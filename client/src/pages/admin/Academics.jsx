import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Bones, Btn, Note } from '../../components/ui';

export default function Academics() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['programs'], queryFn: async () => (await api.get('/programs')).data });
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.data?.programs) {
      setDrafts(query.data.programs.map((program) => ({ ...program, yearText: program.years.join('\n') })));
    }
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (draft) => {
      const years = draft.yearText.split('\n').map((line) => line.trim()).filter(Boolean);
      return (await api.put(`/programs/${draft._id}`, { level: draft.level, name: draft.name, years })).data;
    },
    onSuccess: () => {
      setError('');
      client.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (err) => setError(err.message),
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/programs', { level: 'UG', name: 'New programme', years: ['1st Year'] })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['programs'] }),
    onError: (err) => setError(err.message),
  });

  if (query.isLoading) return <Bones />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">UG and PG, year by year</h1>
          <p className="mt-2 max-w-lg text-sm text-mute">
            HODs enrol students against this structure. One year on each line.
          </p>
        </div>
        <Btn tone="quiet" onClick={() => create.mutate()}>Add programme</Btn>
      </div>
      {error && <div className="mt-4"><Note>{error}</Note></div>}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {drafts.map((draft, index) => (
          <article key={draft._id} className="rounded-3xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-brass">{draft.level}</p>
            <input
              className="field mt-3"
              value={draft.name}
              onChange={(event) => {
                const next = [...drafts];
                next[index] = { ...draft, name: event.target.value };
                setDrafts(next);
              }}
            />
            <textarea
              className="field mt-3 min-h-36 font-serif text-lg"
              value={draft.yearText}
              onChange={(event) => {
                const next = [...drafts];
                next[index] = { ...draft, yearText: event.target.value };
                setDrafts(next);
              }}
            />
            <Btn className="mt-4" onClick={() => save.mutate(draft)}>Save {draft.level}</Btn>
          </article>
        ))}
      </div>
    </div>
  );
}
