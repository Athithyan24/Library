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
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-mute">Department of Computer Science</p>
        <div className="max-w-xl py-16">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl leading-[1.05] sm:text-6xl"
          >
            A quieter room for the department’s books.
          </motion.h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-mute">
            Issue slips, reservations, fines, and the digital shelf — kept as one reading room, not a stack of forms.
          </p>
          <div className="mt-8">
            <LottieSlot name="login" className="h-36 w-36" />
          </div>
        </div>
        <p className="text-sm text-mute">Loans run fourteen days. Late copies are ₹5 a day.</p>
      </section>

      <section className="flex items-center border-line bg-panel px-6 py-10 lg:border-l lg:px-12">
        <form onSubmit={submit} className="mx-auto w-full max-w-sm">
          <h2 className="font-serif text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-mute">Use the desk copy your HOD or the registrar gave you.</p>
          <label className="mt-8 block text-xs uppercase tracking-[0.14em] text-mute">
            Username
            <input className="field mt-2" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-mute">
            Password
            <input className="field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && (
            <div className="mt-4">
              <Note>{error}</Note>
            </div>
          )}
          <Btn type="submit" className="mt-6 w-full py-3" disabled={pending}>
            {pending ? 'Checking the register…' : 'Enter the reading room'}
          </Btn>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.14em] text-mute">Desk copies · password Library@123</p>
            <ul className="mt-3 divide-y divide-line">
              {desks.map(([label, id]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername(id);
                      setPassword('Library@123');
                    }}
                    className="flex w-full items-baseline justify-between py-2 text-left text-sm"
                  >
                    <span>{label}</span>
                    <span className="text-mute">{id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </div>
  );
}
