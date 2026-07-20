const Transaction = require("../models/AllTransaction");

const createTransaction = async ({
    customerId = null,
    vendorId = null,
    bidId = null,
    loadId = null,
    subscriptionId = null,
    amount,
    type,
    paymentStatus = "SUCCESS",
    transactionId,
    razorpayOrderId = null,
    razorpayPaymentId = null,
    razorpaySignature = null,
}) => {

    return await Transaction.create({
        customerId,
        vendorId,
        bidId,
        loadId,
        subscriptionId,
        amount,
        type,
        paymentStatus,
        transactionId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
    });
};

module.exports = {
    createTransaction
};