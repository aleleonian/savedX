import { EventEmitter } from "node:events";

export const mainEmitter = new EventEmitter(); // Export the EventEmitter instance

export function waitForNewReport() {
  return new Promise((resolve) => {
    mainEmitter.once("report-found-tweet", (reportResponse) => {
      resolve(reportResponse);
    });
  });
}

// mainEmitter.once("report-found-tweet", (reportResponse) => {
//   const reportObj = {
//     success: true,
//     data: reportResponse,
//   };
//   resolve(reportObj);
// });
