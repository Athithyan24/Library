import {
  Book,
  User,
  Department,
  IssuedBook,
  BorrowRequest,
  Fine,
  Reservation,
  Review,
  Resource,
  Notification,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const adminDashboard = asyncHandler(async (_req, res) => {
  const [departments, students, books, staff, activeLoans, returned, overdue] = await Promise.all([
    Department.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    Book.countDocuments({ isActive: true }),
    User.countDocuments({ role: { $in: ['hod', 'librarian'] }, isActive: true }),
    IssuedBook.countDocuments({ status: 'issued' }),
    IssuedBook.countDocuments({ status: 'returned' }),
    IssuedBook.countDocuments({ status: 'issued', dueDate: { $lt: new Date() } }),
  ]);

  const deptBooks = await Book.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$department', titles: { $sum: 1 }, copies: { $sum: '$quantity' } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    { $project: { name: '$department.code', titles: 1, copies: 1 } },
    { $sort: { copies: -1 } },
  ]);

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const loans = await IssuedBook.find({ issueDate: { $gte: since } }).select('issueDate');
  const buckets = {};
  for (let i = 0; i < 6; i += 1) {
    const cursor = new Date(since.getFullYear(), since.getMonth() + i, 1);
    buckets[monthKey(cursor)] = 0;
  }
  loans.forEach((loan) => {
    const key = monthKey(new Date(loan.issueDate));
    if (key in buckets) buckets[key] += 1;
  });

  const readers = await User.countDocuments({
    role: 'student',
    updatedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
  });

  res.json({
    totals: { departments, students, books, staff, activeLoans, returned, overdue },
    deptBooks,
    trend: Object.entries(buckets).map(([month, count]) => ({ month, count })),
    activeReaders: readers,
  });
});

export const hodDashboard = asyncHandler(async (req, res) => {
  const department = req.user.department;
  const [titles, students] = await Promise.all([
    Book.find({ department, isActive: true }).select('title borrowCount available quantity author coverColor coverImage'),
    User.find({ department, role: 'student', isActive: true }).select('name courseName yearLabel programme'),
  ]);
  const bookIds = titles.map((book) => book._id);
  const issues = await IssuedBook.find({ book: { $in: bookIds } }).populate('student', 'name courseName');
  const readerMap = {};
  issues.forEach((issue) => {
    const id = String(issue.student?._id);
    if (!readerMap[id]) readerMap[id] = { name: issue.student?.name, course: issue.student?.courseName, count: 0 };
    readerMap[id].count += 1;
  });
  const topReaders = Object.values(readerMap).sort((a, b) => b.count - a.count).slice(0, 5);
  const popular = [...titles].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 5);
  res.json({
    totals: {
      titles: titles.length,
      copies: titles.reduce((sum, book) => sum + book.quantity, 0),
      students: students.length,
      loans: issues.filter((issue) => issue.status === 'issued').length,
    },
    popular,
    topReaders,
    yearSplit: ['UG', 'PG'].map((level) => ({
      level,
      count: students.filter((student) => student.programme === level).length,
    })),
  });
});

export const librarianDashboard = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [pending, active, overdue, reservations, fines] = await Promise.all([
    BorrowRequest.find({ status: 'pending' })
      .populate('student', 'name courseName yearLabel')
      .populate('book', 'title author')
      .sort({ createdAt: 1 })
      .limit(8),
    IssuedBook.countDocuments({ status: 'issued' }),
    IssuedBook.find({ status: 'issued', dueDate: { $lt: now } })
      .populate('student', 'name')
      .populate('book', 'title')
      .sort({ dueDate: 1 })
      .limit(6),
    Reservation.countDocuments({ status: { $in: ['waiting', 'ready'] } }),
    Fine.aggregate([
      { $group: { _id: '$paid', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const collected = fines.find((row) => row._id === true)?.amount || 0;
  const outstanding = fines.find((row) => row._id === false)?.amount || 0;
  res.json({
    pending,
    totals: { active, overdue: overdue.length, reservations, collected, outstanding },
    overdue,
  });
});

export const studentDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 86400000);
  const [loans, reservations, fines, favorites] = await Promise.all([
    IssuedBook.find({ student: req.user._id })
      .populate('book', 'title author coverColor coverImage subject pdfUrl')
      .sort({ issueDate: -1 }),
    Reservation.find({ student: req.user._id, status: { $in: ['waiting', 'ready'] } }).populate(
      'book',
      'title author coverColor coverImage'
    ),
    Fine.find({ student: req.user._id, paid: false }),
    Book.find({ _id: { $in: req.user.favorites } }).select('title author coverColor coverImage subject').limit(4),
  ]);

  const dueSoon = loans.filter((loan) => loan.status === 'issued' && loan.dueDate <= soon && loan.dueDate >= now);
  for (const loan of dueSoon) {
    const existing = await Notification.findOne({
      user: req.user._id,
      type: 'due',
      body: new RegExp(loan.code),
      createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    });
    if (!existing) {
      await Notification.create({
        user: req.user._id,
        title: 'Return window closing',
        body: `${loan.book?.title} (${loan.code}) is due ${loan.dueDate.toLocaleDateString('en-IN')}.`,
        type: 'due',
        link: '/my-library',
      });
    }
  }

  const recent = await Book.find({ isActive: true }).sort({ createdAt: -1 }).limit(4).select('title author coverColor coverImage subject available');
  const popular = await Book.find({ isActive: true }).sort({ borrowCount: -1 }).limit(4).select('title author coverColor coverImage subject borrowCount available');

  res.json({
    loans: loans.filter((loan) => loan.status === 'issued'),
    history: loans.filter((loan) => loan.status === 'returned').slice(0, 5),
    reservations,
    fineDue: fines.reduce((sum, fine) => sum + fine.amount, 0),
    favorites,
    recent,
    popular,
  });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  const unread = items.filter((item) => !item.read).length;
  res.json({ items, unread });
});

export const readNotification = asyncHandler(async (req, res) => {
  if (req.params.id === 'all') {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    return res.json({ ok: true });
  }
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
});

export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ books: [], people: [] });
  const regex = new RegExp(q, 'i');
  const bookFilter = {
    isActive: true,
    $or: [{ title: regex }, { author: regex }, { isbn: regex }, { subject: regex }],
  };
  if (req.user.role === 'hod') bookFilter.department = req.user.department;
  const books = await Book.find(bookFilter).select('title author subject coverColor coverImage').limit(6);
  let people = [];
  if (req.user.role !== 'student') {
    const peopleFilter = { name: regex, role: 'student' };
    if (req.user.role === 'hod') peopleFilter.department = req.user.department;
    people = await User.find(peopleFilter).select('name courseName yearLabel username').limit(5);
  }
  res.json({ books, people });
});

export const listResources = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student' || req.user.role === 'hod') filter.department = req.user.department;
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.subject) filter.subject = new RegExp(req.query.subject, 'i');
  const resources = await Resource.find(filter).populate('department', 'name code').sort({ createdAt: -1 });
  res.json({ resources });
});

export const createResource = asyncHandler(async (req, res) => {
  const department = req.user.role === 'hod' ? req.user.department : req.body.department || req.user.department;
  if (!req.body.title || !req.body.kind || !req.body.subject) {
    return res.status(422).json({ message: 'Title, kind, and subject are required.' });
  }
  const resource = await Resource.create({
    title: req.body.title.trim(),
    kind: req.body.kind,
    department,
    programme: req.body.programme || 'All',
    yearLabel: req.body.yearLabel || 'All',
    subject: req.body.subject.trim(),
    topic: req.body.topic || '',
    summary: req.body.summary || '',
    fileUrl: req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl || '',
    addedBy: req.user._id,
  });
  await logActivity(req.user, 'Resource added', resource.title);
  res.status(201).json({ resource });
});

export const readingRoom = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(4).populate('student', 'name').populate('book', 'title');
  res.json({ reviews });
});
