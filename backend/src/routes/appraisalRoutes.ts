import { Router } from 'express';
import {
  submitSelfAppraisal,
  reviewAppraisal,
  getMyAppraisal,
  getPendingAppraisals
} from '../controllers/appraisalController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser as any);

router.post('/self', submitSelfAppraisal as any);
router.put('/review/:id', reviewAppraisal as any);
router.get('/my-reviews', getMyAppraisal as any);
router.get('/pending', getPendingAppraisals as any);

export default router;
