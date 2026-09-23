import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Bones, Btn, Modal, Note } from '../../components/ui';

const kinds = ['PDF', 'Notes', 'Question Papers', 'Research Papers', 'Lab Manuals', 'Lecture Materials'];

export default function Resources() {
  const role = useAuth((state) => state.user?.role);
  const client = useQueryClient();
  const [kind, setKind] = useState('');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ title: '', kind: 'Notes', subject: '', topic: '', programme: 'All', yearLabel: 'All', summary: '' });
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['resources', kind],
    queryFn: async () => (await api.get('/resources', { params: kind ? { kind } : {} })).data,
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/resources', form)).data,
    onSuccess: () => {
      setForm({ title: '', kind: 'Notes', subject: '', topic: '', programme: 'All', yearLabel: 'All', summary: '' });
      setError('');
      client.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err) => setError(err.message),
  });

  const canAdd = role === 'hod' || role === 'librarian' || role === 'admin';

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-4xl">Materials</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">Notes, papers, lab manuals, and lecture copies, filed by subject and year.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setKind('')} className={`rounded-full px-3 py-1 text-sm ${kind === '' ? 'bg-pine text-paper' : 'border border-line'}`}>All</button>
        {kinds.map((item) => (
          <button key={item} onClick={() => setKind(item)} className={`rounded-full px-3 py-1 text-sm ${kind === item ? 'bg-pine text-paper' : 'border border-line'}`}>{item}</button>
        ))}
      </div>

      {canAdd && (
        <form
          className="mt-6 grid gap-3 rounded-3xl border border-line bg-panel p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <input className="field" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <select className="field" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
            {kinds.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="field" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
          <input className="field" placeholder="Topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} />
          <input className="field md:col-span-2" placeholder="A short description" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          {error && <Note>{error}</Note>}
          <Btn type="submit" className="md:col-span-2 w-fit">Add material</Btn>
        </form>
      )}

      {query.isLoading ? <div className="mt-6"><Bones /></div> : (
        <ul className="mt-6 divide-y divide-line">
          {(query.data?.resources || []).map((item) => (
            <li key={item._id}>
              <button className="flex w-full items-baseline justify-between gap-4 py-4 text-left" onClick={() => setOpen(item)}>
                <span>
                  <span className="block">{item.title}</span>
                  <span className="text-sm text-mute">{item.kind} · {item.subject} · {item.programme} {item.yearLabel}</span>
                </span>
                <span className="text-xs uppercase tracking-wider text-brass">{item.department?.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title || ''} wide>
        {open && (
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{open.kind} · {open.subject} · {open.topic}</p>
            <p className="mt-4 max-w-2xl leading-relaxed">{open.summary || 'No summary was filed with this copy.'}</p>
            {open.fileUrl && <iframe title={open.title} src={open.fileUrl} className="mt-4 h-80 w-full rounded-2xl border border-line" />}
          </div>
        )}
      </Modal>
    </div>
  );
}
