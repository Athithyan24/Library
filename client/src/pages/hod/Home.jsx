import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Cover } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

export default function HodHome() {
  const user = useAuth((state) => state.user);
  const query = useQuery({ queryKey: ['dash', 'hod'], queryFn: async () => (await api.get('/dashboard/hod')).data });
  if (query.isLoading) return <Bones />;
  if (query.isError) return <p className="text-clay">{query.error.message}</p>;
  const { totals, popular, topReaders, yearSplit } = query.data;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mute">{user.department?.name || 'Department'}</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{user.name.split(' ')[0]}, the shelf is yours.</h1>
        </div>
        <LottieSlot name="desk" className="h-28 w-28" />
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
        {[
          ['Titles', totals.titles],
          ['Copies', totals.copies],
          ['Students', totals.students],
          ['On loan', totals.loans],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.14em] text-mute">{label}</dt>
            <dd className="num mt-1 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="font-serif text-2xl">Most borrowed</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {popular.map((book) => (
              <article key={book._id} className="w-36 shrink-0">
                <Cover book={book} className="h-48 rounded-2xl" />
                <p className="mt-2 text-sm leading-snug">{book.title}</p>
                <p className="text-xs text-mute">{book.borrowCount} loans</p>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Readers</h2>
          <ul className="mt-4 divide-y divide-line">
            {topReaders.map((reader) => (
              <li key={reader.name} className="flex items-baseline justify-between py-3">
                <div>
                  <p>{reader.name}</p>
                  <p className="text-xs text-mute">{reader.course}</p>
                </div>
                <span className="num text-sm text-mute">{reader.count}</span>
              </li>
            ))}
            {!topReaders.length && <li className="py-3 text-sm text-mute">No loans recorded yet.</li>}
          </ul>
          <p className="mt-6 text-sm text-mute">
            UG {yearSplit.find((row) => row.level === 'UG')?.count || 0} · PG {yearSplit.find((row) => row.level === 'PG')?.count || 0}
          </p>
        </section>
      </div>
    </div>
  );
}
