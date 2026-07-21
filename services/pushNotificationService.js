// import admin from "../utils/firebase.js";
// import FcmToken from "../models/FcmTokenModel.js";
// import PushNotification from "../models/PushNotificationModel.js";
// import UserRoleModel from "../models/UserRoleModel.js";

// const INVALID_TOKEN_ERRORS = new Set([
//   "messaging/invalid-registration-token",
//   "messaging/registration-token-not-registered",
//   "messaging/mismatched-credential",
// ]);

// const toUniqueStrings = (values = []) => {
//   return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
// };

// /** FCM multicast limit per request */
// const FCM_MULTICAST_MAX = 500;

// const buildDataPayload = (data = {}) =>
//   Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

// const createNotificationRecords = async ({
//   receiverIds = [],
//   senderId = null,
//   eventType = "generic",
//   title,
//   body,
//   data = {},
//   payload = {},
//   pushResultMap = {},
// }) => {
//   if (!receiverIds.length) return;

//   const docs = receiverIds.map((receiverId) => {
//     const result = pushResultMap[String(receiverId)] || {};
//     return {
//       receiverId: String(receiverId),
//       senderId: senderId ? String(senderId) : null,
//       eventType: String(eventType),
//       title: String(title || ""),
//       body: String(body || ""),
//       data,
//       payload,
//       pushSent: Boolean(result.pushSent),
//       pushError: result.pushError || "",
//     };
//   });

//   await PushNotification.insertMany(docs);
// };

// const cleanupInvalidTokens = async (invalidTokens = []) => {
//   if (!invalidTokens.length) return;
//   try {
//     await FcmToken.deleteMany({ fcmToken: { $in: invalidTokens } });
//   } catch (error) {
//     console.error("❌ Failed to cleanup invalid FCM tokens:", error.message);
//   }
// };

// const sendToTokens = async ({ tokenDocs, title, body, data = {} }) => {
//   const uniqueDocs = [];
//   const seen = new Set();

//   for (const doc of tokenDocs) {
//     const token = doc?.fcmToken?.trim();
//     if (!token || seen.has(token)) continue;
//     seen.add(token);
//     uniqueDocs.push(doc);
//   }

//   if (!uniqueDocs.length) {
//     return { successCount: 0, failureCount: 0, sentToUsers: [], pushResultMap: {} };
//   }

//   const multicastBase = {
//     notification: { title, body },
//     data: buildDataPayload(data),
//     android: {
//       priority: "high",
//       notification: {
//         sound: "default",
//         channelId: "default",
//       },
//     },
//     apns: { payload: { aps: { sound: "default" } } },
//   };

//   const invalidTokens = [];
//   const pushResultMap = {};
//   let successCount = 0;
//   let failureCount = 0;

//   for (let offset = 0; offset < uniqueDocs.length; offset += FCM_MULTICAST_MAX) {
//     const chunk = uniqueDocs.slice(offset, offset + FCM_MULTICAST_MAX);
//     const response = await admin.messaging().sendEachForMulticast({
//       tokens: chunk.map((doc) => doc.fcmToken),
//       ...multicastBase,
//     });
//     successCount += response.successCount;
//     failureCount += response.failureCount;

//     response.responses.forEach((result, index) => {
//       const userId = String(chunk[index]?.userId || "");
//       if (result.success) {
//         pushResultMap[userId] = { pushSent: true, pushError: "" };
//         return;
//       }
//       const code = result.error?.code;
//       pushResultMap[userId] = {
//         pushSent: false,
//         pushError: result.error?.message || code || "push_failed",
//       };
//       if (code === "app/invalid-credential") {
//         console.error(
//           "❌ Firebase Admin JWT/service account invalid (same check as startup). Generate a new private key in Firebase Console and update utils/serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_* env vars.",
//         );
//       } else if (code === "messaging/mismatched-credential") {
//         console.error(
//           "❌ SenderId Mismatch! FCM token was registered with a DIFFERENT Firebase project than the server is using.",
//         );
//         console.error(
//           "   Fix: Make sure client app and server use the SAME Firebase project",
//         );
//         console.error(
//           "   1. Check client app's google-services.json / GoogleService-Info.plist",
//         );
//         console.error(
//           "   2. Verify it matches server's Firebase Project ID:",
//           process.env.FIREBASE_PROJECT_ID,
//         );
//         console.error("   3. Clear app data and re-register FCM token");
//       } else {
//         console.warn("FCM failure", {
//           userId,
//           code,
//           message: result.error?.message,
//         });
//       }
//       if (INVALID_TOKEN_ERRORS.has(code)) {
//         invalidTokens.push(chunk[index]?.fcmToken);
//       }
//     });
//   }

//   await cleanupInvalidTokens(invalidTokens);

//   return {
//     successCount,
//     failureCount,
//     sentToUsers: toUniqueStrings(uniqueDocs.map((doc) => doc.userId)),
//     pushResultMap,
//   };
// };

// export const sendNotificationToUsers = async ({
//   userIds = [],
//   title,
//   body,
//   data = {},
//   excludeUserIds = [],
//   senderId = null,
//   eventType = "generic",
//   payload = {},
// }) => {
//   try {
//     const excludedIds = toUniqueStrings([
//       ...excludeUserIds,
//       ...(senderId ? [senderId] : []),
//     ]);
//     let targetUserIds = toUniqueStrings(userIds).filter((id) => !excludedIds.includes(id));

//     if (!targetUserIds.length) {
//       console.log("ℹ️ Push skipped: no target users after sender/exclude filtering");
//       return { successCount: 0, failureCount: 0, sentToUsers: [] };
//     }

//     // ✅ Role-based filtering: har sender (vendor ya customer) sirf "vendor" receivers ko notification bheje
//     if (senderId) {
//       const senderRoleDoc = await UserRoleModel.findOne({ userId: String(senderId) });
//       const senderRole = senderRoleDoc?.userRole; // "vendor" or "customer"

//       if (senderRole === "vendor" || senderRole === "customer") {
//         const expectedReceiverRole = "vendor"; // hamesha vendor ko hi notification jaye

//         // Receivers ka role fetch karo
//         const receiverRoleDocs = await UserRoleModel.find({
//           userId: { $in: targetUserIds },
//         }).select("userId userRole").lean();

//         const allowedReceiverIds = new Set(
//           receiverRoleDocs
//             .filter((doc) => doc.userRole === expectedReceiverRole)
//             .map((doc) => String(doc.userId))
//         );

//         targetUserIds = targetUserIds.filter((id) => allowedReceiverIds.has(id));

//         console.log(`ℹ️ Role filter: sender=${senderRole}, expected receivers=${expectedReceiverRole}, matched=${targetUserIds.length}`);

//         if (!targetUserIds.length) {
//           console.log("ℹ️ Push skipped: no receivers with required role after role-based filtering");
//           return { successCount: 0, failureCount: 0, sentToUsers: [] };
//         }
//       }
//     }

//     const tokenDocs = await FcmToken.find({ userId: { $in: targetUserIds } })
//       .select("userId fcmToken")
//       .lean();

//     if (!tokenDocs.length) {
//       console.warn("⚠️ Push skipped: no FCM tokens found for target users", {
//         eventType,
//         senderId,
//         targetUserIds,
//         reason: "Clients haven't registered their FCM tokens. Make sure app calls POST /api/fcm-token on startup",
//       });
//     }

//     const pushResult = await sendToTokens({ tokenDocs, title, body, data });
//     console.log("✅ Push attempt (targeted users)", {
//       eventType,
//       senderId,
//       targetUsers: targetUserIds.length,
//       successCount: pushResult.successCount,
//       failureCount: pushResult.failureCount,
//     });

//     await createNotificationRecords({
//       receiverIds: targetUserIds,
//       senderId,
//       eventType,
//       title,
//       body,
//       data,
//       payload,
//       pushResultMap: pushResult.pushResultMap || {},
//     });
//     return pushResult;
//   } catch (error) {
//     console.error("❌ sendNotificationToUsers error:", error.message);
//     return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
//   }
// };

// export const sendNotificationToAllExcept = async ({
//   excludeUserIds = [],
//   title,
//   body,
//   data = {},
//   senderId = null,
//   eventType = "generic",
//   payload = {},
// }) => {
//   try {
//     const excluded = toUniqueStrings([
//       ...excludeUserIds,
//       ...(senderId ? [senderId] : []),
//     ]);
//     const tokenDocs = await FcmToken.find({
//       userId: excluded.length ? { $nin: excluded } : { $exists: true },
//     })
//       .select("userId fcmToken")
//       .lean();

//     let targetUserIds = toUniqueStrings(tokenDocs.map((doc) => doc.userId));
//     let filteredTokenDocs = tokenDocs;

//     // ✅ Role-based filtering: har sender (vendor ya customer) sirf "vendor" receivers ko notification bheje
//     if (senderId) {
//       const senderRoleDoc = await UserRoleModel.findOne({ userId: String(senderId) });
//       const senderRole = senderRoleDoc?.userRole; // "vendor" or "customer"

//       if (senderRole === "vendor" || senderRole === "customer") {
//         const expectedReceiverRole = "vendor"; // hamesha vendor ko hi notification jaye

//         // Receivers ka role fetch karo
//         const receiverRoleDocs = await UserRoleModel.find({
//           userId: { $in: targetUserIds },
//         }).select("userId userRole").lean();

//         const allowedReceiverIds = new Set(
//           receiverRoleDocs
//             .filter((doc) => doc.userRole === expectedReceiverRole)
//             .map((doc) => String(doc.userId))
//         );

//         targetUserIds = targetUserIds.filter((id) => allowedReceiverIds.has(id));
//         filteredTokenDocs = filteredTokenDocs.filter((doc) => allowedReceiverIds.has(String(doc.userId)));

//         console.log(`ℹ️ Role filter: sender=${senderRole}, expected receivers=${expectedReceiverRole}, matched=${targetUserIds.length}`);

//         if (!targetUserIds.length) {
//           console.log("ℹ️ Push skipped: no receivers with required role after role-based filtering");
//           return { successCount: 0, failureCount: 0, sentToUsers: [] };
//         }
//       }
//     }

//     const pushResult = await sendToTokens({ tokenDocs: filteredTokenDocs, title, body, data });
//     console.log("✅ Push attempt (broadcast)", {
//       eventType,
//       senderId,
//       targetUsers: targetUserIds.length,
//       successCount: pushResult.successCount,
//       failureCount: pushResult.failureCount,
//     });

//     await createNotificationRecords({
//       receiverIds: targetUserIds,
//       senderId,
//       eventType,
//       title,
//       body,
//       data,
//       payload,
//       pushResultMap: pushResult.pushResultMap || {},
//     });

//     return pushResult;
//   } catch (error) {
//     console.error("❌ sendNotificationToAllExcept error:", error.message);
//     return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
//   }
// };

















// Tue 21 jul










import admin from "../utils/firebase.js";
import FcmToken from "../models/FcmTokenModel.js";
import PushNotification from "../models/PushNotificationModel.js";
import UserRoleModel from "../models/UserRoleModel.js";

const INVALID_TOKEN_ERRORS = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/mismatched-credential",
]);

const toUniqueStrings = (values = []) => {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
};

/** FCM multicast limit per request */
const FCM_MULTICAST_MAX = 500;

const buildDataPayload = (data = {}) =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

const createNotificationRecords = async ({
  receiverIds = [],
  senderId = null,
  eventType = "generic",
  title,
  body,
  data = {},
  payload = {},
  pushResultMap = {},
}) => {
  if (!receiverIds.length) return;

  const docs = receiverIds.map((receiverId) => {
    const result = pushResultMap[String(receiverId)] || {};
    return {
      receiverId: String(receiverId),
      senderId: senderId ? String(senderId) : null,
      eventType: String(eventType),
      title: String(title || ""),
      body: String(body || ""),
      data,
      payload,
      pushSent: Boolean(result.pushSent),
      pushError: result.pushError || "",
    };
  });

  await PushNotification.insertMany(docs);
};

const cleanupInvalidTokens = async (invalidTokens = []) => {
  if (!invalidTokens.length) return;
  try {
    await FcmToken.deleteMany({ fcmToken: { $in: invalidTokens } });
  } catch (error) {
    console.error("❌ Failed to cleanup invalid FCM tokens:", error.message);
  }
};

const sendToTokens = async ({ tokenDocs, title, body, data = {} }) => {
  const uniqueDocs = [];
  const seen = new Set();

  for (const doc of tokenDocs) {
    const token = doc?.fcmToken?.trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    uniqueDocs.push(doc);
  }

  if (!uniqueDocs.length) {
    return { successCount: 0, failureCount: 0, sentToUsers: [], pushResultMap: {} };
  }

  const multicastBase = {
    notification: { title, body },
    data: buildDataPayload(data),
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "default",
      },
    },
    apns: { payload: { aps: { sound: "default" } } },
  };

  const invalidTokens = [];
  const pushResultMap = {};
  let successCount = 0;
  let failureCount = 0;

  for (let offset = 0; offset < uniqueDocs.length; offset += FCM_MULTICAST_MAX) {
    const chunk = uniqueDocs.slice(offset, offset + FCM_MULTICAST_MAX);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk.map((doc) => doc.fcmToken),
      ...multicastBase,
    });
    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((result, index) => {
      const userId = String(chunk[index]?.userId || "");
      if (result.success) {
        pushResultMap[userId] = { pushSent: true, pushError: "" };
        return;
      }
      const code = result.error?.code;
      pushResultMap[userId] = {
        pushSent: false,
        pushError: result.error?.message || code || "push_failed",
      };
      if (code === "app/invalid-credential") {
        console.error(
          "❌ Firebase Admin JWT/service account invalid (same check as startup). Generate a new private key in Firebase Console and update utils/serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_* env vars.",
        );
      } else if (code === "messaging/mismatched-credential") {
        console.error(
          "❌ SenderId Mismatch! FCM token was registered with a DIFFERENT Firebase project than the server is using.",
        );
        console.error(
          "   Fix: Make sure client app and server use the SAME Firebase project",
        );
        console.error(
          "   1. Check client app's google-services.json / GoogleService-Info.plist",
        );
        console.error(
          "   2. Verify it matches server's Firebase Project ID:",
          process.env.FIREBASE_PROJECT_ID,
        );
        console.error("   3. Clear app data and re-register FCM token");
      } else {
        console.warn("FCM failure", {
          userId,
          code,
          message: result.error?.message,
        });
      }
      if (INVALID_TOKEN_ERRORS.has(code)) {
        invalidTokens.push(chunk[index]?.fcmToken);
      }
    });
  }

  await cleanupInvalidTokens(invalidTokens);

  return {
    successCount,
    failureCount,
    sentToUsers: toUniqueStrings(uniqueDocs.map((doc) => doc.userId)),
    pushResultMap,
  };
};

export const sendNotificationToUsers = async ({
  userIds = [],
  title,
  body,
  data = {},
  excludeUserIds = [],
  senderId = null,
  eventType = "generic",
  payload = {},
}) => {
  try {
    const excludedIds = toUniqueStrings([
      ...excludeUserIds,
      ...(senderId ? [senderId] : []),
    ]);
    let targetUserIds = toUniqueStrings(userIds).filter((id) => !excludedIds.includes(id));

    if (!targetUserIds.length) {
      console.log("ℹ️ Push skipped: no target users after sender/exclude filtering");
      return { successCount: 0, failureCount: 0, sentToUsers: [] };
    }

    // ✅ Role-based filtering:
    // - "bid_created" event: koi bhi bid kare (vendor ya customer) → sirf job owner (recipient) ko
    //   directly notify karo — koi role check NAHI hoga
    // - Baaki events: sender ke role ke hisaab se opposite role walo ko notify karo
    if (eventType !== "bid_created" && senderId) {
      const senderRoleDoc = await UserRoleModel.findOne({ userId: String(senderId) });
      const senderRole = senderRoleDoc?.userRole; // "vendor" or "customer"

      if (senderRole === "vendor" || senderRole === "customer") {
        // Default: vendor ko notify karo
        const expectedReceiverRole = "vendor";

        // Receivers ka role fetch karo
        const receiverRoleDocs = await UserRoleModel.find({
          userId: { $in: targetUserIds },
        }).select("userId userRole").lean();

        const allowedReceiverIds = new Set(
          receiverRoleDocs
            .filter((doc) => doc.userRole === expectedReceiverRole)
            .map((doc) => String(doc.userId))
        );

        targetUserIds = targetUserIds.filter((id) => allowedReceiverIds.has(id));

        console.log(`ℹ️ Role filter: sender=${senderRole}, eventType=${eventType}, expected receivers=${expectedReceiverRole}, matched=${targetUserIds.length}`);

        if (!targetUserIds.length) {
          console.log("ℹ️ Push skipped: no receivers with required role after role-based filtering");
          return { successCount: 0, failureCount: 0, sentToUsers: [] };
        }
      }
    } else if (eventType === "bid_created") {
      // bid_created: koi bhi bidder ho — directly recipientId ko push karo, role check nahi
      console.log(`ℹ️ bid_created: role filter SKIPPED — direct push to job owner(s): ${targetUserIds.join(", ")}`);
    }

    const tokenDocs = await FcmToken.find({ userId: { $in: targetUserIds } })
      .select("userId fcmToken")
      .lean();

    if (!tokenDocs.length) {
      console.warn("⚠️ Push skipped: no FCM tokens found for target users", {
        eventType,
        senderId,
        targetUserIds,
        reason: "Clients haven't registered their FCM tokens. Make sure app calls POST /api/fcm-token on startup",
      });
    }

    const pushResult = await sendToTokens({ tokenDocs, title, body, data });
    console.log("✅ Push attempt (targeted users)", {
      eventType,
      senderId,
      targetUsers: targetUserIds.length,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
    });

    await createNotificationRecords({
      receiverIds: targetUserIds,
      senderId,
      eventType,
      title,
      body,
      data,
      payload,
      pushResultMap: pushResult.pushResultMap || {},
    });
    return pushResult;
  } catch (error) {
    console.error("❌ sendNotificationToUsers error:", error.message);
    return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
  }
};

export const sendNotificationToAllExcept = async ({
  excludeUserIds = [],
  title,
  body,
  data = {},
  senderId = null,
  eventType = "generic",
  payload = {},
}) => {
  try {
    const excluded = toUniqueStrings([
      ...excludeUserIds,
      ...(senderId ? [senderId] : []),
    ]);
    const tokenDocs = await FcmToken.find({
      userId: excluded.length ? { $nin: excluded } : { $exists: true },
    })
      .select("userId fcmToken")
      .lean();

    let targetUserIds = toUniqueStrings(tokenDocs.map((doc) => doc.userId));
    let filteredTokenDocs = tokenDocs;

    // ✅ Role-based filtering:
    // - "bid_created" event: koi bhi bid kare (vendor ya customer) → job owner ko directly notify karo
    //   — koi role check NAHI hoga
    // - Baaki events: sender ke role ke hisaab se vendor ko notify karo
    if (eventType !== "bid_created" && senderId) {
      const senderRoleDoc = await UserRoleModel.findOne({ userId: String(senderId) });
      const senderRole = senderRoleDoc?.userRole; // "vendor" or "customer"

      if (senderRole === "vendor" || senderRole === "customer") {
        const expectedReceiverRole = "vendor";

        // Receivers ka role fetch karo
        const receiverRoleDocs = await UserRoleModel.find({
          userId: { $in: targetUserIds },
        }).select("userId userRole").lean();

        const allowedReceiverIds = new Set(
          receiverRoleDocs
            .filter((doc) => doc.userRole === expectedReceiverRole)
            .map((doc) => String(doc.userId))
        );

        targetUserIds = targetUserIds.filter((id) => allowedReceiverIds.has(id));
        filteredTokenDocs = filteredTokenDocs.filter((doc) => allowedReceiverIds.has(String(doc.userId)));

        console.log(`ℹ️ Role filter: sender=${senderRole}, eventType=${eventType}, expected receivers=${expectedReceiverRole}, matched=${targetUserIds.length}`);

        if (!targetUserIds.length) {
          console.log("ℹ️ Push skipped: no receivers with required role after role-based filtering");
          return { successCount: 0, failureCount: 0, sentToUsers: [] };
        }
      }
    } else if (eventType === "bid_created") {
      // bid_created: koi bhi bidder ho — directly recipientId ko push karo, role check nahi
      console.log(`ℹ️ bid_created: role filter SKIPPED — direct push to job owner(s): ${targetUserIds.join(", ")}`);
    }

    const pushResult = await sendToTokens({ tokenDocs: filteredTokenDocs, title, body, data });
    console.log("✅ Push attempt (broadcast)", {
      eventType,
      senderId,
      targetUsers: targetUserIds.length,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
    });

    await createNotificationRecords({
      receiverIds: targetUserIds,
      senderId,
      eventType,
      title,
      body,
      data,
      payload,
      pushResultMap: pushResult.pushResultMap || {},
    });

    return pushResult;
  } catch (error) {
    console.error("❌ sendNotificationToAllExcept error:", error.message);
    return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
  }
};



// new file