import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Bones, Btn, Cover, Note } from '../../components/ui';

export default function Inventory() {
  const client = useQueryClient();
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const books = useQuery({
    queryKey: ['books', 'inv', q],
    queryFn: async () => (await api.get('/books', { params: { q } })).data,
  });

  const change = useMutation({
    mutationFn: async ({ id, path, body }) => (await api.post(`/books/${id}/${path}`, body)).data,
    onSuccess: () => {
      setError('');
      client.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl">Copies</h1>
      <p className="mt-2 text-sm text-mute">Add a copy, withdraw one, or pull a damaged book off the shelf.</p>
      <input className="field mt-6" placeholder="Search title, author, ISBN" value={q} onChange={(event) => setQ(event.target.value)} />
      {error && <div className="mt-3"><Note>{error}</Note></div>}
      {books.isLoading ? <div className="mt-6"><Bones /></div> : (
        <ul className="mt-4">
          {(books.data?.books || []).map((book) => (
            <li key={book._id} className="flex items-center gap-4 border-b border-line py-4">
              <Cover book={book} className="h-16 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{book.title}</p>
                <p className="text-sm text-mute">{book.available} free · {book.quantity} held · {book.damagedCopies || 0} damaged</p>
              </div>
              <div className="flex gap-2">
                <Btn tone="quiet" onClick={() => change.mutate({ id: book._id, path: 'copies', body: { delta: 1 } })}>+1</Btn>
                <Btn tone="quiet" onClick={() => change.mutate({ id: book._id, path: 'copies', body: { delta: -1 } })}>−1</Btn>
                <Btn tone="quiet" onClick={() => change.mutate({ id: book._id, path: 'damage', body: { count: 1 } })}>Damage</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
