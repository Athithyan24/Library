import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'cs-elibrary-viva-secret-change-me', {
    expiresIn: '7d',
  });

export const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  department: user.department,
  programme: user.programme,
  yearLabel: user.yearLabel,
  courseName: user.courseName,
  phone: user.phone,
});

export const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

  const username = String(req.body.username).toLowerCase().trim();
  const user = await User.findOne({ username }).select('+password').populate('department', 'name code isActive');
  if (!user) return res.status(401).json({ message: 'Those credentials do not match our register.' });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(401).json({ message: 'Those credentials do not match our register.' });
  if (!user.isActive) return res.status(403).json({ message: 'This account has been disabled.' });
  if (user.department && user.department.isActive === false) {
    return res.status(403).json({ message: 'This department is currently disabled.' });
  }

  res.json({ token: sign(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name code isActive');
  res.json({ user: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (name) user.name = name.trim();
  if (email !== undefined) user.email = email.trim();
  if (phone !== undefined) user.phone = phone.trim();

  if (newPassword) {
    if (!currentPassword) return res.status(422).json({ message: 'Enter your current password to set a new one.' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect.' });
    if (String(newPassword).length < 6) return res.status(422).json({ message: 'Use at least 6 characters.' });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  const fresh = await User.findById(user._id).populate('department', 'name code isActive');
  res.json({ user: publicUser(fresh) });
});
