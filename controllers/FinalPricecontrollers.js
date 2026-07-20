// // controllers/transactionController.js
// import mongoose from "mongoose";
// import Transaction from "../models/FinalPriceModel.js";

// /**
//  * Create a new transaction
//  */
// export const createTransaction = async (req, res) => {
//   try {
//     const { senderId, receiverId, finalPrice, meta, ActiveStatus } = req.body ?? {};

//     if (!senderId || !receiverId || finalPrice === undefined) {
//       return res.status(400).json({ error: "senderId, receiverId and finalPrice are required" });
//     }

//     // Validate numeric finalPrice
//     const priceNum = Number(finalPrice);
//     if (Number.isNaN(priceNum) || priceNum < 0) {
//       return res.status(400).json({ error: "finalPrice must be a non-negative number" });
//     }

//     const tx = new Transaction({
//       senderId,
//       receiverId,
//       finalPrice: priceNum,
//       meta: meta ?? {},
//       ActiveStatus: ActiveStatus ?? undefined,
//     });

//     const saved = await tx.save();
//     return res.status(201).json(saved);
//   } catch (err) {
//     console.error("createTransaction error:", err);
//     if (err.name === "ValidationError") {
//       return res.status(400).json({ error: err.message });
//     }
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// /**
//  * Update a transaction.
//  * Supports:
//  *  - PUT/PATCH /transactions/:id  -> update by id
//  *  - POST /transactions/update with senderId + receiverId in body -> updates latest doc for that pair
//  */
// export const updateTransaction = async (req, res) => {
//   try {
//     const { id } = req.params ?? {};
//     const { senderId, receiverId } = req.body ?? {};

//     // Allowed updatable fields
//     const allowed = ["finalPrice", "meta", "ActiveStatus"];
//     const updates = {};

//     for (const key of allowed) {
//       if (req.body[key] !== undefined) updates[key] = req.body[key];
//     }

//     if (Object.keys(updates).length === 0) {
//       return res.status(400).json({ error: "No updatable fields provided (allowed: finalPrice, meta, ActiveStatus)" });
//     }

//     if (updates.finalPrice !== undefined) {
//       const p = Number(updates.finalPrice);
//       if (Number.isNaN(p) || p < 0) {
//         return res.status(400).json({ error: "finalPrice must be a non-negative number" });
//       }
//       updates.finalPrice = p;
//     }

//     let updated = null;

//     if (id) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ error: "Invalid transaction id" });
//       }
//       updated = await Transaction.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
//     } else {
//       // require senderId + receiverId if id not provided
//       if (!senderId || !receiverId) {
//         return res.status(400).json({ error: "Provide either transaction id (param) OR senderId and receiverId in body" });
//       }

//       // find the most recent transaction for this pair and update it
//       const filter = { senderId, receiverId };
//       const doc = await Transaction.findOne(filter).sort({ createdAt: -1 });
//       if (!doc) {
//         return res.status(404).json({ error: "No transaction found for this senderId + receiverId" });
//       }
//       updated = await Transaction.findByIdAndUpdate(doc._id, updates, { new: true, runValidators: true });
//     }

//     if (!updated) {
//       return res.status(404).json({ error: "Transaction not found" });
//     }

//     return res.json(updated);
//   } catch (err) {
//     console.error("updateTransaction error:", err);
//     if (err.name === "ValidationError") {
//       return res.status(400).json({ error: err.message });
//     }
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };



// /**
//  * List transactions with optional pagination & filters
//  * Query params: page, limit, senderId, receiverId
//  */
// export const listTransactions = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page || "1", 10));
//     const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
//     const skip = (page - 1) * limit;

//     const filter = {};
//     if (req.query.senderId) filter.senderId = req.query.senderId;
//     if (req.query.receiverId) filter.receiverId = req.query.receiverId;

//     const [items, total] = await Promise.all([
//       Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
//       Transaction.countDocuments(filter),
//     ]);

//     return res.json({
//       page,
//       limit,
//       total,
//       pages: Math.ceil(total / limit),
//       items,
//     });
//   } catch (err) {
//     console.error("listTransactions error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// /**
//  * Delete transaction by id
//  */
// export const deleteTransaction = async (req, res) => {
//   try {
//     const { id } = req.params ?? {};
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid transaction id" });
//     }
//     const removed = await Transaction.findByIdAndDelete(id);
//     if (!removed) return res.status(404).json({ error: "Transaction not found" });
//     return res.json({ message: "Transaction deleted", id: removed._id });
//   } catch (err) {
//     console.error("deleteTransaction error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// /**
//  * Get latest finalPrice by senderId + receiverId
//  * Accepts senderId/receiverId in body (POST) or query (GET)
//  */
// // export const getPriceBySenderReceiver = async (req, res) => {
// //   try {
// //     const senderId = req.body?.senderId ?? req.query?.senderId;
// //     const receiverId = req.body?.receiverId ?? req.query?.receiverId;

// //     if (!senderId || !receiverId) {
// //       return res.status(400).json({ error: "senderId and receiverId are required" });
// //     }

// //     // Include meta in projection { finalPrice:1, ActiveStatus:1, meta:1 }
// //     const tx = await Transaction.findOne(
// //       { senderId, receiverId },
// //       { finalPrice: 1, ActiveStatus: 1, meta: 1 }  // <-- META ADDED HERE
// //     ).sort({ createdAt: -1 });

// //     if (!tx) {
// //       return res.status(404).json({ error: "No transaction found for given senderId & receiverId" });
// //     }

// //     return res.json({
// //       senderId,
// //       receiverId,
// //       finalPrice: tx.finalPrice,
// //       ActiveStatus: tx.ActiveStatus ?? "none",
// //       meta: tx.meta ?? {}   // <-- META RETURNED
// //     });
// //   } catch (err) {
// //     console.error("getPriceBySenderReceiver error:", err);
// //     return res.status(500).json({ error: "Internal server error" });
// //   }
// // };



// export const getPriceBySenderReceiver = async (req, res) => {
//   try {
//     const senderId = req.body?.senderId ?? req.query?.senderId;
//     const receiverId = req.body?.receiverId ?? req.query?.receiverId;

//     if (!senderId || !receiverId) {
//       return res.status(400).json({ error: "senderId and receiverId are required" });
//     }

//     // 🔥 Dono directions check karo: A→B ya B→A
//     const tx = await Transaction.findOne(
//       {
//         $or: [
//           { senderId: senderId, receiverId: receiverId },
//           { senderId: receiverId, receiverId: senderId },
//         ],
//       },
//       { finalPrice: 1, ActiveStatus: 1, meta: 1, senderId: 1, receiverId: 1 }
//     ).sort({ createdAt: -1 });

//     if (!tx) {
//       return res.status(404).json({ error: "No transaction found for given senderId & receiverId" });
//     }

//     return res.json({
//       senderId: tx.senderId,       // actual jo DB mein hai
//       receiverId: tx.receiverId,   // actual jo DB mein hai
//       finalPrice: tx.finalPrice,
//       ActiveStatus: tx.ActiveStatus ?? "none",
//       meta: tx.meta ?? {},
//     });
//   } catch (err) {
//     console.error("getPriceBySenderReceiver error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };




// vaibhav code
// controllers/transactionController.js
import mongoose from "mongoose";
import Transaction from "../models/FinalPriceModel.js";

/**
 * Create a new transaction
 */
export const createTransaction = async (req, res) => {
  try {
    const { senderId, receiverId, finalPrice, meta, ActiveStatus, bidId } = req.body ?? {};

    if (!senderId || !receiverId || finalPrice === undefined) {
      return res.status(400).json({ error: "senderId, receiverId and finalPrice are required" });
    }

    const priceNum = Number(finalPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "finalPrice must be a non-negative number" });
    }

    // ✅ Resolve bidId from top-level param OR meta object
    const resolvedBidId = bidId || meta?.bidId || null;

    const tx = new Transaction({
      senderId,
      receiverId,
      finalPrice: priceNum,
      meta: {
        ...(meta ?? {}),
        bidId: resolvedBidId,      // ✅ always persist bidId inside meta
      },
      ActiveStatus: ActiveStatus ?? undefined,
    });

    const saved = await tx.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createTransaction error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a transaction.
 * Supports:
 *  - PUT/PATCH /transactions/:id  -> update by id
 *  - POST /transactions/update with senderId + receiverId in body -> updates latest doc for that pair
 *
 * ✅ Now scoped by bidId when provided — prevents cross-bid contamination
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params ?? {};
    const { senderId, receiverId, bidId, meta } = req.body ?? {};

    // ✅ Resolve bidId from top-level param OR meta object
    const resolvedBidId = bidId || meta?.bidId || null;

    // Allowed updatable fields
    const allowed = ["finalPrice", "meta", "ActiveStatus"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // ✅ Always persist resolvedBidId inside meta when updating
    if (resolvedBidId) {
      updates.meta = {
        ...(updates.meta ?? {}),
        bidId: resolvedBidId,
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updatable fields provided (allowed: finalPrice, meta, ActiveStatus)" });
    }

    if (updates.finalPrice !== undefined) {
      const p = Number(updates.finalPrice);
      if (Number.isNaN(p) || p < 0) {
        return res.status(400).json({ error: "finalPrice must be a non-negative number" });
      }
      updates.finalPrice = p;
    }

    let updated = null;

    if (id) {
      // Update by document _id — most specific, no bidId scoping needed
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid transaction id" });
      }
      updated = await Transaction.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    } else {
      if (!senderId || !receiverId) {
        return res.status(400).json({ error: "Provide either transaction id (param) OR senderId and receiverId in body" });
      }

      // ✅ Scope filter by bidId so we never update a transaction from a different bid
      const filter = { senderId, receiverId };
      if (resolvedBidId) {
        filter["meta.bidId"] = resolvedBidId;
      }

      const doc = await Transaction.findOne(filter).sort({ createdAt: -1 });

      if (!doc) {
        // ✅ No matching transaction for this bid — create a fresh one (upsert)
        const priceNum = updates.finalPrice !== undefined ? Number(updates.finalPrice) : 0;
        const tx = new Transaction({
          senderId,
          receiverId,
          finalPrice: priceNum,
          meta: updates.meta ?? (resolvedBidId ? { bidId: resolvedBidId } : {}),
          ActiveStatus: updates.ActiveStatus ?? undefined,
        });
        updated = await tx.save();
      } else {
        updated = await Transaction.findByIdAndUpdate(doc._id, updates, { new: true, runValidators: true });
      }
    }

    if (!updated) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("updateTransaction error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * List transactions with optional pagination & filters
 * Query params: page, limit, senderId, receiverId, bidId
 */
export const listTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.senderId) filter.senderId = req.query.senderId;
    if (req.query.receiverId) filter.receiverId = req.query.receiverId;
    // ✅ Allow filtering by bidId
    if (req.query.bidId) filter["meta.bidId"] = req.query.bidId;

    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    console.error("listTransactions error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete transaction by id
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params ?? {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid transaction id" });
    }
    const removed = await Transaction.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: "Transaction not found" });
    return res.json({ message: "Transaction deleted", id: removed._id });
  } catch (err) {
    console.error("deleteTransaction error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get latest finalPrice by senderId + receiverId
 * Accepts senderId/receiverId/bidId in body (POST) or query (GET)
 *
 * ✅ KEY FIX: Now scoped by bidId — will NOT return a transaction
 *    from a different bid between the same two users.
 *
 * Example scenario this fixes:
 *   User A posted job1 → User B accepted (transaction saved with bidId="bid1", ActiveStatus="Accept")
 *   User B posts job2 → User A bids → chat opens
 *   WITHOUT this fix: returns bid1's "Accept" status → chat broken immediately
 *   WITH this fix:    bidId="bid2" finds nothing → 404 → fresh chat state ✅
 */
export const getPriceBySenderReceiver = async (req, res) => {
  try {
    const senderId = req.body?.senderId ?? req.query?.senderId;
    const receiverId = req.body?.receiverId ?? req.query?.receiverId;
    const bidId = req.body?.bidId ?? req.query?.bidId ?? null;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "senderId and receiverId are required" });
    }

    // ✅ Base query: check both directions (A→B and B→A)
    const baseQuery = {
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    };

    // ✅ CRITICAL: scope to this specific bid when bidId is provided
    //    This prevents cross-bid contamination when the same two users
    //    have transactions from multiple different bids/jobs
    if (bidId) {
      baseQuery["meta.bidId"] = bidId;
    }

    const tx = await Transaction.findOne(
      baseQuery,
      { finalPrice: 1, ActiveStatus: 1, meta: 1, senderId: 1, receiverId: 1, isFinalQuotation: 1, finalQuotationAmount: 1 }
    ).sort({ createdAt: -1 });

    if (!tx) {
      // ✅ Return 404 — caller (FetchFinalPrice) will treat this as a fresh chat,
      //    NOT fall through to find stale data from another bid
      return res.status(404).json({ error: "No transaction found for given senderId, receiverId & bidId" });
    }

    return res.json({
      senderId: tx.senderId,
      receiverId: tx.receiverId,
      finalPrice: tx.finalPrice,
      ActiveStatus: tx.ActiveStatus ?? "none",
      meta: tx.meta ?? {},
      isFinalQuotation: tx.isFinalQuotation ?? false,
      finalQuotationAmount: tx.finalQuotationAmount ?? null,
    });
  } catch (err) {
    console.error("getPriceBySenderReceiver error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};