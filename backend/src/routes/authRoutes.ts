import { Router } from 'express';
import { registerUser, loginUser, refreshToken, getCurrentUser, changePassword } from '../controllers/authController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.get('/me', authenticateUser as any, getCurrentUser as any);
router.post('/change-password', authenticateUser as any, changePassword as any);

export default router;
