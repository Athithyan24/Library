import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { Bones } from '../../components/ui';
import { LottieSlot } from '../../components/LottieSlot';

export default function AdminHome() {
  const query = useQuery({ queryKey: ['dash', 'admin'], queryFn: async () => (await api.get('/dashboard/admin')).data });
  if (query.isLoading) return <Bones rows={4} />;
  if (query.isError) return <p className="text-clay">{query.error.message}</p>;
  const { totals, deptBooks, trend, activeReaders } = query.data;

  const figures = [
    ['Departments', totals.departments],
    ['Students', totals.students],
    ['Titles', totals.books],
    ['Staff', totals.staff],
    ['On loan', totals.activeLoans],
    ['Returned', totals.returned],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-mute">Registrar</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">The college, as a set of reading rooms.</h1>
          <p className="mt-4 text-mute">
            {totals.overdue} {totals.overdue === 1 ? 'copy is' : 'copies are'} overdue. {activeReaders} student accounts moved in the last month.
          </p>
        </div>
        <LottieSlot name="shelf" className="h-28 w-28" />
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-6 sm:grid-cols-3 lg:grid-cols-6">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.14em] text-mute">{label}</dt>
            <dd className="num mt-2 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <h2 className="font-serif text-2xl">Borrowing, six months</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="rgb(var(--pine))" fill="rgb(var(--pine))" fillOpacity={0.16} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Copies by department</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBooks} layout="vertical" margin={{ left: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={36} tick={{ fill: 'currentColor', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="copies" fill="rgb(var(--brass))" radius={6} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
