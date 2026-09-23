import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import { useThemeBoot } from './components/LottieSlot';
import { Shell } from './components/Shell';
import Login from './pages/Login';
import Lost from './pages/Lost';
import AdminHome from './pages/admin/Home';
import Departments from './pages/admin/Departments';
import Staff from './pages/admin/Staff';
import Academics from './pages/admin/Academics';
import HodHome from './pages/hod/Home';
import Shelf from './pages/hod/Shelf';
import Roster from './pages/hod/Roster';
import LibrarianHome from './pages/librarian/Home';
import Desk from './pages/librarian/Desk';
import Inventory from './pages/librarian/Inventory';
import Fines from './pages/librarian/Fines';
import StudentHome from './pages/student/Home';
import Catalog from './pages/student/Catalog';
import BookPage from './pages/student/Book';
import Mine from './pages/student/Mine';
import Resources from './pages/shared/Resources';
import Activity from './pages/shared/Activity';
import Profile from './pages/shared/Profile';

function Gate({ children }) {
  const token = useAuth((state) => state.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function Guest({ children }) {
  const token = useAuth((state) => state.token);
  if (token) return <Navigate to="/" replace />;
  return children;
}

function Role({ allow, children }) {
  const role = useAuth((state) => state.user?.role);
  if (!allow.includes(role)) return <Lost />;
  return children;
}

function Home() {
  const role = useAuth((state) => state.user?.role);
  if (role === 'admin') return <AdminHome />;
  if (role === 'hod') return <HodHome />;
  if (role === 'librarian') return <LibrarianHome />;
  return <StudentHome />;
}

export default function App() {
  useThemeBoot();
  return (
    <Routes>
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route element={<Gate><Shell /></Gate>}>
        <Route index element={<Home />} />
        <Route path="departments" element={<Role allow={['admin']}><Departments /></Role>} />
        <Route path="staff" element={<Role allow={['admin']}><Staff /></Role>} />
        <Route path="academics" element={<Role allow={['admin']}><Academics /></Role>} />
        <Route path="shelf" element={<Role allow={['hod']}><Shelf /></Role>} />
        <Route path="students" element={<Role allow={['hod', 'admin', 'librarian']}><Roster /></Role>} />
        <Route path="desk" element={<Role allow={['librarian']}><Desk /></Role>} />
        <Route path="inventory" element={<Role allow={['librarian']}><Inventory /></Role>} />
        <Route path="fines" element={<Role allow={['librarian', 'student']}><Fines /></Role>} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="books/:id" element={<BookPage />} />
        <Route path="my-library" element={<Role allow={['student']}><Mine /></Role>} />
        <Route path="resources" element={<Resources />} />
        <Route path="activity" element={<Activity />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Lost />} />
    </Routes>
  );
}
