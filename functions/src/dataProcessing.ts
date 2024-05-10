import * as Express from "express";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

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

    if ("acceleration" in request.body) {
      this.createAccelerationData(request);
    } else {
      this.createReadingsData(request);
    }
  }

  /**
  * Handles the request and processes the acceleration data.
  * @param {Express.Request} request - The request object.
  */
  async createAccelerationData(request: Express.Request) {
    const {deviceId, acceleration} = request.body as
      { deviceId: string, acceleration: string };

    // Create a reference to the "devices" collection
    const devicesCollection = admin.firestore().collection("devices");

    try {
      // Check if the device exists
      const deviceDoc = await devicesCollection.doc(deviceId).get();
      if (!deviceDoc.exists) {
        throw new Error("Device not found");
      }

      // Create a new document in the "readings_data" collection
      const readingsCollection = admin.firestore()
        .collection("acceleration_data");
      await readingsCollection.add({
        deviceId: deviceDoc.ref,
        acceleration: await this.getAcceleration(String(acceleration)),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Return success response
      return {success: true};
    } catch (error) {
      // Return error response
      return {success: false, error: "An error occurred"};
    }
  }

  /**
  * Handles the request and processes the data.
  * @param {Express.Request} request - The request object.
  */
  async createReadingsData(request: Express.Request) {
    const {deviceId, temperature, heartRate, location} = request.body as
      {deviceId: string, temperature: string
        , heartRate: string, location: string};

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
        temperature: String(await this.getTemperature(String(temperature))),
        heartRate: String(await this.getHeartRate(String(heartRate))),
        location: String(await this.getLocation(String(location))),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Return success response
      return {success: true};
    } catch (error) {
      // Return error response
      return {success: false, error: "An error occurred"};
    }
  }
  /**
  * get the temperature value from the raw data.
  * @param {string} rawData - The raw data.
  */
  async getTemperature(rawData: string) {
    // Get the temperature value from the raw data
    const regex = /Object = (\d+\.\d+)/;
    const match = rawData.match(regex);
    if (match) {
      const temperature = parseFloat(match[1]);
      logger.log("Temperature:", temperature);
      return temperature;
    } else {
      throw new Error("Unable to extract object temperature from raw data");
    }
  }
  /**
  * get the heart rate value from the raw data.
  * @param {string} rawData - The raw data.
  */
  async getHeartRate(rawData: string) {
    // Get the HeartRate value from the raw data
    const regex = /Avg BPM=(\d+)/;
    const match = rawData.match(regex);
    if (match) {
      const heartRate = parseFloat(match[1]);
      logger.info("HeartRate:", heartRate);
      return heartRate;
    } else {
      throw new Error("Unable to extract BDM HeartRate from raw data");
    }
  }
  /**
  * Get the location value from the raw data.
  * @param {string} rawData - The raw data.
  */
  async getLocation(rawData: string) {
    const regex = /Location: (\d+(\.\d+)?,\d+(\.\d+)?)/;
    const match = rawData.match(regex);
    if (match) {
      logger.info("Location: ", match[1]);
      return match[1];
    } else {
      throw new Error("Unable to extract location from raw data");
    }
  }
  /**
  * get the heart rate value from the raw data.
  * @param {string} rawData - The raw data.
  */
  async getAcceleration(rawData: string) {
    const regex = new RegExp([
      "Acceleration X: (\\-?\\d+(\\.\\d+)?),",
      " Y: (\\-?\\d+(\\.\\d+)?),",
      " Z: (\\-?\\d+(\\.\\d+)?)",
    ].join(""));
    const match = rawData.match(regex);
    if (match) {
      const acceleration = {
        x: match[1],
        y: match[3],
        z: match[5],
      };
      logger.info("Acceleration:", acceleration);
      return acceleration;
    } else {
      throw new Error("Unable to extract acceleration from raw data");
    }
  }
}
export {DataProcessing};
