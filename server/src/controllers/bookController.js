import { Book, Category, Review, IssuedBook, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';
import { notify } from '../utils/notify.js';

const bookPopulate = [
  { path: 'category', select: 'name' },
  { path: 'department', select: 'name code' },
];

async function withRatings(books) {
  const ids = books.map((book) => book._id);
  const ratings = await Review.aggregate([
    { $match: { book: { $in: ids } } },
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(ratings.map((row) => [String(row._id), row]));
  return books.map((book) => {
    const plain = book.toObject ? book.toObject() : book;
    const stat = map[String(plain._id)];
    return { ...plain, rating: stat ? Math.round(stat.avg * 10) / 10 : 0, reviewCount: stat?.count || 0 };
  });
}

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
});

export const listBooks = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  const { q, category, department, subject, available, ebook, sort } = req.query;

  if (req.user.role === 'hod') filter.department = req.user.department;
  else if (department) filter.department = department;
  if (category) filter.category = category;
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (available === 'true') filter.available = { $gt: 0 };
  if (ebook === 'true') filter.pdfUrl = { $ne: '' };
  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { author: new RegExp(q, 'i') },
      { isbn: new RegExp(q, 'i') },
      { subject: new RegExp(q, 'i') },
    ];
  }

  let query = Book.find(filter).populate(bookPopulate);
  if (sort === 'popular') query = query.sort({ borrowCount: -1 });
  else if (sort === 'recent') query = query.sort({ createdAt: -1 });
  else query = query.sort({ title: 1 });

  const books = await query.limit(80);
  res.json({ books: await withRatings(books) });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate(bookPopulate);
  if (!book) return res.status(404).json({ message: 'This title is not in the collection.' });
  if (req.user.role === 'hod' && String(book.department?._id || book.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'This title belongs to another department.' });
  }
  const [rated] = await withRatings([book]);
  const reviews = await Review.find({ book: book._id }).populate('student', 'name courseName yearLabel').sort({ createdAt: -1 });

  if (req.user.role === 'student') {
    const viewed = req.user.recentlyViewed.filter((item) => String(item.book) !== String(book._id));
    viewed.unshift({ book: book._id, at: new Date() });
    req.user.recentlyViewed = viewed.slice(0, 8);
    await req.user.save();
  }

  res.json({ book: rated, reviews });
});

export const createBook = asyncHandler(async (req, res) => {
  const department = req.user.role === 'hod' ? req.user.department : req.body.department;
  if (!department) return res.status(422).json({ message: 'Department is required.' });
  if (req.user.role === 'hod' && req.body.department && String(req.body.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'You can catalogue books only for your own department.' });
  }

  const required = ['title', 'author', 'isbn', 'category', 'subject'];
  for (const field of required) {
    if (!req.body[field]) return res.status(422).json({ message: `${field} is required.` });
  }
  const quantity = Number(req.body.quantity ?? 1);
  if (Number.isNaN(quantity) || quantity < 1) return res.status(422).json({ message: 'Quantity must be at least 1.' });

  const book = await Book.create({
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    isbn: req.body.isbn.trim(),
    publisher: req.body.publisher || '',
    category: req.body.category,
    edition: req.body.edition || '1st',
    publicationYear: req.body.publicationYear ? Number(req.body.publicationYear) : undefined,
    department,
    subject: req.body.subject.trim(),
    description: req.body.description || '',
    quantity,
    available: quantity,
    coverColor: req.body.coverColor || '#1e4d3a',
    coverImage: req.files?.cover?.[0] ? `/uploads/${req.files.cover[0].filename}` : '',
    pdfUrl: req.files?.pdf?.[0] ? `/uploads/${req.files.pdf[0].filename}` : req.body.pdfUrl || '',
    addedBy: req.user._id,
  });

  const students = await User.find({ role: 'student', department, isActive: true }).select('_id');
  await Promise.all(
    students.map((student) =>
      notify(student._id, {
        title: 'New title on the shelf',
        body: `${book.title} by ${book.author} was just added.`,
        type: 'book',
        link: `/books/${book._id}`,
      })
    )
  );
  await logActivity(req.user, 'Book catalogued', book.title);
  const populated = await Book.findById(book._id).populate(bookPopulate);
  res.status(201).json({ book: populated });
});

export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (req.user.role === 'hod' && String(book.department) !== String(req.user.department)) {
    return res.status(403).json({ message: 'This title belongs to another department.' });
  }

  const fields = ['title', 'author', 'isbn', 'publisher', 'category', 'edition', 'subject', 'description', 'coverColor'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') book[field] = req.body[field];
  });
  if (req.body.publicationYear) book.publicationYear = Number(req.body.publicationYear);
  if (req.files?.cover?.[0]) book.coverImage = `/uploads/${req.files.cover[0].filename}`;
  if (req.files?.pdf?.[0]) book.pdfUrl = `/uploads/${req.files.pdf[0].filename}`;
  await book.save();
  await logActivity(req.user, 'Book updated', book.title);
  const populated = await Book.findById(book._id).populate(bookPopulate);
  res.json({ book: populated });
});

export const adjustCopies = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const delta = Number(req.body.delta);
  if (!delta || Number.isNaN(delta)) return res.status(422).json({ message: 'Provide a copy change, for example 1 or -1.' });

  const nextQty = book.quantity + delta;
  const nextAvailable = book.available + delta;
  if (nextQty < 0 || nextAvailable < 0) {
    return res.status(422).json({ message: 'That would take copies below what is already on loan.' });
  }
  book.quantity = nextQty;
  book.available = nextAvailable;
  await book.save();
  await logActivity(req.user, 'Copies adjusted', `${book.title} · ${delta > 0 ? '+' : ''}${delta}`);
  res.json({ book });
});

export const markDamaged = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const count = Number(req.body.count || 1);
  if (book.available < count) return res.status(422).json({ message: 'Not enough shelf copies to withdraw.' });
  book.available -= count;
  book.quantity -= count;
  book.damagedCopies += count;
  await book.save();
  await logActivity(req.user, 'Damaged copies withdrawn', `${count} × ${book.title}`);
  res.json({ book });
});

export const addReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) return res.status(422).json({ message: 'Choose a rating from 1 to 5.' });
  const borrowed = await IssuedBook.findOne({ student: req.user._id, book: req.params.id });
  if (!borrowed) return res.status(403).json({ message: 'Reviews are open after you have borrowed the title.' });

  const review = await Review.findOneAndUpdate(
    { book: req.params.id, student: req.user._id },
    { rating, comment: (req.body.comment || '').trim() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ review });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const user = req.user;
  const id = String(req.params.id);
  const exists = user.favorites.some((item) => String(item) === id);
  user.favorites = exists ? user.favorites.filter((item) => String(item) !== id) : [...user.favorites, req.params.id];
  await user.save();
  res.json({ favorites: user.favorites, saved: !exists });
});

export const favorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    populate: bookPopulate,
  });
  res.json({ books: await withRatings(user.favorites || []) });
});
