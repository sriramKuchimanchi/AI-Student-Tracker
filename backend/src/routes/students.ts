import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Student } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<Student>('SELECT * FROM students ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<Student>('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, roll_number, class: cls, section, parent_name, parent_email, parent_phone } = req.body as Student;
  try {
    const result = await pool.query<Student>(
      `INSERT INTO students (name, roll_number, class, section, parent_name, parent_email, parent_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, roll_number, cls, section, parent_name, parent_email, parent_phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { name, roll_number, class: cls, section, parent_name, parent_email, parent_phone } = req.body as Student;
  try {
    const result = await pool.query<Student>(
      `UPDATE students SET name=$1, roll_number=$2, class=$3, section=$4,
       parent_name=$5, parent_email=$6, parent_phone=$7 WHERE id=$8 RETURNING *`,
      [name, roll_number, cls, section, parent_name, parent_email, parent_phone, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;