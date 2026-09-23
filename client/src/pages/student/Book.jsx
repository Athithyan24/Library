import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Btn, Cover, Modal, Note, Stars, when } from '../../components/ui';

export default function BookPage() {
  const { id } = useParams();
  const role = useAuth((state) => state.user?.role);
  const favorites = useAuth((state) => state.user?.favorites);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['book', id], queryFn: async () => (await api.get(`/books/${id}`)).data });
  const savedQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await api.get('/favorites')).data,
    enabled: role === 'student',
  });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [reader, setReader] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const run = useMutation({
    mutationFn: async ({ url, body }) => (await api.post(url, body || {})).data,
    onSuccess: () => {
      setError('');
      client.invalidateQueries({ queryKey: ['book', id] });
      client.invalidateQueries({ queryKey: ['favorites'] });
      client.invalidateQueries({ queryKey: ['dash'] });
    },
    onError: (err) => setError(err.message),
  });

  if (query.isLoading) return <Bones />;
  if (query.isError) return <Note>{query.error.message}</Note>;
  const { book, reviews } = query.data;
  const saved = (savedQuery.data?.books || []).some((item) => item._id === book._id) || (favorites || []).includes(book._id);
  const canEdit = role === 'student' || role === 'hod' || role === 'admin';

  const beginEdit = () => {
    setEdit({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      edition: book.edition || '',
      publicationYear: book.publicationYear || '',
      subject: book.subject || '',
      description: book.description || '',
    });
    setCoverFile(null);
    setPdfFile(null);
    setEditing(true);
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const body = new FormData();
    Object.entries(edit).forEach(([key, value]) => body.append(key, value ?? ''));
    if (coverFile) body.append('cover', coverFile);
    if (pdfFile) body.append('pdf', pdfFile);
    try {
      await api.put(`/books/${book._id}`, body);
      setError('');
      setEditing(false);
      client.invalidateQueries({ queryKey: ['book', id] });
      client.invalidateQueries({ queryKey: ['books'] });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[240px_1fr]">
      <Cover book={book} className="aspect-[3/4] rounded-3xl shadow-lift" />
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-brass">{book.department?.name} · {book.category?.name}</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{book.title}</h1>
        <p className="mt-2 text-mute">{book.author}</p>
        <div className="mt-3"><Stars value={book.rating} /> <span className="text-sm text-mute">{book.reviewCount} reviews</span></div>
        <p className="mt-6 max-w-xl leading-relaxed">{book.description}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[
            ['ISBN', book.isbn],
            ['Publisher', book.publisher || '—'],
            ['Edition', book.edition],
            ['Year', book.publicationYear || '—'],
            ['Subject', book.subject],
            ['Shelf', `${book.available} of ${book.quantity}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wider text-mute">{label}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
        </dl>

        {error && <div className="mt-4"><Note>{error}</Note></div>}

        <div className="mt-6 flex flex-wrap gap-2">
          {role === 'student' && book.available > 0 && (
            <Btn onClick={() => run.mutate({ url: '/borrow', body: { bookId: book._id, note } })}>Request book</Btn>
          )}
          {role === 'student' && book.available < 1 && (
            <Btn onClick={() => run.mutate({ url: '/reservations', body: { bookId: book._id, note } })}>Reserve book</Btn>
          )}
          {role === 'student' && (
            <Btn tone="quiet" onClick={() => run.mutate({ url: `/books/${book._id}/favorite` })}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {saved ? 'Saved' : 'Save'}
            </Btn>
          )}
          {book.pdfUrl && <Btn tone="quiet" onClick={() => setReader(true)}>Open digital copy</Btn>}
          {canEdit && (
            <Btn tone="quiet" onClick={beginEdit}>Update book</Btn>
          )}
        </div>
        {editing && (
          <form onSubmit={saveEdit} className="mt-4 max-w-lg space-y-2 rounded-2xl border border-line p-4">
            {['title', 'author', 'isbn', 'publisher', 'edition', 'publicationYear', 'subject'].map((key) => (
              <input
                key={key}
                className="field"
                value={edit[key]}
                placeholder={key}
                onChange={(event) => setEdit({ ...edit, [key]: event.target.value })}
              />
            ))}
            <textarea className="field min-h-20" value={edit.description} onChange={(event) => setEdit({ ...edit, description: event.target.value })} />
            <label className="block text-xs text-mute">
              Replace cover
              <input className="mt-1 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} />
            </label>
            <label className="block text-xs text-mute">
              Optional PDF
              <input className="mt-1 block w-full text-sm" type="file" accept="application/pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} />
            </label>
            <div className="flex gap-2">
              <Btn type="submit">Save changes</Btn>
              <Btn tone="quiet" onClick={() => setEditing(false)}>Cancel</Btn>
            </div>
          </form>
        )}
        {role === 'student' && <input className="field mt-3 max-w-md" placeholder="A note for the desk" value={note} onChange={(event) => setNote(event.target.value)} />}

        <section className="mt-10">
          <h2 className="font-serif text-2xl">From readers</h2>
          <ul className="mt-3 space-y-4">
            {reviews.map((review) => (
              <li key={review._id}>
                <Stars value={review.rating} />
                <p className="mt-1">{review.comment}</p>
                <p className="text-xs text-mute">{review.student?.name} · {when(review.createdAt)}</p>
              </li>
            ))}
            {!reviews.length && <li className="text-sm text-mute">No reviews yet.</li>}
          </ul>
          {role === 'student' && (
            <form
              className="mt-4 max-w-md space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                run.mutate({ url: `/books/${book._id}/reviews`, body: { rating, comment } });
              }}
            >
              <select className="field" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </select>
              <textarea className="field min-h-20" placeholder="What should the next reader know?" value={comment} onChange={(event) => setComment(event.target.value)} />
              <Btn type="submit">Leave a review</Btn>
            </form>
          )}
        </section>
      </div>

      <Modal open={reader} onClose={() => setReader(false)} title={book.title} wide>
        <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
          <article className="rounded-2xl bg-paper p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{book.subject}</p>
            <p className="mt-4 font-serif text-xl leading-relaxed">{book.description}</p>
            <p className="mt-6 text-sm text-mute">{book.author} · {book.edition} edition</p>
          </article>
          {book.pdfUrl ? (
            <iframe title={book.title} src={book.pdfUrl} className="h-80 w-full rounded-2xl border border-line bg-white" />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
