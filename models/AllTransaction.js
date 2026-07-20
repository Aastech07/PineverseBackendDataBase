import mongoose from "mongoose";

const AlltransactionSchema = new mongoose.Schema(
{
    customerId: String,
    vendorId: String,

    bidId: {
        type: String,
        default: null,
    },

    loadId: {
        type: String,
        default: null,
    },

    subscriptionId: {
        type: String,
        default: null,
    },

    amount: Number,

    type: {
        type: String,
        enum: ["BID", "ADVANCE", "FINAL", "SUBSCRIPTION"],
    },

    paymentStatus: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING",
    },

    transactionId: {
        type: String,
        required: true,
        unique: true,
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
},
{
    timestamps: true,
});

export default mongoose.model("AllTransaction", AlltransactionSchema);