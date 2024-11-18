import React from "react";
import { TransitionAlerts } from './TransitionAlerts';

export const Notification = ({ notificationMessage, notificationClass }) => {
  if (notificationMessage !== "" && notificationMessage) {
    return (
      <TransitionAlerts severity={notificationClass} message={notificationMessage} />
    );
  } else return null;
};
