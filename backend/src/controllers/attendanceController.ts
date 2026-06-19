import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { AttendanceStatus } from '../utils/enums';

export const punchAttendance = async (req: Request, res: Response) => {
  const { email, punchTime, source } = req.body; // simulated biometric payload

  if (!email) {
    return res.status(400).json({ error: 'Email is required to identify the faculty member' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { faculty: true }
    });

    if (!user || !user.faculty) {
      return res.status(404).json({ error: 'Faculty record not found for this email' });
    }

    const facultyId = user.faculty.id;
    const time = punchTime ? new Date(punchTime) : new Date();
    
    // Normalize date to check if a record already exists for today
    const today = new Date(time);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find attendance record for today
    const attendance = await prisma.attendance.findFirst({
      where: {
        facultyId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!attendance) {
      // First punch of the day: Clock-In
      // Determine if LATE (e.g. after 09:15 AM)
      const borderTime = new Date(today);
      borderTime.setHours(9, 15, 0, 0);
      
      const status = time.getTime() > borderTime.getTime() ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const record = await prisma.attendance.create({
        data: {
          facultyId,
          date: today,
          punchIn: time,
          status,
          source: source || 'BIOMETRIC'
        }
      });

      await logAudit(user.id, 'ATTENDANCE_PUNCH_IN', `Clocked in at ${time.toLocaleTimeString()}`);
      return res.status(200).json({ message: 'Clock-In successful', record });
    } else {
      // Second punch of the day: Clock-Out
      if (attendance.punchOut) {
        // Already clocked out, we can update the clock-out to the latest punch
        const diffMs = time.getTime() - attendance.punchIn!.getTime();
        const hours = diffMs / (1000 * 60 * 60);

        const record = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            punchOut: time,
            totalHours: parseFloat(hours.toFixed(2))
          }
        });
        return res.status(200).json({ message: 'Clock-Out updated successful', record });
      }

      const diffMs = time.getTime() - attendance.punchIn!.getTime();
      const hours = diffMs / (1000 * 60 * 60);

      const record = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOut: time,
          totalHours: parseFloat(hours.toFixed(2))
        }
      });

      await logAudit(user.id, 'ATTENDANCE_PUNCH_OUT', `Clocked out at ${time.toLocaleTimeString()}. Total hours: ${hours.toFixed(2)}`);
      return res.status(200).json({ message: 'Clock-Out successful', record });
    }
  } catch (error) {
    console.error('[Attendance Punch Error]', error);
    return res.status(500).json({ error: 'Error recording biometric punch' });
  }
};

export const getMyAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts have logs' });

  const { year, month } = req.query; // optional filters

  try {
    const filters: any = { facultyId };

    if (year && month) {
      const y = parseInt(year as string);
      const m = parseInt(month as string); // 1-indexed (1 = Jan, 12 = Dec)
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      filters.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const logs = await prisma.attendance.findMany({
      where: filters,
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading attendance logs' });
  }
};

export const getFacultyAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { year, month } = req.query;

  try {
    const filters: any = { facultyId: id };

    if (year && month) {
      const y = parseInt(year as string);
      const m = parseInt(month as string);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 1);
      filters.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const logs = await prisma.attendance.findMany({
      where: filters,
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading faculty attendance logs' });
  }
};

export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.query.facultyId as string || req.user?.facultyId;

  if (!facultyId) {
    return res.status(400).json({ error: 'Faculty ID is required' });
  }

  try {
    const logs = await prisma.attendance.findMany({
      where: { facultyId }
    });

    const totalDays = logs.length;
    const presentDays = logs.filter((l: any) => l.status === AttendanceStatus.PRESENT).length;
    const lateDays = logs.filter((l: any) => l.status === AttendanceStatus.LATE).length;
    const absentDays = logs.filter((l: any) => l.status === AttendanceStatus.ABSENT).length;
    
    const presentPercentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 100;
    const latePercentage = totalDays > 0 ? (lateDays / totalDays) * 100 : 0;

    return res.status(200).json({
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      presentPercentage: parseFloat(presentPercentage.toFixed(2)),
      latePercentage: parseFloat(latePercentage.toFixed(2))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching attendance stats' });
  }
};

export const getDepartmentStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return aggregate metrics by department for heatmaps and charts
    const departments = await prisma.department.findMany({
      include: {
        faculties: {
          include: {
            attendances: true
          }
        }
      }
    });

    const stats = departments.map((dept: any) => {
      let totalPunches = 0;
      let totalLate = 0;
      let totalPresent = 0;
      let totalHours = 0;

      dept.faculties.forEach((fac: any) => {
        fac.attendances.forEach((att: any) => {
          totalPunches++;
          if (att.status === AttendanceStatus.LATE) totalLate++;
          if (att.status === AttendanceStatus.PRESENT) totalPresent++;
          if (att.totalHours) totalHours += att.totalHours;
        });
      });

      const avgHours = totalPunches > 0 ? totalHours / totalPunches : 0;
      const rate = totalPunches > 0 ? ((totalPresent + totalLate) / totalPunches) * 100 : 100;

      return {
        departmentName: dept.name,
        departmentCode: dept.code,
        totalFaculty: dept.faculties.length,
        attendanceRate: parseFloat(rate.toFixed(1)),
        latePunches: totalLate,
        averageWorkingHours: parseFloat(avgHours.toFixed(1))
      };
    });

    return res.status(200).json({ stats });
  } catch (error) {
    return res.status(500).json({ error: 'Error generating department attendance metrics' });
  }
};

export const fixMissingPunch = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId, date, punchIn, punchOut, status, remarks } = req.body;

  if (!facultyId || !date) {
    return res.status(400).json({ error: 'Faculty ID and date are required' });
  }

  try {
    const punchDate = new Date(date);
    punchDate.setHours(0, 0, 0, 0);

    const inTime = punchIn ? new Date(punchIn) : null;
    const outTime = punchOut ? new Date(punchOut) : null;

    let totalHours: number | null = null;
    if (inTime && outTime) {
      const diffMs = outTime.getTime() - inTime.getTime();
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        facultyId_date: {
          facultyId,
          date: punchDate
        }
      },
      create: {
        facultyId,
        date: punchDate,
        punchIn: inTime,
        punchOut: outTime,
        totalHours,
        status: status || AttendanceStatus.PRESENT,
        source: 'MANUAL',
        remarks: remarks || 'Resolved missing punch manually'
      },
      update: {
        punchIn: inTime,
        punchOut: outTime,
        totalHours,
        status: status || AttendanceStatus.PRESENT,
        source: 'MANUAL',
        remarks: remarks || 'Modified punch manually'
      }
    });

    await logAudit(req.user!.id, 'ATTENDANCE_CORRECTION', `Corrected attendance for faculty ${facultyId} on ${date}`);
    return res.status(200).json({ message: 'Attendance fixed successfully', attendance });
  } catch (error) {
    console.error('[Attendance Correction Error]', error);
    return res.status(500).json({ error: 'Error correcting attendance record' });
  }
};
