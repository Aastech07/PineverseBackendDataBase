import PushNotification from '../models/PushNotificationModel.js';

// ─── GET /notifications/:userId ───────────────────────────────────────────────
// Returns all notifications where receiverId === userId, newest first
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 30, unreadOnly } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const query = { receiverId: userId };
        if (unreadOnly === 'true') query.isRead = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total, unreadCount] = await Promise.all([
            PushNotification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            PushNotification.countDocuments(query),
            PushNotification.countDocuments({ receiverId: userId, isRead: false }),
        ]);

        return res.status(200).json({
            success: true,
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
            unreadCount,
        });
    } catch (err) {
        console.error('getNotifications error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── POST /notifications/mark-read ───────────────────────────────────────────
// Body: { userId, notificationIds?: string[] }
// If notificationIds omitted → mark ALL for that user
export const markRead = async (req, res) => {
    try {
        const { userId, notificationIds } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const query = { receiverId: userId, isRead: false };
        if (Array.isArray(notificationIds) && notificationIds.length > 0) {
            query._id = { $in: notificationIds };
        }

        const result = await PushNotification.updateMany(query, { $set: { isRead: true } });

        // Get fresh unread count to push to socket
        const unreadCount = await PushNotification.countDocuments({
            receiverId: userId,
            isRead: false,
        });

        // Emit updated count via socket if available
        const io = req.app.get('io');
        if (io) {
            io.to(userId).emit('notification_count_update', { count: unreadCount });
        }

        return res.status(200).json({
            success: true,
            updated: result.modifiedCount,
            unreadCount,
        });
    } catch (err) {
        console.error('markRead error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── GET /notifications/unread-count/:userId ─────────────────────────────────
export const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const count = await PushNotification.countDocuments({
            receiverId: userId,
            isRead: false,
        });

        return res.status(200).json({ success: true, count });
    } catch (err) {
        console.error('getUnreadCount error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── DELETE /notifications/:notificationId ────────────────────────────────────
// Delete a single notification (only if it belongs to the requesting user)
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        if (!userId || !notificationId) {
            return res.status(400).json({ success: false, message: 'userId and notificationId required' });
        }

        const notification = await PushNotification.findOneAndDelete({
            _id: notificationId,
            receiverId: userId,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('deleteNotification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── DELETE /notifications/clear-all ─────────────────────────────────────────
// Body: { userId }  — clears ALL notifications for the user
export const clearAllNotifications = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const result = await PushNotification.deleteMany({ receiverId: userId });

        return res.status(200).json({
            success: true,
            deleted: result.deletedCount,
        });
    } catch (err) {
        console.error('clearAllNotifications error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── POST /notifications/create (internal / admin use) ───────────────────────
// Create a notification manually (usually called from notificationService.js)
export const createNotification = async (req, res) => {
    try {
        const { receiverId, senderId, eventType, title, body, data, payload } = req.body;

        if (!receiverId || !eventType || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'receiverId, eventType, title and body are required',
            });
        }

        const notification = await PushNotification.create({
            receiverId,
            senderId: senderId || null,
            eventType,
            title,
            body,
            data: data || {},
            payload: payload || {},
        });

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to(receiverId).emit('new_notification', notification.toObject());

            const unreadCount = await PushNotification.countDocuments({
                receiverId,
                isRead: false,
            });
            io.to(receiverId).emit('notification_count_update', { count: unreadCount });
        }

        return res.status(201).json({ success: true, notification });
    } catch (err) {
        console.error('createNotification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};