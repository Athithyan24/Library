import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'cs-elibrary-viva-secret-change-me');
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'This account is not active.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Sign in again.' });
  }
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this desk.' });
    }
    next();
  };
}
