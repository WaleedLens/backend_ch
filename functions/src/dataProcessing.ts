import * as Express from "express";
import * as admin from "firebase-admin";

/**
 * The DataProcessing class handles the data processing logic.
 */
class DataProcessing {
  /**
  * Handles the request and processes the data.
  * @param {Express.Request} request - The request object.
  */
  async handleRequest(request: Express.Request) {
    // Process the data in the request
    this.createReadingsData(request);
  }
  /**
  * Handles the request and processes the data.
  * @param {Express.Request} request - The request object.
  */
  async createReadingsData(request: Express.Request) {
    const {deviceId, temperature, heartRate} = request.body as
    { deviceId: string, temperature: string, heartRate: string };

    // Create a reference to the "devices" collection
    const devicesCollection = admin.firestore().collection("devices");

    try {
      // Check if the device exists
      const deviceDoc = await devicesCollection.doc(deviceId).get();
      if (!deviceDoc.exists) {
        throw new Error("Device not found");
      }

      // Create a new document in the "readings_data" collection
      const readingsCollection = admin.firestore().collection("readings_data");
      await readingsCollection.add({
        deviceId: deviceDoc.ref,
        temperature: String(temperature),
        heartRate: String(heartRate),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Return success response
      return {success: true};
    } catch (error) {
      // Return error response
      return {success: false, error: "An error occurred"};
    }
  }
}
export {DataProcessing};
