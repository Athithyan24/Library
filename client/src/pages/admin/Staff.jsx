import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Bones, Btn, Modal, Note } from '../../components/ui';

const blank = { name: '', username: '', password: 'Library@123', role: 'hod', department: '', email: '' };

export default function Staff() {
  const client = useQueryClient();
  const departments = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data });
  const staff = useQuery({ queryKey: ['staff'], queryFn: async () => (await api.get('/staff')).data });
  const [form, setForm] = useState(blank);
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: async () => (await api.post('/staff', form)).data,
    onSuccess: (data) => {
      setSlip(data);
      setForm(blank);
      setError('');
      client.invalidateQueries({ queryKey: ['staff'] });
      client.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: async (person) => (await api.put(`/staff/${person.id}`, { isActive: false })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['staff'] }),
  });

  if (staff.isLoading || departments.isLoading) return <Bones />;
  const rooms = departments.data?.departments || [];

  return (
    <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[320px_1fr]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <h1 className="font-serif text-4xl">Appoint staff</h1>
        <p className="mt-2 text-sm text-mute">One active HOD per department. Librarians work the desk for the room you assign.</p>
        <div className="mt-6 space-y-3">
          <input className="field" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field" placeholder="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          <input className="field" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="hod">Head of department</option>
            <option value="librarian">Librarian</option>
          </select>
          <select className="field" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>
            <option value="">Department</option>
            {rooms.filter((room) => room.isActive).map((room) => (
              <option key={room._id} value={room._id}>{room.name}</option>
            ))}
          </select>
          {error && <Note>{error}</Note>}
          <Btn type="submit" disabled={create.isPending}>Create account</Btn>
        </div>
      </form>

      <div className="space-y-8">
        {['hod', 'librarian'].map((role) => (
          <section key={role}>
            <h2 className="font-serif text-2xl">{role === 'hod' ? 'Heads of department' : 'Librarians'}</h2>
            <ul className="mt-3 divide-y divide-line">
              {(staff.data?.staff || []).filter((person) => person.role === role).map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p>{person.name}</p>
                    <p className="text-sm text-mute">{person.username} · {person.department?.code || '—'}</p>
                  </div>
                  <Btn tone="quiet" onClick={() => toggle.mutate(person)}>Disable</Btn>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Modal open={!!slip} onClose={() => setSlip(null)} title="Hand this over once">
        {slip && (
          <div className="rounded-2xl bg-paper p-4">
            <p className="font-serif text-2xl">{slip.user.name}</p>
            <p className="mt-3 text-sm">Username <span className="font-medium">{slip.user.username}</span></p>
            <p className="text-sm">Password <span className="font-medium">{slip.password}</span></p>
          </div>
        )}
      </Modal>
    </div>
  );
}
