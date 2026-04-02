import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Student, MarkWithDetails, PerformanceRow, ParentReport } from '../types';

const router = Router();

router.get('/parent/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const studentResult = await pool.query<Student>(
      'SELECT * FROM students WHERE id = $1',
      [req.params.studentId]
    );
    if (studentResult.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const marksResult = await pool.query<MarkWithDetails>(
      `SELECT m.*, e.name as exam_name, e.exam_date, e.max_marks,
              ROUND(m.marks_obtained * 100.0 / e.max_marks, 2) as percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1
       ORDER BY e.exam_date, m.subject_name`,
      [req.params.studentId]
    );

    const perfResult = await pool.query<PerformanceRow>(
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
       ORDER BY m.subject_name`,
      [req.params.studentId]
    );

    const totalAvg =
      perfResult.rows.length > 0
        ? (
            perfResult.rows.reduce((sum, r) => sum + parseFloat(r.percentage), 0) /
            perfResult.rows.length
          ).toFixed(2)
        : '0';

    const weakSubjects = perfResult.rows
      .filter(r => parseFloat(r.percentage) < 40)
      .map(r => r.subject_name);

    const avg = parseFloat(totalAvg);
    let grade = 'A+';
    if (avg < 40) grade = 'F';
    else if (avg < 55) grade = 'C';
    else if (avg < 70) grade = 'B';
    else if (avg < 85) grade = 'A';

    const report: ParentReport = {
      student: studentResult.rows[0],
      marks: marksResult.rows,
      performance: perfResult.rows,
      summary: {
        total_average: totalAvg,
        grade,
        weak_subjects: weakSubjects,
        total_exams: [...new Set(marksResult.rows.map(r => r.exam_name))].length,
      },
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;