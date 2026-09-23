import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Btn, when } from '../../components/ui';

export default function Fines() {
  const role = useAuth((state) => state.user?.role);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['fines'], queryFn: async () => (await api.get('/fines')).data });
  const settle = useMutation({
    mutationFn: async (id) => (await api.post(`/fines/${id}/settle`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['fines'] }),
  });
  if (query.isLoading) return <Bones />;
  const fines = query.data?.fines || [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl">{role === 'student' ? 'Penalties' : 'Fines'}</h1>
      <p className="mt-2 text-sm text-mute">₹{query.data?.rate || 5} for each day past the due date.</p>
      <ul className="mt-6">
        {fines.map((fine) => (
          <li key={fine._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
            <div>
              <p className="num font-serif text-2xl">₹{fine.amount}</p>
              <p className="text-sm">{fine.issue?.book?.title || 'Title'} · {fine.issue?.code}</p>
              <p className="text-xs text-mute">{fine.reason} · {fine.student?.name} · {when(fine.createdAt)}</p>
            </div>
            {fine.paid ? (
              <span className="text-sm text-pine">Settled {when(fine.paidAt)}</span>
            ) : role === 'librarian' ? (
              <Btn onClick={() => settle.mutate(fine._id)}>Mark paid</Btn>
            ) : (
              <span className="text-sm text-clay">Due at the desk</span>
            )}
          </li>
        ))}
        {!fines.length && <li className="py-6 text-mute">No fines on the book.</li>}
      </ul>
    </div>
  );
}
