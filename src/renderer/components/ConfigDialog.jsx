import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";
import { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box } from "@mui/material";

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

export function ConfigDialog({ open, onClose, configData }) {
  useEffect(() => {
    // Listen for messages from the preload script
    const notificationEventListener = (event) => {
      if (event.detail) {
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

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);

  const [formData, setFormData] = useState({
    username: configData?.TWITTER_BOT_USERNAME ?? "",
    password: configData?.TWITTER_BOT_PASSWORD ?? "",
    email: configData?.TWITTER_BOT_EMAIL ?? "",
    downloadMedia: configData?.DOWNLOAD_MEDIA ?? false,
    deleteOnlineBookmarks: configData?.DELETE_ONLINE_BOOKMARKS ?? false,
  });

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name == "downloadMedia") {
      value = e.target.checked;
    } else if (name == "deleteOnlineBookmarks") {
      value = e.target.checked;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.email) {
      const updateConfigDataResponse =
        await window.savedXApi.updateConfigData(formData);
      if (updateConfigDataResponse.success) {
        setNotificationMessage(`Config data updated!`);
      } else {
        setNotificationMessage(
          `Trouble updating config data mai fren: ${updateConfigDataResponse.errorMessage}!`
        );
      }
    }
  };

  const handleAlertClose = () => {
    setNotificationMessage(null);
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
          {notificationMessage && (
            <Notification
              notificationClass={notificationClass}
              notificationMessage={notificationMessage}
              handleAlertClose={handleAlertClose}
            />
          )}

          <Container>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <Box
                component="form"
                onSubmit={handleSubmit}
                id="config-form"
                sx={{ mt: 3, width: "100%" }}
              >
                <Typography variant="h5">Configure your account:</Typography>

                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  variant="outlined"
                  margin="normal"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  variant="outlined"
                  margin="normal"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  variant="outlined"
                  margin="normal"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <br />
                <Typography variant="h5">Download tweets media ?</Typography>
                <Checkbox
                  checked={formData.downloadMedia}
                  onChange={handleChange}
                  color="primary"
                  name="downloadMedia"
                />
                <br />
                <Typography variant="h5">
                  Delete online bookmarks after save?
                </Typography>
                <Checkbox
                  checked={formData.deleteOnlineBookmarks}
                  onChange={handleChange}
                  color="primary"
                  name="deleteOnlineBookmarks"
                />
              </Box>
            </Box>
          </Container>
        </DialogContent>

        <DialogActions sx={{ display: "flex", justifyContent: "right" }}>
          <Button
            type="submit" // Correct type to make it submit the form
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            fullWidth
            form="config-form"
          >
            Submit
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
