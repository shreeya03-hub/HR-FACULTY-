import { Router } from 'express';
import {
  createJob,
  getJobs,
  applyJob,
  getCandidates,
  updateCandidateStatus,
  scheduleInterview,
  getInterviews,
  updateInterviewFeedback
} from '../controllers/recruitmentController';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { Role } from '../utils/enums';

const router = Router();

// Publicly viewable jobs
router.get('/jobs', getJobs);
router.post('/apply', applyJob); // Public job application

// Authenticated recruitment processes
router.use(authenticateUser as any);

router.post('/jobs', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, createJob as any);
router.get('/candidates', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, getCandidates as any);
router.put('/candidates/:id/status', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, updateCandidateStatus as any);

router.post('/interviews', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, scheduleInterview as any);
router.get('/interviews', getInterviews as any);
router.put('/interviews/:id/feedback', updateInterviewFeedback as any);

export default router;
