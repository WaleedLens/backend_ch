import * as admin from "firebase-admin";
import * as Express from "express";
/**
 * Authentication class handles the authentication logic.
 */
class Authentication {
/**
 * The Firestore database instance.
 */
  private db: FirebaseFirestore.Firestore;

  /**
  * Constructs a new instance of the Authentication class.
  */
  constructor() {
    this.db = admin.firestore();
  }
  /**
  * Checks if the request is authenticated.
  * @param {Express.Request} request - The request object.
  */
  async isAuthenticated(request: Express.Request): Promise<boolean> {
    const {deviceId, secretKey} = request.body;
    if (!secretKey || !deviceId) {
      return false;
    }

    const secretKeyDocRef = this.db.collection("keys").doc("secret-key");
    const secretKeyDoc = await secretKeyDocRef.get();

    if (!secretKeyDoc.exists) {
      return false;
    }

    const storedSecretKey = secretKeyDoc.data()?.key;

    if (secretKey !== storedSecretKey) {
      return false;
    }

    const deviceDocRef = this.db.collection("devices").doc(deviceId);
    const deviceDoc = await deviceDocRef.get();

    return deviceDoc.exists;
  }
}

export {Authentication};
