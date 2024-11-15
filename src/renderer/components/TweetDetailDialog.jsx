import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { useState } from 'react';

import { Grid, TextField, Autocomplete, Chip } from "@mui/material";

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

export function TweetDetailDialog({ open, onClose, tweetData, onTagsUpdate }) {

    if (tweetData === "" || tweetData == null) return null;
    let tweetTags;
    if (tweetData.tags) {
        tweetTags = tweetData.tags.split(",");
    }
    else tweetTags = [];

    const [tags, setTags] = useState(tweetTags);

    const handleTagsChange = (event, newTags) => {
        setTags(newTags);
        onTagsUpdate(tweetData.id, newTags); // Notify parent or database
    };

    return (
        <React.Fragment>
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
                                <span className="text-gray-600">@{tweetData.twitterHandle}</span>
                                <span className="text-gray-400">· {tweetData.tweetDate}</span>
                                <span className="text-gray-400">tags: {tweetData.tags}</span>
                            </div>

                            {/* Tweet text */}
                            <p className="mt-2">{tweetData.tweetText}</p>

                            {/* Conditional tweet image display */}
                            {tweetData.tweetImageOrPoster ? (
                                <a href={tweetData.tweetUrl} onClick={() => handleClick(tweetData.tweetUrl)}>
                                    <img src={tweetData.tweetImageOrPoster} className="mt-2 rounded-lg" width="75%" alt="tweet image" />
                                </a>
                            ) : (
                                <a href={tweetData.tweetUrl} onClick={() => handleClick(tweetData.tweetUrl)} className="text-blue-500">
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
                        options={tags}
                        value={tags}
                        onChange={handleTagsChange}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={index}
                                    label={option}
                                    {...getTagProps({ index })}
                                    variant="outlined"
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Tags" placeholder="Add tags" />
                        )}
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
