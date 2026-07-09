import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { initiateExit, getExitRecords, updateClearanceStatus, getExitStats } from '../controllers/exitController';
import { Role } from '../utils/enums';

const router = Router();

router.use(authenticateUser as any);

// Get exit stats overview
router.get('/stats', getExitStats as any);

// Get all exit records (HR and SUPER_ADMIN only)
router.get('/records', requireRoles([Role.HR_MANAGER, Role.SUPER_ADMIN]) as any, getExitRecords as any);

// Initiate exit process for a faculty member
router.post('/initiate', requireRoles([Role.HR_MANAGER, Role.SUPER_ADMIN]) as any, initiateExit as any);

// Update clearance status
router.put('/clearance', requireRoles([Role.HR_MANAGER, Role.SUPER_ADMIN]) as any, updateClearanceStatus as any);

export default router;
