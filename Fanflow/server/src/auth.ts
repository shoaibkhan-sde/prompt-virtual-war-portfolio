import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import { getDbUserByEmail, createDbUser, User } from './db';
import { getRequestId, logJSON } from './middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_fanflow_2026';

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const existing = await getDbUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createDbUser({ email, passwordHash, fullName });
    
    const token = jsonwebtoken.sign({ id: newUser.id, isGuest: false, email: newUser.email, fullName: newUser.fullName }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    return res.json({ id: newUser.id, email: newUser.email, fullName: newUser.fullName });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const user = await getDbUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jsonwebtoken.sign({ id: user.id, isGuest: false, email: user.email, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    return res.json({ id: user.id, email: user.email, fullName: user.fullName });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/guest', async (req: Request, res: Response) => {
  try {
    const token = jsonwebtoken.sign({ id: `guest-${Date.now()}`, isGuest: true, fullName: 'Guest User' }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    
    return res.json({ id: 'guest', isGuest: true, fullName: 'Guest User' });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET) as any;
    return res.json({ id: decoded.id, isGuest: decoded.isGuest, email: decoded.email, fullName: decoded.fullName });
  } catch (err: unknown) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

export default router;
