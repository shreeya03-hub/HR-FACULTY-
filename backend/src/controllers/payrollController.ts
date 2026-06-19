import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { PayrollStatus, FacultyStatus } from '../utils/enums';

export const processPayroll = async (req: AuthenticatedRequest, res: Response) => {
  const { month, year, facultyIds } = req.body;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    const filter: any = { status: FacultyStatus.ACTIVE };
    if (facultyIds && Array.isArray(facultyIds) && facultyIds.length > 0) {
      filter.id = { in: facultyIds };
    }

    const faculties = await prisma.faculty.findMany({
      where: filter
    });

    if (faculties.length === 0) {
      return res.status(404).json({ error: 'No active faculty found to process payroll for' });
    }

    const processedList = [];

    // Process salary for each faculty
    for (const fac of faculties) {
      const basicPay = fac.basicPay || 30000.0;
      const hra = basicPay * 0.4;  // 40% House Rent Allowance
      const da = basicPay * 0.2;   // 20% Dearness Allowance
      const allowances = basicPay * 0.1; // 10% Other allowances
      const grossSalary = basicPay + hra + da + allowances;

      const pfDeduction = basicPay * 0.12; // 12% PF Contribution
      const taxDeduction = grossSalary > 50000 ? grossSalary * 0.10 : grossSalary * 0.05; // 5-10% TDS
      const otherDeductions = 0.0;
      const totalDeductions = pfDeduction + taxDeduction + otherDeductions;
      
      const netSalary = grossSalary - totalDeductions;

      // Upsert payroll entry
      const entry = await prisma.payroll.upsert({
        where: {
          facultyId_month_year: {
            facultyId: fac.id,
            month: parseInt(month),
            year: parseInt(year)
          }
        },
        create: {
          facultyId: fac.id,
          month: parseInt(month),
          year: parseInt(year),
          basicPay,
          hra,
          da,
          allowances,
          grossSalary,
          pfDeduction,
          taxDeduction,
          otherDeductions,
          totalDeductions,
          netSalary,
          status: PayrollStatus.PROCESSED,
          processedAt: new Date()
        },
        update: {
          basicPay,
          hra,
          da,
          allowances,
          grossSalary,
          pfDeduction,
          taxDeduction,
          otherDeductions,
          totalDeductions,
          netSalary,
          status: PayrollStatus.PROCESSED,
          processedAt: new Date()
        }
      });

      processedList.push(entry);
    }

    await logAudit(req.user!.id, 'PAYROLL_PROCESS', `Processed payroll for ${processedList.length} faculty members for ${month}/${year}`);

    return res.status(200).json({
      message: `Successfully processed payroll for ${processedList.length} faculty member(s).`,
      payrollRecords: processedList
    });
  } catch (error) {
    console.error('[Payroll Process Error]', error);
    return res.status(500).json({ error: 'Error processing payroll records' });
  }
};

export const getPayrollHistory = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { facultyId, month, year, status } = req.query;

  try {
    const filters: any = {};

    if (req.user.role === 'DEAN' && req.query.self === 'true') {
      filters.facultyId = req.user.facultyId;
    } else {
      if (facultyId) filters.facultyId = facultyId as string;
    }

    if (month) filters.month = parseInt(month as string);
    if (year) filters.year = parseInt(year as string);
    if (status) filters.status = status as PayrollStatus;

    const list = await prisma.payroll.findMany({
      where: filters,
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return res.status(200).json({ history: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading payroll history' });
  }
};

export const getPayrollSlip = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const slip = await prisma.payroll.findUnique({
      where: { id },
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            department: { select: { name: true, code: true } }
          }
        }
      }
    });

    if (!slip) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    // Auth check: dean can only view their own slips
    if (req.user!.role === 'DEAN' && slip.facultyId !== req.user!.facultyId) {
      return res.status(403).json({ error: 'Unauthorized to view this payslip' });
    }

    return res.status(200).json({ payslip: slip });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching payslip' });
  }
};

export const getPayrollStats = async (req: AuthenticatedRequest, res: Response) => {
  const { month, year } = req.query;

  try {
    const filters: any = {};
    if (month) filters.month = parseInt(month as string);
    if (year) filters.year = parseInt(year as string);

    const records = await prisma.payroll.findMany({ where: filters });

    const totalGross = records.reduce((sum: number, r: any) => sum + r.grossSalary, 0);
    const totalNet = records.reduce((sum: number, r: any) => sum + r.netSalary, 0);
    const totalPF = records.reduce((sum: number, r: any) => sum + r.pfDeduction, 0);
    const totalTax = records.reduce((sum: number, r: any) => sum + r.taxDeduction, 0);

    return res.status(200).json({
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalNet: parseFloat(totalNet.toFixed(2)),
      totalPF: parseFloat(totalPF.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalProcessed: records.length,
      paidCount: records.filter((r: any) => r.status === PayrollStatus.PAID).length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating payroll aggregate stats' });
  }
};

export const updatePayrollStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'PAID' or 'DRAFT' or 'PROCESSED'

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        status: status as PayrollStatus,
        paidAt: status === 'PAID' ? new Date() : null
      }
    });

    await logAudit(req.user!.id, 'PAYROLL_STATUS_UPDATE', `Updated payroll slip ${id} status to ${status}`);
    return res.status(200).json({ payslip: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating payroll status' });
  }
};
