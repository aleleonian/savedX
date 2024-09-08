import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';

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

export function TweetDetailDialog({ open, onClose, tweetData }) {
    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={onClose}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
            >
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Tweet Details
                </DialogTitle>
                <DialogContent>
                    <h3>Tweet Detail</h3>

                    <p>{tweetData.tweetDate}</p>
                    <p>{tweetData.twitterHandle} | {tweetData.userName}</p>
                    <p>{tweetData.tweetText}</p>
                    {tweetData.tweetImageOrPoster && <img src={tweetData.tweetImageOrPoster} />}
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={onClose}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
