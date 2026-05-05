import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;

try {
  serviceAccount = JSON.parse(
    fs.readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
  );
} catch (err) {
  console.error("❌ Firebase key file error:", err.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;