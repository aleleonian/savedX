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

const handleClick = (path) => {
    if (window.savedXApi && window.savedXApi.openUrl) {
        window.savedXApi.openUrl("https://www.x.com" + path); // Open the external URL using the exposed API
    } else {
        console.error('The openUrl method is not available');
    }
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
                <DialogContent dividers={scroll === 'paper'}>
                    <p>{tweetData.tweetDate}</p>
                    <p>{tweetData.twitterHandle} | {tweetData.userName}</p>
                    <p>{tweetData.tweetText}</p>
                    {tweetData.tweetImageOrPoster && <a href={tweetData.tweetUrl} onClick={() => handleClick(tweetData.tweetUrl)}><img src={tweetData.tweetImageOrPoster} width='50%'/></a>}
                    {!tweetData.tweetImageOrPoster && <a href={tweetData.tweetUrl} onClick={() => handleClick(tweetData.tweetUrl)}>Tweet Url</a>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
