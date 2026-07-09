import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

// Teaching workload data (simulated from faculty profiles)
export const getWorkloadSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { departmentId } = req.query;

    const filters: any = {};
    if (departmentId) filters.departmentId = departmentId as string;

    const faculties = await prisma.faculty.findMany({
      where: { ...filters, status: 'ACTIVE' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true, code: true } },
        leaveRequests: {
          where: {
            status: { in: ['APPROVED', 'PENDING_HR', 'PENDING_HOD'] },
            startDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        fdpRecords: {
          where: {
            fromDate: { gte: new Date(new Date().getFullYear(), 0, 1) }
          }
        },
        publications: {
          where: { status: 'APPROVED' }
        }
      }
    });

    // Generate simulated workload data
    const designationHours: { [key: string]: number } = {
      'Professor': 14,
      'Associate Professor': 16,
      'Assistant Professor': 18,
      'Senior Lecturer': 20,
      'Lecturer': 22,
      'HOD': 10,
      'Dean & Professor': 8,
      'HR Manager': 0
    };

    const workload = faculties.map((fac, idx) => {
      const teachingHours = designationHours[fac.designation] || 16;
      const overloadHours = Math.max(0, teachingHours - 16);

      // Simulate number of subjects/courses
      const subjects = [
        { code: `${fac.department.code}${(idx + 1) * 100 + 1}`, name: 'Core Subject I', hours: Math.min(teachingHours, 6), batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 1 - 2000}` },
        { code: `${fac.department.code}${(idx + 1) * 100 + 2}`, name: 'Core Subject II', hours: Math.min(teachingHours - 6, 6), batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 1 - 2000}` },
        ...(teachingHours > 12 ? [{ code: `${fac.department.code}${(idx + 1) * 100 + 3}`, name: 'Elective / Lab', hours: teachingHours - 12, batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 1 - 2000}` }] : [])
      ].filter(s => s.hours > 0);

      return {
        id: fac.id,
        facultyName: `${fac.user.firstName} ${fac.user.lastName}`,
        email: fac.user.email,
        department: fac.department.name,
        departmentCode: fac.department.code,
        designation: fac.designation,
        teachingHoursPerWeek: teachingHours,
        maxAllowedHours: 20,
        overloadHours,
        isOverloaded: overloadHours > 0,
        subjects,
        onLeaveThisMonth: fac.leaveRequests.length > 0,
        fdpAttendedThisYear: fac.fdpRecords.length,
        publications: fac.publications.length,
        workloadScore: Math.min(100, Math.round((teachingHours / 20) * 100))
      };
    });

    const summary = {
      totalFaculty: workload.length,
      overloaded: workload.filter(w => w.isOverloaded).length,
      underloaded: workload.filter(w => w.teachingHoursPerWeek < 12).length,
      avgHoursPerWeek: workload.length > 0 
        ? Math.round(workload.reduce((a, b) => a + b.teachingHoursPerWeek, 0) / workload.length)
        : 0
    };

    return res.status(200).json({ workload, summary });
  } catch (error) {
    console.error('[Workload Error]', error);
    return res.status(500).json({ error: 'Error fetching workload data' });
  }
};

export const getWorkloadByFaculty = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true, code: true } },
        attendances: {
          where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    const designationHours: { [key: string]: number } = {
      'Professor': 14,
      'Associate Professor': 16,
      'Assistant Professor': 18,
      'Dean & Professor': 8,
      'HR Manager': 0
    };

    const teachingHours = designationHours[faculty.designation] || 16;

    return res.status(200).json({
      faculty: {
        id: faculty.id,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        department: faculty.department.name,
        designation: faculty.designation,
        teachingHoursPerWeek: teachingHours,
        attendanceLogs: faculty.attendances
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching faculty workload' });
  }
};

export const getDepartmentRoster = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        faculties: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        hod: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    const roster = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description,
      hod: dept.hod ? `${dept.hod.user.firstName} ${dept.hod.user.lastName}` : 'Not assigned',
      totalFaculty: dept.faculties.length,
      faculty: dept.faculties.map(f => ({
        id: f.id,
        name: `${f.user.firstName} ${f.user.lastName}`,
        designation: f.designation,
        email: f.user.email
      }))
    }));

    return res.status(200).json({ roster });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading department roster' });
  }
};
