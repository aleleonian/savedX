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
