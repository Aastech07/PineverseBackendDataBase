// import admin from "firebase-admin";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// function readJsonFile(filePath) {
//   return JSON.parse(fs.readFileSync(filePath, "utf-8"));
// }

// function loadServiceAccount() {
//   const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
//   if (inlineJson) {
//     return JSON.parse(inlineJson);
//   }

//   const pathFromEnv =
//     process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
//     process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

//   if (pathFromEnv) {
//     const resolved = path.isAbsolute(pathFromEnv)
//       ? pathFromEnv
//       : path.resolve(process.cwd(), pathFromEnv);
//     return readJsonFile(resolved);
//   }

//   const bundled = path.join(__dirname, "serviceAccountKey.json");
//   return readJsonFile(bundled);
// }

// let serviceAccount;
// try {
//   serviceAccount = loadServiceAccount();
// } catch (e) {
//   console.error("❌ Firebase service account missing or unreadable:", e.message);
//   throw e;
// }

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     projectId: serviceAccount.project_id,
//   });
// }

// /** Run once at startup — revoked/wrong keys fail here instead of silently breaking every push */
// export async function verifyFirebaseCredentials() {
//   try {
//     await admin.app().options.credential.getAccessToken();
//     console.log("✅ Firebase Admin credentials OK (push notifications enabled)");
//   } catch (e) {
//     console.error("❌ Firebase Admin credentials INVALID — push notifications will NOT work.");
//     console.error("   ", e.message);
//     console.error(
//       "   Fix: Firebase Console → Project settings → Service accounts → Generate new private key → save as utils/serviceAccountKey.json (or set FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT_JSON in .env)",
//     );
//   }
// }

// export default admin;







import admin from "firebase-admin";

function loadServiceAccount() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

const serviceAccount = loadServiceAccount();

if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  throw new Error(
    "❌ Missing Firebase environment variables. Check Render Environment Variables.",
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
  console.log(`📱 Firebase Project: ${serviceAccount.projectId}`);
}

/** Verify credentials on startup */
export async function verifyFirebaseCredentials() {
  try {
    await admin.app().options.credential.getAccessToken();

    console.log(
      "✅ Firebase Admin credentials OK (push notifications enabled)",
    );
  } catch (e) {
    console.error(
      "❌ Firebase Admin credentials INVALID — push notifications will NOT work.",
    );

    console.error("   ", e.message);
    console.error(
      "   Fix: Check these environment variables are set correctly:",
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
    );
    throw new Error("Firebase credentials verification failed. Push notifications disabled.");
  }
}

export default admin;
