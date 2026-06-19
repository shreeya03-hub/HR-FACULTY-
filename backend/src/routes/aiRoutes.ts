import { Router } from 'express';
import {
  getFacultyPerformanceInsights,
  generateAppraisalSummary,
  categorizePublication,
  screenResume,
  balanceFacultyWorkload,
  generateNaacSummary,
  detectPayrollAnomalies,
  analyzeAttendancePatterns,
  getFacultyRecommendations,
  predictAttritionRisk
} from '../controllers/aiController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.use(authenticateUser as any);

router.get('/performance-insights/:facultyId', getFacultyPerformanceInsights as any);
router.post('/appraisal-summary', generateAppraisalSummary as any);
router.post('/pub-categorization', categorizePublication as any);
router.post('/screen-resume', screenResume as any);
router.get('/workload-balancing', balanceFacultyWorkload as any);
router.get('/naac-summary', generateNaacSummary as any);
router.get('/payroll-anomalies', detectPayrollAnomalies as any);
router.get('/attendance-analysis/:facultyId', analyzeAttendancePatterns as any);
router.get('/recommendations', getFacultyRecommendations as any);
router.get('/attrition-risk/:facultyId', predictAttritionRisk as any);

export default router;
