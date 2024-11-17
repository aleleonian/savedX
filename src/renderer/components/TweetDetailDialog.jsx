import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Cancel } from '@mui/icons-material';
import { IconButton, TextField, Autocomplete, Chip } from "@mui/material";
// import { ipcRenderer } from 'electron';
// const { ipcRenderer } = require("electron");

import { Notification } from "./Notification";

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
        console.error('The openUrl method is not available');
    }
}

export function TweetDetailDialog({ open, onClose, tweetData, updateTagsOnDB, removeTagFromDB, updateTweetAndTagsLocally }) {
    if (tweetData == null) return null;

    useEffect(() => {
        // Listen for messages from the main process
        ipcRenderer.on('NOTIFICATION', (event, data) => {
            debugger;
            if (event.detail) {
                const data = event.detail.split("--");
                setNotificationClass(data[0]);
                setNotificationMessage(data[1]);
                setTimeout(() => {
                    setNotificationMessage(null);
                }, 2000);
            }
        });

        // Cleanup the listener on component unmount
        return () => ipcRenderer.removeAllListeners('dialog-notification');
    }, []);

    const { state, updateState } = useContext(AppContext);
    const [tweetTags, setTweetTags] = useState(tweetData.tags ? tweetData.tags.split(",") : []);
    const [notificationMessage, setNotificationMessage] = useState(null);
    const [notificationClass, setNotificationClass] = useState(null);
    const setTweetsData = (savedTweetsArray) => {
        updateState('savedTweets', savedTweetsArray);
    };
    const setTags = (tagsArray) => {
        updateState('tags', tagsArray);
    };

    const handleTagsUpdate = (newTags) => {
        setTweetTags(newTags);
        updateTweetAndTagsLocally(tweetData.id, newTags);
        updateTagsOnDB(tweetData.id, newTags);
    };

    function removeSubstring(originalString, substringToRemove) {
        const regex = new RegExp(`\\b${substringToRemove}\\b,?\\s?|,?\\s?\\b${substringToRemove}\\b`, 'g');
        return originalString.replace(regex, '').trim();
    }

    const handleRemoveTag = (tagToRemove) => {
        // delete this tag locally
        // delete this tag from the tag list
        setTags(state.tags.filter(tag => tag != tagToRemove));
        // delete this tag from every tweet
        const currentTweets = state.savedTweets;
        // iterate the array
        // find the tweet that contains the tagToRemove
        for (let i = 0; i < currentTweets.length; i++) {
            const currentTags = currentTweets[i].tags;
            if (currentTags && currentTags.indexOf(tagToRemove) != -1) {
                currentTweets[i].tags = removeSubstring(currentTags, tagToRemove);
            }
        }
        setTweetsData(currentTweets)
        // delete this tag from the db
        removeTagFromDB(tagToRemove);
        // delete this tag from tweets_tags
        // delete this tag from tags
    }

    const renderOption = (props, option, { selected }) => {
        return (
            <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
    return (
        <React.Fragment>
            {notificationMessage && (
                <Notification
                    notificationClass={notificationClass}
                    notificationMessage={notificationMessage}
                />
            )}
            <Dialog
                open={open}
                onClose={onClose}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
            >
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                </DialogTitle>
                <DialogContent dividers={scroll === 'paper'} className="overflow-auto max-h-[400px]">
                    <div className="flex space-x-4">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            <img src={tweetData.profilePicUrl} className="w-10 h-10 rounded-md" alt="profile pic" />
                        </div>

                        {/* Tweet content */}
                        <div className="flex-1">
                            {/* User details row */}
                            <div className="flex items-center space-x-2">
                                <b>{tweetData.userName}</b>
                                <span className="text-gray-600">{tweetData.twitterHandle}</span>
                                <span className="text-gray-400">· {tweetData.tweetDate}</span>
                                <span className="text-gray-400">tags: {tweetData.tags}</span>
                            </div>

                            {/* Tweet text */}
                            <p className="mt-2">{tweetData.tweetText}</p>

                            {/* Conditional tweet image display */}
                            {tweetData.tweetImageOrPoster ? (
                                <a href={tweetData.tweetUrl} onClick={(e) => {
                                    e.preventDefault();
                                    handleClick(tweetData.tweetUrl)
                                }}>
                                    <img src={tweetData.tweetImageOrPoster} className="mt-2 rounded-lg" width="75%" alt="tweet image" />
                                </a>
                            ) : (
                                <a href={tweetData.tweetUrl} onClick={(e) => {
                                    e.preventDefault();
                                    handleClick(tweetData.tweetUrl)
                                }} className="text-blue-500">
                                    Tweet Url
                                </a>
                            )}
                        </div>
                    </div>
                </DialogContent>


                <DialogActions sx={{ display: "flex", justifyContent: "space-between" }}>
                    {/* Tag Input */}
                    <Autocomplete
                        fullWidth
                        multiple
                        freeSolo
                        options={state.tags}
                        value={tweetTags}
                        onChange={(event, newValue) => handleTagsUpdate(newValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={index}
                                    label={option}
                                    {...getTagProps({ index })}
                                    variant="outlined"
                                // onDelete={() => handleRemoveTag(option)}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Tags" placeholder="Add tags" />
                        )}
                        renderOption={renderOption} // Custom option renderer with a remove button
                        sx={{ marginTop: 1 }}
                    />
                    <Button onClick={onClose}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
