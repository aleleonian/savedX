import React, { useState, useEffect } from "react";
import { Title } from "./Title";
import { AlertDialog } from "./AlertDialog";
import { ProgressIcon } from "./ProgressIcon";
import Button from "@mui/material/Button";
import { Notification } from "./Notification";

const addClass = (classList, className) => {
  const classesArray = classList.split(/\s+/);
  classesArray.push(className);
  return classesArray.join(" ");
};
const removeClass = (classList, className) => {
  return classList
    .split(/\s+/)
    .filter((classItem) => classItem !== className)
    .join(" ");
};

export const Progress = ({ whichState }) => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);

  let logginClass = "flex items-center text-gray-400 py-4";
  let loginText = "Log into X.";

  let scrapingClass = "flex items-center text-gray-400 py-4";
  let scrapingText = "Scrape bookmarks.";

  let logoutClass = "flex items-center text-gray-400 py-4";
  let logoutText = "Log out of X.";

  if (whichState.logingIn) {
    logginClass = removeClass(logginClass, "text-gray-400");
    logginClass = addClass(logginClass, "text-blue-500");
    loginText = "Logging into X...";
  } else if (whichState.loggedIn) {
    logginClass = removeClass(logginClass, "text-gray-400");
    logginClass = addClass(logginClass, "text-blue-500");
    loginText = "Logged into X ✅";
  }

  if (whichState.scraping) {
    scrapingClass = removeClass(scrapingClass, "text-gray-400");
    scrapingClass = addClass(scrapingClass, "text-blue-500");
    scrapingText = "Scraping bookmarks ⏳";
  } else if (whichState.scraped) {
    scrapingClass = removeClass(scrapingClass, "text-gray-400");
    scrapingClass = addClass(scrapingClass, "text-blue-500");
    scrapingText = "Scraped bookmarks ✅";
  }

  if (whichState.loggingOut) {
    logoutClass = removeClass(logoutClass, "text-gray-400");
    logoutClass = addClass(logoutClass, "text-blue-500");
    logoutText = "Logging out of X...";
  } else if (whichState.loggedOut) {
    logoutClass = removeClass(logoutClass, "text-gray-400");
    logoutClass = addClass(logoutClass, "text-blue-500");
    logoutText = "Logged out of X ✅";
  }

  const handleAlertClose = () => {
    setNotificationMessage(null);
  };

  function stopScraping() {
    window.savedXApi.stopScraping();
  }
  useEffect(() => {
    // Listen for messages from the preload script
    const notificationEventListener = (event) => {
      if (event.detail) {
        const data = event.detail.split("--");
        setNotificationClass(data[0]);
        setNotificationMessage(data[1]);
      }
    };

    const alertEventListener = (event) => {
      if (event.detail) {
        const alertMessage = event.detail.message;
        const alertTitle = event.detail.title;
        setAlertTitle(alertTitle);
        setAlertMessage(alertMessage);
      }
    };

    window.addEventListener("ALERT", alertEventListener);
    window.addEventListener("NOTIFICATION", notificationEventListener);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("ALERT", alertEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  return (
    <>
      <div className="container mx-auto text-center">
        <Title />
        {alertMessage && (
          <AlertDialog
            title={alertTitle}
            message={alertMessage}
            openFlag={true}
            cleanUp={() => {
              setAlertTitle(null);
              setAlertMessage(null);
            }}
          />
        )}
        {notificationMessage && (
          <Notification
            notificationClass={notificationClass}
            notificationMessage={notificationMessage}
            handleAlertClose={handleAlertClose}
          />
        )}
        📝Todo list:
        <div className="flex flex-col items-center py-8">
          <div id="login" className={logginClass}>
            {loginText}
            {whichState.logingIn && <ProgressIcon />}
          </div>
          <div id="scraping" className={scrapingClass}>
            {scrapingText}
            {whichState.scraping && <ProgressIcon />}
          </div>
          <div id="logout" className={logoutClass}>
            {logoutText}
            {whichState.loggingOut && <ProgressIcon />}
          </div>
        </div>
        <div>
          {/* <button onClick={stopScraping}>Stop the scrape 🛑</button> */}

          <Button autoFocus onClick={stopScraping}>
            Stop the scrape 🛑
          </Button>
        </div>
      </div>
    </>
  );
};
