import { Router } from 'express';
import { getNaacMetrics, addNaacContribution, getNaacContributions } from '../controllers/naacController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser as any);

router.get('/metrics', getNaacMetrics as any);
router.post('/contribution', addNaacContribution as any);
router.get('/contributions', getNaacContributions as any);

export default router;
