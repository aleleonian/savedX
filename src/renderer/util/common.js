export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createErrorResponse = (errorMessage) => {
  let responseObj = {};
  responseObj.success = false;
  responseObj.errorMessage = errorMessage;
  return responseObj;
};

export const createSuccessResponse = (data) => {
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
