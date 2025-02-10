import React, { useState, useEffect, useContext, useRef } from "react";
import { Notification } from "./Notification";
import { AlertDialog } from "./AlertDialog";
import { ConfigDialog } from "./ConfigDialog";
import TweetsTable from "./TweetsTable";
import { Title } from "./Title";
import * as constants from "../../util/constants";
import { Progress } from "./Progress";
import { AppContext } from "../../context/AppContext";
import { ConfirmationDialog } from "./ConfirmationDialog"; // Adjust the import path based on your folder structure
import * as common from "../util/common";

export const Application = () => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [notificationClass, setNotificationClass] = useState(null);
  const [progressState, setProgressState] = useState({
    active: false,
    logingIn: false,
    loggedIn: false,
    scraping: false,
    scraped: false,
    logingOut: false,
    loggedOut: false,
  });
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [configData, setConfigData] = useState(null);
  const { state, updateState } = useContext(AppContext);
  const [
    deleteAllSavedTweetsConfirmationDialogOpen,
    setDeleteAllSavedTweetsConfirmationDialogOpen,
  ] = useState(false);

  const stateRef = useRef(state);

  useEffect(() => {
    // Wait for savedXApi.DEBUG to be set
    const interval = setInterval(() => {
      if (window.savedXApi && window.savedXApi.DEBUG !== undefined) {
        updateState("isDebug", window.savedXApi.DEBUG); // Update AppContext state directly
        updateState("mediaFolder", window.savedXApi.MEDIA_FOLDER); // Update AppContext state directly
        common.debugLog(
          window.savedXApi.DEBUG,
          "isDebug updated to:",
          window.savedXApi.DEBUG
        );
        common.debugLog(
          window.savedXApi.DEBUG,
          "mediaFolder updated to:",
          window.savedXApi.MEDIA_FOLDER
        );
        clearInterval(interval);
      }
    }, 100); // Check every 100ms until the value is set

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
          newShowProgress.logingOut = false;
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
          newShowProgress.logingOut = true;
        }
        if (progressStages & constants.progress.LOGGED_OUT) {
          newShowProgress.logingOut = false;
          newShowProgress.loggedOut = true;
        }

        return newShowProgress;
      });
    };

    const disableGoFetchButtonEventListener = () => {
      setIsDisabled(true);
    };

    const showConfigDialogEventListener = (event) => {
      const configData = event.detail;
      if (configData) {
        setConfigData(configData);
      }
      setOpenConfigDialog(true);
    };

    const checkSavedTweetEventListener = (event) => {
      const tweetUrl = event.detail;
      const found = stateRef.current.savedTweets.find(
        (savedTweet) => savedTweet.tweetUrl === tweetUrl
      );
      const reportResponse = {
        success: found ? true : false,
        tweetUrl,
      };
      common.debugLog(state.isDebug, "reportResponse->", reportResponse);
      window.savedXApi.reportFoundTweet(reportResponse);
    };

    const showDeleteSavedTweetsEventListener = () => {
      setDeleteAllSavedTweetsConfirmationDialogOpen(true);
    };

    const contentEventListener = (event) => {
      debugger;
      if (event.detail.tweets) updateState("savedTweets", event.detail.tweets);
      if (event.detail.tags) updateState("tags", event.detail.tags);
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
      "SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG",
      showDeleteSavedTweetsEventListener
    );

    window.addEventListener(
      "CHECK_SAVED_TWEET_EXISTS",
      checkSavedTweetEventListener
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
        "SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG",
        showDeleteSavedTweetsEventListener
      );
      window.removeEventListener(
        "CHECK_SAVED_TWEET_EXISTS",
        checkSavedTweetEventListener
      );
      window.removeEventListener(
        "SHOW_CONFIG_DIALOG",
        showConfigDialogEventListener
      );
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  const handleCloseConfirmDeleteSavedTweetsDialog = () => {
    setDeleteAllSavedTweetsConfirmationDialogOpen(false);
  };

  const handleConfirmDeleteSavedTweetsAction = async () => {
    const tweetsDeleteResult = await window.savedXApi.deleteAllSavedTweets();
    handleCloseConfirmDeleteSavedTweetsDialog();
    if (tweetsDeleteResult.success) {
      updateState("savedTweets", []);
      if (tweetsDeleteResult.data) {
        setAlertTitle("All good but...");
        setAlertMessage(tweetsDeleteResult.data);
      } else {
        setAlertTitle("All good!");
        setAlertMessage("All saved tweets deleted!");
      }
    } else {
      setAlertTitle("Something happened...");
      setAlertMessage(
        "Tweets were not deleted: " + tweetsDeleteResult.errorMessage
      );
    }
  };

  async function goFetchTweets() {
    const goFetchTweetsResult = await window.savedXApi.goFetchTweets();
    if (!goFetchTweetsResult.success) {
      setAlertTitle("Err...");
      setAlertMessage(
        goFetchTweetsResult.errorMessage + "\nPlease check configuration."
      );
      const getConfigDataResponse = await window.savedXApi.getConfigData();
      if (getConfigDataResponse.success) {
        setConfigData(getConfigDataResponse.data);
      } else {
        setAlertMessage(getConfigDataResponse.errorMessage);
      }
      setOpenConfigDialog(true);
    }
  }

  function openDebugSession() {
    window.savedXApi.openDebugSession();
  }

  const handleClose = () => {
    setOpenConfigDialog(false);
  };

  const handleAlertClose = () => {
    setNotificationMessage(null);
  };

  const displayTweetsData = () => {
    return (
      <div>
        <TweetsTable />
      </div>
    );
  };

  if (progressState.active) {
    return (
      <>
        <Progress whichState={progressState} />
      </>
    );
  }
  return (
    <section className="home">
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

      {openConfigDialog && (
        <ConfigDialog
          open={openConfigDialog}
          onClose={handleClose}
          configData={configData}
        />
      )}

      {deleteAllSavedTweetsConfirmationDialogOpen && (
        <ConfirmationDialog
          open={deleteAllSavedTweetsConfirmationDialogOpen}
          handleClose={handleCloseConfirmDeleteSavedTweetsDialog}
          handleConfirm={handleConfirmDeleteSavedTweetsAction}
          title="Confirm Deletion of ALL saved tweets"
          message="Are you sure you want to delete all the saved tweets?"
        />
      )}

      <div className="text-center">
        {!progressState.active &&
          state.savedTweets &&
          state.savedTweets.length > 0
          ? displayTweetsData()
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

        {state.isDebug && (
          <div className="text-center my-4">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={openDebugSession}
            >
              Debug
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
