import React, { useState, useEffect } from "react";
import { Title } from "./Title";
import { AlertDialog } from "./AlertDialog";
import Button from "@mui/material/Button";
import { Notification } from "./Notification";
import { ConfirmationDialog } from "./ConfirmationDialog"; // Adjust the import path based on your folder structure
import dialUpImage from "/src/assets/images/dialup.smaller.gif";
import doneImage from "/src/assets/images/done.resized.webp";
import superMarioImage from "/src/assets/images/super.mario.1.resized.webp";
import whiteNoiseImage from "/src/assets/images/white.noise.resized.webp";

export const Progress = ({ whichState }) => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);
  const [currentTaskText, setCurrentTaskText] = useState("Sleeping...");
  const [currentTaskImage, setCurrentTaskImage] = useState(null);
  const [waitForUserInputDialog, setWaitForUserInputDialog] = useState(false);

  let currentTaskClass = "flex items-center text-gray-400 py-4";

  useEffect(() => {
    if (whichState.logingIn) {
      setCurrentTaskText("Logging into X...");
      setCurrentTaskImage(dialUpImage);
    } else if (whichState.loggedIn) {
      setCurrentTaskText("Logged into X ✅");
      setCurrentTaskImage(whiteNoiseImage);
    }

    if (whichState.scraping) {
      setCurrentTaskText("Scraping bookmarks ⏳");
      setCurrentTaskImage(superMarioImage);
    } else if (whichState.scraped) {
      setCurrentTaskText("Scraped bookmarks ✅");
      setCurrentTaskImage(whiteNoiseImage);
    }

    if (whichState.logingOut) {
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

    const waitForUserInteractionEventListener = (event) => {
      console.log("⚡ Received WAIT_FOR_USER_ACTION event:", event.detail);

      setWaitForUserInputDialog(true);
    };

    //TODO: this is ON HOLD
    const snapshotTakenEventListener = () => {
      console.log("snapshot arrived!");
      setCurrentTaskImage(
        "http://localhost:3000/media/bookmark-screenshot.png"
      );
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
    //TODO: this is ON HOLD
    window.addEventListener("SNAPSHOT_TAKEN", snapshotTakenEventListener);
    window.addEventListener(
      "WAIT_FOR_USER_ACTION",
      waitForUserInteractionEventListener
    );

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("ALERT", alertEventListener);
      window.removeEventListener("SNAPSHOT_TAKEN", snapshotTakenEventListener);
      window.removeEventListener(
        "WAIT_FOR_USER_ACTION",
        waitForUserInteractionEventListener
      );
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  const handleCloseWaitForUserInputDialog = () => {
    setWaitForUserInputDialog(false);
  };

  const handleConfirmWaitForUserInputDialog = async () => {
    // gota now ping the main process
    console.log("@ handleConfirmWaitForUserInputDialog");
    window.savedXApi.xbotContinue();
    // then close the dialog
    handleCloseWaitForUserInputDialog();
  };


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

        {waitForUserInputDialog && (
          <AlertDialog
            openFlag={waitForUserInputDialog}
            title="Bro, the browser needs you."
            message="Please solve the captcha or do whatever the browser is requiring you to do and when you're done, click the 'OK' button below. Thanks."
            cleanUp={() => {
              setAlertTitle(null);
              setAlertMessage(null);
              handleConfirmWaitForUserInputDialog();
            }}
          />
        )}

        <div className="flex flex-col items-center py-8">
          <div id="currentTask" className={currentTaskClass}>
            Current Task: {currentTaskText}
            {/* {(whichState.logingIn ||
              whichState.scraping ||
              whichState.logingOut) && <ProgressIcon />} */}
          </div>
          <div>{currentTaskImage && <img src={currentTaskImage} alt="" />}</div>
          {/* <div id="scraping" className={scrapingClass}>
            {scrapingText}
            {whichState.scraping && <ProgressIcon />}
          </div>
          <div id="logout" className={logoutClass}>
            {logoutText}
            {whichState.logingOut && <ProgressIcon />}
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
