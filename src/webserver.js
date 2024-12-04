
const express = require("express");


// Function to Start the Express Server
export const startExpressServer = () => {
    const server = express();
  
    // Add middleware if needed
    server.use(express.json());
  
    // Example route to fetch data
    server.get("/debug-xbot", async (req, res) => {
      try {
        console.log("/debug-xbot");
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