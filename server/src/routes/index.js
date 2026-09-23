import { Router } from 'express';
import { protect, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { login, loginRules, me, updateProfile } from '../controllers/authController.js';
import * as structure from '../controllers/structureController.js';
import * as books from '../controllers/bookController.js';
import * as circ from '../controllers/circulationController.js';
import * as insight from '../controllers/insightController.js';

const router = Router();

router.post('/auth/login', loginRules, login);

router.use(protect);
router.get('/auth/me', me);
router.put('/auth/profile', updateProfile);

router.get('/departments', structure.listDepartments);
router.post('/departments', allow('admin'), structure.createDepartment);
router.put('/departments/:id', allow('admin'), structure.updateDepartment);

router.get('/programs', structure.listPrograms);
router.post('/programs', allow('admin'), structure.saveProgram);
router.put('/programs/:id', allow('admin'), structure.saveProgram);

router.get('/staff', allow('admin'), structure.listStaff);
router.post('/staff', allow('admin'), structure.createStaff);
router.put('/staff/:id', allow('admin'), structure.updateStaff);

router.get('/students', allow('admin', 'hod', 'librarian'), structure.listStudents);
router.post('/students', allow('hod', 'admin'), structure.createStudent);
router.put('/students/:id', allow('hod', 'admin'), structure.updateStudent);

router.get('/activity', structure.activity);

router.get('/categories', books.listCategories);
router.get('/books', books.listBooks);
router.get('/books/:id', books.getBook);
router.post(
  '/books',
  allow('hod', 'admin'),
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  books.createBook
);
router.put(
  '/books/:id',
  allow('hod', 'admin'),
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  books.updateBook
);
router.post('/books/:id/copies', allow('librarian'), books.adjustCopies);
router.post('/books/:id/damage', allow('librarian'), books.markDamaged);
router.post('/books/:id/reviews', allow('student'), books.addReview);
router.post('/books/:id/favorite', allow('student'), books.toggleFavorite);
router.get('/favorites', allow('student'), books.favorites);

router.post('/borrow', allow('student'), circ.requestBorrow);
router.get('/borrow', circ.listRequests);
router.post('/borrow/:id/approve', allow('librarian'), circ.approveRequest);
router.post('/borrow/:id/reject', allow('librarian'), circ.rejectRequest);

router.get('/issues', circ.listIssues);
router.post('/issues/:id/return', allow('librarian'), circ.returnIssue);

router.post('/reservations', allow('student'), circ.reserveBook);
router.get('/reservations', circ.listReservations);
router.post('/reservations/:id/decide', allow('librarian'), circ.decideReservation);
router.post('/reservations/:id/cancel', allow('student'), circ.cancelReservation);

router.get('/fines', circ.listFines);
router.post('/fines/:id/settle', allow('librarian'), circ.settleFine);
router.get('/reading', allow('student'), circ.myReading);

router.get('/dashboard/admin', allow('admin'), insight.adminDashboard);
router.get('/dashboard/hod', allow('hod'), insight.hodDashboard);
router.get('/dashboard/librarian', allow('librarian'), insight.librarianDashboard);
router.get('/dashboard/student', allow('student'), insight.studentDashboard);

router.get('/notifications', insight.listNotifications);
router.post('/notifications/:id/read', insight.readNotification);
router.get('/search', insight.search);

router.get('/resources', insight.listResources);
router.post('/resources', allow('hod', 'librarian', 'admin'), upload.single('file'), insight.createResource);
router.get('/reading-room', insight.readingRoom);

export default router;
