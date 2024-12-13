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

export const debugLog = (debugValue, ...strings) => {
  const string = strings.join(" "); // Join with space for readability
  if (debugValue) {
    console.log(string);
  }
};
