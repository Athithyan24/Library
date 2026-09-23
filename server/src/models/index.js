import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'hod', 'librarian', 'student'], required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    programme: { type: String, enum: ['UG', 'PG', ''], default: '' },
    yearLabel: { type: String, default: '' },
    courseName: { type: String, default: '' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    recentlyViewed: [
      {
        book: { type: Schema.Types.ObjectId, ref: 'Book' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const academicProgramSchema = new Schema(
  {
    level: { type: String, enum: ['UG', 'PG'], required: true },
    name: { type: String, required: true },
    years: [{ type: String, required: true }],
  },
  { timestamps: true }
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    blurb: { type: String, default: '' },
  },
  { timestamps: true }
);

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    publisher: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    edition: { type: String, default: '1st' },
    publicationYear: { type: Number },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 },
    coverColor: { type: String, default: '#1e4d3a' },
    coverImage: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    damagedCopies: { type: Number, default: 0 },
    borrowCount: { type: Number, default: 0 },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', author: 'text', subject: 'text', isbn: 'text' });

const reviewSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ book: 1, student: 1 }, { unique: true });

const borrowRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    status: {
      type: String,
      enum: ['pending', 'rejected', 'issued'],
      default: 'pending',
    },
    note: { type: String, default: '' },
    decisionNote: { type: String, default: '' },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
  },
  { timestamps: true }
);

const issuedBookSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    request: { type: Schema.Types.ObjectId, ref: 'BorrowRequest' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: Date,
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
    fineAmount: { type: Number, default: 0 },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    returnedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const reservationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    status: { type: String, enum: ['waiting', 'ready', 'fulfilled', 'rejected', 'cancelled'], default: 'waiting' },
    position: { type: Number, default: 1 },
    note: { type: String, default: '' },
    notifiedAt: Date,
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const returnedBookSchema = new Schema(
  {
    issueCode: String,
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    issueDate: Date,
    dueDate: Date,
    returnDate: Date,
    fineAmount: { type: Number, default: 0 },
    onTime: Boolean,
  },
  { timestamps: true }
);

const fineSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issue: { type: Schema.Types.ObjectId, ref: 'IssuedBook', required: true },
    amount: { type: Number, required: true },
    daysLate: { type: Number, required: true },
    reason: { type: String, default: 'Late return' },
    paid: { type: Boolean, default: false },
    paidAt: Date,
  },
  { timestamps: true }
);

const resourceSchema = new Schema(
  {
    title: { type: String, required: true },
    kind: {
      type: String,
      enum: ['PDF', 'Notes', 'Question Papers', 'Research Papers', 'Lab Manuals', 'Lecture Materials'],
      required: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    programme: { type: String, enum: ['UG', 'PG', 'All'], default: 'All' },
    yearLabel: { type: String, default: 'All' },
    subject: { type: String, required: true },
    topic: { type: String, default: '' },
    summary: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: { type: String, default: 'info' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const activitySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    role: String,
    action: { type: String, required: true },
    detail: { type: String, default: '' },
  },
  { timestamps: true }
);

const counterSchema = new Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

export const User = model('User', userSchema);
export const Department = model('Department', departmentSchema);
export const AcademicProgram = model('AcademicProgram', academicProgramSchema);
export const Category = model('Category', categorySchema);
export const Book = model('Book', bookSchema);
export const Review = model('Review', reviewSchema);
export const BorrowRequest = model('BorrowRequest', borrowRequestSchema);
export const IssuedBook = model('IssuedBook', issuedBookSchema);
export const Reservation = model('Reservation', reservationSchema);
export const ReturnedBook = model('ReturnedBook', returnedBookSchema);
export const Fine = model('Fine', fineSchema);
export const Resource = model('Resource', resourceSchema);
export const Notification = model('Notification', notificationSchema);
export const ActivityLog = model('ActivityLog', activitySchema);
export const Counter = model('Counter', counterSchema);
