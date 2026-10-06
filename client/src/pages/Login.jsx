import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/useAuth';
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
    <div className="flex min-h-screen items-center justify-center bg-[#fff1ea] p-3 dark:bg-canvas sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex min-h-[min(720px,calc(100vh-3rem))] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-panel shadow-lift sm:rounded-[32px] lg:grid lg:grid-cols-2"
      >
        <header className="flex items-center gap-2.5 px-6 pt-6 text-ink sm:px-9 sm:pt-8 lg:absolute lg:left-0 lg:top-0 lg:z-10 lg:px-10">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine text-ink">
            <BookOpen size={19} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight">Reading Room</span>
        </header>

        <section className="flex flex-1 items-center justify-center bg-[#fff7f2] px-6 py-9 dark:bg-paper sm:px-10 lg:min-h-[720px] lg:px-12 lg:pb-12 lg:pt-24">
          <form onSubmit={submit} className="w-full max-w-[430px]">
            <div className="mb-7 text-center">
              <h1 className="text-[28px] font-semibold tracking-tight text-ink">Sign in</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-mute">
                Welcome back! Enter your account details to continue.
              </p>
            </div>

            <label htmlFor="login-username" className="block text-xs font-semibold text-ink">
              Username
            </label>
            <div className="relative mt-1.5">
              <UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
              <input
                id="login-username"
                className="w-full rounded-full border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-mute focus:border-pine/50 focus:ring-4 focus:ring-pine/10 dark:bg-panel"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>

            <label htmlFor="login-password" className="mt-4 block text-xs font-semibold text-ink">
              Password
            </label>
            <div className="relative mt-1.5">
              <LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
              <input
                id="login-password"
                className="w-full rounded-full border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-mute focus:border-pine/50 focus:ring-4 focus:ring-pine/10 dark:bg-panel"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="mt-3"><Note>{error}</Note></div>}
            <Btn type="submit" className="mt-5 w-full rounded-full bg-pine py-3 !text-ink" disabled={pending}>
              {pending ? 'Checking…' : 'Sign in'}
            </Btn>

            <details className="group mt-6 border-t border-line pt-4">
              <summary className="cursor-pointer list-none text-center text-xs text-mute transition hover:text-pine [&::-webkit-details-marker]:hidden">
                Quick sign-in accounts
              </summary>
              <p className="mb-2 mt-3 text-center text-[11px] text-mute">Desk copies · Library@123</p>
              <ul className="grid grid-cols-2 gap-2">
                {desks.map(([label, id]) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(id);
                        setPassword('Library@123');
                      }}
                      className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-left text-xs transition hover:border-pine/40 hover:bg-white dark:bg-panel dark:hover:bg-[#252936]"
                    >
                      <span className="block font-medium text-ink">{label}</span>
                      <span className="text-mute">{id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </form>
        </section>

        <section className="relative hidden overflow-hidden bg-[#fffaf6] px-12 pb-0 pt-28 dark:bg-[#171923] lg:flex lg:min-h-[720px] lg:flex-col">
          <div className="relative z-10 max-w-md">
            <span className="block h-8 text-4xl font-bold leading-none text-pine" aria-hidden="true">“</span>
            <h2 className="max-w-sm text-[26px] font-medium leading-[1.42] tracking-tight text-ink">
              A good book opens a new world. Your next one is waiting on the department shelf.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mute">
              Find, borrow, and enjoy your next great read — all in one place.
            </p>
          </div>

          <svg
            viewBox="0 0 700 390"
            fill="none"
            className="absolute inset-x-0 bottom-0 h-[48%] min-h-[280px] w-full dark:[&_*]:stroke-[#f0b39a]"
            role="img"
            aria-label="Illustration of a stack of books and an open book"
            preserveAspectRatio="xMidYMax meet"
          >
            <path d="M36 374H664" stroke="#744f48" strokeWidth="4" strokeLinecap="round" />
            <path d="M47 340L157 316L184 329L74 355L47 340Z" fill="#ffd7c4" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M74 355V374M184 329V348" stroke="#744f48" strokeWidth="3" />
            <path d="M62 306L172 282L199 295L89 321L62 306Z" fill="#fffaf6" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M89 321V340M199 295V314" stroke="#744f48" strokeWidth="3" />
            <path d="M79 270L189 246L216 259L106 285L79 270Z" fill="#ff9a60" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M106 285V304M216 259V278M99 269L190 249" stroke="#744f48" strokeWidth="3" />
            <path d="M510 374V224L564 211V374M564 374V193L620 210V374M620 374V238L661 249V374" fill="#fffaf6" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M523 240V357M535 236V357M547 232V357M577 212V357M591 216V357M605 220V357M632 252V357M644 255V357" stroke="#ff5a30" strokeWidth="4" strokeLinecap="round" />
            <path d="M497 374V257L510 253V374M564 193L577 189V374M620 210L633 214V374" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M230 355C270 330 313 329 350 350C387 329 430 330 470 355V373C429 352 388 354 350 378C312 354 271 352 230 373V355Z" fill="#ff9a60" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M239 348C278 326 317 328 350 349V369C318 348 278 347 239 366V348ZM461 348C422 326 383 328 350 349V369C382 348 422 347 461 366V348Z" fill="#fffaf6" stroke="#744f48" strokeWidth="3" strokeLinejoin="round" />
            <path d="M350 349V378M250 351C279 340 308 343 331 355M250 359C279 348 308 351 331 363M450 351C421 340 392 343 369 355M450 359C421 348 392 351 369 363" stroke="#c77a5d" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </section>
      </motion.div>
    </div>
  );
}
