import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {DataProcessing} from "./dataProcessing";
import {Authentication} from "./authentication";
import {onReadingDataCreated} from "./notifications";

// Initialize the Firebase Admin SDK
admin.initializeApp();

export {onReadingDataCreated};

export const main = onRequest((request, response) => {
  logger.info("New incoming request");

  // Check if the request is authenticated.
  const auth = new Authentication();
  auth.isAuthenticated(request).then((isAuthenticated) => {
    if (!isAuthenticated) {
      logger.error("Request is not authenticated");
      response.status(401).send("Unauthorized");
      return;
    }
    logger.info("Request is authenticated");

    // Process the data in the request
    const dataProcessing = new DataProcessing();
    dataProcessing.handleRequest(request).then(() => {
      logger.info("Data processing completed");
      response.status(200).send("Data processing completed");
    }).catch((error) => {
      logger.error("Error processing data:", error);
      response.status(500).send("Internal server error");
    });
  });
});

