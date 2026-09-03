// controllers/bidController.js
import Bid from "../models/BidSchema.js";
import mongoose from "mongoose";
import Location from "../models/locationModel.js";
import Status from "../models/Statusmodel.js";
import { sendNotificationToUsers } from "../services/pushNotificationService.js";
import Statusmodel from "../models/Statusmodel.js";
import FCMToken from "../models/FcmTokenModel.js";
/**
 * Helper: validate recipientDetails shape (basic)
 */
const isValidRecipientDetails = (rd) => {
  if (!rd) return false;
  if (typeof rd !== "object") return false;
  const { name, image, phone } = rd;
  if (!name || typeof name !== "string") return false;
  if (!image || typeof image !== "string") return false;
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone || typeof phone !== "string" || !phoneRegex.test(phone)) return false;
  return true;
};

/**
 * Helper to check if a bid is still valid based on validityOfQuote and submittedAt
 */
const isBidValid = (bid) => {
  if (!bid.submittedAt || !bid.validityOfQuote) return false;

  const submittedDate = new Date(bid.submittedAt);
  const now = new Date();

  let daysToAdd = 0;
  switch (bid.validityOfQuote) {
    case '1 Days':
      daysToAdd = 1;
      break;
    case '2 Days':
      daysToAdd = 2;
      break;
    case '3 Days':
      daysToAdd = 3;
      break;
    default:
      daysToAdd = 1;
  }

  const expiryDate = new Date(submittedDate);
  expiryDate.setDate(submittedDate.getDate() + daysToAdd);
  expiryDate.setHours(23, 59, 59, 999);

  return now <= expiryDate;
};

// 🟢 Create a new bid - FIXED VERSION
// export const createBid = async (req, res) => {
//   try {
//     const {
//       quotation,
//       status,
//       costBreakdown,
//       recipientDetails,
//       validityOfQuote,
//       advancePayment,
//       noteToCustomer,
//       bidderId,
//       userId,  // Added this to handle both cases
//       recipientId,
//       jobId,
//       servicesProvided,
//       locationProvided,
//       image,
//       name,
//       phone,
//       pickup,
//       drop,
//       jobDetails,
//       inventory,
//       serviceDetails,
//       ActiveUserStatus,
//       jobName
//     } = req.body;

//     console.log("📥 Received bid creation request:", {
//       quotation, bidderId, userId, recipientId, jobId
//     });

//     // 🔴 REQUIRED VALIDATIONS
//     if (quotation === undefined || quotation === null || quotation < 0) {
//       return res.status(400).json({
//         message: "Valid quotation is required (minimum 0)",
//         received: quotation
//       });
//     }

//     // Use userId if bidderId is not provided
//     const actualBidderId = bidderId || userId;

//     if (!actualBidderId) {
//       return res.status(400).json({
//         message: "bidderId or userId is required",
//         received: { bidderId, userId }
//       });
//     }

//     if (!recipientId) {
//       return res.status(400).json({
//         message: "recipientId is required",
//         received: recipientId
//       });
//     }

//     if (!jobId) {
//       return res.status(400).json({
//         message: "jobId is required",
//         received: jobId
//       });
//     }

//     // Validate status
//     if (!status || !['Negotiable', 'Non-Negotiable'].includes(status)) {
//       return res.status(400).json({
//         message: "status must be 'Negotiable' or 'Non-Negotiable'",
//         received: status
//       });
//     }

//     // Validate costBreakdown
//     if (!costBreakdown || typeof costBreakdown !== "object") {
//       return res.status(400).json({
//         message: "costBreakdown is required as an object",
//         received: costBreakdown
//       });
//     }

//     if (costBreakdown.totalAmount === undefined || costBreakdown.totalAmount === null || costBreakdown.totalAmount < 0) {
//       return res.status(400).json({
//         message: "costBreakdown.totalAmount is required (minimum 0)",
//         received: costBreakdown?.totalAmount
//       });
//     }

//     // Validate recipientDetails
//     if (!recipientDetails || !isValidRecipientDetails(recipientDetails)) {
//       return res.status(400).json({
//         message: "recipientDetails must include name, image and valid 10-digit phone",
//         received: recipientDetails
//       });
//     }

//     // Validate phone format
//     if (!phone || !/^[0-9]{10}$/.test(phone)) {
//       return res.status(400).json({
//         message: "Phone must be a valid 10-digit number",
//         received: phone
//       });
//     }

//     // Validate name and image
//     if (!name || !image) {
//       return res.status(400).json({
//         message: "Name and image are required",
//         received: { name, image }
//       });
//     }

//     // Validate advancePayment range
//     if (advancePayment < 0 || advancePayment > 100) {
//       return res.status(400).json({
//         message: "advancePayment must be between 0 and 100",
//         received: advancePayment
//       });
//     }

//     // Validate validityOfQuote
//     if (!validityOfQuote || !['7 Days', '10 Days', '1 Month'].includes(validityOfQuote)) {
//       return res.status(400).json({
//         message: "validityOfQuote must be '7 Days', '10 Days' or '1 Month'",
//         received: validityOfQuote
//       });
//     }

//     // Arrays validation
//     if (
//       (servicesProvided && !Array.isArray(servicesProvided)) ||
//       (locationProvided && !Array.isArray(locationProvided))
//     ) {
//       return res.status(400).json({
//         message: "servicesProvided and locationProvided must be arrays",
//         received: { servicesProvided, locationProvided }
//       });
//     }

//     // Inventory validation
//     if (inventory && Array.isArray(inventory)) {
//       for (const [index, item] of inventory.entries()) {
//         if (!item || !item.title) {
//           return res.status(400).json({
//             message: `All inventory items must have a title (item at index ${index})`,
//             received: item
//           });
//         }
//       }
//     }

//     // ✅ CREATE BID with all schema fields
//     const newBid = new Bid({
//       quotation: Number(quotation),
//       status: status || 'Negotiable',

//       // Cost Breakdown
//       costBreakdown: {
//         baseTransport: Number(costBreakdown.baseTransport) || 0,
//         packingCharges: Number(costBreakdown.packingCharges) || 0,
//         loadingUnloadingCharges: Number(costBreakdown.loadingUnloadingCharges) || 0,
//         insuranceCharges: Number(costBreakdown.insuranceCharges) || 0,
//         storageCharges: Number(costBreakdown.storageCharges) || 0,
//         dismantlingCharges: Number(costBreakdown.dismantlingCharges) || 0,
//         otherCharges: Number(costBreakdown.otherCharges) || 0,
//         totalAmount: Number(costBreakdown.totalAmount),
//       },

//       // Recipient Details
//       recipientDetails: {
//         name: recipientDetails.name,
//         image: recipientDetails.image,
//         phone: recipientDetails.phone,
//       },

//       validityOfQuote: validityOfQuote || '7 Days',
//       advancePayment: Number(advancePayment) || 0,
//       noteToCustomer: noteToCustomer || '',

//       // Use actualBidderId (either from bidderId or userId)
//       bidderId: actualBidderId,
//       recipientId: recipientId,
//       jobId: jobId,
//       jobName: jobName || '',
//       activeStatus: 'sent',
//       submittedAt: new Date(), // Explicitly set submittedAt

//       servicesProvided: servicesProvided || [],
//       locationProvided: locationProvided || [],

//       image: image,
//       name: name,
//       phone: phone,

//       pickup: {
//         city: pickup?.city || '',
//         state: pickup?.state || '',
//         pincode: pickup?.pincode || '',
//         location: pickup?.location || '',
//         addressLine1: pickup?.addressLine1 || '',
//         addressLine2: pickup?.addressLine2 || '',
//       },

//       drop: {
//         city: drop?.city || '',
//         state: drop?.state || '',
//         pincode: drop?.pincode || '',
//         location: drop?.location || '',
//         addressLine1: drop?.addressLine1 || '',
//         addressLine2: drop?.addressLine2 || '',
//       },

//       jobDetails: {
//         // ── Core ──────────────────────────────────────────────
//         dateOfPacking: jobDetails?.dateOfPacking || null,
//         propertySize: jobDetails?.propertySize || '',
//         truckSize: jobDetails?.truckSize || '',
//         status: jobDetails?.status || 'Job Posted',
//         progressStep: Number(jobDetails?.progressStep) || 0,

//         // ── Transport ─────────────────────────────────────────
//         transportDescription: jobDetails?.transportDescription || '',
//         distance: jobDetails?.distance || '',
//         goodsType: jobDetails?.goodsType || '',

//         // ── Storage ───────────────────────────────────────────
//         warehouseLocationRequired: jobDetails?.warehouseLocationRequired || '',
//         storageDuration: jobDetails?.storageDuration || '',
//         storageNotes: jobDetails?.storageNotes || '',
//         handoverDate: jobDetails?.handoverDate || null,
//         vacateDate: jobDetails?.vacateDate || null,

//         // ── Packing ───────────────────────────────────────────
//         packingRequired: jobDetails?.packingRequired || 'No',
//         packingDays: Number(jobDetails?.packingDays) || 0,
//         selectedPackingLayers: jobDetails?.selectedPackingLayers || [],
//         selectedPackingPackages: jobDetails?.selectedPackingPackages || [],
//         selectedReturnable: jobDetails?.selectedReturnable || '',

//         // ── Labour / Box ──────────────────────────────────────
//         boxCount: Number(jobDetails?.boxCount) || 0,
//         labourCount: Number(jobDetails?.labourCount) || 0,

//         // ── Custom / Misc ─────────────────────────────────────
//         customServiceDescription: jobDetails?.customServiceDescription || '',
//         additionalCustomNotes: jobDetails?.additionalCustomNotes || '',
//         preferredContactTime: jobDetails?.preferredContactTime || '',
//       },

//       inventory: (inventory || []).map(item => ({
//         title: item.title,
//         subtitle: item.subtitle || '',
//         qty: Number(item.qty) || 1,
//       })),

//       serviceDetails: {
//         packingRequired: serviceDetails?.packingRequired || '',
//         insuranceRequired: serviceDetails?.insuranceRequired || '',
//         storageRequired: serviceDetails?.storageRequired || '',
//         dismantlingRequired: serviceDetails?.dismantlingRequired || '',
//       },

//       ActiveUserStatus: ActiveUserStatus || 'Quote Sent',
//     });

//     console.log("📝 Saving bid to database:", {
//       bidderId: newBid.bidderId,
//       recipientId: newBid.recipientId,
//       jobId: newBid.jobId,
//       quotation: newBid.quotation,
//       totalAmount: newBid.costBreakdown?.totalAmount
//     });

//     const savedBid = await newBid.save();
//     console.log("✅ Bid saved successfully:", savedBid._id);

//     // ✅ Update Status Tracker to 'Bid Received'
//     try {
//       await Status.findOneAndUpdate(
//         { JobId: savedBid.jobId.toString() },
//         { status: "Bid Received" },
//         { upsert: true, new: true }
//       );
//       console.log(`📡 Job Status updated to: Bid Received`);
//     } catch (statusError) {
//       console.error("⚠️ Failed to update status tracker:", statusError.message);
//     }

//     await sendNotificationToUsers({
//       userIds: [String(savedBid.recipientId)],
//       title: "New Bid Received",
//       body: `${savedBid.name || "A mover"} sent a bid on your job${savedBid.jobName ? `: ${savedBid.jobName}` : ""}`,
//       senderId: String(savedBid.bidderId || ""),
//       eventType: "bid_created",
//       data: {
//         type: "bid_created",
//         bidId: savedBid._id.toString(),
//         jobId: String(savedBid.jobId || ""),
//         bidderId: String(savedBid.bidderId || ""),
//         recipientId: String(savedBid.recipientId || ""),
//       },
//       payload: {
//         bid: savedBid.toObject(),
//         senderId: String(savedBid.bidderId || ""),
//         receiverId: String(savedBid.recipientId || ""),
//       },
//     });

//     return res.status(201).json({
//       message: "✅ Bid created successfully",
//       success: true,
//       bidId: savedBid._id,
//       bid: savedBid,
//     });
//   } catch (error) {
//     console.error("❌ Error creating bid:", error);

//     // Handle specific MongoDB errors
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(val => val.message);
//       return res.status(400).json({
//         message: "Validation error",
//         success: false,
//         errors: messages,
//         error: error.message
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(400).json({
//         message: "Duplicate bid found",
//         success: false,
//         error: "A bid already exists for this job by this user"
//       });
//     }

//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };


export const createBid = async (req, res) => {
  try {
    const {
      quotation,
      status,
      costBreakdown,
      recipientDetails,
      validityOfQuote,
      advancePayment,
      noteToCustomer,
      bidderId,
      userId, // Added this to handle both cases
      recipientId,
      jobId,
      servicesProvided,
      locationProvided,
      image,
      name,
      phone,
      pickup,
      drop,
      jobDetails,
      inventory,
      serviceDetails,
      ActiveUserStatus,
      jobName,
      AdvancePaidPayment,
      PendingPayment,
      fullPaymentStatus
    } = req.body;

    console.log("📥 Received bid creation request:", {
      quotation,
      bidderId,
      userId,
      recipientId,
      jobId,
    });

    // 🔴 REQUIRED VALIDATIONS
    if (quotation === undefined || quotation === null || quotation < 0) {
      return res.status(400).json({
        message: "Valid quotation is required (minimum 0)",
        received: quotation,
      });
    }

    // Use userId if bidderId is not provided
    const actualBidderId = bidderId || userId;

    if (!actualBidderId) {
      return res.status(400).json({
        message: "bidderId or userId is required",
        received: { bidderId, userId },
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        message: "recipientId is required",
        received: recipientId,
      });
    }

    if (!jobId) {
      return res.status(400).json({
        message: "jobId is required",
        received: jobId,
      });
    }

    // Validate status
    if (!status || !["Negotiable", "Non-Negotiable"].includes(status)) {
      return res.status(400).json({
        message: "status must be 'Negotiable' or 'Non-Negotiable'",
        received: status,
      });
    }

    // Validate costBreakdown
    if (!costBreakdown || typeof costBreakdown !== "object") {
      return res.status(400).json({
        message: "costBreakdown is required as an object",
        received: costBreakdown,
      });
    }

    if (
      costBreakdown.totalAmount === undefined ||
      costBreakdown.totalAmount === null ||
      costBreakdown.totalAmount < 0
    ) {
      return res.status(400).json({
        message: "costBreakdown.totalAmount is required (minimum 0)",
        received: costBreakdown?.totalAmount,
      });
    }

    // Validate recipientDetails
    if (!recipientDetails || !isValidRecipientDetails(recipientDetails)) {
      return res.status(400).json({
        message:
          "recipientDetails must include name, image and valid 10-digit phone",
        received: recipientDetails,
      });
    }

    // Validate phone format
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone must be a valid 10-digit number",
        received: phone,
      });
    }

    // Validate name and image
    if (!name || !image) {
      return res.status(400).json({
        message: "Name and image are required",
        received: { name, image },
      });
    }

    // Validate advancePayment range
    if (advancePayment < 0 || advancePayment > 100) {
      return res.status(400).json({
        message: "advancePayment must be between 0 and 100",
        received: advancePayment,
      });
    }

    // Validate validityOfQuote
    // if (
    //   !validityOfQuote ||
    //   !["1 Days", "2 Days", "3 Days"].includes(validityOfQuote)
    // ) {
    //   return res.status(400).json({
    //     message: "validityOfQuote must be '1 Days', '2 Days' or '3 Days'",
    //     received: validityOfQuote,
    //   });
    // }
    // Validate validityOfQuote
    if (
      !validityOfQuote ||
      !["1 Day", "2 Days", "3 Days"].includes(validityOfQuote)
    ) {
      return res.status(400).json({
        message: "validityOfQuote must be '1 Day', '2 Days' or '3 Days'",
        received: validityOfQuote,
      });
    }
    // Arrays validation
    if (
      (servicesProvided && !Array.isArray(servicesProvided)) ||
      (locationProvided && !Array.isArray(locationProvided))
    ) {
      return res.status(400).json({
        message: "servicesProvided and locationProvided must be arrays",
        received: { servicesProvided, locationProvided },
      });
    }

    // Inventory validation
    if (inventory && Array.isArray(inventory)) {
      for (const [index, item] of inventory.entries()) {
        if (!item || !item.title) {
          return res.status(400).json({
            message: `All inventory items must have a title (item at index ${index})`,
            received: item,
          });
        }
      }
    }

    // ✅ CREATE BID with all schema fields
    const newBid = new Bid({
      quotation: Number(quotation),
      status: status || "Negotiable",

      // Cost Breakdown
      costBreakdown: {
        baseTransport: Number(costBreakdown.baseTransport) || 0,
        packingCharges: Number(costBreakdown.packingCharges) || 0,
        loadingUnloadingCharges:
          Number(costBreakdown.loadingUnloadingCharges) || 0,
        insuranceCharges: Number(costBreakdown.insuranceCharges) || 0,
        storageCharges: Number(costBreakdown.storageCharges) || 0,
        dismantlingCharges: Number(costBreakdown.dismantlingCharges) || 0,
        otherCharges: Number(costBreakdown.otherCharges) || 0,
        totalAmount: Number(costBreakdown.totalAmount),
      },

      // Recipient Details
      recipientDetails: {
        name: recipientDetails.name,
        image: recipientDetails.image,
        phone: recipientDetails.phone,
      },

      validityOfQuote: validityOfQuote || "1 Days",
      advancePayment: Number(advancePayment) || 0,
      noteToCustomer: noteToCustomer || "",

      // Use actualBidderId (either from bidderId or userId)
      bidderId: actualBidderId,
      recipientId: recipientId,
      jobId: jobId,
      jobName: jobName || "",
      activeStatus: "sent",
      submittedAt: new Date(), // Explicitly set submittedAt

      servicesProvided: servicesProvided || [],
      locationProvided: locationProvided || [],

      image: image,
      name: name,
      phone: phone,

      pickup: {
        city: pickup?.city || "",
        state: pickup?.state || "",
        pincode: pickup?.pincode || "",
        location: pickup?.location || "",
        addressLine1: pickup?.addressLine1 || "",
        addressLine2: pickup?.addressLine2 || "",
      },

      drop: {
        city: drop?.city || "",
        state: drop?.state || "",
        pincode: drop?.pincode || "",
        location: drop?.location || "",
        addressLine1: drop?.addressLine1 || "",
        addressLine2: drop?.addressLine2 || "",
      },

      jobDetails: {
        // ── Core ──────────────────────────────────────────────
        dateOfPacking: jobDetails?.dateOfPacking || null,
        propertySize: jobDetails?.propertySize || "",
        truckSize: jobDetails?.truckSize || "",
        status: jobDetails?.status || "Job Posted",
        progressStep: Number(jobDetails?.progressStep) || 0,

        // ── Transport ─────────────────────────────────────────
        transportDescription: jobDetails?.transportDescription || "",
        distance: jobDetails?.distance || "",
        goodsType: jobDetails?.goodsType || "",

        // ── Storage ───────────────────────────────────────────
        warehouseLocationRequired: jobDetails?.warehouseLocationRequired || "",
        storageDuration: jobDetails?.storageDuration || "",
        storageNotes: jobDetails?.storageNotes || "",
        handoverDate: jobDetails?.handoverDate || null,
        vacateDate: jobDetails?.vacateDate || null,

        // ── Packing ───────────────────────────────────────────
        packingRequired: jobDetails?.packingRequired || "No",
        packingDays: Number(jobDetails?.packingDays) || 0,
        selectedPackingLayers: jobDetails?.selectedPackingLayers || [],
        selectedPackingPackages: jobDetails?.selectedPackingPackages || [],
        selectedReturnable: jobDetails?.selectedReturnable || "",

        // ── Labour / Box ──────────────────────────────────────
        boxCount: Number(jobDetails?.boxCount) || 0,
        labourCount: Number(jobDetails?.labourCount) || 0,

        // ── Custom / Misc ─────────────────────────────────────
        customServiceDescription: jobDetails?.customServiceDescription || "",
        additionalCustomNotes: jobDetails?.additionalCustomNotes || "",
        preferredContactTime: jobDetails?.preferredContactTime || "",
      },

      inventory: (inventory || []).map((item) => ({
        title: item.title,
        subtitle: item.subtitle || "",
        qty: Number(item.qty) || 1,
      })),

      serviceDetails: {
        packingRequired: serviceDetails?.packingRequired || "",
        insuranceRequired: serviceDetails?.insuranceRequired || "",
        storageRequired: serviceDetails?.storageRequired || "",
        dismantlingRequired: serviceDetails?.dismantlingRequired || "",
      },

      ActiveUserStatus: ActiveUserStatus || "Quote Sent",


      AdvancePaidPayment: AdvancePaidPayment,
      PendingPayment: PendingPayment,
      fullPaymentStatus: fullPaymentStatus

    });

    console.log("📝 Saving bid to database:", {
      bidderId: newBid.bidderId,
      recipientId: newBid.recipientId,
      jobId: newBid.jobId,
      quotation: newBid.quotation,
      totalAmount: newBid.costBreakdown?.totalAmount,
    });

    const savedBid = await newBid.save();
    console.log("✅ Bid saved successfully:", savedBid._id);

    // ✅ Update Status Tracker to 'Bid Received'
    try {
      await Status.findOneAndUpdate(
        { JobId: savedBid.jobId.toString() },
        { status: "Bid Received" },
        { upsert: true, new: true },
      );
      console.log(`📡 Job Status updated to: Bid Received`);
    } catch (statusError) {
      console.error("⚠️ Failed to update status tracker:", statusError.message);
    }

    // ───────────────── NOTIFICATION DEBUG ─────────────────

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📨 BID NOTIFICATION START");
    console.log("👤 Recipient ID:", savedBid.recipientId);
    console.log("👤 Bidder ID:", savedBid.bidderId);
    console.log("📦 Job ID:", savedBid.jobId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      const recipientToken = await FCMToken.findOne({
        userId: String(savedBid.recipientId),
      });

      console.log("📱 Recipient Token Record:", recipientToken);

      if (!recipientToken) {
        console.log("❌ NO FCM TOKEN FOUND FOR RECIPIENT USER");
      } else {
        console.log("✅ FCM TOKEN FOUND");
        console.log("🔥 TOKEN:", recipientToken.fcmToken);
      }

      const notificationResult = await sendNotificationToUsers({
        userIds: [String(savedBid.recipientId)],

        title: "New Bid Received",

        body: `${savedBid.name || "A mover"} sent a bid on your job${savedBid.jobName ? `: ${savedBid.jobName}` : ""}`,

        senderId: String(savedBid.bidderId || ""),

        eventType: "bid_created",

        data: {
          type: "bid_created",
          bidId: savedBid._id.toString(),
          jobId: String(savedBid.jobId || ""),
          bidderId: String(savedBid.bidderId || ""),
          recipientId: String(savedBid.recipientId || ""),
        },

        payload: {
          bid: savedBid.toObject(),
          senderId: String(savedBid.bidderId || ""),
          receiverId: String(savedBid.recipientId || ""),
        },
      });

      console.log("✅ NOTIFICATION FUNCTION RESPONSE:");
      console.log(notificationResult);
    } catch (notificationError) {
      console.log("❌ BID NOTIFICATION ERROR");
      console.log(notificationError);
    }

    return res.status(201).json({
      message: "✅ Bid created successfully",
      success: true,
      bidId: savedBid._id,
      bid: savedBid,
    });
  } catch (error) {
    console.error("❌ Error creating bid:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation error",
        success: false,
        errors: messages,
        error: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate bid found",
        success: false,
        error: "A bid already exists for this job by this user",
      });
    }

    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};


// 🟢 Get all bids for a job
// export const getBidsByJob = async (req, res) => {
//   try {
//     const { jobId } = req.params;
//     if (!jobId) {
//       return res.status(400).json({
//         message: "jobId is required",
//         success: false
//       });
//     }

//     const bids = await Bid.find({ jobId }).lean();
//     console.log(`📊 Found ${bids.length} bids for job ${jobId}`);

//     const validBids = bids.filter(isBidValid);

//     return res.status(200).json({
//       message: "Active bids fetched successfully",
//       success: true,
//       count: validBids.length,
//       totalFound: bids.length,
//       validCount: validBids.length,
//       bids: validBids,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching bids:", error);
//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message
//     });
//   }
// };



export const getBidsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({
        message: "jobId is required",
        success: false,
      });
    }

    const bids = await Bid.find({ jobId }).lean(); // ✅ find() use karo
    console.log(`📊 Found ${bids.length} bids for job ${jobId}`);

    const validBids = bids.filter(isBidValid);

    // ─── Rejected Bid Logic ───────────────────────────────────────────────────

    const totalBids = validBids.length;
    const rejectedBids = validBids.filter(
      (bid) => bid.ActiveUserStatus === "Rejected"
    );
    const nonRejectedBids = validBids.filter(
      (bid) => bid.ActiveUserStatus !== "Rejected"
    );

    const allRejected = totalBids > 0 && rejectedBids.length === totalBids;
    const onlyOneAndRejected = totalBids === 1 && rejectedBids.length === 1;

    if (allRejected || onlyOneAndRejected) {
      // ✅ JobId capital — schema ke according
      // ✅ status: "Posted" — enum mein hai, empty string nahi chalega
      await Status.findOneAndUpdate(
        { JobId: jobId },
        {
          $set: {
            status: "Posted",           // 🔄 Reset back to Posted
            updatedAt: new Date(),
          },
        },
        { new: true }
      );
      console.log(`🧹 Status reset to "Posted" for job ${jobId} — all bids rejected`);

      return res.status(200).json({
        message: "All bids rejected. Status reset to Posted.",
        success: true,
        count: validBids.length,
        totalFound: bids.length,
        validCount: validBids.length,
        bids: validBids,
      });
    }

    // Kuch bids reject hain, kuch nahi → sirf non-rejected dikhao
    const bidsToReturn = nonRejectedBids;
    // ─────────────────────────────────────────────────────────────────────────
    // return res.status(200).json({
    //   message: "Active bids fetched successfully",
    //   success: true,
    //   count: bidsToReturn.length,
    //   totalFound: bids.length,
    //   validCount: bidsToReturn.length,
    //   rejectedCount: rejectedBids.length,
    //   bids: bidsToReturn,
    // });

    return res.status(200).json({
      message: "Active bids fetched successfully for job",
      success: true,
      jobId,
      count: validBids.length,
      totalBids: bids.length,
      bids: validBids,
    });
  } catch (error) {
    console.error("❌ Error fetching bids:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};


// 🟢 Get bids placed by a user
// export const getBidsForUser = async (req, res) => {
//   try {
//     const { bidderId, userId } = req.query;

//     // Accept both bidderId and userId parameters
//     const actualBidderId = bidderId || userId;

//     if (!actualBidderId) {
//       return res.status(400).json({
//         message: "bidderId or userId is required",
//         success: false
//       });
//     }

//     const bids = await Bid.find({ bidderId: actualBidderId })
//       .sort({ createdAt: -1 })
//       .lean();

//     console.log(`📊 Found ${bids.length} bids for user ${actualBidderId}`);

//     const validBids = bids.filter(isBidValid);
//     // Match each bid.jobId with Location _id and attach full reschedule details
//     const jobIds = validBids
//       .map((bid) => bid.jobId?.toString())
//       .filter((jobId) => jobId && mongoose.Types.ObjectId.isValid(jobId));

//     let locationMap = new Map();
//     if (jobIds.length > 0) {
//       const locations = await Location.find({ _id: { $in: jobIds } })
//         .select("_id rescheduledate scheduleDate rescheduleStatus")
//         .lean();

//       locationMap = new Map(
//         locations.map((location) => [
//           location._id.toString(),
//           {
//             requestedDate: location.rescheduledate || null,
//             finalDate: location.scheduleDate || null,
//             status: location.rescheduleStatus || "Pending",
//           },
//         ]),
//       );
//     }

//     const bidsWithStatus = validBids.map((bid) => ({
//       ...bid,
//       rescheduleDetails: locationMap.get(bid.jobId?.toString()) || null,
//     }));

//     return res.status(200).json({
//       message: "Active bids fetched successfully",
//       success: true,
//       count: bidsWithStatus.length,
//       totalBids: bids.length,
//       bids: bidsWithStatus,
//     });

//   } catch (error) {
//     console.error("❌ Error fetching user bids:", error);
//     res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message
//     });
//   }
// };


export const getBidsForUser = async (req, res) => {
  try {
    const { bidderId, userId } = req.query;
    // Accept both bidderId and userId parameters
    const actualBidderId = bidderId || userId;
    if (!actualBidderId) {
      return res.status(400).json({
        message: "bidderId or userId is required",
        success: false
      });
    }

    const bids = await Bid.find({ bidderId: actualBidderId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${bids.length} bids for user ${actualBidderId}`);

    const validBids = bids.filter(isBidValid);

    // Match each bid.jobId with Location _id and attach full reschedule details
    const jobIds = validBids
      .map((bid) => bid.jobId?.toString())
      .filter((jobId) => jobId && mongoose.Types.ObjectId.isValid(jobId));

    let locationMap = new Map();
    if (jobIds.length > 0) {
      const locations = await Location.find({
        _id: { $in: jobIds },
        rescheduleUserId: actualBidderId  // Filter by bidderId
      })
        .select("_id rescheduledate scheduleDate rescheduleStatus rescheduleUserId")
        .lean();

      locationMap = new Map(
        locations.map((location) => [
          location._id.toString(),
          {
            requestedDate: location.rescheduledate || null,
            finalDate: location.scheduleDate || null,
            status: location.rescheduleStatus || "Pending",
            rescheduleUserId: location.rescheduleUserId
          },
        ]),
      );
    }

    const bidsWithStatus = validBids.map((bid) => ({
      ...bid,
      rescheduleDetails: locationMap.get(bid.jobId?.toString()) || null,
    }));

    return res.status(200).json({
      message: "Active bids fetched successfully",
      success: true,
      count: bidsWithStatus.length,
      totalBids: bids.length,
      bids: bidsWithStatus
    });

  } catch (error) {
    console.error("❌ Error fetching user bids:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};



// 🟢 Get bids received by a recipient
// export const getBidsByRecipient = async (req, res) => {
//   try {
//     const { recipientId } = req.query;
//     if (!recipientId) {
//       return res.status(400).json({
//         message: "recipientId is required",
//         success: false
//       });
//     }

//     const bids = await Bid.find({ recipientId })
//       .sort({ createdAt: -1 })
//       .lean();

//     console.log(`📊 Found ${bids.length} bids for recipient ${recipientId}`);

//     const validBids = bids.filter(isBidValid);

//     return res.status(200).json({
//       message: "Active bids fetched successfully for recipient",
//       success: true,
//       recipientId,
//       count: validBids.length,
//       totalBids: bids.length,
//       bids: validBids,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching bids by recipientId:", error);
//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message
//     });
//   }
// };


export const getBidsByRecipient = async (req, res) => {
  try {
    const { recipientId } = req.query;

    if (!recipientId) {
      return res.status(400).json({
        message: "recipientId is required",
        success: false,
      });
    }

    const bids = await Bid.find({ recipientId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${bids.length} bids for recipient ${recipientId}`);

    const validBids = bids.filter(isBidValid);

    // ✅ StatusModel ka poora response
    const statusResponse = await Statusmodel.find({
      JobId: {
        $in: validBids
          .map((bid) => bid.jobId?.toString())
          .filter(Boolean),
      },
    }).lean();

    return res.status(200).json({
      message: "Active bids fetched successfully for recipient",
      success: true,
      recipientId,
      count: validBids.length,
      totalBids: bids.length,
      bids: validBids,
      statusResponse, // 👈 Added only this
    });
  } catch (error) {
    console.error("❌ Error fetching bids by recipientId:", error);

    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};


export const updateBidStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { activeStatus, updatedByUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }

    if (!["sent", "accepted", "rejected", "Negotiate"].includes(activeStatus)) {
      return res.status(400).json({
        message: "Invalid activeStatus",
        success: false
      });
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { activeStatus },
      { new: true, runValidators: true }
    );

    if (!updatedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    if (["accepted", "rejected"].includes(activeStatus)) {
      const receiverIds = [String(updatedBid.bidderId), String(updatedBid.recipientId)];
      const statusLabel = activeStatus === "accepted" ? "accepted" : "rejected";

      await sendNotificationToUsers({
        userIds: receiverIds,
        excludeUserIds: updatedByUserId ? [String(updatedByUserId)] : [],
        title: `Bid ${activeStatus === "accepted" ? "Accepted" : "Rejected"}`,
        body: `Your bid has been ${statusLabel}${updatedBid.jobName ? ` for ${updatedBid.jobName}` : ""}`,
        senderId: updatedByUserId ? String(updatedByUserId) : String(updatedBid.recipientId || ""),
        eventType: "bid_status_updated",
        data: {
          type: "bid_status_updated",
          bidId: updatedBid._id.toString(),
          jobId: String(updatedBid.jobId || ""),
          activeStatus: String(activeStatus),
          bidderId: String(updatedBid.bidderId || ""),
          recipientId: String(updatedBid.recipientId || ""),
        },
        payload: {
          bid: updatedBid.toObject(),
          senderId: updatedByUserId ? String(updatedByUserId) : String(updatedBid.recipientId || ""),
          receiverIds,
        },
      });
    }

    return res.status(200).json({
      message: "✅ Bid status updated successfully",
      success: true,
      bid: updatedBid,
    });
  } catch (error) {
    console.error("❌ Error updating bid status:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Get unique job IDs for a recipient
export const getJobIdsByRecipient = async (req, res) => {
  try {
    const { recipientId } = req.query;
    if (!recipientId) {
      return res.status(400).json({
        message: "recipientId is required",
        success: false
      });
    }

    const bids = await Bid.find({ recipientId })
      .select("jobId submittedAt validityOfQuote costBreakdown")
      .lean();

    if (!bids || bids.length === 0) {
      return res.status(404).json({
        message: "No jobs found for this recipient",
        success: false
      });
    }

    const validBids = bids.filter(isBidValid);
    const jobIds = [...new Set(validBids.map((bid) => bid.jobId.toString()))];

    return res.status(200).json({
      success: true,
      recipientId,
      jobIds,
      totalValidJobs: jobIds.length
    });
  } catch (error) {
    console.error("❌ Error fetching job IDs:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Check if a user has placed a bid on a specific job
export const checkUserBidOnJob = async (req, res) => {
  try {
    const { jobId, userId } = req.params;
    if (!jobId || !userId) {
      return res.status(400).json({
        message: "jobId and userId are required",
        success: false,
        status: false,
      });
    }

    const bid = await Bid.findOne({
      jobId: jobId,
      bidderId: userId,
    }).lean();

    if (!bid) {
      return res.status(200).json({
        message: "User has not bid on this job",
        success: true,
        status: false,
        found: false,
        userExists: false,
      });
    }

    const isValid = isBidValid(bid);

    if (isValid) {
      return res.status(200).json({
        message: "User has an active bid on this job",
        success: true,
        status: true,
        found: true,
        userExists: true,
        isValid: true,
        bid,
      });
    } else {
      return res.status(200).json({
        message: "User had a bid but it has expired",
        success: true,
        status: false,
        found: true,
        userExists: true,
        isValid: false,
        bid,
      });
    }
  } catch (error) {
    console.error("❌ Error checking user bid:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
      status: false,
    });
  }
};

// 🟢 Update ActiveUserStatus
// 🟢 Update ActiveUserStatus with proper logging
// 🟢 Update ActiveUserStatus with proper logging
// export const updateActiveUserStatus = async (req, res) => {
//   try {
//     const { bidId } = req.params;
//     const { ActiveUserStatus } = req.body;

//     console.log(`🔄 Received request to update ActiveUserStatus for bid ${bidId}`);
//     console.log(`📤 Request body:`, { ActiveUserStatus });

//     // Validate bidId
//     if (!mongoose.Types.ObjectId.isValid(bidId)) {
//       console.log(`❌ Invalid Bid ID format: ${bidId}`);
//       return res.status(400).json({
//         message: "Invalid Bid ID format",
//         success: false
//       });
//     }

//     // Define allowed statuses
//     const allowedStatuses = [
//       "In Progress",
//       "Quote Sent",
//       "Cancelled",
//       "Completed",
//       "Rejected",
//       "Under Negotiation"
//     ];

//     console.log(`📋 Allowed statuses: ${allowedStatuses.join(', ')}`);
//     console.log(`📝 Received status: ${ActiveUserStatus}`);

//     // Validate ActiveUserStatus
//     if (!ActiveUserStatus || !allowedStatuses.includes(ActiveUserStatus)) {
//       console.log(`❌ Invalid ActiveUserStatus received: ${ActiveUserStatus}`);
//       return res.status(400).json({
//         message: "Invalid ActiveUserStatus. Allowed values: " + allowedStatuses.join(", "),
//         success: false,
//       });
//     }
//     // Find the bid first to get jobId
//     const existingBid = await Bid.findById(bidId);
//     if (!existingBid) {
//       console.log(`❌ Bid not found with ID: ${bidId}`);
//       return res.status(404).json({
//         message: "Bid not found",
//         success: false
//       });
//     }

//     console.log(`📄 Found bid:`, {
//       bidId: existingBid._id,
//       jobId: existingBid.jobId,
//       currentActiveUserStatus: existingBid.ActiveUserStatus,
//       newActiveUserStatus: ActiveUserStatus
//     });

//     // Update Bid's ActiveUserStatus
//     const updatedBid = await Bid.findByIdAndUpdate(
//       bidId,
//       { 
//         ActiveUserStatus,
//         updatedAt: new Date()
//       },
//       { 
//         new: true, 
//         runValidators: true 
//       }
//     );

//     console.log(`✅ Bid updated successfully:`, {
//       bidId: updatedBid._id,
//       newStatus: updatedBid.ActiveUserStatus,
//       updatedAt: updatedBid.updatedAt
//     });

//     // Update Location job status based on ActiveUserStatus
//     let locationUpdateResult = null;

//     // Define mapping between ActiveUserStatus and Location job status
//     const statusMapping = {
//       "In Progress": "In Progress",
//       "Completed": "Completed",
//       "Cancelled": "Posted", // Reset to Posted if cancelled
//       "Rejected": "Posted",   // Reset to Posted if rejected
//       "Under Negotiation": "Under Negotiation"
//     };

//     if (updatedBid.jobId && statusMapping[ActiveUserStatus]) {
//       try {
//         console.log(`🔄 Attempting to update Location status for jobId: ${updatedBid.jobId}`);
//         console.log(`📊 Mapping ActiveUserStatus "${ActiveUserStatus}" to Location status "${statusMapping[ActiveUserStatus]}"`);

//         // Update Location's jobDetails.status
//         locationUpdateResult = await Location.findByIdAndUpdate(
//           updatedBid.jobId,
//           {
//             "jobDetails.status": statusMapping[ActiveUserStatus],
//             updatedAt: new Date(),
//           },
//           { 
//             new: true,
//             runValidators: true 
//           }
//         );

//         if (locationUpdateResult) {
//           console.log(`✅ Location updated successfully:`, {
//             locationId: locationUpdateResult._id,
//             newStatus: locationUpdateResult.jobDetails.status,
//             jobName: locationUpdateResult.jobName
//           });
//         } else {
//           console.log(`⚠️ Location not found with ID: ${updatedBid.jobId}`);
//         }
//       } catch (locationError) {
//         console.error(`❌ Error updating Location:`, {
//           message: locationError.message,
//           stack: locationError.stack
//         });
//         // Don't fail the whole request if Location update fails
//         console.warn("⚠️ Location update failed but bid update was successful");
//       }
//     } else {
//       console.log(`ℹ️ No Location update needed for ActiveUserStatus: ${ActiveUserStatus}`);
//     }

//     // Prepare response
//     const response = {
//       message: "✅ ActiveUserStatus updated successfully",
//       success: true,
//       bid: updatedBid,
//     };

//     // Add location update info if available
//     if (locationUpdateResult) {
//       response.locationUpdate = {
//         success: true,
//         jobId: updatedBid.jobId,
//         newStatus: locationUpdateResult.jobDetails.status,
//         jobName: locationUpdateResult.jobName
//       };
//     }

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error("❌ Error updating ActiveUserStatus:", {
//       message: error.message,
//       stack: error.stack,
//       bidId: req.params.bidId,
//       status: req.body.ActiveUserStatus
//     });

//     return res.status(500).json({
//       message: "Server error while updating ActiveUserStatus",
//       success: false,
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };
















// export const updateActiveUserStatus = async (req, res) => {
//   try {
//     const { bidId } = req.params;
//     const { ActiveUserStatus } = req.body;

//     console.log(
//       `🔄 Received request to update ActiveUserStatus for bid ${bidId}`,
//     );
//     console.log(`📤 Request body:`, { ActiveUserStatus });

//     // Validate bidId
//     if (!mongoose.Types.ObjectId.isValid(bidId)) {
//       console.log(`❌ Invalid Bid ID format: ${bidId}`);
//       return res.status(400).json({
//         message: "Invalid Bid ID format",
//         success: false,
//       });
//     }
//     // Define allowed statuses
//     const allowedStatuses = [
//       "In Progress",
//       "Quote Sent",
//       "Cancelled",
//       "Completed",
//       "Rejected",
//       "Under Negotiation",
//     ];

//     console.log(`📋 Allowed statuses: ${allowedStatuses.join(", ")}`);
//     console.log(`📝 Received status: ${ActiveUserStatus}`);

//     // Validate ActiveUserStatus
//     if (!ActiveUserStatus || !allowedStatuses.includes(ActiveUserStatus)) {
//       console.log(`❌ Invalid ActiveUserStatus received: ${ActiveUserStatus}`);
//       return res.status(400).json({
//         message:
//           "Invalid ActiveUserStatus. Allowed values: " +
//           allowedStatuses.join(", "),
//         success: false,
//       });
//     }
//     // Find the bid first to get jobId
//     const existingBid = await Bid.findById(bidId);
//     if (!existingBid) {
//       console.log(`❌ Bid not found with ID: ${bidId}`);
//       return res.status(404).json({
//         message: "Bid not found",
//         success: false,
//       });
//     }

//     console.log(`📄 Found bid:`, {
//       bidId: existingBid._id,
//       jobId: existingBid.jobId,
//       currentActiveUserStatus: existingBid.ActiveUserStatus,
//       newActiveUserStatus: ActiveUserStatus,
//     });

//     // Update Bid's ActiveUserStatus
//     const updatedBid = await Bid.findByIdAndUpdate(
//       bidId,
//       {
//         ActiveUserStatus,
//         updatedAt: new Date(),
//       },
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     console.log(`✅ Bid updated successfully:`, {
//       bidId: updatedBid._id,
//       newStatus: updatedBid.ActiveUserStatus,
//       updatedAt: updatedBid.updatedAt,
//     });

//     // Update Location job status based on ActiveUserStatus
//     let locationUpdateResult = null;

//     // Define mapping between ActiveUserStatus and Location job status
//     const statusMapping = {
//       "In Progress": "In Progress",
//       Completed: "Completed",
//       Cancelled: "Job Posted", // Reset to Job Posted if cancelled
//       Rejected: null, // Reset to Posted if rejected
//       "Under Negotiation": "Under Negotiation",
//     };

//     // 🔥 User requirement: ActiveUserStatus 'In Progress' -> Status 'Pickup Scheduled'
//     if (ActiveUserStatus === "In Progress") {
//       try {
//         await Status.findOneAndUpdate(
//           { JobId: updatedBid.jobId.toString() },
//           { status: "Pickup Scheduled" },
//           { upsert: true, new: true }
//         );
//         console.log(`📡 Job Tracking changed to: Pickup Scheduled`);
//       } catch (statusError) {
//         console.warn("⚠️ Failed to update status tracker to Pickup Scheduled");
//       }
//     } else if (ActiveUserStatus === "Completed") {
//       try {
//         await Status.findOneAndUpdate(
//           { JobId: updatedBid.jobId.toString() },
//           { status: "Job Completed" },
//           { upsert: true, new: true }
//         );
//       } catch (e) {}
//     }

//     if (
//       updatedBid.jobId &&
//       statusMapping[ActiveUserStatus] &&
//       ActiveUserStatus !== "Rejected"
//     ) {
//       try {
//         console.log(
//           `🔄 Attempting to update Location status for jobId: ${updatedBid.jobId}`,
//         );
//         console.log(
//           `📊 Mapping ActiveUserStatus "${ActiveUserStatus}" to Location status "${statusMapping[ActiveUserStatus]}"`,
//         );

//         // Update Location's jobDetails.status
//         locationUpdateResult = await Location.findByIdAndUpdate(
//           updatedBid.jobId,
//           {
//             "jobDetails.status": statusMapping[ActiveUserStatus],
//             updatedAt: new Date(),
//           },
//           {
//             new: true,
//             runValidators: true,
//           },
//         );

//         if (locationUpdateResult) {
//           console.log(`✅ Location updated successfully:`, {
//             locationId: locationUpdateResult._id,
//             newStatus: locationUpdateResult.jobDetails.status,
//             jobName: locationUpdateResult.jobName,
//           });
//         } else {
//           console.log(`⚠️ Location not found with ID: ${updatedBid.jobId}`);
//         }
//       } catch (locationError) {
//         console.error(`❌ Error updating Location:`, {
//           message: locationError.message,
//           stack: locationError.stack,
//         });
//         // Don't fail the whole request if Location update fails
//         console.warn("⚠️ Location update failed but bid update was successful");
//       }
//     } else {
//       console.log(
//         `ℹ️ No Location update needed for ActiveUserStatus: ${ActiveUserStatus}`,
//       );
//     }

//     // Prepare response
//     const response = {
//       message: "✅ ActiveUserStatus updated successfully",
//       success: true,
//       bid: updatedBid,
//     };

//     // Add location update info if available
//     if (locationUpdateResult) {
//       response.locationUpdate = {
//         success: true,
//         jobId: updatedBid.jobId,
//         newStatus: locationUpdateResult.jobDetails.status,
//         jobName: locationUpdateResult.jobName,
//       };
//     }

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error("❌ Error updating ActiveUserStatus:", {
//       message: error.message,
//       stack: error.stack,
//       bidId: req.params.bidId,
//       status: req.body.ActiveUserStatus,
//     });

//     return res.status(500).json({
//       message: "Server error while updating ActiveUserStatus",
//       success: false,
//       error: error.message,
//       timestamp: new Date().toISOString(),
//     });
//   }
// };



export const updateActiveUserStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { ActiveUserStatus, updatedByUserId } = req.body; // 👈 updatedByUserId bhi lo

    console.log(`🔄 Received request to update ActiveUserStatus for bid ${bidId}`);
    console.log(`📤 Request body:`, { ActiveUserStatus });

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      console.log(`❌ Invalid Bid ID format: ${bidId}`);
      return res.status(400).json({ message: "Invalid Bid ID format", success: false });
    }

    const allowedStatuses = [
      "In Progress", "Quote Sent", "Cancelled",
      "Completed", "Rejected", "Under Negotiation",
    ];

    if (!ActiveUserStatus || !allowedStatuses.includes(ActiveUserStatus)) {
      console.log(`❌ Invalid ActiveUserStatus received: ${ActiveUserStatus}`);
      return res.status(400).json({
        message: "Invalid ActiveUserStatus. Allowed values: " + allowedStatuses.join(", "),
        success: false,
      });
    }

    const existingBid = await Bid.findById(bidId);
    if (!existingBid) {
      return res.status(404).json({ message: "Bid not found", success: false });
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { ActiveUserStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    ); `   `

    console.log(`✅ Bid updated successfully:`, {
      bidId: updatedBid._id,
      newStatus: updatedBid.ActiveUserStatus,
    });

    // ─── Status Tracker Update ────────────────────────────────────────────────
    if (ActiveUserStatus === "In Progress") {
      try {
        await Status.findOneAndUpdate(
          { JobId: updatedBid.jobId.toString() },
          { status: "Pickup Scheduled" },
          { upsert: true, new: true }
        );
        console.log(`📡 Job Tracking changed to: Pickup Scheduled`);
      } catch (e) {
        console.warn("⚠️ Failed to update status tracker to Pickup Scheduled");
      }
    } else if (ActiveUserStatus === "Completed") {
      try {
        await Status.findOneAndUpdate(
          { JobId: updatedBid.jobId.toString() },
          { status: "Job Completed" },
          { upsert: true, new: true }
        );
      } catch (e) { }
    }

    // ─── Location Update ──────────────────────────────────────────────────────
    let locationUpdateResult = null;
    const statusMapping = {
      "In Progress": "In Progress",
      Completed: "Completed",
      Cancelled: "Job Posted",
      Rejected: null,
      "Under Negotiation": "Under Negotiation",
    };

    if (updatedBid.jobId && statusMapping[ActiveUserStatus] && ActiveUserStatus !== "Rejected") {
      try {
        locationUpdateResult = await Location.findByIdAndUpdate(
          updatedBid.jobId,
          { "jobDetails.status": statusMapping[ActiveUserStatus], updatedAt: new Date() },
          { new: true, runValidators: true }
        );
        if (locationUpdateResult) {
          console.log(`✅ Location updated: ${locationUpdateResult.jobDetails.status}`);
        }
      } catch (locationError) {
        console.error(`❌ Error updating Location:`, locationError.message);
      }
    }

    // ─── 🔔 PUSH NOTIFICATIONS ────────────────────────────────────────────────
    const notificationConfig = {
      "In Progress": {
        // Recipient ne accept kiya → Bidder ko batao
        userIds: [String(updatedBid.bidderId)],
        title: "Bid Accepted 🎉",
        body: `Your bid${updatedBid.jobName ? ` for "${updatedBid.jobName}"` : ""} has been accepted! Job is now In Progress.`,
        eventType: "bid_accepted",
      },
      Rejected: {
        // Recipient ne reject kiya → Bidder ko batao
        userIds: [String(updatedBid.bidderId)],
        title: "Bid Rejected ❌",
        body: `Your bid${updatedBid.jobName ? ` for "${updatedBid.jobName}"` : ""} has been rejected.`,
        eventType: "bid_rejected",
      },
      Cancelled: {
        // Job cancel hua → Dono ko batao
        userIds: [String(updatedBid.bidderId), String(updatedBid.recipientId)],
        title: "Job Cancelled 🚫",
        body: `The job${updatedBid.jobName ? ` "${updatedBid.jobName}"` : ""} has been cancelled.`,
        eventType: "job_cancelled",
      },
      Completed: {
        // Job complete hua → Dono ko batao
        userIds: [String(updatedBid.bidderId), String(updatedBid.recipientId)],
        title: "Job Completed ✅",
        body: `The job${updatedBid.jobName ? ` "${updatedBid.jobName}"` : ""} has been marked as completed.`,
        eventType: "job_completed",
      },
      "Under Negotiation": {
        // Negotiation shuru → Bidder ko batao
        userIds: [String(updatedBid.bidderId)],
        title: "Negotiation Started 🤝",
        body: `Your bid${updatedBid.jobName ? ` for "${updatedBid.jobName}"` : ""} is now under negotiation.`,
        eventType: "bid_negotiation",
      },
    };

    const config = notificationConfig[ActiveUserStatus];
    if (config) {
      try {
        const notificationResult = await sendNotificationToUsers({
          userIds: config.userIds,
          excludeUserIds: updatedByUserId ? [String(updatedByUserId)] : [],
          title: config.title,
          body: config.body,
          senderId: updatedByUserId ? String(updatedByUserId) : String(updatedBid.recipientId || ""),
          eventType: config.eventType,
          data: {
            type: config.eventType,
            bidId: updatedBid._id.toString(),
            jobId: String(updatedBid.jobId || ""),
            ActiveUserStatus,
            bidderId: String(updatedBid.bidderId || ""),
            recipientId: String(updatedBid.recipientId || ""),
          },
          payload: {
            bid: updatedBid.toObject(),
            senderId: updatedByUserId ? String(updatedByUserId) : String(updatedBid.recipientId || ""),
          },
        });
        console.log(`🔔 Notification sent for status: ${ActiveUserStatus}`, notificationResult);
      } catch (notifError) {
        console.error(`❌ Notification error for ${ActiveUserStatus}:`, notifError.message);
        // Notification fail hone pe response fail mat karo
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const response = {
      message: "✅ ActiveUserStatus updated successfully",
      success: true,
      bid: updatedBid,
    };

    if (locationUpdateResult) {
      response.locationUpdate = {
        success: true,
        jobId: updatedBid.jobId,
        newStatus: locationUpdateResult.jobDetails.status,
        jobName: locationUpdateResult.jobName,
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error updating ActiveUserStatus:", {
      message: error.message,
      stack: error.stack,
      bidId: req.params.bidId,
      status: req.body.ActiveUserStatus,
    });

    return res.status(500).json({
      message: "Server error while updating ActiveUserStatus",
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};


// 🟢 Update bid status field (Negotiable/Non-Negotiable)
export const updateBidStatusField = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }

    if (!status || !['Negotiable', 'Non-Negotiable'].includes(status)) {
      return res.status(400).json({
        message: "status must be 'Negotiable' or 'Non-Negotiable'",
        success: false
      });
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "✅ Bid status (Negotiable/Non-Negotiable) updated successfully",
      success: true,
      bid: updatedBid,
    });
  } catch (error) {
    console.error("❌ Error updating bid status:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Get ALL bids
export const getAllBids = async (req, res) => {
  try {
    const { includeExpired } = req.query;

    let bids = await Bid.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Found ${bids.length} total bids`);

    if (includeExpired !== 'true') {
      bids = bids.filter(isBidValid);
      console.log(`📊 ${bids.length} active bids after filtering`);
    }

    return res.status(200).json({
      message: `${includeExpired === 'true' ? 'All bids (including expired)' : 'Active bids'} fetched successfully`,
      success: true,
      count: bids.length,
      includeExpired: includeExpired === 'true',
      bids,
    });
  } catch (error) {
    console.error("❌ Error fetching all bids:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Get expired bids specifically
export const getExpiredBids = async (req, res) => {
  try {
    const bids = await Bid.find()
      .sort({ createdAt: -1 })
      .lean();

    const expiredBids = bids.filter((bid) => !isBidValid(bid));

    console.log(`📊 Found ${expiredBids.length} expired bids`);

    return res.status(200).json({
      message: "Expired bids fetched successfully",
      success: true,
      count: expiredBids.length,
      totalBids: bids.length,
      bids: expiredBids,
    });
  } catch (error) {
    console.error("❌ Error fetching expired bids:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Get bid by ID
export const getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }

    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Bid fetched successfully",
      success: true,
      bid,
      isValid: isBidValid(bid.toObject()),
    });
  } catch (error) {
    console.error("❌ Error fetching bid by ID:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Update bid (full update)
export const updateBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }

    // If costBreakdown is being updated, ensure totalAmount exists
    if (updateData.costBreakdown) {
      if (updateData.costBreakdown.totalAmount === undefined || updateData.costBreakdown.totalAmount < 0) {
        return res.status(400).json({
          message: "costBreakdown.totalAmount is required (minimum 0)",
          success: false
        });
      }
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "✅ Bid updated successfully",
      success: true,
      bid: updatedBid,
    });
  } catch (error) {
    console.error("❌ Error updating bid:", error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: "Validation error",
        success: false,
        errors: messages,
      });
    }

    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Delete bid
export const deleteBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }
    const deletedBid = await Bid.findByIdAndDelete(bidId);
    if (!deletedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "✅ Bid deleted successfully",
      success: true,
      bid: deletedBid,
    });
  } catch (error) {
    console.error("❌ Error deleting bid:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};

// 🟢 Update cost breakdown only
export const updateCostBreakdown = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { costBreakdown } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false
      });
    }

    if (!costBreakdown || typeof costBreakdown !== "object") {
      return res.status(400).json({
        message: "costBreakdown is required",
        success: false
      });
    }

    if (costBreakdown.totalAmount === undefined || costBreakdown.totalAmount === null || costBreakdown.totalAmount < 0) {
      return res.status(400).json({
        message: "costBreakdown.totalAmount is required (minimum 0)",
        success: false
      });
    }

    const updatedCostBreakdown = {
      baseTransport: Number(costBreakdown.baseTransport) || 0,
      packingCharges: Number(costBreakdown.packingCharges) || 0,
      loadingUnloadingCharges: Number(costBreakdown.loadingUnloadingCharges) || 0,
      insuranceCharges: Number(costBreakdown.insuranceCharges) || 0,
      storageCharges: Number(costBreakdown.storageCharges) || 0,
      dismantlingCharges: Number(costBreakdown.dismantlingCharges) || 0,
      otherCharges: Number(costBreakdown.otherCharges) || 0,
      totalAmount: Number(costBreakdown.totalAmount),
    };

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { costBreakdown: updatedCostBreakdown },
      { new: true, runValidators: true }
    );

    if (!updatedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "✅ Cost breakdown updated successfully",
      success: true,
      bid: updatedBid,
    });
  } catch (error) {
    console.error("❌ Error updating cost breakdown:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message
    });
  }
};


// // 🟢 Update Payment Fields (AdvancePaidPayment, PendingPayment, fullPayment)
// export const updatePaymentFields = async (req, res) => {
//   try {
//     const { bidId } = req.params;
//     const { AdvancePaidPayment, PendingPayment, fullPayment } = req.body;

//     // Validate bidId
//     if (!mongoose.Types.ObjectId.isValid(bidId)) {
//       return res.status(400).json({
//         message: "Invalid Bid ID format",
//         success: false,
//       });
//     }

//     // At least ek field honi chahiye update ke liye
//     if (
//       AdvancePaidPayment === undefined &&
//       PendingPayment === undefined &&
//       fullPayment === undefined
//     ) {
//       return res.status(400).json({
//         message:
//           "At least one payment field is required: AdvancePaidPayment, PendingPayment, or fullPayment",
//         success: false,
//       });
//     }

//     // Negative values allowed nahi
//     if (
//       (AdvancePaidPayment !== undefined && AdvancePaidPayment < 0) ||
//       (PendingPayment !== undefined && PendingPayment < 0) ||
//       (fullPayment !== undefined && fullPayment < 0)
//     ) {
//       return res.status(400).json({
//         message: "Payment values cannot be negative",
//         success: false,
//       });
//     }

//     // Sirf jo fields aaye hain unhe update karo
//     const updateFields = {};
//     if (AdvancePaidPayment !== undefined)
//       updateFields.AdvancePaidPayment = Number(AdvancePaidPayment);
//     if (PendingPayment !== undefined)
//       updateFields.PendingPayment = Number(PendingPayment);
//     if (fullPayment !== undefined)
//       updateFields.fullPayment = Number(fullPayment);

//     const updatedBid = await Bid.findByIdAndUpdate(
//       bidId,
//       { ...updateFields, updatedAt: new Date() },
//       { new: true, runValidators: true }
//     );

//     if (!updatedBid) {
//       return res.status(404).json({
//         message: "Bid not found",
//         success: false,
//       });
//     }

//     return res.status(200).json({
//       message: "✅ Payment fields updated successfully",
//       success: true,
//       payments: {
//         AdvancePaidPayment: updatedBid.AdvancePaidPayment,
//         PendingPayment: updatedBid.PendingPayment,
//         fullPayment: updatedBid.fullPayment,
//       },
//       bid: updatedBid,
//     });
//   } catch (error) {
//     console.error("❌ Error updating payment fields:", error);
//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message,
//     });
//   }
// };


// // 🟢 Get Payment Fields by BidId
// export const getPaymentFields = async (req, res) => {
//   try {
//     const { bidId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(bidId)) {
//       return res.status(400).json({
//         message: "Invalid Bid ID format",
//         success: false,
//       });
//     }

//     const bid = await Bid.findById(bidId)
//       .select("AdvancePaidPayment PendingPayment fullPayment jobId jobName")
//       .lean();

//     if (!bid) {
//       return res.status(404).json({
//         message: "Bid not found",
//         success: false,
//       });
//     }

//     return res.status(200).json({
//       message: "✅ Payment fields fetched successfully",
//       success: true,
//       bidId: bid._id,
//       jobId: bid.jobId,
//       jobName: bid.jobName || "",
//       payments: {
//         AdvancePaidPayment: bid.AdvancePaidPayment ?? 0,
//         PendingPayment: bid.PendingPayment ?? 0,
//         fullPayment: bid.fullPayment ?? 0,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching payment fields:", error);
//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//       error: error.message,
//     });
//   }
// };




// 🟢 Update Payment Fields (AdvancePaidPayment, PendingPayment, fullPayment, fullPaymentStatus)

export const updatePaymentFields = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { AdvancePaidPayment, PendingPayment, fullPaymentStatus } = req.body;

    // Validate bidId
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false,
      });
    }

    // At least ek field honi chahiye update ke liye
    if (
      AdvancePaidPayment === undefined &&
      PendingPayment === undefined &&
      fullPaymentStatus === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one payment field is required: AdvancePaidPayment, PendingPayment,  or fullPaymentStatus",
        success: false,
      });
    }

    // Negative values allowed nahi
    if (
      (AdvancePaidPayment !== undefined && AdvancePaidPayment < 0) ||
      (PendingPayment !== undefined && PendingPayment < 0)

    ) {
      return res.status(400).json({
        message: "Payment values cannot be negative",
        success: false,
      });
    }

    // fullPaymentStatus enum validate karo
    const validStatuses = ['pending', 'hold', 'paid'];
    if (fullPaymentStatus !== undefined && !validStatuses.includes(fullPaymentStatus)) {
      return res.status(400).json({
        message: `Invalid fullPaymentStatus. Allowed values: ${validStatuses.join(', ')}`,
        success: false,
      });
    }

    // Sirf jo fields aaye hain unhe update karo
    const updateFields = {};
    if (AdvancePaidPayment !== undefined)
      updateFields.AdvancePaidPayment = Number(AdvancePaidPayment);
    if (PendingPayment !== undefined)
      updateFields.PendingPayment = Number(PendingPayment);
    if (fullPaymentStatus !== undefined)
      updateFields.fullPaymentStatus = fullPaymentStatus;

    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { ...updateFields, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedBid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "✅ Payment fields updated successfully",
      success: true,
      payments: {
        AdvancePaidPayment: updatedBid.AdvancePaidPayment,
        PendingPayment: updatedBid.PendingPayment,
        fullPaymentStatus: updatedBid.fullPaymentStatus,
      },
      bid: updatedBid,
    });
  } catch (error) {
    console.error("❌ Error updating payment fields:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};


// 🟢 Get Payment Fields by BidId
export const getPaymentFields = async (req, res) => {
  try {
    const { bidId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({
        message: "Invalid Bid ID format",
        success: false,
      });
    }

    const bid = await Bid.findById(bidId)
      .select("AdvancePaidPayment PendingPayment fullPaymentStatus jobId jobName")
      .lean();

    if (!bid) {
      return res.status(404).json({
        message: "Bid not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "✅ Payment fields fetched successfully",
      success: true,
      bidId: bid._id,
      jobId: bid.jobId,
      jobName: bid.jobName || "",
      payments: {
        AdvancePaidPayment: bid.AdvancePaidPayment ?? 0,
        PendingPayment: bid.PendingPayment ?? 0,
        fullPaymentStatus: bid.fullPaymentStatus ?? 'pending',
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment fields:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};

export default {
  createBid,
  getBidsByJob,
  getBidsForUser,
  getBidsByRecipient,
  updateBidStatus,
  updateBidStatusField,
  getJobIdsByRecipient,
  checkUserBidOnJob,
  updateActiveUserStatus,
  getAllBids,
  getExpiredBids,
  getBidById,
  updateBid,
  deleteBid,
  updateCostBreakdown,
  updatePaymentFields,
  getPaymentFields
};

export const getVendorBidHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    const bids = await Bid.aggregate([
      {
        $match: {
          bidderId: vendorId,
        },
      },

      // Job details
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "jobData",
        },
      },

      {
        $unwind: {
          path: "$jobData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Final response
      {
        $project: {
          _id: 1,
          // ✅ ADD THESE
          senderId: "$bidderId",
          receiverId: "$recipientId",
          bidId: "$_id",
          quotation: 1,
          status: 1,
          activeStatus: 1,
          ActiveUserStatus: 1,
          validityOfQuote: 1,
          advancePayment: 1,
          noteToCustomer: 1,
          createdAt: 1,

          // Vendor
          bidderId: 1,
          vendorName: "$name",
          vendorPhone: "$phone",
          vendorImage: "$image",

          // Customer
          customerName: "$recipientDetails.name",
          customerPhone: "$recipientDetails.phone",

          // Job
          jobId: "$jobData._id",
          jobName: "$jobData.jobName",

          pickup: "$jobData.pickup.city",
          drop: "$jobData.drop.city",

          pickupFullAddress: "$jobData.pickup.location",
          dropFullAddress: "$jobData.drop.location",

          moveType: "$jobData.moveType",

          inventory: "$jobData.inventory",

          jobStatus: "$jobData.jobDetails.status",

          packingRequired: "$jobData.jobDetails.packingRequired",

          dateOfPacking: "$jobData.jobDetails.dateOfPacking",
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    // Stats
    const totalBids = bids.length;

    const totalQuotedAmount = bids.reduce(
      (sum, item) => sum + Number(item.quotation || 0),
      0,
    );

    const acceptedBids = bids.filter(
      (item) => item.status === "Accepted",
    ).length;

    const negotiableBids = bids.filter(
      (item) => item.status === "Negotiable",
    ).length;

    return res.status(200).json({
      success: true,
      totalBids,
      totalQuotedAmount,
      acceptedBids,
      negotiableBids,
      data: bids,
    });
  } catch (error) {
    console.log("getVendorBidHistory error", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
