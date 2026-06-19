import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { FdpType } from '../utils/enums';

export const addFdpRecord = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts can track FDP records' });

  const { type, title, organization, fromDate, toDate, durationDays, certificateUrl } = req.body;

  if (!type || !title || !organization || !fromDate || !toDate || !durationDays) {
    return res.status(400).json({ error: 'Missing required FDP tracking details' });
  }

  try {
    const record = await prisma.fdpRecord.create({
      data: {
        facultyId,
        type: type as FdpType,
        title,
        organization,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        durationDays: parseInt(durationDays),
        certificateUrl: certificateUrl || null
      }
    });

    await logAudit(req.user!.id, 'FDP_RECORD_ADD', `Added FDP tracking item: ${title}`);
    return res.status(201).json({ record });
  } catch (error) {
    console.error('[Add FDP Error]', error);
    return res.status(500).json({ error: 'Error adding FDP record' });
  }
};

export const getFdpRecords = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { facultyId, departmentId, type } = req.query;

  try {
    const filters: any = {};

    if (req.user.role === 'DEAN' && req.query.self === 'true') {
      filters.facultyId = req.user.facultyId;
    } else {
      if (facultyId) filters.facultyId = facultyId as string;
      if (departmentId) {
        filters.faculty = { departmentId: departmentId as string };
      }
    }

    if (type) filters.type = type as FdpType;

    const list = await prisma.fdpRecord.findMany({
      where: filters,
      include: {
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } }
          }
        }
      },
      orderBy: { fromDate: 'desc' }
    });

    return res.status(200).json({ records: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading FDP records' });
  }
};

export const getFdpReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await prisma.fdpRecord.findMany();

    const summary = {
      workshop: records.filter((r: any) => r.type === FdpType.WORKSHOP).length,
      fdp: records.filter((r: any) => r.type === FdpType.FDP).length,
      seminar: records.filter((r: any) => r.type === FdpType.SEMINAR).length,
      certification: records.filter((r: any) => r.type === FdpType.CERTIFICATION).length,
      industrialTraining: records.filter((r: any) => r.type === FdpType.INDUSTRIAL_TRAINING).length,
      totalDays: records.reduce((sum: number, r: any) => sum + r.durationDays, 0)
    };

    return res.status(200).json({ summary });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating FDP reports' });
  }
};
