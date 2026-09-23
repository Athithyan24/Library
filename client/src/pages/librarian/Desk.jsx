import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Bones, Btn, Note, when } from '../../components/ui';

export default function Desk() {
  const client = useQueryClient();
  const requests = useQuery({ queryKey: ['borrow', 'pending'], queryFn: async () => (await api.get('/borrow', { params: { status: 'pending' } })).data });
  const issues = useQuery({ queryKey: ['issues', 'open'], queryFn: async () => (await api.get('/issues', { params: { status: 'issued' } })).data });
  const reservations = useQuery({ queryKey: ['reservations'], queryFn: async () => (await api.get('/reservations')).data });
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const refresh = () => {
    ['borrow', 'issues', 'reservations', 'dash'].forEach((key) => client.invalidateQueries({ queryKey: [key] }));
  };

  const act = useMutation({
    mutationFn: async ({ url, body }) => (await api.post(url, body || {})).data,
    onSuccess: () => {
      setError('');
      refresh();
    },
    onError: (err) => setError(err.message),
  });

  if (requests.isLoading || issues.isLoading) return <Bones />;

  const queue = (reservations.data?.reservations || []).filter((item) => ['waiting', 'ready'].includes(item.status));

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl">Circulation</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">Approve a request and the room prints the next issue slip. Returns calculate ₹5 for each late day and wake the reservation queue.</p>
      {error && <div className="mt-4"><Note>{error}</Note></div>}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <section>
          <h2 className="font-serif text-2xl">Requests</h2>
          <ul className="mt-3 space-y-3">
            {(requests.data?.requests || []).map((request, index) => (
              <motion.li key={request._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-3xl border border-line bg-panel p-4">
                <p className="font-medium">{request.book?.title}</p>
                <p className="text-sm text-mute">{request.student?.name} · {request.student?.yearLabel}</p>
                {request.note && <p className="mt-2 text-sm">“{request.note}”</p>}
                <div className="mt-3 flex gap-2">
                  <Btn onClick={() => act.mutate({ url: `/borrow/${request._id}/approve` })}>Issue</Btn>
                  <Btn tone="quiet" onClick={() => act.mutate({ url: `/borrow/${request._id}/reject`, body: { note } })}>Decline</Btn>
                </div>
              </motion.li>
            ))}
            {!requests.data?.requests?.length && <p className="text-sm text-mute">The request tray is empty.</p>}
            <input className="field" placeholder="Note if you decline" value={note} onChange={(event) => setNote(event.target.value)} />
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl">Out</h2>
          <ul className="mt-3 divide-y divide-line">
            {(issues.data?.issues || []).map((issue) => {
              const late = new Date(issue.dueDate) < new Date();
              return (
                <li key={issue._id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="num text-xs tracking-wider text-brass">{issue.code}</p>
                      <p>{issue.book?.title}</p>
                      <p className="text-sm text-mute">{issue.student?.name} · due {when(issue.dueDate)}</p>
                      {late && <p className="text-xs text-clay">Late</p>}
                    </div>
                    <Btn tone="quiet" onClick={() => act.mutate({ url: `/issues/${issue._id}/return` })}>Return</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl">Reservations</h2>
          <ul className="mt-3 space-y-3">
            {queue.map((item) => (
              <li key={item._id} className="rounded-3xl bg-paper p-4">
                <p className="text-xs uppercase tracking-wider text-mute">{item.status} · place {item.position}</p>
                <p className="mt-1">{item.book?.title}</p>
                <p className="text-sm text-mute">{item.student?.name}</p>
                <div className="mt-3 flex gap-2">
                  <Btn disabled={item.status !== 'ready'} onClick={() => act.mutate({ url: `/reservations/${item._id}/decide`, body: { action: 'issue' } })}>Issue hold</Btn>
                  <Btn tone="quiet" onClick={() => act.mutate({ url: `/reservations/${item._id}/decide`, body: { action: 'reject' } })}>Release</Btn>
                </div>
              </li>
            ))}
            {!queue.length && <p className="text-sm text-mute">No one is waiting on a title.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
