import { Counter } from '../models/index.js';

export async function nextIssueCode() {
  const counter = await Counter.findOneAndUpdate(
    { key: 'issue' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `ISS${String(counter.seq).padStart(6, '0')}`;
}
