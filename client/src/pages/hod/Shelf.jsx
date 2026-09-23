import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Bones, Btn, Cover, Note } from '../../components/ui';

const colors = ['#1e4d3a', '#3d4f6f', '#6b3f3a', '#5c4a32', '#24342e', '#4a3d55'];
const blank = {
  title: '', author: '', isbn: '', publisher: '', category: '', edition: '1st',
  publicationYear: '', subject: '', description: '', quantity: 1, coverColor: colors[0],
};

export default function Shelf() {
  const client = useQueryClient();
  const books = useQuery({ queryKey: ['books', 'hod'], queryFn: async () => (await api.get('/books')).data });
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const create = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (file) body.append('pdf', file);
      if (cover) body.append('cover', cover);
      return (await api.post('/books', body)).data;
    },
    onSuccess: () => {
      setForm(blank);
      setFile(null);
      setCover(null);
      setPreview('');
      setError('');
      client.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[340px_1fr]">
      <form
        className="lg:sticky lg:top-24 lg:self-start"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <h1 className="font-serif text-4xl">Add to your shelf</h1>
        <p className="mt-2 text-sm text-mute">Titles land in your department only. Students in the room are told.</p>
        <div className="mt-5 space-y-3">
          <input className="field" placeholder="Title" value={form.title} onChange={set('title')} />
          <input className="field" placeholder="Author" value={form.author} onChange={set('author')} />
          <input className="field" placeholder="ISBN" value={form.isbn} onChange={set('isbn')} />
          <input className="field" placeholder="Publisher" value={form.publisher} onChange={set('publisher')} />
          <select className="field" value={form.category} onChange={set('category')}>
            <option value="">Category</option>
            {(categories.data?.categories || []).map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="field" placeholder="Edition" value={form.edition} onChange={set('edition')} />
            <input className="field" placeholder="Year" value={form.publicationYear} onChange={set('publicationYear')} />
          </div>
          <input className="field" placeholder="Subject" value={form.subject} onChange={set('subject')} />
          <textarea className="field min-h-20" placeholder="Why it is on this shelf" value={form.description} onChange={set('description')} />
          <input className="field" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          <label className="block text-xs text-mute">
            Cover image
            <input
              className="mt-1 block w-full text-sm"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const next = event.target.files?.[0] || null;
                setCover(next);
                setPreview(next ? URL.createObjectURL(next) : '');
              }}
            />
          </label>
          {preview && <img src={preview} alt="" className="h-36 w-28 rounded-xl object-cover" />}
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, coverColor: color })}
                className={`h-7 w-7 rounded-full ${form.coverColor === color ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
                style={{ background: color }}
                aria-label={color}
              />
            ))}
          </div>
          <label className="block text-xs text-mute">
            Optional PDF
            <input className="mt-1 block w-full text-sm" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          {error && <Note>{error}</Note>}
          <Btn type="submit" disabled={create.isPending}>Catalogue title</Btn>
        </div>
      </form>

      <div>
        {books.isLoading ? <Bones /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(books.data?.books || []).map((book, index) => (
              <motion.div key={book._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ y: -4 }}>
                <Link to={`/books/${book._id}`}>
                  <Cover book={book} className="h-52 rounded-2xl shadow-lift" />
                  <p className="mt-2 text-sm">{book.author}</p>
                  <p className="text-xs text-mute">{book.available} of {book.quantity} on shelf</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
