import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { AppraisalStatus, Role } from '../utils/enums';

export const submitSelfAppraisal = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty can initiate self appraisals' });

  const { academicYear, teachingScore, researchScore, publicationsScore, feedbackScore, fdpScore, selfRating, selfComments } = req.body;

  if (!academicYear || teachingScore === undefined || researchScore === undefined || publicationsScore === undefined || feedbackScore === undefined || fdpScore === undefined) {
    return res.status(400).json({ error: 'Missing appraisal parameters or scores' });
  }

  try {
    const appraisal = await prisma.appraisal.upsert({
      where: {
        facultyId_academicYear: {
          facultyId,
          academicYear
        }
      },
      create: {
        facultyId,
        academicYear,
        teachingScore: parseFloat(teachingScore),
        researchScore: parseFloat(researchScore),
        publicationsScore: parseFloat(publicationsScore),
        feedbackScore: parseFloat(feedbackScore),
        fdpScore: parseFloat(fdpScore),
        selfRating: selfRating ? parseFloat(selfRating) : null,
        selfComments,
        status: AppraisalStatus.DEAN_REVIEW
      },
      update: {
        teachingScore: parseFloat(teachingScore),
        researchScore: parseFloat(researchScore),
        publicationsScore: parseFloat(publicationsScore),
        feedbackScore: parseFloat(feedbackScore),
        fdpScore: parseFloat(fdpScore),
        selfRating: selfRating ? parseFloat(selfRating) : null,
        selfComments,
        status: AppraisalStatus.DEAN_REVIEW
      }
    });

    await logAudit(req.user!.id, 'APPRAISAL_SUBMIT_SELF', `Submitted self appraisal for year ${academicYear}`);
    return res.status(200).json({ appraisal });
  } catch (error) {
    console.error('[Submit Appraisal Error]', error);
    return res.status(500).json({ error: 'Error submitting self appraisal' });
  }
};

export const reviewAppraisal = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comments } = req.body;
  const role = req.user!.role;

  if (rating === undefined || !comments) {
    return res.status(400).json({ error: 'Rating and comments are required for review' });
  }

  try {
    const appraisal = await prisma.appraisal.findUnique({ where: { id } });
    if (!appraisal) return res.status(404).json({ error: 'Appraisal record not found' });

    let nextStatus = appraisal.status;
    const updateData: any = {};

    if (role === Role.DEAN) {
      if (appraisal.status !== AppraisalStatus.DEAN_REVIEW) {
        return res.status(400).json({ error: 'Appraisal is not pending Dean review' });
      }
      updateData.deanRating = parseFloat(rating);
      updateData.deanComments = comments;
      nextStatus = AppraisalStatus.HR_REVIEW;
    } else if (role === Role.HR_MANAGER || role === Role.SUPER_ADMIN) {
      if (appraisal.status !== AppraisalStatus.HR_REVIEW) {
        return res.status(400).json({ error: 'Appraisal is not pending HR review' });
      }
      updateData.hrRating = parseFloat(rating);
      updateData.hrComments = comments;
      nextStatus = AppraisalStatus.APPROVED;
    } else {
      return res.status(403).json({ error: 'Unauthorized to review appraisals' });
    }

    const updated = await prisma.appraisal.update({
      where: { id },
      data: {
        ...updateData,
        status: nextStatus
      }
    });

    await logAudit(req.user!.id, 'APPRAISAL_REVIEW', `Reviewed appraisal ID ${id} as ${role}. Status is now ${nextStatus}`);
    return res.status(200).json({ appraisal: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error reviewing appraisal' });
  }
};

export const getMyAppraisal = async (req: AuthenticatedRequest, res: Response) => {
  const facultyId = req.user?.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Only faculty accounts have appraisals' });

  try {
    const list = await prisma.appraisal.findMany({
      where: { facultyId },
      orderBy: { academicYear: 'desc' }
    });

    return res.status(200).json({ appraisals: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching appraisals' });
  }
};

export const getPendingAppraisals = async (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;

  try {
    let list: any[] = [];
    if (role === Role.DEAN) {
      list = await prisma.appraisal.findMany({
        where: { status: AppraisalStatus.DEAN_REVIEW },
        include: {
          faculty: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: { select: { code: true } }
            }
          }
        }
      });
    } else if (role === Role.HR_MANAGER || role === Role.SUPER_ADMIN) {
      list = await prisma.appraisal.findMany({
        where: { status: AppraisalStatus.HR_REVIEW },
        include: {
          faculty: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: { select: { code: true } }
            }
          }
        }
      });
    } else {
      list = [];
    }

    return res.status(200).json({ appraisals: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading pending appraisals' });
  }
};
