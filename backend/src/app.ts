import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import briefRoutes from './routes/brief.routes';
import assignmentRoutes from './routes/assignment.routes';
import adminRoutes from './routes/admin.routes';
import tokenRoutes from './routes/token.routes';
import generationRoutes from './routes/generation.routes';
import issueRoutes from './routes/issue.routes';
import { errorHandler } from './middlewares/error';
import path from 'path';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for exports
app.use('/exports', express.static(path.join(process.cwd(), 'exports')));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/briefs', briefRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/issues', issueRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

export default app;
