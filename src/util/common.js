import * as crypto from 'crypto';

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

export const debugLog = (debugValue, ...strings) => {
  const string = strings.join(" "); // Join with space for readability
  if (debugValue) {
    console.log(string);
  }
};

export function createHash(inputString) {
  const hash = crypto.createHash("md5");
  hash.update(inputString);
  return hash.digest("hex");
}