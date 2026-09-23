import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Bones, Btn, Note } from '../../components/ui';

export default function Departments() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data });
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: async () => (await api.post('/departments', form)).data,
    onSuccess: () => {
      setForm({ name: '', code: '', description: '' });
      setError('');
      client.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: async (dept) => (await api.put(`/departments/${dept._id}`, { isActive: !dept.isActive })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['departments'] }),
  });

  if (query.isLoading) return <Bones />;
  const departments = query.data?.departments || [];

  return (
    <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[280px_1fr]">
      <form
        className="lg:sticky lg:top-24 lg:self-start"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <h1 className="font-serif text-4xl">Open a department</h1>
        <p className="mt-2 text-sm text-mute">Each room gets one HOD. Librarians can be appointed after the room exists.</p>
        <input className="field mt-6" placeholder="Computer Science" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field mt-3" placeholder="CS" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
        <textarea className="field mt-3 min-h-24" placeholder="A line about the room" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        {error && <div className="mt-3"><Note>{error}</Note></div>}
        <Btn type="submit" className="mt-4" disabled={create.isPending}>Add department</Btn>
      </form>

      <ol className="divide-y divide-line">
        {departments.map((dept, index) => (
          <motion.li
            key={dept._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="grid gap-3 py-5 sm:grid-cols-[72px_1fr_auto] sm:items-center"
          >
            <span className="font-serif text-2xl text-brass">{dept.code}</span>
            <div>
              <p className={`font-medium ${dept.isActive ? '' : 'text-mute line-through'}`}>{dept.name}</p>
              <p className="text-sm text-mute">
                {dept.students} students · HOD {dept.hod?.name || 'unassigned'}
              </p>
            </div>
            <Btn tone="quiet" onClick={() => toggle.mutate(dept)}>
              {dept.isActive ? 'Disable' : 'Restore'}
            </Btn>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
