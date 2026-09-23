import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Cover } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

const sorts = [
  ['All', {}],
  ['On shelf', { available: 'true' }],
  ['Digital copy', { ebook: 'true' }],
  ['Just in', { sort: 'recent' }],
  ['Most borrowed', { sort: 'popular' }],
];

function Tile({ book, badge }) {
  return (
    <Link to={`/books/${book._id}`} className="group block rounded-2xl border border-line bg-panel p-2.5 shadow-card transition hover:-translate-y-0.5">
      <div className="relative">
        <Cover book={book} className="h-36 rounded-xl" />
        {badge && (
          <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-pine">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-2 px-1 text-sm font-semibold leading-snug">{book.title}</p>
      <p className="mt-1 px-1 text-xs text-mute">
        {book.author}
        <span className="text-mute/70"> · {book.available > 0 ? `${book.available} on shelf` : 'Waitlist'}</span>
      </p>
    </Link>
  );
}

export default function Catalog() {
  const role = useAuth((state) => state.user?.role);
  const [q, setQ] = useState('');
  const [facet, setFacet] = useState(0);
  const [category, setCategory] = useState('');
  const [grid, setGrid] = useState(true);
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
  const books = useQuery({
    queryKey: ['books', q, facet, category],
    queryFn: async () => (await api.get('/books', { params: { q, category, ...sorts[facet][1] } })).data,
  });

  const list = books.data?.books || [];
  const featured = list.slice(0, 3);
  const rest = list.slice(3);
  const activeFilters = Number(Boolean(category)) + Number(facet > 0);

  return (
    <div>
      {role === 'student' && (
        <div className="mb-4 flex gap-6 border-b border-line text-sm">
          <Link to="/my-library" className="pb-3 text-mute">My shelf</Link>
          <span className="border-b-2 border-pine pb-3 font-medium text-pine">Library</span>
          <Link to="/my-library" className="pb-3 text-mute">Returned</Link>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#fff4ee] via-[#fff8f4] to-[#f4f7ff] px-6 py-7 dark:from-paper dark:to-panel">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight">Find your next book</h2>
          <p className="mt-1 text-sm text-mute">Browse the department library by subject, shelf, and what other students are borrowing.</p>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full bg-[#ffd7c4]/80 blur-2xl" />
      </section>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Featured titles</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {featured.map((book) => (
            <Link key={book._id} to={`/books/${book._id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-card">
              <Cover book={book} compact className="h-14 w-14 shrink-0 rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{book.title}</span>
                <span className="mt-0.5 block truncate text-xs text-mute">{book.subject} · {book.category?.name}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">On the shelf</h3>
            <div className="flex gap-1">
              <button onClick={() => setGrid(true)} className={`rounded-lg border p-1.5 ${grid ? 'border-line bg-paper' : 'border-transparent text-mute'}`} aria-label="Grid">
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setGrid(false)} className={`rounded-lg border p-1.5 ${!grid ? 'border-line bg-paper' : 'border-transparent text-mute'}`} aria-label="List">
                <List size={14} />
              </button>
            </div>
          </div>

          {books.isLoading ? <Bones /> : list.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line px-6 py-8">
              <LottieSlot name="empty" className="h-28 w-28" />
              <h2 className="text-xl font-semibold">No books found</h2>
              <p className="text-sm text-mute">Try another subject, or clear the filters.</p>
            </div>
          ) : grid ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {(rest.length ? rest : list).map((book, index) => (
                <motion.div key={book._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03 }}>
                  <Tile book={book} badge={index < 2 ? 'New' : ''} />
                </motion.div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {list.map((book) => (
                <li key={book._id}>
                  <Link to={`/books/${book._id}`} className="flex items-center gap-3 px-3 py-3">
                    <Cover book={book} compact className="h-12 w-10 rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{book.title}</span>
                      <span className="text-xs text-mute">{book.author}</span>
                    </span>
                    <span className="text-xs text-mute">{book.available > 0 ? `${book.available} free` : 'Waitlist'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rounded-3xl border border-line bg-panel p-4 xl:sticky xl:top-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold"><SlidersHorizontal size={14} /> Filters</p>
            {activeFilters > 0 && (
              <button
                className="text-xs text-pine"
                onClick={() => {
                  setCategory('');
                  setFacet(0);
                  setQ('');
                }}
              >
                Clear filter ({activeFilters})
              </button>
            )}
          </div>
          <label className="mt-3 block text-xs text-mute">
            Search
            <input className="field mt-1" placeholder="Title, author, ISBN" value={q} onChange={(event) => setQ(event.target.value)} />
          </label>
          <p className="mb-2 mt-4 text-xs font-medium">Categories <span className="text-mute">{category ? 1 : 0}</span></p>
          <ul className="space-y-1.5">
            {(categories.data?.categories || []).map((item) => (
              <li key={item._id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[#ff5a30]"
                    checked={category === item._id}
                    onChange={() => setCategory(category === item._id ? '' : item._id)}
                  />
                  {item.name}
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-xs text-mute">
            Availability
            <select className="field mt-1" value={facet} onChange={(event) => setFacet(Number(event.target.value))}>
              {sorts.map(([label], index) => (
                <option key={label} value={index}>{label}</option>
              ))}
            </select>
          </label>
        </aside>
      </div>
    </div>
  );
}
