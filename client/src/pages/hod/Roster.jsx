import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Btn, Modal, Note } from '../../components/ui';

const blank = { name: '', username: '', password: '', programme: 'UG', yearLabel: '1st Year', courseName: '' };

function suggestPassword(name) {
  const stem = (name.split(' ')[0] || 'Reader').replace(/[^a-z]/gi, '');
  return `${stem || 'Reader'}#${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function Roster() {
  const role = useAuth((state) => state.user?.role);
  const client = useQueryClient();
  const students = useQuery({ queryKey: ['students'], queryFn: async () => (await api.get('/students')).data });
  const programs = useQuery({ queryKey: ['programs'], queryFn: async () => (await api.get('/programs')).data });
  const [form, setForm] = useState(blank);
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState('');

  const years = useMemo(() => {
    const program = (programs.data?.programs || []).find((item) => item.level === form.programme);
    return program?.years || [];
  }, [programs.data, form.programme]);

  const create = useMutation({
    mutationFn: async () => (await api.post('/students', form)).data,
    onSuccess: (data) => {
      setSlip(data);
      setForm(blank);
      setError('');
      client.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => setError(err.message),
  });

  const grouped = {};
  (students.data?.students || []).forEach((student) => {
    const key = `${student.programme || '—'} · ${student.yearLabel || 'Year not set'}`;
    grouped[key] = grouped[key] || [];
    grouped[key].push(student);
  });

  if (students.isLoading) return <Bones />;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr]">
      {role !== 'librarian' && (
        <form
          className="lg:sticky lg:top-24 lg:self-start"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <h1 className="font-serif text-4xl">Enrol a student</h1>
          <p className="mt-2 text-sm text-mute">Credentials are shown once. The student belongs to your department.</p>
          <div className="mt-5 space-y-3">
            <input className="field" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, password: form.password || suggestPassword(event.target.value) })} />
            <input className="field" placeholder="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <input className="field" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <input className="field" placeholder="B.Sc Computer Science" value={form.courseName} onChange={(event) => setForm({ ...form, courseName: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="field" value={form.programme} onChange={(event) => setForm({ ...form, programme: event.target.value, yearLabel: '' })}>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
              <select className="field" value={form.yearLabel} onChange={(event) => setForm({ ...form, yearLabel: event.target.value })}>
                <option value="">Year</option>
                {years.map((year) => <option key={year}>{year}</option>)}
              </select>
            </div>
            {error && <Note>{error}</Note>}
            <Btn type="submit" disabled={create.isPending}>Create login</Btn>
          </div>
        </form>
      )}

      <div className={role === 'librarian' ? 'lg:col-span-2' : ''}>
        {role === 'librarian' && <h1 className="mb-6 font-serif text-4xl">Students on the register</h1>}
        {Object.entries(grouped).map(([label, people]) => (
          <section key={label} className="mb-8">
            <h2 className="font-serif text-2xl">{label}</h2>
            <ul className="mt-2">
              {people.map((student) => (
                <li key={student.id} className="flex items-baseline justify-between gap-3 border-b border-line py-3">
                  <div>
                    <p>{student.name}</p>
                    <p className="text-sm text-mute">{student.courseName} · {student.username}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-mute">{student.department?.code}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!Object.keys(grouped).length && <p className="text-mute">No students yet.</p>}
      </div>

      <Modal open={!!slip} onClose={() => setSlip(null)} title="Give these to the student">
        {slip && (
          <div className="rounded-2xl bg-paper p-4">
            <p className="font-serif text-2xl">{slip.user.name}</p>
            <p className="mt-1 text-sm text-mute">{slip.user.courseName} · {slip.user.programme} · {slip.user.yearLabel}</p>
            <p className="mt-4 text-sm">Username <span className="font-medium">{slip.user.username}</span></p>
            <p className="text-sm">Password <span className="font-medium">{slip.password}</span></p>
          </div>
        )}
      </Modal>
    </div>
  );
}
