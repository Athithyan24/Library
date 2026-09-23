import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import {
  User,
  Department,
  AcademicProgram,
  Category,
  Book,
  Review,
  BorrowRequest,
  IssuedBook,
  Reservation,
  Fine,
  Resource,
  Notification,
  ActivityLog,
  Counter,
} from './models/index.js';

const hash = (value) => bcrypt.hash(value, 10);

const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
};

async function seed() {
  await connectDb();
  await mongoose.connection.dropDatabase();

  const programs = await AcademicProgram.create([
    { level: 'UG', name: 'Undergraduate', years: ['1st Year', '2nd Year', '3rd Year'] },
    { level: 'PG', name: 'Postgraduate', years: ['1st Year', '2nd Year'] },
  ]);

  const deptSeed = [
    ['Computer Science', 'CS', 'Core computing, systems, and software for the department reading room.'],
    ['Information Technology', 'IT', 'Applied computing, networks, and information systems.'],
    ['Artificial Intelligence', 'AI', 'Intelligent systems, learning, and language.'],
    ['Data Science', 'DS', 'Statistical learning and data practice.'],
    ['Cyber Security', 'CY', 'Security, privacy, and secure systems.'],
    ['Software Engineering', 'SE', 'Design, process, and delivery of software.'],
    ['Computer Applications', 'CA', 'Application building across the undergraduate years.'],
  ];
  const departments = await Department.create(
    deptSeed.map(([name, code, description]) => ({ name, code, description }))
  );
  const dept = Object.fromEntries(departments.map((item) => [item.code, item]));

  const categoryNames = [
    ['Programming', 'Languages, practice, and craft.'],
    ['Database', 'Models, queries, and storage engines.'],
    ['Operating Systems', 'Processes, memory, and kernels.'],
    ['Networking', 'Protocols and distributed talk.'],
    ['Artificial Intelligence', 'Search, knowledge, and agents.'],
    ['Machine Learning', 'Models that learn from data.'],
    ['Cyber Security', 'Defence, cryptography, and risk.'],
    ['Cloud Computing', 'Platforms, scale, and operations.'],
    ['Web Development', 'Interfaces and services on the web.'],
    ['Software Engineering', 'How teams build lasting software.'],
  ];
  const categories = await Category.create(categoryNames.map(([name, blurb]) => ({ name, blurb })));
  const cat = Object.fromEntries(categories.map((item) => [item.name, item]));

  const password = await hash('Library@123');
  const admin = await User.create({
    name: 'Registrar Mehta',
    username: 'admin',
    email: 'registrar@csdept.edu',
    password,
    role: 'admin',
  });

  const hod = await User.create({
    name: 'Dr. Anjali Rao',
    username: 'hod.cs',
    email: 'anjali.rao@csdept.edu',
    password,
    role: 'hod',
    department: dept.CS._id,
  });
  const hodAI = await User.create({
    name: 'Dr. Kabir Sen',
    username: 'hod.ai',
    email: 'kabir.sen@csdept.edu',
    password,
    role: 'hod',
    department: dept.AI._id,
  });
  const librarian = await User.create({
    name: 'Leela Krishnan',
    username: 'librarian',
    email: 'desk@csdept.edu',
    password,
    role: 'librarian',
    department: dept.CS._id,
  });

  const students = await User.create([
    {
      name: 'Ananya Iyer',
      username: 'ananya',
      email: 'ananya@csdept.edu',
      password,
      role: 'student',
      department: dept.CS._id,
      programme: 'PG',
      yearLabel: '1st Year',
      courseName: 'M.Sc Computer Science',
    },
    {
      name: 'Rahul Menon',
      username: 'rahul',
      email: 'rahul@csdept.edu',
      password,
      role: 'student',
      department: dept.CS._id,
      programme: 'UG',
      yearLabel: '2nd Year',
      courseName: 'B.Sc Computer Science',
    },
    {
      name: 'Meera Nair',
      username: 'meera',
      email: 'meera@csdept.edu',
      password,
      role: 'student',
      department: dept.CS._id,
      programme: 'UG',
      yearLabel: '1st Year',
      courseName: 'B.Sc Computer Science',
    },
    {
      name: 'Arjun Das',
      username: 'arjun',
      email: 'arjun@csdept.edu',
      password,
      role: 'student',
      department: dept.CS._id,
      programme: 'PG',
      yearLabel: '2nd Year',
      courseName: 'M.Sc Computer Science',
    },
    {
      name: 'Sara Qureshi',
      username: 'sara',
      email: 'sara@csdept.edu',
      password,
      role: 'student',
      department: dept.AI._id,
      programme: 'PG',
      yearLabel: '1st Year',
      courseName: 'M.Sc Artificial Intelligence',
    },
  ]);
  const [ananya, rahul, meera, arjun, sara] = students;

  const palette = ['#1e4d3a', '#3d4f6f', '#6b3f3a', '#3f4a3a', '#5c4a32', '#24342e', '#4a3d55', '#2f4550'];
  const bookSeed = [
    ['The C Programming Language', 'Brian Kernighan, Dennis Ritchie', '9780131103627', 'Prentice Hall', 'Programming', '2nd', 1988, 'CS', 'Programming in C', 'The book the department still hands to first-year labs.', 4, 2, 18],
    ['Database System Concepts', 'Abraham Silberschatz', '9780078022159', 'McGraw Hill', 'Database', '7th', 2019, 'CS', 'DBMS', 'A course spine for relational design and transactions.', 5, 1, 22],
    ['Operating System Concepts', 'Abraham Silberschatz', '9781119800361', 'Wiley', 'Operating Systems', '10th', 2018, 'CS', 'Operating Systems', 'Processes, memory, and the evenings before the OS viva.', 1, 0, 16],
    ['Computer Networking: A Top-Down Approach', 'James Kurose, Keith Ross', '9780133594140', 'Pearson', 'Networking', '7th', 2016, 'CS', 'Computer Networks', 'From the application layer downward, with problems that linger.', 3, 2, 11],
    ['Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', '9780134610993', 'Pearson', 'Artificial Intelligence', '4th', 2020, 'AI', 'Artificial Intelligence', 'The shared reference for the AI reading list.', 3, 1, 14],
    ['Hands-On Machine Learning', 'Aurélien Géron', '9781098125974', 'O’Reilly', 'Machine Learning', '3rd', 2022, 'AI', 'Machine Learning', 'Practical models, with a PDF companion for lab week.', 3, 2, 19],
    ['Cryptography and Network Security', 'William Stallings', '9780134444284', 'Pearson', 'Cyber Security', '7th', 2017, 'CY', 'Network Security', 'Cipher suites and the questions that follow them.', 2, 1, 7],
    ['Designing Data-Intensive Applications', 'Martin Kleppmann', '9781449373320', 'O’Reilly', 'Database', '1st', 2017, 'DS', 'Distributed Systems', 'Reliability, scale, and maintainability, read slowly.', 2, 1, 9],
    ['Clean Code', 'Robert C. Martin', '9780132350884', 'Prentice Hall', 'Software Engineering', '1st', 2008, 'SE', 'Software Design', 'A short, opinionated shelf favourite before project reviews.', 4, 3, 15],
    ['Eloquent JavaScript', 'Marijn Haverbeke', '9781593279509', 'No Starch', 'Web Development', '3rd', 2018, 'CA', 'Web Technology', 'Language fundamentals with a downloadable edition.', 3, 3, 8],
    ['Cloud Native Patterns', 'Cornelia Davis', '9781617294297', 'Manning', 'Cloud Computing', '1st', 2019, 'IT', 'Cloud Computing', 'How services behave once they leave a single machine.', 2, 2, 6],
    ['Computer Networks', 'Andrew Tanenbaum', '9780132126953', 'Pearson', 'Networking', '5th', 2010, 'IT', 'Computer Networks', 'A second voice on the network syllabus.', 2, 2, 5],
    ['Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein', '9780262046305', 'MIT Press', 'Programming', '4th', 2022, 'CS', 'Design and Analysis of Algorithms', 'The heavy green book. Everyone knows which one.', 3, 1, 21],
    ['Deep Learning', 'Ian Goodfellow', '9780262035613', 'MIT Press', 'Machine Learning', '1st', 2016, 'DS', 'Deep Learning', 'Foundations for the PG elective.', 2, 1, 10],
  ];

  const books = await Book.create(
    bookSeed.map((row, index) => ({
      title: row[0],
      author: row[1],
      isbn: row[2],
      publisher: row[3],
      category: cat[row[4]]._id,
      edition: row[5],
      publicationYear: row[6],
      department: dept[row[7]]._id,
      subject: row[8],
      description: row[9],
      quantity: row[10],
      available: row[11],
      borrowCount: row[12],
      coverColor: palette[index % palette.length],
      pdfUrl: ['9781098125974', '9781593279509', '9780262035613'].includes(row[2]) ? '/samples/companion.pdf' : '',
      addedBy: row[7] === 'AI' ? hodAI._id : hod._id,
      createdAt: daysAgo(40 - index * 2),
    }))
  );
  const byIsbn = Object.fromEntries(books.map((book) => [book.isbn, book]));

  await Counter.create({ key: 'issue', seq: 147 });

  const makeIssue = async ({ code, student, isbn, ago, days, returned, lateDays = 0 }) => {
    const book = byIsbn[isbn];
    const issueDate = daysAgo(ago);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const returnDate = returned ? new Date(dueDate.getTime() + lateDays * 86400000) : null;
    const request = await BorrowRequest.create({
      student: student._id,
      book: book._id,
      status: 'issued',
      decidedBy: librarian._id,
      decidedAt: issueDate,
      createdAt: issueDate,
    });
    const issue = await IssuedBook.create({
      code,
      student: student._id,
      book: book._id,
      request: request._id,
      issueDate,
      dueDate: returned ? dueDate : daysAgo(-days),
      returnDate,
      status: returned ? 'returned' : 'issued',
      fineAmount: lateDays > 0 ? lateDays * 5 : 0,
      issuedBy: librarian._id,
      returnedTo: returned ? librarian._id : null,
      createdAt: issueDate,
    });
    return issue;
  };

  const history = [
    ['ISS000139', ananya, '9780131103627', 70, 0, true, 0],
    ['ISS000140', rahul, '9780078022159', 55, 0, true, 3],
    ['ISS000141', meera, '9780133594140', 40, 0, true, 0],
    ['ISS000142', arjun, '9780262046305', 28, 0, true, 0],
    ['ISS000143', ananya, '9781449373320', 18, 0, true, 2],
    ['ISS000145', ananya, '9780134610993', 6, 8, false, 0],
    ['ISS000146', rahul, '9781119800361', 20, -4, false, 0],
    ['ISS000147', meera, '9780132350884', 3, 11, false, 0],
  ];

  const issues = [];
  for (const row of history) {
    issues.push(
      await makeIssue({
        code: row[0],
        student: row[1],
        isbn: row[2],
        ago: row[3],
        days: row[4],
        returned: row[5],
        lateDays: row[6],
      })
    );
  }

  const lateRahul = issues[1];
  const lateAnanya = issues[4];
  await Fine.create([
    {
      student: rahul._id,
      issue: lateRahul._id,
      amount: 15,
      daysLate: 3,
      reason: 'Late return · 3 days × ₹5',
      paid: true,
      paidAt: daysAgo(30),
      createdAt: daysAgo(36),
    },
    {
      student: ananya._id,
      issue: lateAnanya._id,
      amount: 10,
      daysLate: 2,
      reason: 'Late return · 2 days × ₹5',
      paid: false,
      createdAt: daysAgo(2),
    },
  ]);

  await BorrowRequest.create({
    student: arjun._id,
    book: byIsbn['9780131103627']._id,
    status: 'pending',
    note: 'Needed for the algorithms lab citation.',
    createdAt: daysAgo(1),
  });

  await Reservation.create({
    student: meera._id,
    book: byIsbn['9781119800361']._id,
    status: 'waiting',
    position: 1,
    note: 'OS viva next week.',
    createdAt: daysAgo(2),
  });
  await Reservation.create({
    student: sara._id,
    book: byIsbn['9780262035613']._id,
    status: 'ready',
    position: 1,
    notifiedAt: daysAgo(0),
    createdAt: daysAgo(5),
  });

  ananya.favorites = [byIsbn['9781449373320']._id, byIsbn['9780262046305']._id];
  ananya.recentlyViewed = [
    { book: byIsbn['9780134610993']._id, at: daysAgo(0) },
    { book: byIsbn['9781098125974']._id, at: daysAgo(1) },
  ];
  await ananya.save();
  rahul.favorites = [byIsbn['9780132350884']._id];
  await rahul.save();

  await Review.create([
    {
      book: byIsbn['9780131103627']._id,
      student: ananya._id,
      rating: 5,
      comment: 'Still the clearest explanation of pointers I have been handed.',
    },
    {
      book: byIsbn['9780078022159']._id,
      student: rahul._id,
      rating: 4,
      comment: 'Dense, but the transaction chapters carried the internal.',
    },
    {
      book: byIsbn['9781449373320']._id,
      student: ananya._id,
      rating: 5,
      comment: 'Read it twice. The replication chapter changed how I talk in seminars.',
    },
    {
      book: byIsbn['9780132350884']._id,
      student: meera._id,
      rating: 4,
      comment: 'Short enough to finish between labs.',
    },
  ]);

  await Resource.create([
    {
      title: 'DBMS End-Semester Papers 2022–2025',
      kind: 'Question Papers',
      department: dept.CS._id,
      programme: 'UG',
      yearLabel: '2nd Year',
      subject: 'DBMS',
      topic: 'Transactions',
      summary: 'Five papers, with the 2024 set marked by the course teacher.',
      addedBy: hod._id,
    },
    {
      title: 'Operating Systems Lab Manual',
      kind: 'Lab Manuals',
      department: dept.CS._id,
      programme: 'UG',
      yearLabel: '2nd Year',
      subject: 'Operating Systems',
      topic: 'Process scheduling',
      summary: 'Shell experiments used in the Monday lab.',
      addedBy: hod._id,
    },
    {
      title: 'Lecture Notes — Relational Algebra',
      kind: 'Notes',
      department: dept.CS._id,
      programme: 'PG',
      yearLabel: '1st Year',
      subject: 'DBMS',
      topic: 'Relational algebra',
      summary: 'Dr. Rao’s annotated notes from week 4.',
      addedBy: hod._id,
    },
    {
      title: 'Attention Is All You Need — reading copy',
      kind: 'Research Papers',
      department: dept.AI._id,
      programme: 'PG',
      yearLabel: '1st Year',
      subject: 'Machine Learning',
      topic: 'Transformers',
      summary: 'Seminar paper for the language models hour.',
      addedBy: hodAI._id,
    },
    {
      title: 'MERN Stack Lecture Deck',
      kind: 'Lecture Materials',
      department: dept.CS._id,
      programme: 'PG',
      yearLabel: '1st Year',
      subject: 'Web Technology',
      topic: 'Full stack',
      summary: 'Slides from the departmental workshop.',
      addedBy: librarian._id,
    },
  ]);

  await Notification.create([
    {
      user: ananya._id,
      title: 'Late return fine',
      body: '₹10 is due on ISS000143 (2 days late).',
      type: 'fine',
      link: '/my-library',
      read: false,
    },
    {
      user: ananya._id,
      title: 'Book issued',
      body: 'Artificial Intelligence: A Modern Approach is issued as ISS000145.',
      type: 'approved',
      link: '/my-library',
      read: true,
    },
    {
      user: librarian._id,
      title: 'Borrow request',
      body: 'Arjun Das asked for “The C Programming Language”.',
      type: 'request',
      link: '/desk',
      read: false,
    },
    {
      user: sara._id,
      title: 'Reserved title is free',
      body: '“Deep Learning” is back. Ask the desk to issue it.',
      type: 'reservation',
      link: '/my-library',
      read: false,
    },
  ]);

  await ActivityLog.create([
    { actor: admin._id, actorName: admin.name, role: 'admin', action: 'Department opened', detail: 'Computer Science', createdAt: daysAgo(80) },
    { actor: admin._id, actorName: admin.name, role: 'admin', action: 'Staff appointed', detail: 'Dr. Anjali Rao · hod · Computer Science', createdAt: daysAgo(78) },
    { actor: admin._id, actorName: admin.name, role: 'admin', action: 'Staff appointed', detail: 'Leela Krishnan · librarian · Computer Science', createdAt: daysAgo(77) },
    { actor: hod._id, actorName: hod.name, role: 'hod', action: 'Student enrolled', detail: 'Ananya Iyer · M.Sc Computer Science · 1st Year', createdAt: daysAgo(60) },
    { actor: hod._id, actorName: hod.name, role: 'hod', action: 'Book catalogued', detail: 'Introduction to Algorithms', createdAt: daysAgo(20) },
    { actor: librarian._id, actorName: librarian.name, role: 'librarian', action: 'Book issued', detail: 'ISS000145 · Artificial Intelligence: A Modern Approach', createdAt: daysAgo(6) },
  ]);

  console.log('Seeded cs_elibrary.');
  console.log('Password for every demo account: Library@123');
  console.log('admin · hod.cs · hod.ai · librarian · ananya · rahul · meera · arjun · sara');
  console.log(`Programs: ${programs.length}, departments: ${departments.length}`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
