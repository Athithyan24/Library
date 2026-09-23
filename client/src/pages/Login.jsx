import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../store/useAuth';
import { LottieSlot } from '../components/LottieSlot';
import { Btn, Note } from '../components/ui';

const desks = [
  ['Registrar', 'admin'],
  ['HOD, Computer Science', 'hod.cs'],
  ['HOD, Artificial Intelligence', 'hod.ai'],
  ['Librarian', 'librarian'],
  ['PG student', 'ananya'],
  ['UG student', 'rahul'],
];

export default function Login() {
  const [username, setUsername] = useState('ananya');
  const [password, setPassword] = useState('Library@123');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const setSession = useAuth((state) => state.setSession);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-panel shadow-lift lg:grid-cols-[1.05fr_0.95fr]"
      >
        <section className="relative hidden flex-col justify-between bg-gradient-to-br from-[#fff4ee] to-[#f3f6ff] p-10 lg:flex">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-white">CS</span>
            Reading Room
          </div>
          <div>
            <h1 className="max-w-sm text-4xl font-semibold tracking-tight">The department library, in one place.</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mute">
              Borrow, reserve, and read. Loans run fourteen days. Late copies are ₹5 a day.
            </p>
          </div>
          <LottieSlot name="login" className="h-28 w-28" />
        </section>
        <form onSubmit={submit} className="p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-mute">Use the account your HOD or the registrar gave you.</p>
          <label className="mt-6 block text-xs font-medium text-mute">
            Username
            <input className="field mt-1.5" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="mt-3 block text-xs font-medium text-mute">
            Password
            <input className="field mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="mt-3"><Note>{error}</Note></div>}
          <Btn type="submit" className="mt-5 w-full rounded-xl py-2.5" disabled={pending}>
            {pending ? 'Checking…' : 'Continue'}
          </Btn>
          <p className="mb-2 mt-8 text-xs text-mute">Desk copies · Library@123</p>
          <ul className="grid grid-cols-2 gap-2">
            {desks.map(([label, id]) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(id);
                    setPassword('Library@123');
                  }}
                  className="w-full rounded-xl border border-line px-3 py-2 text-left text-xs hover:bg-paper"
                >
                  <span className="block font-medium">{label}</span>
                  <span className="text-mute">{id}</span>
                </button>
              </li>
            ))}
          </ul>
        </form>
      </motion.div>
    </div>
  );
}
