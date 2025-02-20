import * as common from "./util/common.mjs";
import express from "express";

let xBotPointer;

// Function to Start the Express Server
export const startExpressServer = (xBot) => {
  common.debugLog("web server started!");
  xBotPointer = xBot;
  const server = express();
  // Serve the media files
  server.use("/media", express.static(process.env.MEDIA_FOLDER));
  // Add middleware if needed
  server.use(express.json());
  // Example route to fetch data
  server.get("/debug-xbot", async (req, res) => {
    try {
      common.debugLog("/debug-xbot GET");
      common.debugLog("xBotPointer->", xBotPointer);
      // const data = await getQuery("SELECT * FROM config"); // Assume this is your DB helper function
      // res.json(data);
      await xBotPointer.goto("https://www.latigo.com.ar");
      res.send("/xbot-debug");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  server.post("/debug-xbot", async (req, res) => {
    try {
      common.debugLog("/debug-xbot POST");
      // const data = await getQuery("SELECT * FROM config"); // Assume this is your DB helper function
      // res.json(data);
      res.send("/xbot-debug");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    common.debugLog(
      process.env.DEBUG,
      `Express server running at http://localhost:${port}`,
    );
  });
};
