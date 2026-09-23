import bcrypt from 'bcryptjs';
import { User, Department, AcademicProgram, ActivityLog } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { publicUser } from './authController.js';

function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] === undefined || String(body[field]).trim() === '') {
      const error = new Error(`${field} is required.`);
      error.status = 422;
      throw error;
    }
  }
}

export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  const staff = await User.find({ role: { $in: ['hod', 'librarian'] } }).select('name username role department isActive');
  const counts = await User.aggregate([
    { $match: { role: 'student', isActive: true, department: { $ne: null } } },
    { $group: { _id: '$department', students: { $sum: 1 } } },
  ]);
  const byDept = Object.fromEntries(counts.map((row) => [String(row._id), row.students]));
  res.json({
    departments: departments.map((dept) => ({
      ...dept.toObject(),
      students: byDept[String(dept._id)] || 0,
      hod: staff.find((person) => person.role === 'hod' && String(person.department) === String(dept._id)) || null,
      librarian: staff.find((person) => person.role === 'librarian' && String(person.department) === String(dept._id)) || null,
    })),
  });
});

export const createDepartment = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'code']);
  const department = await Department.create({
    name: req.body.name.trim(),
    code: req.body.code.trim().toUpperCase(),
    description: req.body.description?.trim() || '',
  });
  await logActivity(req.user, 'Department opened', department.name);
  res.status(201).json({ department });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ message: 'Department not found.' });
  if (req.body.name) department.name = req.body.name.trim();
  if (req.body.code) department.code = req.body.code.trim().toUpperCase();
  if (req.body.description !== undefined) department.description = req.body.description;
  if (typeof req.body.isActive === 'boolean') department.isActive = req.body.isActive;
  await department.save();
  await logActivity(req.user, department.isActive ? 'Department updated' : 'Department disabled', department.name);
  res.json({ department });
});

export const listPrograms = asyncHandler(async (_req, res) => {
  const programs = await AcademicProgram.find().sort({ level: -1 });
  res.json({ programs });
});

export const saveProgram = asyncHandler(async (req, res) => {
  requireFields(req.body, ['level', 'name']);
  const years = Array.isArray(req.body.years) ? req.body.years.map((year) => String(year).trim()).filter(Boolean) : [];
  if (!years.length) return res.status(422).json({ message: 'Add at least one academic year.' });

  let program;
  if (req.params.id) {
    program = await AcademicProgram.findByIdAndUpdate(
      req.params.id,
      { level: req.body.level, name: req.body.name.trim(), years },
      { new: true }
    );
  } else {
    program = await AcademicProgram.create({ level: req.body.level, name: req.body.name.trim(), years });
  }
  await logActivity(req.user, 'Academic structure saved', `${program.level}: ${program.years.join(', ')}`);
  res.status(req.params.id ? 200 : 201).json({ program });
});

export const listStaff = asyncHandler(async (req, res) => {
  const filter = { role: { $in: ['hod', 'librarian'] } };
  if (req.query.role) filter.role = req.query.role;
  const staff = await User.find(filter).populate('department', 'name code').sort({ createdAt: -1 });
  res.json({ staff: staff.map(publicUser) });
});

export const createStaff = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'username', 'password', 'role', 'department']);
  if (!['hod', 'librarian'].includes(req.body.role)) {
    return res.status(422).json({ message: 'Staff role must be HOD or librarian.' });
  }
  const department = await Department.findById(req.body.department);
  if (!department) return res.status(404).json({ message: 'Department not found.' });

  if (req.body.role === 'hod') {
    const existing = await User.findOne({ role: 'hod', department: department._id, isActive: true });
    if (existing) return res.status(409).json({ message: `${department.name} already has an active HOD.` });
  }

  const password = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    name: req.body.name.trim(),
    username: req.body.username.toLowerCase().trim(),
    email: req.body.email?.trim() || '',
    password,
    role: req.body.role,
    department: department._id,
    phone: req.body.phone || '',
  });
  await logActivity(req.user, 'Staff appointed', `${user.name} · ${user.role} · ${department.name}`);
  res.status(201).json({ user: publicUser(user), password: req.body.password });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !['hod', 'librarian'].includes(user.role)) {
    return res.status(404).json({ message: 'Staff account not found.' });
  }
  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.email !== undefined) user.email = req.body.email;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
  if (req.body.department) user.department = req.body.department;
  if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
  await user.save();
  res.json({ user: publicUser(user) });
});

export const listStudents = asyncHandler(async (req, res) => {
  const filter = { role: 'student' };
  if (req.user.role === 'hod') filter.department = req.user.department;
  if (req.query.department && req.user.role === 'admin') filter.department = req.query.department;
  if (req.query.programme) filter.programme = req.query.programme;
  if (req.query.year) filter.yearLabel = req.query.year;
  const students = await User.find(filter).populate('department', 'name code').sort({ name: 1 });
  res.json({ students: students.map(publicUser) });
});

export const createStudent = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'username', 'password', 'programme', 'yearLabel', 'courseName']);
  const departmentId = req.user.role === 'hod' ? req.user.department : req.body.department;
  if (!departmentId) return res.status(422).json({ message: 'Department is required.' });
  if (req.user.role === 'hod' && String(req.body.department || req.user.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'You can enrol students only in your own department.' });
  }
  if (!['UG', 'PG'].includes(req.body.programme)) {
    return res.status(422).json({ message: 'Programme must be UG or PG.' });
  }

  const passwordPlain = req.body.password;
  const user = await User.create({
    name: req.body.name.trim(),
    username: req.body.username.toLowerCase().trim(),
    email: req.body.email?.trim() || '',
    password: await bcrypt.hash(passwordPlain, 10),
    role: 'student',
    department: departmentId,
    programme: req.body.programme,
    yearLabel: req.body.yearLabel,
    courseName: req.body.courseName.trim(),
  });
  await logActivity(req.user, 'Student enrolled', `${user.name} · ${user.courseName} · ${user.yearLabel}`);
  const populated = await User.findById(user._id).populate('department', 'name code');
  res.status(201).json({ user: publicUser(populated), password: passwordPlain });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found.' });
  if (req.user.role === 'hod' && String(student.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'This student belongs to another department.' });
  }
  ['name', 'courseName', 'yearLabel', 'programme', 'email', 'phone'].forEach((key) => {
    if (req.body[key] !== undefined) student[key] = req.body[key];
  });
  if (typeof req.body.isActive === 'boolean') student.isActive = req.body.isActive;
  if (req.body.password) student.password = await bcrypt.hash(req.body.password, 10);
  await student.save();
  res.json({ user: publicUser(student) });
});

export const activity = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'hod') {
    const people = await User.find({ department: req.user.department }).select('_id');
    filter.actor = { $in: people.map((person) => person._id) };
  }
  if (req.user.role === 'student') filter.actor = req.user._id;
  const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(40);
  res.json({ logs });
});
