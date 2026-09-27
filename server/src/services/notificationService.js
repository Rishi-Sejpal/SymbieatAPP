import Notification from '../models/Notification.js';
import { emitToUser } from '../realtime.js';

export async function notifyUser(userId, { title, body = '', type = 'order', link = '' }) {
  try {
    const doc = await Notification.create({ user: userId, title, body, type, link });
    emitToUser(userId, 'notification:new', {
      _id: String(doc._id),
      title,
      body,
      type,
      link,
      isRead: false,
      createdAt: doc.createdAt,
    });
    return doc;
  } catch (err) {
    console.error('[notify]', err.message);
  }
}

export async function notifyMany(userIds, payload) {
  await Promise.all(userIds.filter(Boolean).map((id) => notifyUser(id, payload)));
}
