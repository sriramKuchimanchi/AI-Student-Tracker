import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Subject } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = req.query.class as string | undefined;
    const query = cls
      ? 'SELECT * FROM subjects WHERE class = $1 ORDER BY name'
      : 'SELECT * FROM subjects ORDER BY class, name';
    const result = await pool.query<Subject>(query, cls ? [cls] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, class: cls, max_marks } = req.body as Subject;
  try {
    const result = await pool.query<Subject>(
      'INSERT INTO subjects (name, class, max_marks) VALUES ($1, $2, $3) RETURNING *',
      [name, cls, max_marks ?? 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;