
const express = require("express");

let xBotPointer;

// Function to Start the Express Server
export const startExpressServer = (xBot) => {
  xBotPointer = xBot;
  const server = express();

  // Add middleware if needed
  server.use(express.json());

  // Example route to fetch data
  server.get("/debug-xbot", async (req, res) => {
    try {
      console.log("/debug-xbot GET");
      console.log("xBotPointer->", xBotPointer);
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
      console.log("/debug-xbot POST");
      // const data = await getQuery("SELECT * FROM config"); // Assume this is your DB helper function
      // res.json(data);
      res.send("/xbot-debug");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
  });
};