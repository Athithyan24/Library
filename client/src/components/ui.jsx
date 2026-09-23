import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Btn({ children, tone = 'pine', className = '', ...props }) {
  const tones = {
    pine: 'bg-pine text-white',
    quiet: 'border border-line bg-panel/70',
    clay: 'bg-clay text-white',
    ghost: 'bg-transparent',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Cover({ book, className = '', compact = false }) {
  if (!book) return null;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: book.coverImage ? undefined : book.coverColor || '#1e4d3a' }}
    >
      {book.coverImage ? (
        <img src={book.coverImage} alt="" className="h-full w-full object-cover" />
      ) : compact ? (
        <span className="sr-only">{book.title}</span>
      ) : (
        <div className="flex h-full flex-col justify-between p-3 text-white">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/70">{book.subject || 'Volume'}</span>
          <span className="font-serif text-[1.05rem] leading-tight">{book.title}</span>
        </div>
      )}
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 bg-ink/30 backdrop-blur-md" onClick={onClose} aria-label="Close" />
          <motion.div
            role="dialog"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`relative max-h-[88vh] w-full overflow-auto rounded-3xl border border-line bg-panel p-6 shadow-lift ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl">{title}</h2>
              <Btn tone="ghost" onClick={onClose} className="px-2 text-mute">
                Close
              </Btn>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ lottie, title, body }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-line px-6 py-8">
      {lottie}
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="max-w-md text-sm text-mute">{body}</p>
    </div>
  );
}

export function Bones({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-line/70" />
      ))}
    </div>
  );
}

export function Note({ children }) {
  return <p className="text-sm text-clay">{children}</p>;
}

export function Stars({ value }) {
  return (
    <span className="text-brass tracking-tight" aria-label={`${value} of 5`}>
      {'●'.repeat(Math.round(value || 0))}
      <span className="text-line">{'●'.repeat(5 - Math.round(value || 0))}</span>
    </span>
  );
}

export function when(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
