import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { Student, MarkWithDetails, PerformanceRow, ParentReport } from '../types';
import nodemailer from 'nodemailer';

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

router.post('/send-email', async (req: Request, res: Response): Promise<void> => {
  const { to, subject, body } = req.body as {
    to: string;
    subject: string;
    body: string;
    student_id?: string;
  };

  if (!to || !subject || !body) {
    res.status(400).json({ error: 'to, subject, and body are required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    let transporter: nodemailer.Transporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {

      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"EduTrack" <noreply@edutrack.app>',
      to,
      subject,
      text: body,
      // Optional HTML version with basic styling
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #3D74F5; color: white; padding: 16px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">📚 EduTrack — Progress Report</h2>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #334155; margin: 0;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
          Sent by EduTrack · AI Student Progress Tracker
        </p>
      </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.json({
      message: 'Email sent successfully',
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: `Failed to send email: ${(err as Error).message}` });
  }
});

export default router;