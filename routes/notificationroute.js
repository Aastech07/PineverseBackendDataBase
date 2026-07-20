import express from 'express';
import {
    getNotifications,
    markRead,
    getUnreadCount,
    deleteNotification,
    clearAllNotifications,
    createNotification,
} from '../controllers/notification.js';

const router = express.Router();

// GET /notifications/unread-count/:userId MUST be before /notifications/:userId
// (otherwise Express treats "unread-count" as :userId).
// Full paths under app.use("/api", …): /api/notifications/unread-count/:userId
router.get('/notifications/unread-count/:userId', getUnreadCount);

// GET  /notifications/:userId              → fetch all (paginated) for a user
router.get('/notifications/:userId', getNotifications);

// GET  /unread-count/:userId               → same count (legacy / shorter URL)
router.get('/unread-count/:userId', getUnreadCount);

// POST /notifications/mark-read            → mark one or all as read
router.post('/mark-read', markRead);

// POST /notifications/create               → create a notification (server-side / admin)
router.post('/create', createNotification);

// DELETE /notifications/:notificationId    → delete one
router.delete('/DELETE/:notificationId', deleteNotification);

// DELETE /notifications/clear-all          → wipe all for a user
router.delete('/clear-all', clearAllNotifications);

export default router;