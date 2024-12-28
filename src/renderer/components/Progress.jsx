import React, { useState, useEffect } from "react";
import { Title } from "./Title";
import { AlertDialog } from "./AlertDialog";
import { ProgressIcon } from "./ProgressIcon";
import Button from "@mui/material/Button";
import { Notification } from "./Notification";
import dialUpImage from "/src/assets/images/dial-up-modem.gif";
import doneImage from "/src/assets/images/done.webp";
import superMarioImage from "/src/assets/images/super.mario.1.gif";

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
  const [currentTaskText, setCurrentTaskText] = useState("Sleeping...");
  const [currentTaskImage, setCurrentTaskImage] = useState(null);

  useEffect(() => {
    if (whichState.logingIn) {
      setCurrentTaskText("Logging into X...");
      setCurrentTaskImage(dialUpImage);
    } else if (whichState.loggedIn) {
      setCurrentTaskText("Logged into X ✅");
      setCurrentTaskImage(null);
    }

    if (whichState.scraping) {
      setCurrentTaskText("Scraping bookmarks ⏳");
      setCurrentTaskImage(superMarioImage);
    } else if (whichState.scraped) {
      setCurrentTaskText("Scraped bookmarks ✅");
      setCurrentTaskImage(null);
    }

    if (whichState.loggingOut) {
      setCurrentTaskText("Logging out of X...");
      setCurrentTaskImage(doneImage);
    } else if (whichState.loggedOut) {
      setCurrentTaskText("Logged out of X ✅");
      setCurrentTaskImage(doneImage);
    }
  }, [whichState]);

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
        Current Task:
        <div className="flex flex-col items-center py-8">
          <div id="currentTask">
            {currentTaskText}
            {(whichState.logingIn ||
              whichState.scraping ||
              whichState.loggingOut) && <ProgressIcon />}
          </div>
          <div>
            {currentTaskImage && (
              <img src={currentTaskImage} alt="Connecting..." />
            )}
          </div>
          {/* <div id="scraping" className={scrapingClass}>
            {scrapingText}
            {whichState.scraping && <ProgressIcon />}
          </div>
          <div id="logout" className={logoutClass}>
            {logoutText}
            {whichState.loggingOut && <ProgressIcon />}
          </div> */}
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
