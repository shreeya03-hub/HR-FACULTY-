import { Router } from 'express';
import {
  processPayroll,
  getPayrollHistory,
  getPayrollSlip,
  getPayrollStats,
  updatePayrollStatus
} from '../controllers/payrollController';
import { authenticateUser, requireRoles } from '../middlewares/auth';
import { Role } from '../utils/enums';

const router = Router();

router.use(authenticateUser as any);

router.post('/process', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, processPayroll as any);
router.get('/history', getPayrollHistory as any);
router.get('/slip/:id', getPayrollSlip as any);
router.get('/stats', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER, Role.DEAN]) as any, getPayrollStats as any);
router.put('/slip/:id/status', requireRoles([Role.SUPER_ADMIN, Role.HR_MANAGER]) as any, updatePayrollStatus as any);

export default router;
