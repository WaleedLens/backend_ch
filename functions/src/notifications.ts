import * as admin from "firebase-admin";
import {DocumentData, DocumentReference} from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";

/**
* The Notification class handles the notification logic.
*/
class Notification {
  /**
  * handle the threshold logic for the patient.
  * @param {DocumentData} data - The data of the new reading.
  */
  async handleThreshold(data: DocumentData) {
    try {
      logger.info("handleThreshold");
      const deviceId = data.deviceId;
      logger.info("Device ID:", deviceId);

      // Assuming device_id in the patients
      // collection is stored as a reference or
      // as a string matching the device ID
      const patientsRef = admin.firestore().collection("patients");
      const patientQuerySnapshot = await patientsRef
        .where("device_id", "==", deviceId).limit(1).get();

      if (patientQuerySnapshot.empty) {
        logger.error("No patient found for device ID:", deviceId);
        return; // or throw an error,
        // depending on your error handling strategy
      }

      // Since `limit(1)` is used,
      // there should only be one document.
      const patientDoc = patientQuerySnapshot.docs[0];
      const patientId = patientDoc.ref;
      // This is the document ID of the patient
      const patientData = patientDoc.data(); // This is the patient data
      const threshold = patientData.threshold;
      logger.info("Threshold:", threshold.temperature, threshold.heartRate);
      // Perform the threshold logic for temperature
      if (data.temperature > threshold.temperature) {
        // Handle the case when the temperature reading exceeds the threshold
        console.log("Temperature reading exceeds threshold");
      } else {
        // Handle the case when the temperature reading is within the threshold
        await this.createNewNotif(patientData.device_id,
          patientId, "Vital Alert");
        console.log("Temperature reading is within threshold");
      }

      // Perform the threshold logic for heart rate
      if (data.heartRate > threshold.heartRate) {
        // Handle the case when the heart rate reading exceeds the threshold
        console.log("Heart rate reading exnceeds threshold");
      } else {
        // Handle the case when the heart rate reading is within the threshold
        await this.createNewNotif(patientData.device_id,
          patientId, "Vital Alert");
        console.log("Heart rate reading is within threshold");
      }
    } catch (error) {
      logger.error("Error handling threshold logic:", error);
      console.error("Error handling threshold logic:", error);
    }
  }
  /**
  * Get the last three readings for a patient.
  * @param {string} deviceId - The device ID.
  */
  async getRecentPatientReadings(deviceId: string):
  Promise<{ temperature: { x: number, y: number }[],
   heartRate: { x: number, y: number }[] }> {
    try {
      const devicesCollection = admin.firestore().collection("devices");
      const deviceRef = devicesCollection.doc(deviceId);
      const readingsRef = admin.firestore().collection("readings_data");
      const querySnapshot = await readingsRef
        .where("deviceId", "==", deviceRef)
        .orderBy("timestamp", "desc")
        .limit(3)
        .get();
      logger.info("Device ID: ---> ", deviceId);
      logger.info("QUERY --> ", querySnapshot.size);
      const temperatureReadings: { x: number, y: number }[] = [];
      const heartRateReadings: { x: number, y: number }[] = [];

      let x = 0;
      querySnapshot.forEach((doc) => {
        logger.info("X: ", x);
        const readingData = doc.data() as DocumentData;
        const temperature = readingData.temperature;
        const heartRate = readingData.heartRate;

        temperatureReadings.push({x: x, y: Number(temperature)});
        heartRateReadings.push({x: x, y: Number(heartRate)});

        x += 10;
      });

      return {temperature: temperatureReadings, heartRate: heartRateReadings};
    } catch (error) {
      console.error("Error getting last three readings:", error);
      throw error;
    }
  }
  /**
  * create a new notification for the patient.
  * @param {string} deviceId - The device ID.
  * @param {DocumentReference} patientId - The patient ID.
  * @param {string} notificationType - The notification type.
  */
  async createNewNotif(deviceId: string,
    patientId: DocumentReference, notificationType: string) {
    // Create a new notification document in the "notifications" collection
    logger.info("Creating new notification");
    logger.info("Device ID:", deviceId);
    const vitalSignsReadings = await this.getRecentPatientReadings(deviceId);

    const notificationsRef = admin.firestore().collection("notifications");
    const notificationsSnapshot = await notificationsRef.get();
    const id = (notificationsSnapshot.size + 2).toString();
    const newNotification = {
      id: id,
      patient_id: patientId,
      notificationType: notificationType,
      heartRateSpots: vitalSignsReadings.heartRate,
      temperatureSpots: vitalSignsReadings.temperature,
      date: admin.firestore.FieldValue.serverTimestamp(),
    };
    logger.info("ID ---> ", id);
    logger.info("New notification created:", newNotification);
    await notificationsRef.doc("notification "+id).set(newNotification);
  }
}

// Export the Notification class
export const onReadingDataCreated = functions.firestore
  .document("readings_data/{docId}").onCreate(async (snapshot, context) => {
    const notification = new Notification();
    const newReadingData = snapshot.data() as DocumentData;
    await notification.handleThreshold(newReadingData);
    logger.info("Handled new reading in Notification");
  });

export {Notification};
