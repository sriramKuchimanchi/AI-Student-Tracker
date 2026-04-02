import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Class, Section, ClassWithSections } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const classResult = await pool.query<Class>(
      'SELECT * FROM classes ORDER BY name'
    );
    const classes: ClassWithSections[] = await Promise.all(
      classResult.rows.map(async cls => {
        const sectionResult = await pool.query<Section>(
          'SELECT * FROM sections WHERE class_id = $1 ORDER BY name',
          [cls.id]
        );
        const countResult = await pool.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM students WHERE class = $1',
          [cls.name]
        );
        return {
          ...cls,
          sections: sectionResult.rows,
          student_count: parseInt(countResult.rows[0].count),
        };
      })
    );
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  try {
    const result = await pool.query<Class>(
      'INSERT INTO classes (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/sections', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  try {
    const result = await pool.query<Section>(
      'INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING *',
      [req.params.id, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:classId/sections/:sectionId', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM sections WHERE id = $1', [req.params.sectionId]);
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;