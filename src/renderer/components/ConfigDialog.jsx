import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";
import { useState, useContext, useEffect } from "react";
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
    // TODO: esto está al pedo?
    // const configDataDialogEventListener = (event) => {
    //   if (event.detail) {
    //     if (event.detail.success) {
    //       debugger;
    //     }
    //   }
    // };

    window.addEventListener("NOTIFICATION", notificationEventListener);
    // window.addEventListener("CONFIG_DATA", configDataDialogEventListener);
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      // window.removeEventListener("CONFIG_DATA", configDataDialogEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);

  // TODO: al pedo?
  // useEffect(() => {
  //   window.savedXApi.getConfigData();
  // }, []);

  const [formData, setFormData] = useState({
    username: configData?.TWITTER_BOT_USERNAME ?? "",
    password: configData?.TWITTER_BOT_PASSWORD ?? "",
    email: configData?.TWITTER_BOT_EMAIL ?? "",
    downloadMedia: configData?.DOWNLOAD_MEDIA ?? false,
  });

  debugger;
  
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name == "downloadMedia") {
      if (value == "on") value = true;
      else value = false;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username && formData.password && formData.email) {
      window.savedXApi.updateConfigData(formData);
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
                <Button
                  type="Save"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Submit
                </Button>
              </Box>
            </Box>
          </Container>
        </DialogContent>

        <DialogActions sx={{ display: "flex", justifyContent: "right" }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
