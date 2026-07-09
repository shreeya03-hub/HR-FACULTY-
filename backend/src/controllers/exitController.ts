import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';

// In-memory exit clearance store (since we don't add a new model for simplicity)
// We use the Notification model as a proxy store for exits.

export const initiateExit = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId, exitType, reason, lastWorkingDate, targetFacultyId } = req.body;

  const isHR = req.user!.role === 'HR_MANAGER' || req.user!.role === 'SUPER_ADMIN';
  if (!isHR) {
    return res.status(403).json({ error: 'Only HR can initiate exit procedures' });
  }

  const resolvedFacultyId = targetFacultyId || facultyId;
  if (!resolvedFacultyId || !exitType || !lastWorkingDate) {
    return res.status(400).json({ error: 'Faculty ID, exit type, and last working date are required' });
  }

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id: resolvedFacultyId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Update faculty status
    await prisma.faculty.update({
      where: { id: resolvedFacultyId },
      data: { status: exitType === 'RETIRED' ? 'RETIRED' : 'TERMINATED' }
    });

    // Create exit initiation notification/log
    await prisma.notification.create({
      data: {
        userId: faculty.userId,
        title: `Exit Process Initiated - ${exitType}`,
        message: JSON.stringify({
          exitType,
          reason: reason || 'No reason provided',
          lastWorkingDate,
          status: 'INITIATED',
          clearances: {
            hod: false,
            library: false,
            accounts: false,
            it: false,
            hr: false
          },
          initiatedAt: new Date().toISOString(),
          initiatedBy: req.user!.id
        }),
        type: 'IN_APP',
        isRead: false
      }
    });

    await logAudit(req.user!.id, 'EXIT_INITIATE', `Exit process initiated for faculty ${resolvedFacultyId} - Type: ${exitType}`);

    return res.status(201).json({
      message: `Exit process (${exitType}) initiated for ${faculty.user.firstName} ${faculty.user.lastName}`,
      faculty: {
        id: faculty.id,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        email: faculty.user.email,
        exitType,
        lastWorkingDate,
        status: 'INITIATED'
      }
    });
  } catch (error: any) {
    console.error('[Exit Initiate Error]', error);
    return res.status(500).json({ error: 'Error initiating exit process' });
  }
};

export const getExitRecords = async (req: AuthenticatedRequest, res: Response) => {
  const isHR = req.user!.role === 'HR_MANAGER' || req.user!.role === 'SUPER_ADMIN';
  if (!isHR) {
    return res.status(403).json({ error: 'Only HR can view exit records' });
  }

  try {
    // Get faculties with TERMINATED or RETIRED status
    const exited = await prisma.faculty.findMany({
      where: {
        status: { in: ['TERMINATED', 'RETIRED'] }
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true, code: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get exit notifications/logs
    const exitNotifications = await prisma.notification.findMany({
      where: {
        title: { startsWith: 'Exit Process Initiated' }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map notifications to exit records
    const exitMap: { [userId: string]: any } = {};
    for (const notif of exitNotifications) {
      try {
        const data = JSON.parse(notif.message);
        exitMap[notif.userId] = { ...data, notifId: notif.id };
      } catch {}
    }

    const records = exited.map(fac => ({
      id: fac.id,
      name: `${fac.user.firstName} ${fac.user.lastName}`,
      email: fac.user.email,
      department: fac.department.name,
      designation: fac.designation,
      dateOfJoining: fac.dateOfJoining,
      status: fac.status,
      exitData: exitMap[fac.userId] || null
    }));

    return res.status(200).json({ exits: records });
  } catch (error) {
    console.error('[Get Exits Error]', error);
    return res.status(500).json({ error: 'Error loading exit records' });
  }
};

export const updateClearanceStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId, clearanceType, cleared } = req.body;

  const isHR = req.user!.role === 'HR_MANAGER' || req.user!.role === 'SUPER_ADMIN';
  if (!isHR) {
    return res.status(403).json({ error: 'Only HR can update clearance status' });
  }

  if (!facultyId || !clearanceType) {
    return res.status(400).json({ error: 'Faculty ID and clearance type are required' });
  }

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true }
    });

    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    // Find and update the notification
    const notif = await prisma.notification.findFirst({
      where: {
        userId: faculty.userId,
        title: { startsWith: 'Exit Process Initiated' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!notif) return res.status(404).json({ error: 'No exit process found for this faculty' });

    const data = JSON.parse(notif.message);
    data.clearances[clearanceType] = cleared !== false;
    data.updatedAt = new Date().toISOString();
    data.updatedBy = req.user!.id;

    // Check if all clearances are done
    const allCleared = Object.values(data.clearances).every(v => v === true);
    if (allCleared) {
      data.status = 'FULLY_CLEARED';
    }

    await prisma.notification.update({
      where: { id: notif.id },
      data: { message: JSON.stringify(data) }
    });

    await logAudit(req.user!.id, 'EXIT_CLEARANCE_UPDATE', `Updated ${clearanceType} clearance for faculty ${facultyId}`);

    return res.status(200).json({
      message: 'Clearance status updated',
      clearances: data.clearances,
      fullyCleared: allCleared
    });
  } catch (error) {
    console.error('[Clearance Update Error]', error);
    return res.status(500).json({ error: 'Error updating clearance status' });
  }
};

export const getExitStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalActive = await prisma.faculty.count({ where: { status: 'ACTIVE' } });
    const totalTerminated = await prisma.faculty.count({ where: { status: 'TERMINATED' } });
    const totalRetired = await prisma.faculty.count({ where: { status: 'RETIRED' } });

    return res.status(200).json({
      stats: {
        active: totalActive,
        terminated: totalTerminated,
        retired: totalRetired,
        total: totalActive + totalTerminated + totalRetired
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading exit stats' });
  }
};
