import * as admin from "firebase-admin";

import { serviceAccount } from "../../constants/serviceAccount";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export const db = admin.firestore();
