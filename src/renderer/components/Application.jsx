import React, { useState, useEffect, useContext } from "react";
import { Notification } from "./Notification";
import { AlertDialog } from "./AlertDialog";
import { ConfigDialog } from "./ConfigDialog";
import TweetsTable from "./TweetsTable";
import { Title } from "./Title";
import * as constants from "../../util/constants";
import { Progress } from "./Progress";
import { AppContext } from "../../context/AppContext";

export const Application = () => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [notificationClass, setNotificationClass] = useState(null);
  const [progressState, setProgressState] = useState({
    active: false,
    logingIn: false,
    loggedIn: false,
    scraping: false,
    scraped: false,
    loggingOut: false,
    loggedOut: false,
  });
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [configData, setConfigData] = useState(null);
  const { state, updateState } = useContext(AppContext);
  const [debugValue, setDebugValue] = useState(null);

  const setTweetsData = (savedTweetsArray) => {
    updateState("savedTweets", savedTweetsArray);
  };
  const setTags = (tagsArray) => {
    updateState("tags", tagsArray);
  };

  // const [tweetsData, setTweetsData] = useState(
  //   // JSON.parse(localStorage.getItem("tweetsData")) || null
  //   null
  // );

  // const [tags, setTags] = useState(
  //   // JSON.parse(localStorage.getItem("tags")) || null
  //   null
  // );

  useEffect(() => {
    // Wait for savedXApi.DEBUG to be set
    const interval = setInterval(() => {
      if (window.savedXApi && window.savedXApi.DEBUG !== undefined) {
        debugger;
        setDebugValue(window.savedXApi.DEBUG);
        clearInterval(interval);
      }
    }, 100); // Check every 100ms until the value is set

    return () => clearInterval(interval);
  }, []);

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
        const data = event.detail;
        setAlertMessage(data);
      }
    };

    const progressEventListener = (event) => {
      const progressStages = event.detail.progressStages;
      const data = event.detail.data ? event.detail.data : null;

      setProgressState((prev) => {
        const newShowProgress = { ...prev };
        if (data) newShowProgress.data = data;

        if (progressStages === constants.progress.INIT_PROGRESS) {
          newShowProgress.active = true;
        }
        if (progressStages === constants.progress.HIDE_PROGRESS) {
          newShowProgress.active = false;
          newShowProgress.logingIn = false;
          newShowProgress.loggedIn = false;
          newShowProgress.scraping = false;
          newShowProgress.scraped = false;
          newShowProgress.loggingOut = false;
          newShowProgress.loggedOut = false;
        }
        if (progressStages & constants.progress.LOGGING_IN) {
          newShowProgress.logingIn = true;
        }
        if (progressStages & constants.progress.LOGGED_IN) {
          newShowProgress.logingIn = false;
          newShowProgress.loggedIn = true;
        }
        if (progressStages & constants.progress.SCRAPING) {
          newShowProgress.scraping = true;
        }
        if (progressStages & constants.progress.SCRAPED) {
          newShowProgress.scraping = false;
          newShowProgress.scraped = true;
        }
        if (progressStages & constants.progress.LOGGING_OUT) {
          newShowProgress.loggingOut = true;
        }
        if (progressStages & constants.progress.LOGGED_OUT) {
          newShowProgress.loggingOut = false;
          newShowProgress.loggedOut = true;
        }

        return newShowProgress;
      });
    };

    const disableGoFetchButtonEventListener = (event) => {
      setIsDisabled(true);
    };

    const showConfigDialogEventListener = (event) => {
      const configData = event.detail;
      if (configData) {
        setConfigData(configData);
      }
      setOpenConfigDialog(true);
    };

    const contentEventListener = (event) => {
      if (event.detail.tweets) setTweetsData(event.detail.tweets);
      if (event.detail.tags) setTags(event.detail.tags);
    };
    window.addEventListener("NOTIFICATION", notificationEventListener);
    window.addEventListener("ALERT", alertEventListener);
    window.addEventListener("CONTENT", contentEventListener);
    window.addEventListener("SHOW_PROGRESS", progressEventListener);
    window.addEventListener(
      "DISABLE_GO_FETCH_BUTTON",
      disableGoFetchButtonEventListener
    );
    window.addEventListener(
      "SHOW_CONFIG_DIALOG",
      showConfigDialogEventListener
    );

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("ALERT", alertEventListener);
      window.removeEventListener("CONTENT", contentEventListener);
      window.removeEventListener("SHOW_PROGRESS", progressEventListener);
      window.removeEventListener(
        "DISABLE_GO_FETCH_BUTTON",
        disableGoFetchButtonEventListener
      );
      window.removeEventListener(
        "SHOW_CONFIG_DIALOG",
        showConfigDialogEventListener
      );
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  function goFetchTweets() {
    window.savedXApi.goFetchTweets();
  }

  const handleClose = () => {
    setOpenConfigDialog(false);
  };

  const handleAlertClose = () => {
    setNotificationMessage(null);
  };

  const displayTweetsData = (tweetsArray, tags) => {
    return (
      <div>
        <TweetsTable />
      </div>
    );
  };

  if (progressState.active) {
    return (
      <>
        <Progress state={progressState} />
      </>
    );
  }
  return (
    <section className="home">
      <Title />

      {alertMessage && (
        <AlertDialog
          title={"Ouch!"}
          message={alertMessage}
          openFlag={true}
          cleanUp={() => setAlertMessage(null)}
        />
      )}

      {notificationMessage && (
        <Notification
          notificationClass={notificationClass}
          notificationMessage={notificationMessage}
          handleAlertClose={handleAlertClose}
        />
      )}

      {openConfigDialog && (
        <ConfigDialog
          open={openConfigDialog}
          onClose={handleClose}
          configData={configData}
        />
      )}

      <div className="text-center">
        {!progressState.active &&
          state.savedTweets &&
          state.savedTweets.length > 0
          ? displayTweetsData(state.savedTweets, state.tags)
          : "There's nothing to show, bro 😣"}
        <div className="text-center my-4">
          <button
            className="btn btn-blue"
            disabled={isDisabled}
            onClick={goFetchTweets}
          >
            Go fetch tweets
          </button>
        </div>
      </div>
    </section>
  );
};
