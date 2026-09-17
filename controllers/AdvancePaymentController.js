import AdvancePayment from "../models/AdvancePaymentModel.js";
import Bid from "../models/BidSchema.js";
import mongoose from "mongoose";

// CREATE Advance Payment
export const createAdvancePayment = async (req, res) => {
  try {
    const { user_id, AdvancePayment: advancePayment, BidId } = req.body;

    // Validation
    if (!user_id || !BidId) {
      return res.status(400).json({
        success: false,
        message: "user_id and BidId are required",
      });
    }

    if (advancePayment === undefined || advancePayment === null) {
      return res.status(400).json({
        success: false,
        message: "AdvancePayment is required",
      });
    }

    if (Number(advancePayment) < 0) {
      return res.status(400).json({
        success: false,
        message: "AdvancePayment cannot be negative",
      });
    }

    const payment = await AdvancePayment.create({
      user_id,
      AdvancePayment: Number(advancePayment),
      BidId,
    });

    return res.status(201).json({
      success: true,
      message: "Advance payment created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create Advance Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create advance payment",
      error: error.message,
    });
  }
};


// GET Advance Payments (supports user_id and BidId filtering, returns matched Bid data)
export const getAdvancePayments = async (req, res) => {
  try {
    const user_id =
      req.params.user_id ||
      req.params.userId ||
      req.query.user_id ||
      req.query.userId;

    const BidId =
      req.params.BidId ||
      req.params.bidId ||
      req.query.BidId ||
      req.query.bidId;

    let filter = {};

    // Optional filters: if user_id or BidId is passed, filter by it; otherwise return all
    if (user_id && user_id.trim()) {
      filter.user_id = user_id.trim();
    }

    if (BidId && BidId.trim()) {
      filter.BidId = BidId.trim();
    }

    // Fetch advance payments
    const payments = await AdvancePayment.find(filter)
      .sort({
        createdAt: -1,
      })
      .lean();

    // Extract unique BidIds to batch fetch matching bids
    const rawBidIds = payments
      .map((p) => p.BidId)
      .filter((id) => id !== null && id !== undefined && String(id).trim() !== "");

    const uniqueBidIds = [...new Set(rawBidIds.map((id) => String(id).trim()))];

    // Separate valid Mongo ObjectIds and string IDs for safe querying
    const objectIds = [];
    uniqueBidIds.forEach((id) => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        objectIds.push(new mongoose.Types.ObjectId(id));
      }
    });

    let bids = [];
    if (uniqueBidIds.length > 0) {
      const orConditions = [];
      if (objectIds.length > 0) {
        orConditions.push({ _id: { $in: objectIds } });
      }
      orConditions.push({ _id: { $in: uniqueBidIds } });

      bids = await Bid.find({ $or: orConditions }).lean();
    }

    // Create lookup map for O(1) matching
    const bidMap = new Map();
    bids.forEach((bid) => {
      if (bid && bid._id) {
        bidMap.set(String(bid._id), bid);
      }
    });

    // Merge matched Bid data into each payment item
    const paymentsWithBidData = payments.map((payment) => {
      const bidIdStr = payment.BidId ? String(payment.BidId).trim() : null;
      const matchedBid = bidIdStr ? (bidMap.get(bidIdStr) || null) : null;

      return {
        ...payment,
        bidId: payment.BidId, // original string ID
        BidId: matchedBid || payment.BidId, // populated Bid object (or original ID if not found)
        bidData: matchedBid, // matched Bid data
        bidDetails: matchedBid, // matched Bid details
        bid: matchedBid, // matched Bid
      };
    });

    return res.status(200).json({
      success: true,
      message:
        paymentsWithBidData.length > 0
          ? "Advance payments fetched successfully"
          : "No advance payments found",
      count: paymentsWithBidData.length,
      data: paymentsWithBidData,
    });
  } catch (error) {
    console.error("Get Advance Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get advance payments",
      error: error.message,
    });
  }
};
