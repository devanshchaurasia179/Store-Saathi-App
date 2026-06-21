import admin from "firebase-admin";

// Initialize Firebase Admin SDK once using the service account credentials from env vars.
// Set FIREBASE_SERVICE_ACCOUNT in your .env as a JSON string, or use individual fields.
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
