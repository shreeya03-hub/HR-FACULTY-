import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth';
import { getWorkloadSummary, getWorkloadByFaculty, getDepartmentRoster } from '../controllers/workloadController';

const router = Router();

router.use(authenticateUser as any);

// Get full workload summary across all departments
router.get('/summary', getWorkloadSummary as any);

// Get workload for a specific faculty
router.get('/faculty/:id', getWorkloadByFaculty as any);

// Get teaching roster by department
router.get('/roster', getDepartmentRoster as any);

export default router;
