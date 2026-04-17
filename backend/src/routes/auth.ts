import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../db';
import { User } from '../types';

const router = Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  try {
    const existing = await pool.query<User>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query<User>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase(), password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/signin', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  try {
    const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  try {
    const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.json({ message: 'If an account exists, a reset link has been sent.' });
      return;
    }
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"EduTrack" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your EduTrack password',
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:2rem;border-radius:1rem;">
          <div style="background:linear-gradient(135deg,#1e3a8a,#3d74f5);padding:1.5rem 2rem;border-radius:0.75rem;margin-bottom:1.5rem;">
            <h1 style="color:#fff;font-size:1.4rem;margin:0;font-weight:700;">EduTrack</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:0.8rem;margin:0.25rem 0 0;">AI Student Progress Tracker</p>
          </div>
          <div style="background:#fff;padding:1.75rem 2rem;border-radius:0.75rem;border:1px solid #e2e8f0;">
            <h2 style="font-size:1.1rem;color:#1e293b;margin:0 0 0.75rem;">Password Reset Request</h2>
            <p style="color:#64748b;font-size:0.9rem;line-height:1.6;margin:0 0 1.25rem;">
              Hi <strong style="color:#1e293b;">${user.name}</strong>, we received a request to reset your EduTrack password.
              Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background:#3d74f5;color:#fff;padding:0.75rem 1.75rem;border-radius:0.75rem;text-decoration:none;font-weight:600;font-size:0.9rem;margin-bottom:1.25rem;">
              Reset Password
            </a>
            <p style="color:#94a3b8;font-size:0.78rem;margin:0;border-top:1px solid #f1f5f9;padding-top:1rem;">
              If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
      `,
    });
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token: string; password: string };
  if (!token || !password) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  try {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Reset link is invalid or has expired' });
      return;
    }
    const user = result.rows[0];
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number; email: string; name: string };
    res.json({ id: decoded.userId, email: decoded.email, name: decoded.name });
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
});

export default router;