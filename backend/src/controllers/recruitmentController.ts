import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logAudit } from '../utils/audit';
import { JobStatus, CandidateStatus, InterviewStatus } from '../utils/enums';

export const createJob = async (req: AuthenticatedRequest, res: Response) => {
  const { title, departmentId, description, requirements, experienceRequired } = req.body;

  if (!title || !departmentId || !description || !requirements || experienceRequired === undefined) {
    return res.status(400).json({ error: 'Missing job post fields' });
  }

  try {
    const job = await prisma.recruitmentJob.create({
      data: {
        title,
        departmentId,
        description,
        requirements,
        experienceRequired: parseFloat(experienceRequired as string),
        status: JobStatus.OPEN
      }
    });

    await logAudit(req.user!.id, 'JOB_CREATE', `Created recruitment job post: ${title}`);
    return res.status(201).json({ job });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating job post' });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  const { departmentId, status } = req.query;

  try {
    const filters: any = {};
    if (departmentId) filters.departmentId = departmentId as string;
    if (status) filters.status = status as JobStatus;

    const jobs = await prisma.recruitmentJob.findMany({
      where: filters,
      include: {
        department: { select: { name: true, code: true } },
        _count: { select: { candidates: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ jobs });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading job posts' });
  }
};

export const applyJob = async (req: Request, res: Response) => {
  const { jobId, firstName, lastName, email, phone, resumeUrl } = req.body;

  if (!jobId || !firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'Missing applicant contact information' });
  }

  try {
    const job = await prisma.recruitmentJob.findUnique({ where: { id: jobId } });
    if (!job || job.status === JobStatus.CLOSED) {
      return res.status(400).json({ error: 'Job is no longer open for applications' });
    }

    // Auto-rank score simulation
    const rankingScore = Math.floor(Math.random() * 40) + 60; // 60 - 100
    const aiFeedback = `Candidate has match on qualifications. Strong verbal skills indicated. Estimated experience matches target job of ${job.experienceRequired} years.`;

    const candidate = await prisma.candidate.create({
      data: {
        jobId,
        firstName,
        lastName,
        email,
        phone,
        resumeUrl,
        status: CandidateStatus.APPLIED,
        rankingScore,
        aiFeedback
      }
    });

    return res.status(201).json({ message: 'Application submitted successfully', candidate });
  } catch (error) {
    return res.status(500).json({ error: 'Error submitting application' });
  }
};

export const getCandidates = async (req: AuthenticatedRequest, res: Response) => {
  const { jobId, status } = req.query;

  try {
    const filters: any = {};
    if (jobId) filters.jobId = jobId as string;
    if (status) filters.status = status as CandidateStatus;

    const list = await prisma.candidate.findMany({
      where: filters,
      include: {
        job: {
          include: {
            department: { select: { code: true } }
          }
        },
        interviews: true
      },
      orderBy: { rankingScore: 'desc' }
    });

    return res.status(200).json({ candidates: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error loading candidates list' });
  }
};

export const updateCandidateStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const updated = await prisma.candidate.update({
      where: { id },
      data: { status: status as CandidateStatus }
    });

    await logAudit(req.user!.id, 'CANDIDATE_STATUS_UPDATE', `Updated candidate ${id} status to ${status}`);
    return res.status(200).json({ candidate: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating candidate status' });
  }
};

export const scheduleInterview = async (req: AuthenticatedRequest, res: Response) => {
  const { candidateId, interviewDate, interviewerIds, mode } = req.body;

  if (!candidateId || !interviewDate || !interviewerIds || !Array.isArray(interviewerIds)) {
    return res.status(400).json({ error: 'Candidate, date, and interviewers list are required' });
  }

  try {
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        interviewDate: new Date(interviewDate),
        interviewerIds: JSON.stringify(interviewerIds),
        mode: mode || 'ONLINE',
        status: InterviewStatus.SCHEDULED
      }
    });

    // Move candidate to INTERVIEWED status
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: CandidateStatus.INTERVIEWED }
    });

    await logAudit(req.user!.id, 'INTERVIEW_SCHEDULE', `Scheduled interview for candidate ID ${candidateId}`);
    return res.status(201).json({ interview });
  } catch (error) {
    console.error('[Schedule Interview Error]', error);
    return res.status(500).json({ error: 'Error scheduling interview' });
  }
};

export const getInterviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let list;
    if (req.user!.role === 'DEAN') {
      // If user is a faculty member, they might be an interviewer
      // We will parse interviewerIds JSON array in application layer
      const allInterviews = await prisma.interview.findMany({
        include: {
          candidate: {
            include: { job: true }
          }
        },
        orderBy: { interviewDate: 'asc' }
      });

      list = allInterviews.filter((item: any) => {
        try {
          const ids = JSON.parse(item.interviewerIds);
          return Array.isArray(ids) && ids.includes(req.user!.id);
        } catch {
          return false;
        }
      });
    } else {
      list = await prisma.interview.findMany({
        include: {
          candidate: {
            include: { job: true }
          }
        },
        orderBy: { interviewDate: 'asc' }
      });
    }

    return res.status(200).json({ interviews: list });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching interviews' });
  }
};

export const updateInterviewFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { feedback, rating, status } = req.body;

  try {
    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        feedback: feedback !== undefined ? feedback : interview.feedback,
        rating: rating !== undefined ? parseFloat(rating) : interview.rating,
        status: (status as InterviewStatus) || interview.status
      }
    });

    await logAudit(req.user!.id, 'INTERVIEW_FEEDBACK', `Updated feedback for interview ID ${id}`);
    return res.status(200).json({ interview: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating interview feedback' });
  }
};
