import * as common from "./util/common.mjs";
import express from "express";
import getPort from "get-port";

let xBotPointer;
let serverInstance;

// Function to Start the Express Server
export const startExpressServer = async (xBot) => {
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

  // 🌈 Pick a port, default to 3000, but find another if it's busy
  const preferredPort = Number(process.env.PORT) || 3000;
  const port = await getPort({ port: preferredPort });

  // 🔐 Store the chosen port back into process.env
  process.env.PORT = port;

  try {
    serverInstance = server.listen(port, () => {
      common.debugLog(
        `✅ Express server running at http://localhost:${port}`
      );
    });

    serverInstance.on("error", (err) => {
      common.debugLog("❌ Server error:", err);
    });

    return serverInstance;
  } catch (err) {
    common.debugLog("❌ Failed to start server:", err);
    return null;
  }
};

export const stopExpressServer = () => {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      serverInstance.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    } else {
      resolve();
    }
  });
};