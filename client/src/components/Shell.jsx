import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BookCopy,
  BookOpen,
  Bookmark,
  Building2,
  ClipboardList,
  GraduationCap,
  History,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/useAuth';
import { useUi } from '../store/useUi';
import { Btn } from './ui';

const NAV = {
  admin: [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/staff', label: 'Appointments', icon: ShieldCheck },
    { to: '/academics', label: 'Years', icon: GraduationCap },
    { to: '/catalog', label: 'Collection', icon: Library },
    { to: '/activity', label: 'Activity', icon: History },
  ],
  hod: [
    { to: '/', label: 'Department', icon: LayoutDashboard, end: true },
    { to: '/shelf', label: 'Shelf', icon: BookCopy },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/resources', label: 'Materials', icon: BookOpen },
    { to: '/activity', label: 'Activity', icon: History },
  ],
  librarian: [
    { to: '/', label: 'Today', icon: LayoutDashboard, end: true },
    { to: '/desk', label: 'Circulation', icon: ClipboardList },
    { to: '/inventory', label: 'Copies', icon: Library },
    { to: '/fines', label: 'Fines', icon: Receipt },
    { to: '/resources', label: 'Materials', icon: BookOpen },
    { to: '/activity', label: 'Activity', icon: History },
  ],
  student: [
    { to: '/', label: 'Today', icon: LayoutDashboard, end: true },
    { to: '/catalog', label: 'Catalogue', icon: Library },
    { to: '/my-library', label: 'My shelf', icon: Bookmark },
    { to: '/resources', label: 'Materials', icon: BookOpen },
  ],
};

const CRUMB = {
  '/': 'Today',
  '/departments': 'Departments',
  '/staff': 'Appointments',
  '/academics': 'Academic years',
  '/catalog': 'Catalogue',
  '/shelf': 'Shelf',
  '/students': 'Students',
  '/desk': 'Circulation desk',
  '/inventory': 'Copies',
  '/fines': 'Fines',
  '/resources': 'Materials',
  '/activity': 'Activity',
  '/profile': 'Profile',
  '/my-library': 'My shelf',
};

export function Shell() {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const collapsed = useUi((state) => state.collapsed);
  const toggleCollapsed = useUi((state) => state.toggleCollapsed);
  const dark = useUi((state) => state.dark);
  const toggleDark = useUi((state) => state.toggleDark);
  const palette = useUi((state) => state.palette);
  const setPalette = useUi((state) => state.setPalette);
  const notices = useUi((state) => state.notices);
  const setNotices = useUi((state) => state.setNotices);
  const mobileNav = useUi((state) => state.mobileNav);
  const setMobileNav = useUi((state) => state.setMobileNav);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPalette]);

  useEffect(() => {
    setMobileNav(false);
    setMenu(false);
  }, [location.pathname, setMobileNav]);

  const crumb = location.pathname.startsWith('/books/') ? 'Title' : CRUMB[location.pathname] || 'Reading Room';
  const width = collapsed ? 84 : 248;

  return (
    <div className="min-h-screen md:flex">
      <AnimatePresence>
        {mobileNav && (
          <motion.button
            className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNav(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed inset-y-0 left-0 z-40 flex-col border-r border-line bg-paper px-3 py-4 md:sticky md:top-0 md:h-screen ${
          mobileNav ? 'flex' : 'hidden md:flex'
        }`}
        animate={{ width }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      >
        <div className={`mb-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pine text-paper">
              <Library size={18} strokeWidth={1.7} />
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-serif text-lg leading-none">Reading Room</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-mute">Computer Science</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative">
              {({ isActive }) => (
                <span className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${collapsed ? 'justify-center' : ''}`}>
                  {isActive && (
                    <motion.span layoutId="active-nav" className="absolute inset-0 rounded-2xl bg-pine/10" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
                  )}
                  <item.icon size={18} strokeWidth={1.7} className={`relative ${isActive ? 'text-pine' : 'text-mute'}`} />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        className={`relative truncate ${isActive ? 'text-ink' : 'text-mute'}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleCollapsed}
          className="mt-3 hidden items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm text-mute hover:bg-panel md:flex"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>
            <PanelLeft size={16} />
          </motion.span>
          {!collapsed && 'Collapse'}
        </button>
      </motion.aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/80 bg-paper/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <button className="md:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Department library</p>
            <p className="truncate font-serif text-lg leading-tight">{crumb}</p>
          </div>
          <button
            onClick={() => setPalette(true)}
            className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-mute sm:flex"
          >
            <Search size={14} />
            Search the room
            <kbd className="rounded-md border border-line px-1.5 text-[10px]">Ctrl K</kbd>
          </button>
          <button className="sm:hidden" onClick={() => setPalette(true)} aria-label="Search">
            <Search size={18} />
          </button>
          <button onClick={() => setNotices(!notices)} className="relative rounded-full p-2" aria-label="Notifications">
            <Bell size={18} />
            <NoticeDot />
          </button>
          <button onClick={toggleDark} className="rounded-full p-2" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button onClick={() => setMenu((open) => !open)} className="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brass/30 text-xs font-medium">
                {user.name.slice(0, 1)}
              </span>
              <span className="hidden text-sm sm:block">{user.name.split(' ')[0]}</span>
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-panel p-2 shadow-lift"
                >
                  <p className="px-2 py-1 text-xs uppercase tracking-wider text-mute">{user.role}</p>
                  <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm" onClick={() => navigate('/profile')}>
                    <UserRound size={15} /> Profile
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm" onClick={() => navigate('/profile')}>
                    <Settings size={15} /> Preferences
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-clay"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} items={items} />
      <NoticePanel open={notices} onClose={() => setNotices(false)} />
    </div>
  );
}

function NoticeDot() {
  const query = useQuery({ queryKey: ['notes'], queryFn: async () => (await api.get('/notifications')).data });
  if (!query.data?.unread) return null;
  return <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay" />;
}

function NoticePanel({ open, onClose }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['notes'], queryFn: async () => (await api.get('/notifications')).data, enabled: open });

  const read = async (id, link) => {
    await api.post(`/notifications/${id}/read`);
    client.invalidateQueries({ queryKey: ['notes'] });
    if (link) navigate(link);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          className="fixed bottom-4 right-4 top-20 z-40 flex w-[min(100%-2rem,22rem)] flex-col rounded-3xl border border-line bg-panel p-4 shadow-lift"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">Notices</h2>
            <div className="flex gap-2">
              <Btn tone="ghost" className="px-2 text-xs" onClick={() => read('all')}>
                Mark read
              </Btn>
              <button onClick={onClose} aria-label="Close notices">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-2 overflow-auto">
            {(query.data?.items || []).map((item, index) => (
              <motion.button
                key={item._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => read(item._id, item.link)}
                className={`block w-full rounded-2xl px-3 py-3 text-left ${item.read ? 'opacity-60' : 'bg-paper'}`}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-mute">{item.body}</p>
              </motion.button>
            ))}
            {query.data && !query.data.items.length && <p className="text-sm text-mute">Nothing waiting.</p>}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function CommandPalette({ open, onClose, items }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['search', q],
    queryFn: async () => (await api.get('/search', { params: { q } })).data,
    enabled: open && q.trim().length > 1,
  });

  const pages = useMemo(
    () => items.filter((item) => item.label.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const go = (to) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-ink/30 backdrop-blur-md" onClick={onClose} aria-label="Close search" />
          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-panel shadow-lift"
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search size={16} className="text-mute" />
              <input
                autoFocus
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Titles, people, pages"
                className="w-full bg-transparent py-4 outline-none"
              />
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {pages.map((item) => (
                <button key={item.to} onClick={() => go(item.to)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-paper">
                  <item.icon size={15} /> {item.label}
                </button>
              ))}
              {(query.data?.books || []).map((book) => (
                <button key={book._id} onClick={() => go(`/books/${book._id}`)} className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-paper">
                  <span className="text-sm">{book.title}</span>
                  <span className="text-xs text-mute">{book.author}</span>
                </button>
              ))}
              {(query.data?.people || []).map((person) => (
                <button key={person._id} onClick={() => go('/students')} className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-paper">
                  <span className="text-sm">{person.name}</span>
                  <span className="text-xs text-mute">{person.courseName}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
