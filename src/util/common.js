import * as common from "./common";

export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const returnError = (errorMessage) => {
  let responseObj = {};
  responseObj.success = false;
  responseObj.errorMessage = errorMessage;
  return responseObj;
};

export const returnSuccess = (data) => {
  let responseObj = {};
  responseObj.success = true;
  if (data) responseObj.data = data;
  return responseObj;
};

export const generateHash = (data) => {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const debugLog = (...strings) => {
  const string = strings.join(" "); // Join with space
  if (typeof process !== "undefined" && process?.env?.DEBUG) {
    // Check for Node.js environment and DEBUG variable
    console.log(string);
  } else {
    console.log(string); // Default behavior if not in Node.js environment
  }
};
