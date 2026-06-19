import { Router } from 'express';
import {
  addPublication,
  getPublications,
  updatePublicationStatus,
  addPatent,
  getPatents,
  updatePatentStatus,
  getResearchReports
} from '../controllers/researchController';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { Role } from '../utils/enums';

const router = Router();

router.use(authenticateUser as any);

// Publications
router.post('/publications', addPublication as any);
router.get('/publications', getPublications as any);
router.put('/publications/:id/status', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, updatePublicationStatus as any);

// Patents
router.post('/patents', addPatent as any);
router.get('/patents', getPatents as any);
router.put('/patents/:id/status', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, updatePatentStatus as any);

// Reports
router.get('/reports', getResearchReports as any);

export default router;
