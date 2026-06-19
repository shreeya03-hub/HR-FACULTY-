import { Router } from 'express';
import {
  punchAttendance,
  getMyAttendance,
  getFacultyAttendance,
  getAttendanceStats,
  getDepartmentStats,
  fixMissingPunch
} from '../controllers/attendanceController';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { Role } from '../utils/enums';

const router = Router();

// Endpoint for biometric device integration simulator (no auth, or API key. We will allow simple POST for device hook simulator)
router.post('/punch', punchAttendance);

// Authenticated routes
router.use(authenticateUser as any);

router.get('/my-logs', getMyAttendance as any);
router.get('/faculty-logs/:id', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, getFacultyAttendance as any);
router.get('/stats', getAttendanceStats as any);
router.get('/dept-stats', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, getDepartmentStats as any);
router.post('/fix-punch', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, fixMissingPunch as any);

export default router;
