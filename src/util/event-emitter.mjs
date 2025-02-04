import { EventEmitter } from "node:events";

export const mainEmitter = new EventEmitter(); // Export the EventEmitter instance

//TODO: this is not being currently used
export function waitForNewReport() {
  return new Promise((resolve) => {
    mainEmitter.once("report-found-tweet", (reportResponse) => {
      resolve(reportResponse);
    });
  });
}
