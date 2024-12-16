const tvd = require("twitter-video-downloader");
const fs = require("fs");

// Twitter video URL
const videoUrl = "https://x.com/ConnieKR016/status/1868082240405615091";

// Call the twitter-video-downloader function
tvd(videoUrl)
  .then((videoReadableBufferStream) => {
    // Define the output file path
    const outputPath = "./video.mp4";

    // Create a writable stream to save the video to disk
    const writeStream = fs.createWriteStream(outputPath);

    // Pipe the readable buffer stream into the writable stream
    videoReadableBufferStream.pipe(writeStream);

    // Listen for the 'finish' event to know when the file has been saved
    writeStream.on("finish", () => {
      console.log("Video downloaded successfully to:", outputPath);
    });

    // Handle any errors during the write process
    writeStream.on("error", (err) => {
      console.error("Error writing the video to disk:", err);
    });
  })
  .catch((err) => {
    console.error("Error downloading video:", err);
  });
