import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { pool } from '../db';
import { Student, PerformanceRow } from '../types';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/suggestions/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const studentResult = await pool.query<Student>(
      'SELECT * FROM students WHERE id = $1',
      [req.params.studentId]
    );
    if (studentResult.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    const student = studentResult.rows[0];

    const perfResult = await pool.query<PerformanceRow>(
      `SELECT
         m.subject_name,
         e.max_marks,
         ROUND(AVG(m.marks_obtained), 2) as average_marks,
         ROUND(AVG(m.marks_obtained) * 100.0 / e.max_marks, 2) as percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1
       GROUP BY m.subject_name, e.max_marks
       ORDER BY percentage ASC`,
      [req.params.studentId]
    );

    if (perfResult.rows.length === 0) {
      res.json({ suggestions: 'No marks data available yet. Please add marks to get AI suggestions.' });
      return;
    }

    const performanceData = perfResult.rows
      .map(r => `${r.subject_name}: ${r.average_marks}/${r.max_marks} (${r.percentage}%)`)
      .join('\n');

    const weakSubjects = perfResult.rows.filter(r => parseFloat(r.percentage) < 40);
    const weakList = weakSubjects.map(r => r.subject_name).join(', ') || 'None';

    const prompt = `You are an educational advisor. Analyze this student's performance and give specific, actionable improvement suggestions.

Student: ${student.name}
Class: ${student.class}${student.section ? ' - ' + student.section : ''}

Subject-wise Performance (average across exams):
${performanceData}

Weak Subjects (below 40%): ${weakList}

Please provide:
1. A brief overall assessment (2-3 sentences)
2. Specific study strategies for each weak subject
3. 3-4 general tips to improve overall academic performance
4. An encouraging closing message for the student

Keep the tone positive, professional, and motivating. Format with clear sections.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 800,
      temperature: 0.7,
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;