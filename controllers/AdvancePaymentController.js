import AdvancePayment from "../models/AdvancePaymentModel.js";
import Bid from "../models/BidSchema.js";
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


// GET Advance Payments
export const getAdvancePayments = async (req, res) => {
  try {
    const { user_id, BidId } = req.query;

    let filter = {};

    // Optional filters
    if (user_id) {
      filter.user_id = user_id;
    }

    if (BidId) {
      filter.BidId = BidId;
    }

    const payments = await AdvancePayment.find(filter).sort({
      createdAt: -1,
    });

    // Fetch Bid data for each payment using BidId
    const paymentsWithBidData = await Promise.all(
      payments.map(async (payment) => {
        const paymentObj = payment.toObject();
        if (payment.BidId) {
          const bidData = await Bid.findById(payment.BidId).lean();
          paymentObj.bidData = bidData || null;
        } else {
          paymentObj.bidData = null;
        }
        return paymentObj;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Advance payments fetched successfully",
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