import {
  Book,
  BorrowRequest,
  IssuedBook,
  Reservation,
  ReturnedBook,
  Fine,
  User,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { notify, notifyRole } from '../utils/notify.js';
import { nextIssueCode } from '../utils/issueCode.js';

const LOAN_DAYS = Number(process.env.LOAN_DAYS || 14);
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY || 5);

const requestPopulate = [
  { path: 'student', select: 'name username courseName yearLabel programme department' },
  { path: 'book', select: 'title author isbn available coverColor subject' },
];

async function openLoan(studentId, bookId) {
  return IssuedBook.findOne({ student: studentId, book: bookId, status: 'issued' });
}

export const requestBorrow = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.body.bookId);
  if (!book || !book.isActive) return res.status(404).json({ message: 'This title is not in the collection.' });
  if (book.available < 1) {
    return res.status(409).json({ message: 'No copies are on the shelf. Place a reservation instead.' });
  }
  const pending = await BorrowRequest.findOne({
    student: req.user._id,
    book: book._id,
    status: 'pending',
  });
  if (pending) return res.status(409).json({ message: 'A request for this title is already waiting at the desk.' });
  if (await openLoan(req.user._id, book._id)) {
    return res.status(409).json({ message: 'You already have this title issued.' });
  }

  const request = await BorrowRequest.create({
    student: req.user._id,
    book: book._id,
    note: (req.body.note || '').trim(),
  });
  await notifyRole(
    'librarian',
    {
      title: 'Borrow request',
      body: `${req.user.name} asked for “${book.title}”.`,
      type: 'request',
      link: '/desk',
    },
    book.department
  );
  await logActivity(req.user, 'Borrow requested', book.title);
  res.status(201).json({ request });
});

export const listRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const requests = await BorrowRequest.find(filter).populate(requestPopulate).sort({ createdAt: -1 }).limit(80);
  res.json({ requests });
});

async function issueFromRequest(request, librarian) {
  const book = await Book.findById(request.book);
  if (!book || book.available < 1) {
    const error = new Error('No shelf copy is free for this title right now.');
    error.status = 409;
    throw error;
  }
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LOAN_DAYS);
  const issue = await IssuedBook.create({
    code: await nextIssueCode(),
    student: request.student,
    book: book._id,
    request: request._id,
    dueDate,
    issuedBy: librarian._id,
  });
  book.available -= 1;
  book.borrowCount += 1;
  await book.save();

  request.status = 'issued';
  request.decidedBy = librarian._id;
  request.decidedAt = new Date();
  await request.save();

  await Reservation.updateMany(
    { student: request.student, book: book._id, status: { $in: ['waiting', 'ready'] } },
    { status: 'fulfilled', decidedBy: librarian._id }
  );

  await notify(request.student, {
    title: 'Book issued',
    body: `${book.title} is issued as ${issue.code}. Return by ${dueDate.toLocaleDateString('en-IN')}.`,
    type: 'approved',
    link: '/my-library',
  });
  await logActivity(librarian, 'Book issued', `${issue.code} · ${book.title}`);
  return issue;
}

export const approveRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id);
  if (!request || request.status !== 'pending') {
    return res.status(404).json({ message: 'That request is no longer waiting.' });
  }
  const issue = await issueFromRequest(request, req.user);
  res.json({ issue, request });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id).populate('book', 'title');
  if (!request || request.status !== 'pending') {
    return res.status(404).json({ message: 'That request is no longer waiting.' });
  }
  request.status = 'rejected';
  request.decisionNote = (req.body.note || '').trim();
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  await request.save();
  await notify(request.student, {
    title: 'Request declined',
    body: request.decisionNote
      ? `“${request.book.title}” was declined. ${request.decisionNote}`
      : `“${request.book.title}” could not be issued.`,
    type: 'rejected',
    link: '/my-library',
  });
  await logActivity(req.user, 'Request declined', request.book.title);
  res.json({ request });
});

export const listIssues = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.user.role === 'hod') {
    const books = await Book.find({ department: req.user.department }).select('_id');
    filter.book = { $in: books.map((book) => book._id) };
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.overdue === 'true') {
    filter.status = 'issued';
    filter.dueDate = { $lt: new Date() };
  }
  const issues = await IssuedBook.find(filter)
    .populate('student', 'name username courseName yearLabel')
    .populate('book', 'title author coverColor isbn subject')
    .sort({ issueDate: -1 })
    .limit(100);
  res.json({ issues });
});

export const returnIssue = asyncHandler(async (req, res) => {
  const issue = await IssuedBook.findById(req.params.id).populate('book');
  if (!issue || issue.status !== 'issued') return res.status(404).json({ message: 'This loan is already closed.' });

  const now = new Date();
  let daysLate = 0;
  let amount = 0;
  if (now > issue.dueDate) {
    daysLate = Math.ceil((now - issue.dueDate) / 86400000);
    amount = daysLate * FINE_PER_DAY;
  }

  issue.status = 'returned';
  issue.returnDate = now;
  issue.fineAmount = amount;
  issue.returnedTo = req.user._id;
  await issue.save();

  const book = await Book.findById(issue.book._id);
  await ReturnedBook.create({
    issueCode: issue.code,
    student: issue.student,
    book: book._id,
    issueDate: issue.issueDate,
    dueDate: issue.dueDate,
    returnDate: now,
    fineAmount: amount,
    onTime: amount === 0,
  });
  book.available += 1;
  await book.save();

  let fine = null;
  if (amount > 0) {
    fine = await Fine.create({
      student: issue.student,
      issue: issue._id,
      amount,
      daysLate,
      reason: `Late return · ${daysLate} day${daysLate === 1 ? '' : 's'} × ₹${FINE_PER_DAY}`,
    });
    await notify(issue.student, {
      title: 'Late return fine',
      body: `₹${amount} is due on ${issue.code} (${daysLate} day${daysLate === 1 ? '' : 's'} late).`,
      type: 'fine',
      link: '/my-library',
    });
  } else {
    await notify(issue.student, {
      title: 'Returned on time',
      body: `${book.title} (${issue.code}) is back on the shelf. No fine.`,
      type: 'return',
      link: '/my-library',
    });
  }

  const next = await Reservation.findOne({ book: book._id, status: 'waiting' }).sort({ createdAt: 1 });
  if (next) {
    next.status = 'ready';
    next.notifiedAt = now;
    await next.save();
    await notify(next.student, {
      title: 'Reserved title is free',
      body: `“${book.title}” is back. Ask the desk to issue it before the next reader.`,
      type: 'reservation',
      link: '/my-library',
    });
  }

  await logActivity(req.user, 'Book returned', `${issue.code} · ${book.title}${amount ? ` · fine ₹${amount}` : ''}`);
  res.json({ issue, fine, reservation: next });
});

export const reserveBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.body.bookId);
  if (!book) return res.status(404).json({ message: 'This title is not in the collection.' });
  if (book.available > 0) {
    return res.status(409).json({ message: 'Copies are available. Send a borrow request instead.' });
  }
  const existing = await Reservation.findOne({
    student: req.user._id,
    book: book._id,
    status: { $in: ['waiting', 'ready'] },
  });
  if (existing) return res.status(409).json({ message: 'You are already in the queue for this title.' });

  const ahead = await Reservation.countDocuments({ book: book._id, status: { $in: ['waiting', 'ready'] } });
  const reservation = await Reservation.create({
    student: req.user._id,
    book: book._id,
    position: ahead + 1,
    note: (req.body.note || '').trim(),
  });
  await notifyRole(
    'librarian',
    {
      title: 'New reservation',
      body: `${req.user.name} joined the queue for “${book.title}”.`,
      type: 'reservation',
      link: '/desk',
    },
    book.department
  );
  await logActivity(req.user, 'Book reserved', book.title);
  res.status(201).json({ reservation });
});

export const listReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const reservations = await Reservation.find(filter)
    .populate('student', 'name username courseName yearLabel')
    .populate('book', 'title author available coverColor')
    .sort({ createdAt: 1 });
  res.json({ reservations });
});

export const decideReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation || !['waiting', 'ready'].includes(reservation.status)) {
    return res.status(404).json({ message: 'That reservation is no longer open.' });
  }

  if (req.body.action === 'reject') {
    reservation.status = 'rejected';
    reservation.decidedBy = req.user._id;
    await reservation.save();
    await notify(reservation.student, {
      title: 'Reservation declined',
      body: 'The desk could not hold this title for you.',
      type: 'rejected',
      link: '/my-library',
    });
    return res.json({ reservation });
  }

  if (req.body.action !== 'issue') {
    return res.status(422).json({ message: 'Choose issue or reject.' });
  }

  const request = await BorrowRequest.create({
    student: reservation.student,
    book: reservation.book,
    note: 'Issued from reservation queue',
    status: 'pending',
  });
  const issue = await issueFromRequest(request, req.user);
  reservation.status = 'fulfilled';
  reservation.decidedBy = req.user._id;
  await reservation.save();
  res.json({ reservation, issue });
});

export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    student: req.user._id,
    status: { $in: ['waiting', 'ready'] },
  });
  if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });
  reservation.status = 'cancelled';
  await reservation.save();
  res.json({ reservation });
});

export const listFines = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.query.paid === 'false') filter.paid = false;
  const fines = await Fine.find(filter)
    .populate('student', 'name username courseName')
    .populate({ path: 'issue', select: 'code dueDate returnDate', populate: { path: 'book', select: 'title' } })
    .sort({ createdAt: -1 });
  res.json({ fines, rate: FINE_PER_DAY });
});

export const settleFine = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id);
  if (!fine) return res.status(404).json({ message: 'Fine not found.' });
  fine.paid = true;
  fine.paidAt = new Date();
  await fine.save();
  await notify(fine.student, {
    title: 'Fine settled',
    body: `₹${fine.amount} has been marked paid at the desk.`,
    type: 'fine',
    link: '/my-library',
  });
  await logActivity(req.user, 'Fine settled', `₹${fine.amount}`);
  res.json({ fine });
});

export const myReading = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'recentlyViewed.book',
    select: 'title author coverColor subject available',
  });
  const issues = await IssuedBook.find({ student: req.user._id });
  const returned = issues.filter((item) => item.status === 'returned').length;
  const active = issues.filter((item) => item.status === 'issued');
  const overdue = active.filter((item) => item.dueDate < new Date()).length;
  res.json({
    recentlyViewed: (user.recentlyViewed || []).filter((item) => item.book),
    stats: {
      borrowed: issues.length,
      active: active.length,
      returned,
      overdue,
      saved: user.favorites.length,
    },
  });
});
