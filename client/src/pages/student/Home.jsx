import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Cover, when } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

export default function StudentHome() {
  const user = useAuth((state) => state.user);
  const query = useQuery({ queryKey: ['dash', 'student'], queryFn: async () => (await api.get('/dashboard/student')).data });
  if (query.isLoading) return <Bones />;
  if (query.isError) return <p className="text-clay">{query.error.message}</p>;
  const { loans, reservations, fineDue, favorites, recent, popular } = query.data;
  const next = loans[0];

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#fff4ee] to-[#f4f7ff] px-6 py-7 dark:from-paper dark:to-panel">
        <p className="text-xs font-medium text-mute">{user.courseName} · {user.yearLabel}</p>
        <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">
          {next ? `${next.book?.title} is due ${when(next.dueDate)}.` : 'Nothing is out in your name.'}
        </h2>
        {fineDue > 0 && <p className="mt-2 text-sm text-clay">₹{fineDue} is waiting at the desk.</p>}
        <Link to="/catalog" className="mt-4 inline-flex rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">Browse library</Link>
        <div className="pointer-events-none absolute right-4 top-4 hidden sm:block">
          <LottieSlot name="read" className="h-24 w-24" />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">With you</h2>
          <Link to="/my-library" className="text-sm text-mute">My shelf</Link>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {loans.map((loan) => (
            <Link key={loan._id} to={`/books/${loan.book?._id}`} className="flex h-44 w-16 shrink-0 items-center justify-center rounded-r-xl rounded-l-sm shadow-lift" style={{ background: loan.book?.coverColor }}>
              <span className="spine px-2 text-center font-serif text-sm text-white">{loan.book?.title}</span>
            </Link>
          ))}
          {!loans.length && <p className="text-sm text-mute">Your loan shelf is clear.</p>}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-2xl">Holds</h2>
          <ul className="mt-3 divide-y divide-line">
            {reservations.map((item) => (
              <li key={item._id} className="py-3">
                <p>{item.book?.title}</p>
                <p className="text-sm capitalize text-mute">{item.status}</p>
              </li>
            ))}
            {!reservations.length && <li className="py-3 text-sm text-mute">You are not in a queue.</li>}
          </ul>
          {!!favorites.length && (
            <>
              <h2 className="mt-8 font-serif text-2xl">Kept</h2>
              <div className="mt-3 flex gap-3">
                {favorites.map((book) => (
                  <Link key={book._id} to={`/books/${book._id}`} className="w-24">
                    <Cover book={book} className="h-32 rounded-xl" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
        <section>
          <h2 className="font-serif text-2xl">Just arrived</h2>
          <ul className="mt-3">
            {recent.map((book, index) => (
              <motion.li key={book._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Link to={`/books/${book._id}`} className="flex items-center gap-3 border-b border-line py-3">
                  <Cover book={book} compact className="h-12 w-9 rounded-md" />
                  <span>
                    <span className="block text-sm">{book.title}</span>
                    <span className="text-xs text-mute">{book.author}</span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
          <h2 className="mt-8 font-serif text-2xl">Often borrowed</h2>
          <ul className="mt-2 text-sm">
            {popular.map((book) => (
              <li key={book._id} className="border-b border-line py-2">
                <Link to={`/books/${book._id}`}>{book.title}</Link>
                <span className="text-mute"> · {book.borrowCount}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
