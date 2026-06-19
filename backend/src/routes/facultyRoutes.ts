import { Router } from 'express';
import {
  getMyProfile,
  getFacultyProfile,
  updateFacultyProfile,
  listFaculties,
  addQualification,
  deleteQualification,
  addExperience,
  deleteExperience,
  createServiceRequest,
  getServiceRequests,
  updateServiceRequestStatus,
  getDepartments
} from '../controllers/facultyController';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { Role } from '../utils/enums';

const router = Router();

// Middleware for all faculty routes
router.use(authenticateUser as any);

router.get('/departments', getDepartments as any);
router.get('/profile', getMyProfile as any);
router.get('/profile/:id', getFacultyProfile as any);
router.put('/profile', updateFacultyProfile as any);
router.get('/list', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, listFaculties as any);


// Qualifications & Experience
router.post('/qualifications', addQualification as any);
router.delete('/qualifications/:id', deleteQualification as any);
router.post('/experience', addExperience as any);
router.delete('/experience/:id', deleteExperience as any);

// Service Requests
router.post('/service-requests', createServiceRequest as any);
router.get('/service-requests', getServiceRequests as any);
router.put('/service-requests/:id/status', updateServiceRequestStatus as any);

export default router;
