import { Router } from 'express';
import {
  applyLeave,
  getLeaveBalances,
  getLeaveRequests,
  approveRejectLeave,
  cancelLeave
} from '../controllers/leaveController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser as any);

router.post('/apply', applyLeave as any);
router.get('/balances', getLeaveBalances as any);
router.get('/requests', getLeaveRequests as any);
router.put('/requests/:id/approve', approveRejectLeave as any);
router.put('/requests/:id/cancel', cancelLeave as any);

export default router;
