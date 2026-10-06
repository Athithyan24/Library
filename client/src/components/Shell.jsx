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
import { Avatar, Btn } from './ui';

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
    { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
    { to: '/catalog', label: 'Library', icon: Library },
    { to: '/my-library', label: 'My shelf', icon: Bookmark },
    { to: '/resources', label: 'Materials', icon: BookOpen },
  ],
};

const CRUMB = {
  '/': 'Home',
  '/departments': 'Departments',
  '/staff': 'Appointments',
  '/academics': 'Academic years',
  '/catalog': 'Library',
  '/shelf': 'Shelf',
  '/students': 'Students',
  '/desk': 'Circulation',
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
    <div className="min-h-screen bg-canvas p-2 sm:p-4 md:p-5">
      <div className="mx-auto flex h-[calc(100vh-1rem)] max-w-[10000px] overflow-hidden rounded-[28px] border border-white/70 bg-panel shadow-lift sm:h-[calc(100vh-2.5rem)] dark:border-line">
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
          className={`fixed inset-y-2 left-2 z-40 flex-col overflow-y-auto rounded-[24px] border border-line bg-panel px-3 py-4 md:static md:inset-auto md:z-auto md:h-full md:rounded-none md:border-0 md:border-r ${
            mobileNav ? 'flex' : 'hidden md:flex'
          }`}
          animate={{ width }}
          transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        >
          <div className={`mb-4 flex items-center gap-2.5 px-1 ${collapsed ? 'justify-center' : ''}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pine text-white shadow-card">
              <Library size={16} strokeWidth={2.2} />
            </span>
            {!collapsed && <p className="text-[15px] font-semibold tracking-tight">Reading Room</p>}
          </div>

          <button
            onClick={() => setMenu((open) => !open)}
            className={`relative mb-4 flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-paper ${collapsed ? 'justify-center' : ''}`}
          >
            <Avatar person={user} className="h-9 w-9 shrink-0 text-sm" />
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{user.name}</span>
                <span className="block truncate text-xs text-mute">{user.email || user.username}</span>
              </span>
            )}
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-14 z-20 w-52 rounded-2xl border border-line bg-panel p-1.5 shadow-lift"
                >
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
          </button>

          {!collapsed && <p className="mb-1 px-3 text-[11px] font-medium text-mute">Menu</p>}
          <nav className="flex flex-1 flex-col gap-0.5">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <span className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-paper font-medium text-ink' : 'text-mute hover:bg-paper'}`}>
                    <item.icon size={16} strokeWidth={1.8} className={isActive ? 'text-ink' : ''} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {!collapsed && (
            <div className="mt-4 rounded-2xl bg-[#fff1ea] p-4 dark:bg-paper">
              <p className="text-sm font-semibold leading-snug">Need a title for class?</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">Search the department shelf and send a request to the desk.</p>
              <button onClick={() => navigate('/catalog')} className="mt-3 w-full rounded-xl bg-ink py-2 text-sm font-medium text-white dark:text-black">
                Browse library
              </button>
            </div>
          )}

          <button
            onClick={toggleCollapsed}
            className="mt-3 hidden items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-mute hover:bg-paper md:flex"
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>
              <PanelLeft size={16} />
            </motion.span>
            {!collapsed && 'Collapse'}
          </button>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3.5 md:px-6">
            <button className="rounded-xl border border-line p-2 md:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
              <Menu size={16} />
            </button>
            <h1 className="w-28 shrink-0 text-base font-semibold tracking-tight sm:w-40">{crumb}</h1>
            <button
              onClick={() => setPalette(true)}
              className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-line bg-paper px-3 text-sm text-mute md:flex"
            >
              <Search size={15} />
              <span className="flex-1 text-left">Search</span>
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <button className="rounded-xl border border-line p-2 md:hidden" onClick={() => setPalette(true)} aria-label="Search">
                <Search size={16} />
              </button>
              <button onClick={() => navigate('/catalog')} className="hidden rounded-xl border border-line p-2 sm:grid" aria-label="Library">
                <Library size={16} />
              </button>
              <button onClick={() => setNotices(!notices)} className="relative rounded-xl border border-line p-2" aria-label="Notifications">
                <Bell size={16} />
                <NoticeDot />
              </button>
              <button onClick={toggleDark} className="rounded-xl border border-line p-2" aria-label="Toggle theme">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 py-5 md:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
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
  const trending = useQuery({
    queryKey: ['books', 'trending'],
    queryFn: async () => (await api.get('/books', { params: { sort: 'popular' } })).data,
    enabled: open,
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

  const recent = ['Database', 'Operating Systems', 'Machine Learning', 'Networks'];
  const trends = (trending.data?.books || []).slice(0, 4);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={onClose} aria-label="Close search" />
          <motion.div
            initial={{ y: 12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-panel p-4 shadow-lift"
          >
            <div className="search-ring flex items-center gap-2 rounded-2xl px-4">
              <input
                autoFocus
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent py-3.5 text-sm outline-none"
              />
              <Search size={16} className="text-mute" />
            </div>

            <p className="mb-2 mt-4 text-xs text-mute">Recent search</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((chip) => (
                <button key={chip} onClick={() => setQ(chip)} className="inline-flex items-center gap-1 rounded-lg bg-paper px-2.5 py-1 text-xs text-mute">
                  <X size={11} /> {chip}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-4 text-xs text-mute">{q.trim().length > 1 ? 'Results' : 'Trending in the library'}</p>
            {q.trim().length > 1 ? (
              <div className="max-h-64 space-y-1 overflow-auto">
                {pages.map((item) => (
                  <button key={item.to} onClick={() => go(item.to)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-paper">
                    <item.icon size={15} /> {item.label}
                  </button>
                ))}
                {(query.data?.books || []).map((book) => (
                  <button key={book._id} onClick={() => go(`/books/${book._id}`)} className="flex w-full flex-col rounded-xl px-2 py-2 text-left hover:bg-paper">
                    <span className="text-sm font-medium">{book.title}</span>
                    <span className="text-xs text-mute">{book.author}</span>
                  </button>
                ))}
                {(query.data?.people || []).map((person) => (
                  <button key={person._id} onClick={() => go('/students')} className="flex w-full flex-col rounded-xl px-2 py-2 text-left hover:bg-paper">
                    <span className="text-sm font-medium">{person.name}</span>
                    <span className="text-xs text-mute">{person.courseName}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {trends.map((book) => (
                  <button key={book._id} onClick={() => go(`/books/${book._id}`)} className="flex items-center gap-3 rounded-2xl border border-line p-2.5 text-left hover:bg-paper">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: book.coverColor || '#ff5a30' }} />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{book.title}</span>
                      <span className="text-xs text-mute">{book.available > 0 ? `${book.available} on shelf` : 'Waitlist'}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-[11px] text-mute">
              <span>↑↓ Navigate</span>
              <span>Esc Close</span>
              <span>Enter Select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
