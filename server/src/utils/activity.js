import { ActivityLog } from '../models/index.js';

export async function logActivity(actor, action, detail) {
  await ActivityLog.create({
    actor: actor?._id || actor,
    actorName: actor?.name || '',
    role: actor?.role || '',
    action,
    detail,
  });
}
