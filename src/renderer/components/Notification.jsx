import React from "react";

export const Notification = ({notificationMessage, notificationClass}) => {
  if (notificationMessage !== "" && notificationMessage) {
    return <div className={notificationClass}>{notificationMessage}</div>;
  } else return null;
};
