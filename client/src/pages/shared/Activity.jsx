import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Bones, when } from '../../components/ui';

export default function Activity() {
  const query = useQuery({ queryKey: ['activity'], queryFn: async () => (await api.get('/activity')).data });
  if (query.isLoading) return <Bones />;
  const logs = query.data?.logs || [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">What the room has done</h1>
      <ol className="mt-8 border-l border-line pl-6">
        {logs.map((log, index) => (
          <motion.li key={log._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="relative pb-7">
            <span className="absolute -left-[1.65rem] top-1 h-2.5 w-2.5 rounded-full bg-brass" />
            <p className="text-xs uppercase tracking-wider text-mute">{when(log.createdAt)} · {log.actorName}</p>
            <p className="mt-1 font-medium">{log.action}</p>
            <p className="text-sm text-mute">{log.detail}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
