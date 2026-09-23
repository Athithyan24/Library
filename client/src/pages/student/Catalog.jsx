import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Bones, Cover, Stars } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

const filters = [
  ['All', {}],
  ['On shelf', { available: 'true' }],
  ['Digital copy', { ebook: 'true' }],
  ['Just in', { sort: 'recent' }],
  ['Most borrowed', { sort: 'popular' }],
];

export default function Catalog() {
  const [q, setQ] = useState('');
  const [facet, setFacet] = useState(0);
  const [category, setCategory] = useState('');
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
  const books = useQuery({
    queryKey: ['books', q, facet, category],
    queryFn: async () => (await api.get('/books', { params: { q, category, ...filters[facet][1] } })).data,
  });

  const list = books.data?.books || [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Catalogue</h1>
          <p className="mt-2 text-sm text-mute">Title, author, ISBN, subject. Department shelves stay inside their rooms for heads of department.</p>
        </div>
      </div>
      <input className="field mt-6" placeholder="Search the collection" value={q} onChange={(event) => setQ(event.target.value)} />
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map(([label], index) => (
          <button key={label} onClick={() => setFacet(index)} className={`rounded-full px-3 py-1.5 text-sm ${facet === index ? 'bg-pine text-paper' : 'bg-panel border border-line'}`}>
            {label}
          </button>
        ))}
        <select className="rounded-full border border-line bg-panel px-3 py-1.5 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Every category</option>
          {(categories.data?.categories || []).map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </select>
      </div>

      {books.isLoading ? <div className="mt-8"><Bones /></div> : list.length === 0 ? (
        <div className="mt-10">
          <LottieSlot name="empty" className="h-32 w-32" />
          <h2 className="font-serif text-3xl">No books found</h2>
          <p className="text-sm text-mute">Try another subject, or clear the shelf filter.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((book, index) => (
            <motion.article key={book._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }} whileHover={{ y: -6 }}>
              <Link to={`/books/${book._id}`}>
                <Cover book={book} className="aspect-[3/4] rounded-2xl shadow-lift" />
                <p className="mt-3 text-sm leading-snug">{book.title}</p>
                <p className="text-xs text-mute">{book.author}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-mute">
                  <Stars value={book.rating} />
                  <span>{book.available > 0 ? `${book.available} free` : 'Waitlist'}</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
