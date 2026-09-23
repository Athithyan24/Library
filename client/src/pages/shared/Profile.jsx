import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../store/useAuth';
import { Avatar, Btn, Note } from '../../components/ui';

export default function Profile() {
  const user = useAuth((state) => state.user);
  const setUser = useAuth((state) => state.setUser);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (photo) body.append('avatar', photo);
      if (removePhoto) body.append('removeAvatar', 'true');
      return (await api.put('/auth/profile', body)).data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      setMessage('Saved.');
      setError('');
      setForm((current) => ({ ...current, currentPassword: '', newPassword: '' }));
      setPhoto(null);
      setPreview('');
      setRemovePhoto(false);
    },
    onError: (err) => {
      setError(err.message);
      setMessage('');
    },
  });

  return (
    <form
      className="mx-auto max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-mute">{user.role}{user.department?.name ? ` · ${user.department.name}` : ''}</p>
      <h1 className="mt-2 font-serif text-4xl">{user.name}</h1>
      <p className="mt-1 text-sm text-mute">{user.username}{user.courseName ? ` · ${user.courseName}` : ''}</p>
      <div className="mt-6 flex items-center gap-4">
        <Avatar person={{ ...user, avatar: removePhoto ? '' : preview || user.avatar }} className="h-16 w-16 text-lg" />
        <div>
          <label className="inline-flex cursor-pointer rounded-xl border border-line px-3 py-1.5 text-sm">
            {user.avatar || preview ? 'Change photo' : 'Add photo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0] || null;
                setPhoto(next);
                setPreview(next ? URL.createObjectURL(next) : '');
                setRemovePhoto(false);
              }}
            />
          </label>
          {(user.avatar || preview) && !removePhoto && (
            <button
              type="button"
              className="ml-2 text-sm text-mute"
              onClick={() => {
                setPhoto(null);
                setPreview('');
                setRemovePhoto(true);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="field" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="field" type="password" placeholder="Current password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
        <input className="field" type="password" placeholder="New password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
        {error && <Note>{error}</Note>}
        {message && <p className="text-sm text-pine">{message}</p>}
        <Btn type="submit" disabled={save.isPending}>Save profile</Btn>
      </div>
    </form>
  );
}
