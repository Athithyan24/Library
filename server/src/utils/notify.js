import { Notification, User } from '../models/index.js';

export async function notify(userId, { title, body, type, link }) {
  if (!userId) return;
  await Notification.create({ user: userId, title, body, type, link });
}

export async function notifyRole(role, payload, departmentId) {
  const query = { role, isActive: true };
  if (departmentId) query.department = departmentId;
  const people = await User.find(query).select('_id');
  await Promise.all(people.map((person) => notify(person._id, payload)));
}
