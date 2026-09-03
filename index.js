
// server.js — load .env before any module reads process.env (Firebase path / secrets)
import "./loadEnv.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import multer from "multer";
import mime from "mime-types";
import connectDB from "./db/connectDB.js";
import bidRoutes from "./routes/BidRoutes.js";
import { uploadpdf } from "./upload_pdf/uploadpdf.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import transactionRoutes from "./routes/transactions.js";
import locationRoutes from "./routes/locationRoutes.js";
import countRoutes from "./routes/countRoutes.js";
import SkipRoute from "./routes/SkipRoute.js";
import statusRoutes from "./routes/Statusroutes.js";
import notificationroute from "./routes/notificationroute.js";
import fcmTokenRoutes from "./routes/fcmTokenRoutes.js";
import Payment from "./routes/PaymentRoute.js";
import UserSubscriptionRoutes from "./routes/UserSubscriptionRoutes.js";
import UserRoleRoute from './routes/UserRoleRoute.js'
import { sendNotificationToUsers } from "./services/pushNotificationService.js";
import { verifyFirebaseCredentials } from "./utils/firebase.js";
import UsersPlan from './routes/subscriptionPlanRoutes.js'
import AdvancePaymentRoute from "./routes/AdvancePaymentRoute.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});
//setSocketInstance(io);

await connectDB();
await verifyFirebaseCredentials();

// ✅ Attach io to app so controllers can access it
app.set('io', io);

app.use(cors());
app.use(express.json()); // ← ye hona chahiye
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
//app.use("/api/socket", socketRoutes);

// ========== UPLOADS SETUP ==========
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// serve static uploads
app.use("/uploads", express.static(uploadsDir));

// Multer config
const ALLOWED_MIMES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
    "text/plain": "txt",
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = mime.extension(file.mimetype) || "";
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        cb(null, `${unique}.${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (Object.keys(ALLOWED_MIMES).includes(file.mimetype)) cb(null, true);
        else cb(new Error("Invalid file type"));
    },
});

// ========== SINGLE FILE UPLOAD (with optional caption) ==========
app.post("/uploadFile", upload.single("file"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const { caption = "" } = req.body;
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            attachment: {
                url: fileUrl,
                filename: req.file.originalname,
                mime: req.file.mimetype,
                size: req.file.size,
                caption: String(caption || ""),
            },
        });
    } catch (err) {
        console.error("❌ upload error:", err.message);
        res.status(500).json({ error: "File upload failed" });
    }
});

// ========== MULTI FILE UPLOAD (with optional captions[]) ==========
app.post("/uploadFiles", upload.array("files", 10), (req, res) => {
    try {
        if (!req.files?.length)
            return res.status(400).json({ error: "No files uploaded" });

        let { captions } = req.body;
        if (typeof captions === "string") {
            try {
                const maybeJson = JSON.parse(captions);
                captions = Array.isArray(maybeJson) ? maybeJson : [captions];
            } catch {
                captions = [captions];
            }
        } else if (!Array.isArray(captions)) {
            captions = [];
        }

        const attachments = req.files.map((f, idx) => {
            const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${f.filename}`;
            return {
                url: fileUrl,
                filename: f.originalname,
                mime: f.mimetype,
                size: f.size,
                caption: String(captions[idx] || ""),
            };
        });

        res.json({ success: true, attachments });
    } catch (err) {
        console.error("❌ multi upload error:", err.message);
        res.status(500).json({ error: "Files upload failed" });
    }
});

// ========== ROUTES ==========
app.use("/", uploadpdf);
app.use("/api", bidRoutes);
app.use("/api", reviewRoutes);
app.use("/api", locationRoutes);
app.use("/api", UserSubscriptionRoutes);
app.use("/api", UsersPlan)
app.use("/api", Payment);
app.use("/api", UserRoleRoute)


//add new api routes
app.use("/api", countRoutes);
app.use("/api", transactionRoutes);
app.use("/api", SkipRoute);
app.use("/api", statusRoutes);

app.use("/api", fcmTokenRoutes);
app.use("/api", notificationroute);
app.use("/api", AdvancePaymentRoute);
// ========== Mongoose Message Schema (with caption & activeStatus & negotiateAmount) ==========
const attachmentSchema = new mongoose.Schema(
    {
        url: String,
        filename: String,
        mime: String,
        size: Number,
        caption: { type: String, default: "" },
    },
    { _id: false },
);

const amountHistorySchema = new mongoose.Schema(
    {
        amount: { type: Number, default: 0 },
        addedBy: { type: String, default: "" }, // senderId jo amount add kar raha hai
        addedAt: { type: Date, default: Date.now },
        bidId: { type: String, default: null },
    },
    { _id: false },
);

// EXISTING (near line 165):
const messageSchema = new mongoose.Schema(
    {
        senderId: String,
        receiverId: String,
        text: { type: String, default: "" },
        attachments: { type: [attachmentSchema], default: [] },
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },
        isRead: { type: Boolean, default: false },
        activeStatus: {
            type: String,
            enum: ["accept", "negotiate", "none"],
            default: "none",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        getCurrentAmount: { type: Number, default: 0 },
        amountHistory: { type: [amountHistorySchema], default: [] },
        negotiateAmount: { type: Number, default: 0 },

        // ✅ ADD THIS — stores bidId, jobId so every document is bid-scoped
        meta: {
            bidId: { type: String, default: null },
            jobId: { type: String, default: null },
        },
    },
    { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);

// ========== PAYMENT STATUS ROUTES & SOCKET ==========

// REST API: Update paymentStatus
// app.post("/updatePaymentStatus", async (req, res) => {
//   const { senderId, receiverId, paymentStatus ,amount } = req.body;
//   try {
//     if (!["pending", "completed", "failed"].includes(paymentStatus)) {
//       return res.status(400).json({ error: "Invalid paymentStatus" });
//     }

//     // Upsert - sender+receiver pair ke liye
//     const updated = await Message.findOneAndUpdate(
//       { senderId, receiverId },
//       {
//         senderId,
//         receiverId,
//         paymentStatus,
//         getCurrentAmount: amount || 0,
//         text: "",
//         status: "sent",
//         isRead: false,
//         activeStatus: "none",
//         negotiateAmount: 0,
//       },
//       { new: true, upsert: true, setDefaultsOnInsert: true },
//     );

//     const payload = {
//       paymentStatus: updated.paymentStatus,
//       senderId: updated.senderId,
//       receiverId: updated.receiverId,
//     };

//     io.to(senderId).emit("payment_status_updated", payload);
//     io.to(receiverId).emit("payment_status_updated", payload);

//     res.json({ success: true, ...payload });
//   } catch (err) {
//     console.error("❌ Error updating paymentStatus:", err.message);
//     res.status(500).json({ error: "Failed to update paymentStatus" });
//   }
// });

// app.get("/getPaymentStatus", async (req, res) => {
//   const { senderId, receiverId ,bidId  } = req.query;
//   try {
//     const messages = await Message.find({
//       $or: [
//         { senderId, receiverId },
//         { senderId: receiverId, receiverId: senderId },
//       ],
//     }).select("paymentStatus senderId receiverId -_id");

//     if (!messages.length)
//       return res.status(404).json({ error: "No payment status found" });

//     const senderToReceiver = messages.find(
//       (m) => m.senderId === senderId && m.receiverId === receiverId,
//     );
//     const receiverToSender = messages.find(
//       (m) => m.senderId === receiverId && m.receiverId === senderId,
//     );

//     res.json({
//       senderToReceiver: senderToReceiver
//         ? {
//             senderId: senderToReceiver.senderId,
//             receiverId: senderToReceiver.receiverId,
//             paymentStatus: senderToReceiver.paymentStatus,
//           }
//         : null,
//       receiverToSender: receiverToSender
//         ? {
//             senderId: receiverToSender.senderId,
//             receiverId: receiverToSender.receiverId,
//             paymentStatus: receiverToSender.paymentStatus,
//           }
//         : null,
//     });
//   } catch (err) {
//     console.error("❌ Error fetching paymentStatus:", err.message);
//     res.status(500).json({ error: "Failed to fetch paymentStatus" });
//   }
// });

app.post("/updatePaymentStatus", async (req, res) => {
    const { senderId, receiverId, paymentStatus, amount, bidId } = req.body; // ✅ bidId added
    try {
        if (!["pending", "completed", "failed"].includes(paymentStatus)) {
            return res.status(400).json({ error: "Invalid paymentStatus" });
        }

        // ✅ bidId available ho toh us bid ka record dhundo
        const findQuery = bidId
            ? { senderId, receiverId, "meta.bidId": bidId }
            : { senderId, receiverId };

        const updated = await Message.findOneAndUpdate(
            findQuery,
            {
                senderId,
                receiverId,
                paymentStatus,
                getCurrentAmount: amount || 0,
                text: "",
                status: "sent",
                isRead: false,
                activeStatus: "none",
                negotiateAmount: 0,
                ...(bidId ? { "meta.bidId": bidId } : {}), // ✅ meta.bidId save karo
            },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        const payload = {
            paymentStatus: updated.paymentStatus,
            senderId: updated.senderId,
            receiverId: updated.receiverId,
            bidId: bidId || null, // ✅ socket payload mein bhi bhejo
        };

        io.to(senderId).emit("payment_status_updated", payload);
        io.to(receiverId).emit("payment_status_updated", payload);

        res.json({ success: true, ...payload });
    } catch (err) {
        console.error("❌ Error updating paymentStatus:", err.message);
        res.status(500).json({ error: "Failed to update paymentStatus" });
    }
});

// app.get("/getPaymentStatus", async (req, res) => {
//     const { senderId, receiverId, bidId } = req.query; // ✅ bidId added
//     try {
//         // ✅ Base query
//         const baseQuery = {
//             $or: [
//                 { senderId, receiverId },
//                 { senderId: receiverId, receiverId: senderId },
//             ],
//         };

//         // ✅ bidId available ho toh sirf us bid ka payment status fetch karo
//         if (bidId) {
//             baseQuery["meta.bidId"] = bidId;
//         }

//         const messages = await Message.find(baseQuery).select(
//             "paymentStatus senderId receiverId meta -_id",
//         );

//         if (!messages.length)
//             return res.status(404).json({ error: "No payment status found" });

//         const senderToReceiver = messages.find(
//             (m) => m.senderId === senderId && m.receiverId === receiverId,
//         );
//         const receiverToSender = messages.find(
//             (m) => m.senderId === receiverId && m.receiverId === senderId,
//         );

//         res.json({
//             senderToReceiver: senderToReceiver
//                 ? {
//                     senderId: senderToReceiver.senderId,
//                     receiverId: senderToReceiver.receiverId,
//                     paymentStatus: senderToReceiver.paymentStatus,
//                 }
//                 : null,
//             receiverToSender: receiverToSender
//                 ? {
//                     senderId: receiverToSender.senderId,
//                     receiverId: receiverToSender.receiverId,
//                     paymentStatus: receiverToSender.paymentStatus,
//                 }
//                 : null,
//         });
//     } catch (err) {
//         console.error("❌ Error fetching paymentStatus:", err.message);
//         res.status(500).json({ error: "Failed to fetch paymentStatus" });
//     }
// });
// ========== SOCKET.IO ==========
io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on("join", ({ userId }) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        }
    });

    // send_message supports attachments WITH captions + activeStatus + negotiateAmount
    socket.on("send_message", async (data) => {
        try {
            const {
                senderId,
                receiverId,
                text = "",
                username,
                attachments = [],
                activeStatus = "none",
                negotiateAmount = 0,
                bidId = null, // ✅ NEW
                meta = {}, // ✅ NEW
            } = data;

            const negotiateVal =
                negotiateAmount === null || negotiateAmount === undefined
                    ? 0
                    : Number(negotiateAmount) || 0;

            // ✅ Resolve bidId from either top-level or meta
            const resolvedBidId = bidId || meta?.bidId || null;
            const resolvedJobId = meta?.jobId || null;

            const newMessage = new Message({
                senderId,
                receiverId,
                text,
                attachments,
                activeStatus,
                negotiateAmount: negotiateVal,
                // ✅ Save meta so getMessages can filter by meta.bidId
                meta: {
                    bidId: resolvedBidId,
                    jobId: resolvedJobId,
                },
            });

            const savedMessage = await newMessage.save();

            const formattedTime = savedMessage.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });

            const payload = {
                _id: savedMessage._id,
                senderId,
                receiverId,
                text,
                attachments,
                timestamp: savedMessage.createdAt,
                time: formattedTime,
                status: savedMessage.status,
                activeStatus: savedMessage.activeStatus,
                negotiateAmount: savedMessage.negotiateAmount || 0,
                bidId: resolvedBidId, // ✅ Send bidId back so client can filter
                meta: savedMessage.meta, // ✅ Send full meta
            };

            io.to(receiverId).emit("receive_message", payload);
            io.to(senderId).emit("receive_message", payload);

            const unreadCount = await Message.countDocuments({
                receiverId,
                senderId,
                isRead: false,
                ...(resolvedBidId ? { "meta.bidId": resolvedBidId } : {}), // ✅ per-bid unread
            });

            // io.to(receiverId).emit("unread_count_update", {
            //     userId: receiverId,
            //     from: senderId,
            //     count: unreadCount,
            // });

            io.to(receiverId).emit("unread_count_update", {
                userId: receiverId,
                from: senderId,
                bidId: resolvedBidId,   // ✅ add this
                count: unreadCount,
            });

            let notifyBody =
                (text && text.length ? text.slice(0, 100) : "") ||
                (attachments && attachments.length
                    ? `${username || "Someone"} sent an attachment`
                    : "You have a new message");

            await sendNotificationToUsers({
                userIds: [String(receiverId)],
                title: username || "New Message",
                body: notifyBody,
                senderId: String(senderId),
                eventType: "chat_message",
                data: {
                    type: "chat_message",
                    senderId: String(senderId),
                    receiverId: String(receiverId),
                    messageId: savedMessage._id.toString(),
                    hasAttachments: attachments.length ? "1" : "0",
                    activeStatus: savedMessage.activeStatus || "none",
                    negotiateAmount: String(savedMessage.negotiateAmount || 0),
                    bidId: resolvedBidId || "",
                },
                payload: {
                    message: savedMessage.toObject(),
                    senderId: String(senderId),
                    receiverId: String(receiverId),
                },
            });
        } catch (err) {
            console.error("❌ Error saving message:", err.message);
        }
    });

    socket.on("message_delivered", async ({ messageId }) => {
        try {
            const updated = await Message.findByIdAndUpdate(
                messageId,
                { status: "delivered" },
                { new: true },
            );
            if (updated) {
                // emit update only (scoped) - you can change to io.emit if you prefer global
                io.to(updated.receiverId).emit("message_status_update", {
                    messageId,
                    status: "delivered",
                });
                io.to(updated.senderId).emit("message_status_update", {
                    messageId,
                    status: "delivered",
                });
            } else {
                io.emit("message_status_update", { messageId, status: "delivered" });
            }
        } catch (err) {
            console.error("❌ Error updating delivered:", err.message);
        }
    });

    socket.on("message_seen", async ({ messageId }) => {
        try {
            const updated = await Message.findByIdAndUpdate(
                messageId,
                { status: "seen", isRead: true },
                { new: true },
            );
            if (updated) {
                io.to(updated.receiverId).emit("message_status_update", {
                    messageId,
                    status: "seen",
                });
                io.to(updated.senderId).emit("message_status_update", {
                    messageId,
                    status: "seen",
                });

                const unreadCount = await Message.countDocuments({
                    receiverId: updated.receiverId,
                    senderId: updated.senderId,
                    isRead: false,
                });

                io.to(updated.receiverId).emit("unread_count_update", {
                    userId: updated.receiverId,
                    from: updated.senderId,
                    count: unreadCount,
                });
            } else {
                // fallback emit
                io.emit("message_status_update", { messageId, status: "seen" });
            }
        } catch (err) {
            console.error("❌ Error updating seen:", err.message);
        }
    });

    // socket.on("mark_as_read", async ({ senderId, receiverId }) => {
    //     try {
    //         await Message.updateMany(
    //             { senderId, receiverId, isRead: false },
    //             { isRead: true, status: "seen" },
    //         );

    //         io.to(receiverId).emit("unread_count_update", {
    //             userId: receiverId,
    //             from: senderId,
    //             count: 0,
    //         });
    //     } catch (err) {
    //         console.error("❌ Error marking as read:", err.message);
    //     }
    // });

    socket.on("mark_as_read", async ({ senderId, receiverId, bidId }) => {
        try {
            const filter = { senderId, receiverId, isRead: false };
            if (bidId) filter["meta.bidId"] = bidId; // ✅ scope to bid

            await Message.updateMany(filter, { isRead: true, status: "seen" });

            io.to(receiverId).emit("unread_count_update", {
                userId: receiverId,
                from: senderId,
                bidId: bidId || null, // ✅
                count: 0,
            });
        } catch (err) {
            console.error("❌ Error marking as read:", err.message);
        }
    });



    socket.on("transaction_updated", async (data) => {
        try {
            const {
                senderId,
                receiverId,
                finalPrice,
                ActiveStatus, // "Accept" ya "ACCEPT" ya "accept"
                meta = {},
            } = data;

            if (!senderId || !receiverId) {
                console.log("❌ transaction_updated → missing senderId or receiverId");
                return;
            }

            const normalizedStatus = String(ActiveStatus || "")
                .toLowerCase()
                .trim();

            console.log(
                `[TXN] ${senderId} → ${receiverId} | Status: ${normalizedStatus} | ₹${finalPrice || "?"}`,
            );

            const broadcastPayload = {
                finalPrice: finalPrice ?? null,
                ActiveStatus:
                    normalizedStatus === "accept" ? "Accept" : normalizedStatus,
                normalizedStatus,
                fromUser: senderId,
                meta,
                timestamp: new Date().toISOString(),
            };

            // Dono ko bhejo — important!
            io.to(senderId).emit("transaction_updated", broadcastPayload);
            io.to(receiverId).emit("transaction_updated", broadcastPayload);

            // Optional: Agar accept hua to saare pending messages ko seen kar do
            if (normalizedStatus === "accept") {
                await Message.updateMany(
                    {
                        $or: [
                            { senderId, receiverId },
                            { senderId: receiverId, receiverId: senderId },
                        ],
                        isRead: false,
                    },
                    { isRead: true, status: "seen" },
                );

                // Reset unread counts
                io.to(senderId).emit("unread_count_update", {
                    userId: senderId,
                    from: receiverId,
                    count: 0,
                });
                io.to(receiverId).emit("unread_count_update", {
                    userId: receiverId,
                    from: senderId,
                    count: 0,
                });
            }
        } catch (err) {
            console.error("❌ transaction_updated socket error:", err);
        }
    });

    // ✅ REALTIME PAYMENT STATUS UPDATE - place inside io.on('connection', ...) block
    socket.on(
        "update_payment_status",
        async ({ senderId, receiverId, paymentStatus }) => {
            try {
                if (!["pending", "completed", "failed"].includes(paymentStatus)) {
                    socket.emit("payment_status_error", {
                        error: "Invalid paymentStatus",
                    });
                    return;
                }

                if (!senderId || !receiverId) {
                    socket.emit("payment_status_error", {
                        error: "Missing senderId or receiverId",
                    });
                    return;
                }

                const updated = await Message.findOneAndUpdate(
                    { senderId, receiverId },
                    {
                        senderId,
                        receiverId,
                        paymentStatus,
                        text: "",
                        status: "sent",
                        isRead: false,
                        activeStatus: "none",
                        negotiateAmount: 0,
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                );

                const payload = {
                    senderId: updated.senderId,
                    receiverId: updated.receiverId,
                    paymentStatus: updated.paymentStatus,
                    timestamp: new Date().toISOString(),
                };

                // Emit to BOTH sender and receiver — same as get_payment_status pattern
                io.to(senderId).emit("payment_status_updated", payload);
                io.to(receiverId).emit("payment_status_updated", payload);

                console.log(
                    `[PAYMENT] ${senderId} → ${receiverId} | Status: ${paymentStatus}`,
                );
            } catch (err) {
                console.error("❌ Socket update_payment_status error:", err.message);
                socket.emit("payment_status_error", {
                    error: "Failed to update payment status",
                });
            }
        },
    );
    // SOCKET: Realtime paymentStatus update
    socket.on("get_payment_status", async ({ senderId, receiverId }) => {
        try {
            const messages = await Message.find({
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            })
                .sort({ createdAt: -1 })
                .select("paymentStatus senderId receiverId createdAt");

            // Agar koi message nahi mila
            if (!messages.length) {
                socket.emit("payment_status_result", {
                    senderToReceiver: { senderId, receiverId, paymentStatus: "pending" },
                    receiverToSender: {
                        senderId: receiverId,
                        receiverId: senderId,
                        paymentStatus: "pending",
                    },
                });
                return;
            }

            const senderToReceiver = messages.find(
                (m) =>
                    String(m.senderId) === String(senderId) &&
                    String(m.receiverId) === String(receiverId),
            );
            const receiverToSender = messages.find(
                (m) =>
                    String(m.senderId) === String(receiverId) &&
                    String(m.receiverId) === String(senderId),
            );

            const payload = {
                senderToReceiver: {
                    senderId,
                    receiverId,
                    paymentStatus: senderToReceiver?.paymentStatus || "pending",
                },
                receiverToSender: {
                    senderId: receiverId,
                    receiverId: senderId,
                    paymentStatus: receiverToSender?.paymentStatus || "pending",
                },
            };

            io.to(senderId).emit("payment_status_result", payload);
            io.to(receiverId).emit("payment_status_result", payload);
        } catch (err) {
            console.error("❌ Socket get_payment_status error:", err.message);
            socket.emit("payment_status_error", {
                error: "Failed to fetch payment status",
            });
        }
    });

    // ✅ REALTIME - Amount array me add karo
    socket.on(
        "add_amount_history",
        async ({ senderId, receiverId, amount, addedBy, bidId }) => {
            try {
                if (!senderId || !receiverId) {
                    socket.emit("amount_history_error", {
                        error: "Missing senderId or receiverId",
                    });
                    return;
                }
                if (amount === undefined || isNaN(Number(amount))) {
                    socket.emit("amount_history_error", { error: "Invalid amount" });
                    return;
                }

                const newEntry = {
                    amount: Number(amount),
                    addedBy: addedBy || senderId,
                    addedAt: new Date(),
                };

                // ✅ Scope to bid
                const findQuery = bidId
                    ? { senderId, receiverId, "meta.bidId": bidId }
                    : { senderId, receiverId, "meta.bidId": null };

                const updated = await Message.findOneAndUpdate(
                    findQuery,
                    {
                        $push: { amountHistory: newEntry },
                        $set: {
                            getCurrentAmount: Number(amount),
                            ...(bidId ? { "meta.bidId": bidId } : {}),
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                );

                const payload = {
                    senderId: updated.senderId,
                    receiverId: updated.receiverId,
                    bidId: bidId || null, // ✅ include bidId so client can filter
                    getCurrentAmount: updated.getCurrentAmount,
                    amountHistory: updated.amountHistory,
                    latestEntry: newEntry,
                    timestamp: new Date().toISOString(),
                };

                io.to(senderId).emit("amount_history_updated", payload);
                io.to(receiverId).emit("amount_history_updated", payload);

                console.log(
                    `[HISTORY] ${senderId} → ${receiverId} | bidId: ${bidId} | ₹${amount} added`,
                );
            } catch (err) {
                console.error("❌ add_amount_history error:", err.message);
                socket.emit("amount_history_error", { error: "Failed to add amount" });
            }
        },
    );

    // ✅ REALTIME - Saari history fetch karo
    socket.on("get_amount_history", async ({ senderId, receiverId, bidId }) => {
        try {
            if (!senderId || !receiverId) {
                socket.emit("amount_history_error", {
                    error: "Missing senderId or receiverId",
                });
                return;
            }

            // ✅ Scope to bid
            const baseQuery = {
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
                ...(bidId ? { "meta.bidId": bidId } : {}),
            };

            const messages = await Message.find(baseQuery).select(
                "amountHistory getCurrentAmount senderId receiverId meta",
            );

            const senderToReceiver = messages.find(
                (m) =>
                    String(m.senderId) === String(senderId) &&
                    String(m.receiverId) === String(receiverId),
            );
            const receiverToSender = messages.find(
                (m) =>
                    String(m.senderId) === String(receiverId) &&
                    String(m.receiverId) === String(senderId),
            );

            const payload = {
                bidId: bidId || null, // ✅ echo back
                senderToReceiver: {
                    senderId,
                    receiverId,
                    getCurrentAmount: senderToReceiver?.getCurrentAmount ?? 0,
                    amountHistory: senderToReceiver?.amountHistory ?? [],
                },
                receiverToSender: {
                    senderId: receiverId,
                    receiverId: senderId,
                    getCurrentAmount: receiverToSender?.getCurrentAmount ?? 0,
                    amountHistory: receiverToSender?.amountHistory ?? [],
                },
            };

            io.to(senderId).emit("amount_history_result", payload);
            io.to(receiverId).emit("amount_history_result", payload);
        } catch (err) {
            console.error("❌ get_amount_history error:", err.message);
            socket.emit("amount_history_error", {
                error: "Failed to get amount history",
            });
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User disconnected: ${socket.id}`);
    });
    socket.on("final_quotation_sent", (data) => {
        const { senderId, receiverId, amount, bidId } = data;
        if (!senderId || !receiverId) return;
        const payload = { senderId, receiverId, amount, bidId: bidId || null };
        io.to(receiverId).emit("final_quotation_sent", payload);
        io.to(senderId).emit("final_quotation_sent", payload);
        console.log(`[FINAL QUOT] ${senderId} → ${receiverId} | ₹${amount}`);
    });

    // ✅ Relay offer rejection to the vendor
    socket.on("offer_rejected", (data) => {
        const { senderId, receiverId, bidId } = data;
        if (!senderId || !receiverId) return;
        const payload = { senderId, receiverId, bidId: bidId || null };
        io.to(receiverId).emit("offer_rejected", payload);
        io.to(senderId).emit("offer_rejected", payload);
        console.log(`[REJECTED] ${senderId} → ${receiverId}`);
    });

    // ✅ Relay vendor "Ok Done" to the customer
    socket.on("vendor_ok_done", (data) => {
        const { senderId, receiverId, amount, bidId } = data;
        if (!senderId || !receiverId) return;
        const payload = { senderId, receiverId, amount, bidId: bidId || null };
        io.to(receiverId).emit("vendor_ok_done", payload);
        io.to(senderId).emit("vendor_ok_done", payload);
        console.log(`[OK DONE] ${senderId} → ${receiverId} | ₹${amount}`);
    });
});

// ✅ Relay final quotation to the buyer

// ========== MESSAGE & CHAT ROUTES ==========

app.post("/getMessages", async (req, res) => {
    const { senderId, receiverId, bidId } = req.body;

    const formatTime = (date) =>
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const formatDateLabel = (date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const msgDate = new Date(date);

        if (msgDate.toDateString() === today.toDateString()) return "Today";
        if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
        return msgDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year:
                msgDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
    };

    try {
        let baseQuery;

        if (bidId) {
            // ✅ When bidId is provided:
            // First check if ANY message exists tagged to this bidId in DB
            const taggedCount = await mongoose.model("Message").countDocuments({
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
                "meta.bidId": bidId,
            });

            if (taggedCount > 0) {
                // ✅ Tagged messages exist → return ONLY this bid's messages
                baseQuery = {
                    $or: [
                        { senderId, receiverId },
                        { senderId: receiverId, receiverId: senderId },
                    ],
                    "meta.bidId": bidId,
                };
            } else {
                // ✅ No tagged messages yet (legacy data or first message not sent yet)
                // Return messages that have NO bidId at all (old untagged messages)
                baseQuery = {
                    $or: [
                        { senderId, receiverId },
                        { senderId: receiverId, receiverId: senderId },
                    ],
                    $and: [
                        {
                            $or: [
                                { "meta.bidId": null },
                                { "meta.bidId": { $exists: false } },
                                { meta: null },
                                { meta: { $exists: false } },
                            ],
                        },
                    ],
                };
            }
        } else {
            // ✅ No bidId provided → return all messages between these two users
            baseQuery = {
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            };
        }

        const messages = await mongoose
            .model("Message")
            .find(baseQuery)
            .sort({ createdAt: 1 });

        const grouped = [];
        let currentLabel = "";

        messages.forEach((msg) => {
            const label = formatDateLabel(msg.createdAt);
            if (label !== currentLabel) {
                grouped.push({ type: "label", label });
                currentLabel = label;
            }
            grouped.push({
                type: "message",
                _id: msg._id,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                text: msg.text,
                attachments: msg.attachments || [],
                status: msg.status,
                isRead: msg.isRead,
                activeStatus: msg.activeStatus || "none",
                negotiateAmount: msg.negotiateAmount || 0,
                // ✅ Return bidId in each message so frontend filter works
                bidId: msg.meta?.bidId ?? null,
                timestamp: msg.createdAt,
                time: formatTime(msg.createdAt),
            });
        });

        res.json(grouped);
    } catch (err) {
        console.error("❌ Failed to fetch messages:", err.message);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

app.post("/chatUsers", async (req, res) => {
    const { userId, groupByBid = false } = req.body;
    try {
        const messages = await mongoose
            .model("Message")
            .find({
                $or: [{ senderId: userId }, { receiverId: userId }],
            })
            .sort({ createdAt: -1 });

        // ✅ Key = chatWith_bidId (one row per bid, not per user pair)
        //    Falls back to chatWith if no bidId (legacy messages)
        const unique = new Map();

        messages.forEach((msg) => {
            const chatWith = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const bidId = msg.meta?.bidId || null;

            // ✅ Unique key per bid — same two users with 2 bids = 2 rows
            const key = bidId ? `${chatWith}_${bidId}` : chatWith;

            if (!unique.has(key)) {
                const baseLastMessage =
                    msg.text ||
                    (msg.attachments?.length
                        ? msg.attachments[0].caption
                            ? `Attachment: ${msg.attachments[0].caption}`
                            : "Attachment"
                        : "");

                const lastMessage =
                    msg.activeStatus && msg.activeStatus !== "none"
                        ? `${baseLastMessage || "Status"} [${msg.activeStatus}]`
                        : baseLastMessage;

                unique.set(key, {
                    chatWith,
                    bidId, // ✅ Include bidId in response
                    jobId: msg.meta?.jobId || null, // ✅ Include jobId in response
                    lastMessage,
                    activeStatus: msg.activeStatus || "none",
                    negotiateAmount: msg.negotiateAmount || 0,
                    status: msg.status,
                    time: msg.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    timestamp: msg.createdAt,
                    unreadCount: 0,
                });
            }
        });

        // ✅ Unread counts also scoped per bid
        const unreadAgg = await mongoose.model("Message").aggregate([
            { $match: { receiverId: userId, isRead: false } },
            {
                $group: {
                    _id: {
                        senderId: "$senderId",
                        bidId: "$meta.bidId", // ✅ Group by sender + bid
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Build unread map: key = senderId_bidId or just senderId
        const unreadMap = {};
        unreadAgg.forEach((u) => {
            const bid = u._id.bidId;
            const sender = u._id.senderId;
            const key = bid ? `${sender}_${bid}` : sender;
            unreadMap[key] = u.count;
        });

        const chatList = Array.from(unique.entries()).map(([key, chat]) => ({
            ...chat,
            unreadCount: unreadMap[key] || 0,
        }));

        res.json(chatList);
    } catch (err) {
        console.error("❌ Failed to fetch chat users:", err.message);
        res.status(500).json({ error: "Failed to fetch chat users" });
    }
});

// app.post("/unreadCounts", async (req, res) => {
//     const { userId } = req.body;
//     try {
//         const unread = await mongoose
//             .model("Message")
//             .aggregate([
//                 { $match: { receiverId: userId, isRead: false } },
//                 { $group: { _id: "$senderId", count: { $sum: 1 } } },
//             ]);

//         const unreadMap = {};
//         unread.forEach((item) => (unreadMap[item._id] = item.count));
//         res.json(unreadMap);
//     } catch (err) {
//         console.error("❌ Error fetching unread counts:", err.message);
//         res.status(500).json({ error: "Failed to fetch unread counts" });
//     }
// });

// ========== CURRENT AMOUNT ROUTES ==========



app.post("/unreadCounts", async (req, res) => {
    const { userId } = req.body;
    try {
        const unread = await mongoose.model("Message").aggregate([
            { $match: { receiverId: userId, isRead: false } },
            {
                $group: {
                    _id: { senderId: "$senderId", bidId: "$meta.bidId" }, // ✅ bidId bhi group me
                    count: { $sum: 1 },
                },
            },
        ]);

        const unreadMap = {};
        unread.forEach((item) => {
            const { senderId, bidId } = item._id;
            const key = bidId ? `${senderId}_${bidId}` : senderId; // ✅ same key format jo client use karta hai
            unreadMap[key] = item.count;
        });
        res.json(unreadMap);
    } catch (err) {
        console.error("❌ Error fetching unread counts:", err.message);
        res.status(500).json({ error: "Failed to fetch unread counts" });
    }
});

app.get("/getPaymentStatus", async (req, res) => {
    const { senderId, receiverId, bidId } = req.query;
    try {
        const baseQuery = {
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        };

        // ✅ KEY FIX: bidId scope — purani bid ki payment na aaye
        if (bidId) {
            baseQuery["meta.bidId"] = bidId;
        }

        const messages = await Message.find(baseQuery).select(
            "paymentStatus senderId receiverId meta -_id",
        );

        // ✅ Agar koi message nahi mila is bidId ke liye — pending return karo
        if (!messages.length) {
            return res.json({
                senderToReceiver: { senderId, receiverId, paymentStatus: "pending" },
                receiverToSender: { senderId: receiverId, receiverId: senderId, paymentStatus: "pending" },
            });
        }

        const senderToReceiver = messages.find(
            (m) => m.senderId === senderId && m.receiverId === receiverId,
        );
        const receiverToSender = messages.find(
            (m) => m.senderId === receiverId && m.receiverId === senderId,
        );

        res.json({
            senderToReceiver: senderToReceiver
                ? {
                    senderId: senderToReceiver.senderId,
                    receiverId: senderToReceiver.receiverId,
                    paymentStatus: senderToReceiver.paymentStatus,
                }
                : { senderId, receiverId, paymentStatus: "pending" }, // ✅ null ki jagah pending
            receiverToSender: receiverToSender
                ? {
                    senderId: receiverToSender.senderId,
                    receiverId: receiverToSender.receiverId,
                    paymentStatus: receiverToSender.paymentStatus,
                }
                : { senderId: receiverId, receiverId: senderId, paymentStatus: "pending" }, // ✅ null ki jagah pending
        });
    } catch (err) {
        console.error("❌ Error fetching paymentStatus:", err.message);
        res.status(500).json({ error: "Failed to fetch paymentStatus" });
    }
});


app.post("/addAmountHistory", async (req, res) => {
    const { senderId, receiverId, amount, addedBy, bidId } = req.body; // ✅ bidId added
    try {
        if (!senderId || !receiverId) {
            return res
                .status(400)
                .json({ error: "senderId and receiverId required" });
        }
        if (amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const newEntry = {
            amount: Number(amount),
            addedBy: addedBy || senderId,
            addedAt: new Date(),
            bidId: bidId || null,
        };

        // ✅ bidId available ho toh us bid ka record dhundo
        const findQuery = bidId
            ? { senderId, receiverId, "meta.bidId": bidId }
            : { senderId, receiverId };

        const updated = await Message.findOneAndUpdate(
            findQuery,
            {
                $push: { amountHistory: newEntry },
                $set: {
                    getCurrentAmount: Number(amount),
                    ...(bidId ? { "meta.bidId": bidId } : {}), // ✅ meta.bidId save karo
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        const payload = {
            senderId: updated.senderId,
            receiverId: updated.receiverId,
            getCurrentAmount: updated.getCurrentAmount,
            amountHistory: updated.amountHistory,
            latestEntry: newEntry,
            timestamp: new Date().toISOString(),
        };

        io.to(senderId).emit("amount_history_updated", payload);
        io.to(receiverId).emit("amount_history_updated", payload);

        res.json({ success: true, ...payload });
    } catch (err) {
        console.error("❌ Error adding amount history:", err.message);
        res.status(500).json({ error: "Failed to add amount history" });
    }
});
app.get("/getAmountHistory", async (req, res) => {
    const { senderId, receiverId, bidId } = req.query;

    try {
        if (!senderId || !receiverId) {
            return res.status(400).json({
                error: "senderId and receiverId required",
            });
        }

        // ✅ SAME BID + BOTH USERS
        const query = {
            $or: [
                {
                    senderId: String(senderId),
                    receiverId: String(receiverId),
                },
                {
                    senderId: String(receiverId),
                    receiverId: String(senderId),
                },
            ],
        };

        // ✅ FILTER BY BID
        if (bidId) {
            query["meta.bidId"] = String(bidId);
        }

        // ✅ GET LATEST FIRST
        const messages = await Message.find(query).sort({ createdAt: -1 });

        if (!messages.length) {
            return res.json({
                success: true,
                latestAmount: 0,
                amountHistory: [],
            });
        }

        // ✅ FIND LATEST NEGOTIATED MESSAGE
        const latestNegotiationMessage = messages.find(
            (m) => Number(m.negotiateAmount) > 0,
        );

        // ✅ GET LATEST AMOUNT
        const latestAmount =
            latestNegotiationMessage?.negotiateAmount ||
            latestNegotiationMessage?.getCurrentAmount ||
            0;

        // ✅ MERGE ALL HISTORY
        let allHistory = [];

        messages.forEach((msg) => {
            if (Array.isArray(msg.amountHistory)) {
                allHistory.push(...msg.amountHistory);
            }
        });

        // ✅ SORT HISTORY NEWEST FIRST
        allHistory.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

        return res.json({
            success: true,

            bidId: bidId || null,

            latestAmount,

            latestNegotiation: {
                amount: latestAmount,
                senderId: latestNegotiationMessage?.senderId || null,
                receiverId: latestNegotiationMessage?.receiverId || null,
                activeStatus: latestNegotiationMessage?.activeStatus || "none",

                createdAt: latestNegotiationMessage?.createdAt || null,
            },

            amountHistory: allHistory,
        });
    } catch (err) {
        console.error("❌ Error fetching amount history:", err.message);

        res.status(500).json({
            error: "Failed to fetch amount history",
        });
    }
});
// ✅ DELETE - Poori history clear karo (optional)
app.post("/clearAmountHistory", async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        const updated = await Message.findOneAndUpdate(
            { senderId, receiverId },
            { $set: { amountHistory: [], getCurrentAmount: 0 } },
            { new: true },
        );

        if (!updated) return res.status(404).json({ error: "Record not found" });

        const payload = {
            senderId,
            receiverId,
            amountHistory: [],
            getCurrentAmount: 0,
            timestamp: new Date().toISOString(),
        };

        io.to(senderId).emit("amount_history_cleared", payload);
        io.to(receiverId).emit("amount_history_cleared", payload);

        res.json({ success: true, ...payload });
    } catch (err) {
        console.error("❌ Error clearing amount history:", err.message);
        res.status(500).json({ error: "Failed to clear amount history" });
    }
});


app.get("/getTransactionHistory", async (req, res) => {
    try {
        const { senderId, receiverId, bidId } = req.query;

        console.log("📌 senderId =>", senderId);
        console.log("📌 receiverId =>", receiverId);
        console.log("📌 bidId =>", bidId);

        // ✅ Validation
        if (!senderId || !receiverId || !bidId) {
            return res.status(400).json({
                success: false,
                message: "senderId, receiverId and bidId are required",
            });
        }

        // ✅ Query
        const query = {
            $or: [
                {
                    senderId: String(senderId),
                    receiverId: String(receiverId),
                },
                {
                    senderId: String(receiverId),
                    receiverId: String(senderId),
                },
            ],

            "meta.bidId": String(bidId),
        };

        console.log("📌 Mongo Query =>", JSON.stringify(query, null, 2));

        // ✅ Find messages
        const messages = await Message.find(query).sort({
            createdAt: -1,
        });

        console.log("📌 Total Messages Found =>", messages.length);

        // ✅ No data
        if (!messages.length) {
            return res.status(200).json({
                success: true,
                totalTransactions: 0,
                totalPaidAmount: 0,
                latestAmount: 0,
                latestTransaction: null,
                transactionHistory: [],
            });
        }

        // ✅ Filter transaction messages
        const transactionMessages = messages.filter(
            (msg) =>
                Number(msg.negotiateAmount) > 0 ||
                Number(msg.getCurrentAmount) > 0 ||
                msg.activeStatus === "accept" ||
                msg.paymentStatus === "paid",
        );

        console.log("📌 Transaction Messages =>", transactionMessages.length);

        // ✅ Create history
        const transactionHistory = transactionMessages.map((msg) => {
            const amount =
                Number(msg.negotiateAmount) || Number(msg.getCurrentAmount) || 0;

            return {
                _id: msg._id,

                senderId: msg.senderId,
                receiverId: msg.receiverId,

                text: msg.text || "",

                activeStatus: msg.activeStatus || "pending",

                paymentStatus: msg.paymentStatus || "pending",

                amount,

                negotiateAmount: Number(msg.negotiateAmount) || 0,

                currentAmount: Number(msg.getCurrentAmount) || 0,

                bidId: msg?.meta?.bidId || null,

                jobId: msg?.meta?.jobId || null,

                type: msg.senderId === senderId ? "sent" : "received",

                status: msg.paymentStatus || "pending",

                description: msg.text || "Transaction",

                transactionId: msg.transactionId || `TXN_${msg._id}`,

                paymentMode: msg.paymentMode || "online",

                createdAt: msg.createdAt,
            };
        });

        // ✅ Latest
        const latestTransaction = transactionHistory[0] || null;

        const latestAmount = latestTransaction?.amount || 0;

        // ✅ Total
        const totalPaidAmount = transactionHistory.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0,
        );

        console.log("📌 Total Paid Amount =>", totalPaidAmount);

        // ✅ Response
        return res.status(200).json({
            success: true,

            totalTransactions: transactionHistory.length,

            totalPaidAmount,

            latestAmount,

            latestTransaction,

            transactionHistory,
        });
    } catch (error) {
        console.log("❌ getTransactionHistory error =>", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
// ========== ADD THIS INSIDE io.on('connection', (socket) => { ... }) ==========
// Place this AFTER the existing socket.on('mark_as_read', ...) block and BEFORE socket.on('disconnect', ...)

// ✅ REALTIME DEAL ACCEPTANCE - broadcasts to BOTH sender and receiver

// ========== TEST PUSH NOTIFICATION ENDPOINT ==========
app.post("/api/test-push-notification", async (req, res) => {
    try {
        const { userId = "test-user", title = "Test Notification", body = "This is a test push notification" } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        const result = await sendNotificationToUsers({
            userIds: [String(userId)],
            title,
            body,
            senderId: "system",
            eventType: "test",
            data: { type: "test_notification", timestamp: new Date().toISOString() }
        });

        res.json({
            success: true,
            message: "Test notification sent",
            result
        });
    } catch (err) {
        console.error("❌ Test push error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== HEALTH CHECK ENDPOINT ==========
app.get("/api/health", async (req, res) => {
    try {
        const health = {
            status: "ok",
            timestamp: new Date().toISOString(),
            services: {
                database: "checking...",
                firebase: "checking...",
                socketio: "ok"
            }
        };

        // Check database
        try {
            const User = mongoose.model("User");
            await User.findOne().lean();
            health.services.database = "✅ connected";
        } catch (e) {
            health.services.database = `❌ ${e.message}`;
        }

        // Check Firebase
        try {
            await admin.app().options.credential.getAccessToken();
            health.services.firebase = "✅ credentials valid";
        } catch (e) {
            health.services.firebase = `❌ ${e.message}`;
        }

        // Check Socket.io
        health.services.socketio = req.app.get('io') ? "✅ attached" : "❌ not attached";

        res.json(health);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// ========== FIREBASE DIAGNOSTIC ENDPOINT ==========
app.get("/api/firebase-info", (req, res) => {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        res.json({
            status: "ok",
            firebase: {
                projectId,
                clientEmail,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                message: "These are the Firebase credentials the server is using"
            },
            instructions: {
                problem: "SenderId mismatch - client and server use different Firebase projects",
                solution: [
                    "1. Go to Firebase Console → Project Settings",
                    "2. Copy Project ID from this endpoint (shown above)",
                    "3. Ensure client app's google-services.json has SAME Project ID",
                    "4. Rebuild/reinstall client app",
                    "5. Clear app data and re-register FCM token",
                    "6. Try sending notification again"
                ]
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// ========== CLEAR ALL FCM TOKENS (FOR RESET) ==========
app.delete("/api/fcm-token/clear-all/admin", async (req, res) => {
    try {
        // Optional: Add auth check here
        const result = await mongoose.model("FcmToken").deleteMany({});

        res.json({
            success: true,
            message: "All FCM tokens cleared",
            deletedCount: result.deletedCount,
            instructions: "Users need to re-register their FCM tokens with the correct Firebase project"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

