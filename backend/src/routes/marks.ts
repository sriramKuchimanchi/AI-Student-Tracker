import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Mark, MarkEntry, MarkWithDetails, PerformanceRow } from '../types';

const router = Router();

router.get('/student/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<MarkWithDetails>(
      `SELECT m.*, e.name as exam_name, e.exam_date, e.max_marks,
              ROUND(m.marks_obtained * 100.0 / e.max_marks, 2) as percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1
       ORDER BY e.exam_date DESC, m.subject_name`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/performance/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<PerformanceRow>(
      `SELECT
         m.subject_name,
         e.max_marks,
         ROUND(AVG(m.marks_obtained), 2) as average_marks,
         MIN(m.marks_obtained) as min_marks,
         MAX(m.marks_obtained) as max_marks_obtained,
         COUNT(m.id) as exam_count,
         ROUND(AVG(m.marks_obtained) * 100.0 / e.max_marks, 2) as percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1
       GROUP BY m.subject_name, e.max_marks
       ORDER BY percentage ASC`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
  const { student_id, exam_id, marks } = req.body as {
    student_id: number;
    exam_id: number;
    marks: MarkEntry[];
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results: Mark[] = [];
    for (const entry of marks) {
      const result = await client.query<Mark>(
        `INSERT INTO marks (student_id, exam_id, subject_name, marks_obtained)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, exam_id, subject_name)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
         RETURNING *`,
        [student_id, exam_id, entry.subject_name, entry.marks_obtained]
      );
      results.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(results);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;