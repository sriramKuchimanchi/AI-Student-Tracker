import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Exam } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = req.query.class as string | undefined;
    const query = cls
      ? 'SELECT * FROM exams WHERE class = $1 ORDER BY exam_date DESC'
      : 'SELECT * FROM exams ORDER BY exam_date DESC';
    const result = await pool.query<Exam>(query, cls ? [cls] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, class: cls, section, exam_date, subjects, max_marks } = req.body as Exam;
  try {
    const result = await pool.query<Exam>(
      `INSERT INTO exams (name, class, section, exam_date, subjects, max_marks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, cls, section ?? null, exam_date ?? null, subjects ?? '', max_marks ?? 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;