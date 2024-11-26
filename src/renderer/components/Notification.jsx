import React from "react";
import { TransitionAlerts } from './TransitionAlerts';

export const Notification = ({ notificationMessage, notificationClass, handleAlertClose }) => {
  if (notificationMessage !== "" && notificationMessage) {
    return (
      <TransitionAlerts severity={notificationClass} message={notificationMessage} handleAlertClose={handleAlertClose}/>
    );
  } else return null;
};
