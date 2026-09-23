import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Bones, Btn, Cover, when } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

export default function Mine() {
  const client = useQueryClient();
  const issues = useQuery({ queryKey: ['issues', 'mine'], queryFn: async () => (await api.get('/issues')).data });
  const reservations = useQuery({ queryKey: ['reservations', 'mine'], queryFn: async () => (await api.get('/reservations')).data });
  const fines = useQuery({ queryKey: ['fines'], queryFn: async () => (await api.get('/fines')).data });
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: async () => (await api.get('/favorites')).data });
  const reading = useQuery({ queryKey: ['reading'], queryFn: async () => (await api.get('/reading')).data });

  const cancel = useMutation({
    mutationFn: async (id) => (await api.post(`/reservations/${id}/cancel`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['reservations'] }),
  });

  if (issues.isLoading) return <Bones />;
  const loans = (issues.data?.issues || []).filter((issue) => issue.status === 'issued');
  const history = (issues.data?.issues || []).filter((issue) => issue.status === 'returned');
  const due = (fines.data?.fines || []).filter((fine) => !fine.paid).reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">My shelf</h1>
          <p className="mt-2 text-sm text-mute">
            {reading.data?.stats?.borrowed || 0} borrowed · {reading.data?.stats?.returned || 0} returned · {reading.data?.stats?.saved || 0} saved
          </p>
        </div>
        <LottieSlot name="read" className="h-24 w-24" />
      </div>
      {due > 0 && <p className="mt-4 text-clay">₹{due} outstanding. <Link to="/fines">See penalties</Link></p>}

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Issued</h2>
        <ul className="mt-3 divide-y divide-line">
          {loans.map((issue) => (
            <li key={issue._id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="num text-xs text-brass">{issue.code}</p>
                <Link to={`/books/${issue.book?._id}`}>{issue.book?.title}</Link>
                <p className={`text-sm ${new Date(issue.dueDate) < new Date() ? 'text-clay' : 'text-mute'}`}>Due {when(issue.dueDate)}</p>
              </div>
            </li>
          ))}
          {!loans.length && <li className="py-3 text-sm text-mute">Nothing issued.</li>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Reservations</h2>
        <ul className="mt-3 divide-y divide-line">
          {(reservations.data?.reservations || []).map((item) => (
            <li key={item._id} className="flex items-center justify-between py-3">
              <div>
                <p>{item.book?.title}</p>
                <p className="text-sm capitalize text-mute">{item.status}</p>
              </div>
              {['waiting', 'ready'].includes(item.status) && <Btn tone="quiet" onClick={() => cancel.mutate(item._id)}>Leave queue</Btn>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Saved</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {(favorites.data?.books || []).map((book) => (
            <Link key={book._id} to={`/books/${book._id}`} className="w-28 shrink-0">
              <Cover book={book} className="h-36 rounded-xl" />
              <p className="mt-2 text-xs">{book.title}</p>
            </Link>
          ))}
          {!favorites.data?.books?.length && <p className="text-sm text-mute">Save a title from its page.</p>}
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl">Returned</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {history.map((issue) => (
              <li key={issue._id} className="py-2">
                {issue.book?.title}
                <span className="text-mute"> · {issue.code} · {when(issue.returnDate)}{issue.fineAmount ? ` · ₹${issue.fineAmount}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl">Recently viewed</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {(reading.data?.recentlyViewed || []).map((item) => (
              <li key={item.book?._id} className="py-2">
                <Link to={`/books/${item.book?._id}`}>{item.book?.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
