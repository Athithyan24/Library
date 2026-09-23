import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Bones, when } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

export default function LibrarianHome() {
  const query = useQuery({ queryKey: ['dash', 'lib'], queryFn: async () => (await api.get('/dashboard/librarian')).data });
  if (query.isLoading) return <Bones />;
  if (query.isError) return <p className="text-clay">{query.error.message}</p>;
  const { pending, totals, overdue } = query.data;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Circulation desk</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
            {pending.length ? `${pending.length} request${pending.length === 1 ? '' : 's'} waiting for a stamp.` : 'The queue is clear.'}
          </h1>
          <Link to="/desk" className="mt-4 inline-block text-sm text-pine">Open circulation</Link>
        </div>
        <LottieSlot name="desk" className="h-32 w-32" />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
        {[
          ['Active issues', totals.active],
          ['Overdue', totals.overdue],
          ['In queue', totals.reservations],
          ['Fines collected', `₹${totals.collected}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.14em] text-mute">{label}</dt>
            <dd className="num mt-1 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-2xl">Waiting</h2>
          <ul className="mt-3 divide-y divide-line">
            {pending.map((request) => (
              <li key={request._id} className="py-3">
                <p>{request.book?.title}</p>
                <p className="text-sm text-mute">{request.student?.name} · {request.student?.courseName}</p>
              </li>
            ))}
            {!pending.length && <li className="py-3 text-sm text-mute">No pending requests.</li>}
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Overdue</h2>
          <ul className="mt-3 divide-y divide-line">
            {overdue.map((issue) => (
              <li key={issue._id} className="flex items-baseline justify-between py-3">
                <div>
                  <p>{issue.book?.title}</p>
                  <p className="text-sm text-mute">{issue.student?.name} · {issue.code}</p>
                </div>
                <span className="text-sm text-clay">{when(issue.dueDate)}</span>
              </li>
            ))}
            {!overdue.length && <li className="py-3 text-sm text-mute">Nothing is late.</li>}
          </ul>
          <p className="mt-4 text-sm text-mute">Outstanding fines ₹{totals.outstanding}</p>
        </section>
      </div>
    </div>
  );
}
