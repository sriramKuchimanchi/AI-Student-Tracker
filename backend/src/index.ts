import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './db';
import { authenticate } from './middleware';
import authRouter from './routes/auth';
import studentsRouter from './routes/students';
import marksRouter from './routes/marks';
import subjectsRouter from './routes/subjects';
import examsRouter from './routes/exams';
import classesRouter from './routes/classes';
import aiRouter from './routes/ai';
import reportsRouter from './routes/reports';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.use('/api/students', authenticate, studentsRouter);
app.use('/api/marks', authenticate, marksRouter);
app.use('/api/subjects', authenticate, subjectsRouter);
app.use('/api/exams', authenticate, examsRouter);
app.use('/api/classes', authenticate, classesRouter);
app.use('/api/ai', authenticate, aiRouter);
app.use('/api/reports', authenticate, reportsRouter);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
});