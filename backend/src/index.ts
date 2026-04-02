import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './db';
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

app.use('/api/students', studentsRouter);
app.use('/api/marks', marksRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/exams', examsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reports', reportsRouter);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
});