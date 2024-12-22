import React from "react";
import { useRef } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";
import { useState, useContext, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { Cancel } from "@mui/icons-material";
import { IconButton, TextField, Autocomplete, Chip } from "@mui/material";
import { ConfirmationDialog } from "./ConfirmationDialog"; // Adjust the import path based on your folder structure
import { VideoPlayer } from "./VideoPlayer";
import { AlertDialog } from "./AlertDialog";
import { debugLog } from "../util/common";

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const handleClick = (path) => {
  if (window.savedXApi && window.savedXApi.openUrl) {
    window.savedXApi.openUrl("https://www.x.com" + path); // Open the external URL using the exposed API
  } else {
    console.error("The openUrl method is not available");
  }
};

export function TweetDetailDialog({
  open,
  onClose,
  tweetData,
  updateTagsOnDB,
  removeTagFromDB,
  updateTweetAndTagsLocally,
}) {
  const isOpenRef = useRef(open);

  useEffect(() => {
    isOpenRef.current = open; // Update the ref whenever `open` changes
  }, [open]);

  useEffect(() => {
    // Listen for messages from the preload script
    const notificationEventListener = (event) => {
      if (event.detail && isOpenRef.current) {
        const data = event.detail.split("--");
        setNotificationClass(data[0]);
        setNotificationMessage(data[1]);
      }
    };

    window.addEventListener("NOTIFICATION", notificationEventListener);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  const { state, updateState } = useContext(AppContext);
  const [tweetTags, setTweetTags] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  useEffect(() => {
    // Make sure tweetData and tweetData.tags are available
    if (tweetData && tweetData.tags) {
      setTweetTags(tweetData.tags.split(","));
    } else setTweetTags([]);
  }, [tweetData]); // Dependency array to rerun when tweetData changes

  if (tweetData == null) return null;

  const setTweetsData = (savedTweetsArray) => {
    updateState("savedTweets", savedTweetsArray);
  };
  const setTags = (tagsArray) => {
    updateState("tags", tagsArray);
  };

  const handleTagsUpdate = (newTags) => {
    setTweetTags(newTags);
    updateTweetAndTagsLocally(tweetData.id, newTags);
    updateTagsOnDB(tweetData.id, newTags);
  };

  function removeSubstring(originalString, substringToRemove) {
    const regex = new RegExp(
      `\\b${substringToRemove}\\b,?\\s?|,?\\s?\\b${substringToRemove}\\b`,
      "g",
    );
    return originalString.replace(regex, "").trim();
  }

  const handleRemoveTag = (tagToRemove) => {
    //
    setTweetTags(tweetTags.filter((tag) => tag != tagToRemove));
    // delete this tag from the tag list
    setTags(state.tags.filter((tag) => tag != tagToRemove));
    const currentTweets = state.savedTweets;
    for (let i = 0; i < currentTweets.length; i++) {
      const currentTags = currentTweets[i].tags;
      if (currentTags && currentTags.indexOf(tagToRemove) != -1) {
        currentTweets[i].tags = removeSubstring(currentTags, tagToRemove);
      }
    }
    setTweetsData(currentTweets);
    // delete this tag from the db
    removeTagFromDB(tagToRemove);
  };

  // const renderOption = (props, option, { selected }) => {
  const renderOption = (props, option) => {
    return (
      <li
        {...props}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{option}</span>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering selection action
            handleRemoveTag(option);
          }}
          color="error"
        >
          <Cancel fontSize="small" />
        </IconButton>
      </li>
    );
  };

  const onDelete = () => {
    setConfirmationDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmationDialogOpen(false);
  };

  const handleConfirmAction = async () => {
    // Add your confirmation logic here (e.g., delete item)
    setConfirmationDialogOpen(false);
    const tweetDeleteResult =
      await window.savedXApi.deleteSavedTweet(tweetData);
    // Gotta update the array of tweets and re-render
    if (tweetDeleteResult) {
      const newSavedTweets = [...state.savedTweets];
      updateState(
        "savedTweets",
        newSavedTweets.filter((savedTweet) => savedTweet.id != tweetData.id),
      );
      setNotificationMessage(null);
      onClose();
    } else {
      debugLog(window.savedXApi.DEBUG, "tweetDeleteResult:", tweetDeleteResult);
    }
  };

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={onClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle
          style={{ cursor: "move" }}
          id="draggable-dialog-title"
        ></DialogTitle>
        <DialogContent
          dividers={scroll === "paper"}
          className="overflow-auto max-h-[400px]"
        >
          <div className="flex space-x-4">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <img
                src={tweetData.profilePicUrl}
                className="w-10 h-10 rounded-md"
                alt="profile pic"
              />
            </div>

            {notificationMessage && (
              <AlertDialog
                title="⚠️"
                message={notificationMessage}
                openFlag={true}
                cleanUp={() => setNotificationMessage(null)}
              />
            )}

            <ConfirmationDialog
              open={confirmationDialogOpen}
              handleClose={handleCloseDialog}
              handleConfirm={handleConfirmAction}
              title="Confirm Deletion"
              message="Are you sure you want to delete this saved tweet?"
            />

            {/* Tweet content */}
            <div className="flex-1">
              {/* User details row */}
              <div className="flex items-center space-x-2">
                <b>{tweetData.userName}</b>
                <span className="text-gray-600">{tweetData.twitterHandle}</span>
                <span className="text-gray-400">· {tweetData.tweetDate}</span>
              </div>

              {/* Tweet text */}
              <p className="mt-2">{tweetData.tweetText}</p>

              {/* Conditional tweet image /video display */}
              {tweetData.hasLocalMedia == "no" ? (
                tweetData.tweetImageOrPoster ? (
                  <a
                    href={tweetData.tweetUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(tweetData.tweetUrl);
                    }}
                  >
                    <img
                      src={tweetData.tweetImageOrPoster}
                      className="mt-2 rounded-lg"
                      width="75%"
                      alt="tweet image"
                    />
                  </a>
                ) : (
                  <a
                    href={tweetData.tweetUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      handleClick(tweetData.tweetUrl);
                    }}
                    className="text-blue-500"
                  >
                    Tweet Url
                  </a>
                )
              ) : tweetData.hasLocalMedia == "image" ? (
                <img
                  src={`media/${tweetData.tweetUrlHash}.jpg`}
                  className="mt-2 rounded-lg"
                  width="75%"
                  alt="tweet image"
                />
              ) : (
                <VideoPlayer videoSrc={`media/${tweetData.tweetUrlHash}.mp4`} />
              )}
            </div>
          </div>
        </DialogContent>

        <DialogActions
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          <Autocomplete
            fullWidth
            multiple
            freeSolo
            options={state.tags}
            value={tweetTags}
            onChange={(event, newValue) => handleTagsUpdate(newValue)}
            renderTags={(value, getTagProps) => {
              return value.map((option, index) => (
                <Chip
                  key={index}
                  label={option}
                  {...getTagProps({ index })}
                  variant="outlined"
                />
              ));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Tags" placeholder="Add tags" />
            )}
            renderOption={renderOption} // Custom option renderer with a remove button
            sx={{ marginTop: 1 }}
          />
          <Button onClick={onDelete}>
            <span style={{ fontSize: "24px" }}>❌</span>
          </Button>
          <Button onClick={onClose}>
            <span style={{ fontSize: "24px" }}>👍🏻</span>
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
