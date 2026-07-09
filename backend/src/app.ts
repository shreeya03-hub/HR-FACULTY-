import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import facultyRoutes from './routes/facultyRoutes';
import leaveRoutes from './routes/leaveRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import researchRoutes from './routes/researchRoutes';
import fdpRoutes from './routes/fdpRoutes';
import payrollRoutes from './routes/payrollRoutes';
import recruitmentRoutes from './routes/recruitmentRoutes';
import appraisalRoutes from './routes/appraisalRoutes';
import naacRoutes from './routes/naacRoutes';
import aiRoutes from './routes/aiRoutes';
import exitRoutes from './routes/exitRoutes';
import workloadRoutes from './routes/workloadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For development. Change in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/fdp', fdpRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/appraisal', appraisalRoutes);
app.use('/api/naac', naacRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/exit', exitRoutes);
app.use('/api/workload', workloadRoutes);

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`[Server] University Faculty & HR API running on port ${PORT}`);
});

export default app;
