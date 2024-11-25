import * as React from "react";
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
import { IconButton, TextField, Autocomplete } from "@mui/material";

import { AlertDialog } from "./AlertDialog";

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

export function ConfigDialog({ open, onClose }) {
  useEffect(() => {
    // Listen for messages from the preload script
    const notificationEventListener = (event) => {
      if (event.detail) {
        const data = event.detail.split("--");
        setNotificationClass(data[0]);
        setNotificationMessage(data[1]);
      }
    };

    const configDataDialogEventListener = (event) => {
      if (event.detail) {
        if (event.detail.success) {
        }
      }
    };

    window.addEventListener("NOTIFICATION", notificationEventListener);
    window.addEventListener("CONFIG_DATA", configDataDialogEventListener);
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("CONFIG_DATA", configDataDialogEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  const { state, updateState } = useContext(AppContext);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);

  useEffect(() => {
    window.savedXApi.getConfigData();
  }, []);

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
            <div className="flex-shrink-0"></div>

            {notificationMessage && (
              <AlertDialog
                title="Woops!"
                message={notificationMessage}
                openFlag={true}
              />
            )}
            {/* Tweet content */}
            <div className="flex-1">
              {/* User details row */}
              <div className="flex items-center space-x-2"></div>
            
              {/* Tweet text */}
              <p className="mt-2"></p>

              {/* Conditional tweet image display */}
            </div>
          </div>
        </DialogContent>

        <DialogActions
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
