import { Router } from 'express';
import { addFdpRecord, getFdpRecords, getFdpReports } from '../controllers/fdpController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser as any);

router.post('/add', addFdpRecord as any);
router.get('/list', getFdpRecords as any);
router.get('/reports', getFdpReports as any);

export default router;
