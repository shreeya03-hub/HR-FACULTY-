import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { LeaveType, LeaveRequestStatus, Role } from '../utils/enums';

export const applyLeave = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can apply for leave' });

  const { type, startDate, endDate, reason, supportingDocUrl } = req.body;
  if (!type || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Missing required leave request fields' });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    // Check balances
    const year = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { facultyId_year: { facultyId, year } }
    });

    if (!balance) {
      return res.status(400).json({ error: 'No leave balances configured for this year' });
    }

    // Check available days
    let availableDays = 0;
    switch (type as LeaveType) {
      case LeaveType.CASUAL_LEAVE: availableDays = balance.casualLeave; break;
      case LeaveType.SICK_LEAVE: availableDays = balance.sickLeave; break;
      case LeaveType.EARNED_LEAVE: availableDays = balance.earnedLeave; break;
      case LeaveType.DUTY_LEAVE: availableDays = balance.dutyLeave; break;
      case LeaveType.MATERNITY_LEAVE: availableDays = balance.maternityLeave; break;
    }

    if (availableDays < totalDays) {
      return res.status(400).json({ error: `Insufficient leave balance. Required: ${totalDays}, Available: ${availableDays}` });
    }

    // Set initial status directly to PENDING_HR since HOD role is removed
    const initialStatus = LeaveRequestStatus.PENDING_HR;

    const request = await prisma.leaveRequest.create({
      data: {
        facultyId,
        type: type as LeaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: initialStatus,
        supportingDocUrl
      }
    });

    await logAudit(req.user!.id, 'LEAVE_APPLY', `Applied for ${totalDays} day(s) of ${type}`);
    return res.status(201).json({ request });
  } catch (error) {
    console.error('[Leave Apply Error]', error);
    return res.status(500).json({ error: 'Error applying for leave' });
  }
};

export const getLeaveBalances = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = (req.query.facultyId as string) || req.user?.facultyId;
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

  if (!facultyId) {
    return res.status(400).json({ error: 'Faculty ID required' });
  }

  try {
    const balances = await prisma.leaveBalance.findUnique({
      where: { facultyId_year: { facultyId, year } }
    });

    if (!balances) {
      return res.status(404).json({ error: 'Leave balances not found for this year' });
    }

    return res.status(200).json({ balances });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading leave balances' });
  }
};

export const getLeaveRequests = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let requests: any[];

    if (req.user.role === Role.DEAN) {
      requests = await prisma.leaveRequest.findMany({
        where: { facultyId: req.user.facultyId },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === Role.HR_MANAGER || req.user.role === Role.SUPER_ADMIN) {
      requests = await prisma.leaveRequest.findMany({
        include: {
          faculty: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: { select: { code: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      requests = [];
    }

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching leave requests' });
  }
};

export const approveRejectLeave = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // 'APPROVED' or 'REJECTED'

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { faculty: true }
    });

    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    const role = req.user!.role;
    let nextStatus = leave.status;

    if (role === Role.HR_MANAGER || role === Role.SUPER_ADMIN) {
      if (leave.status !== LeaveRequestStatus.PENDING_HR) {
        return res.status(400).json({ error: 'Request has already been processed' });
      }
      nextStatus = status === 'REJECTED' ? LeaveRequestStatus.REJECTED : LeaveRequestStatus.APPROVED;
    } else {
      return res.status(403).json({ error: 'Unauthorized to approve leaves' });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          remarks: remarks || leave.remarks,
          approvedByHodId: leave.approvedByHodId,
          approvedByHrId: (role === Role.HR_MANAGER || role === Role.SUPER_ADMIN) ? req.user!.facultyId : leave.approvedByHrId
        }
      });

      // If fully approved, deduct leave balance
      if (nextStatus === LeaveRequestStatus.APPROVED) {
        const year = new Date(leave.startDate).getFullYear();
        const balance = await tx.leaveBalance.findUnique({
          where: { facultyId_year: { facultyId: leave.facultyId, year } }
        });

        if (balance) {
          const fieldMap: any = {
            [LeaveType.CASUAL_LEAVE]: 'casualLeave',
            [LeaveType.SICK_LEAVE]: 'sickLeave',
            [LeaveType.EARNED_LEAVE]: 'earnedLeave',
            [LeaveType.DUTY_LEAVE]: 'dutyLeave',
            [LeaveType.MATERNITY_LEAVE]: 'maternityLeave'
          };
          const balanceFieldName = fieldMap[leave.type];

          if (balanceFieldName) {
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: {
                [balanceFieldName]: Math.max(0, (balance as any)[balanceFieldName] - leave.totalDays)
              }
            });
          }
        }
      }

      return updatedRequest;
    });

    await logAudit(req.user!.id, 'LEAVE_DECISION', `Updated leave ${id} status to ${nextStatus}`);
    return res.status(200).json({ request: updated });
  } catch (error) {
    console.error('[Leave Approval Error]', error);
    return res.status(500).json({ error: 'Error processing leave decision' });
  }
};

export const cancelLeave = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const facultyId = req.user?.facultyId;

  if (!facultyId) return res.status(400).json({ error: 'Only faculty can cancel leave' });

  try {
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave || leave.facultyId !== facultyId) {
      return res.status(404).json({ error: 'Leave request not found or unauthorized' });
    }

    if (leave.status === LeaveRequestStatus.APPROVED) {
      return res.status(400).json({ error: 'Approved leaves cannot be cancelled directly. Contact HR.' });
    }

    await prisma.leaveRequest.delete({ where: { id } });
    await logAudit(req.user!.id, 'LEAVE_CANCEL', `Cancelled leave request ${id}`);

    return res.status(200).json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error cancelling leave request' });
  }
};
