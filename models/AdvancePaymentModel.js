
import mongoose from "mongoose";

const AdvancePaymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    AdvancePayment: {
      type: Number,
      default: 0,
    },

    BidId: {
      type: String,
      required: true,
    }

  },
  { timestamps: true },
);
const AdvancePayment = mongoose.model("AdvancePayment", AdvancePaymentSchema);

export default AdvancePayment;