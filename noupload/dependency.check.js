const { exec } = require("child_process");

// Function to check if a command exists
const checkCommandExists = (command) => {
  return new Promise((resolve, reject) => {
    exec(`${command} --version`, (error) => {
      if (error) {
        resolve(false); // Command not found
      } else {
        resolve(true); // Command found
      }
    });
  });
};

// Check yt-dlp and FFmpeg
(async () => {
  const ytDlpInstalled = await checkCommandExists("yt-dlp");
  const ffmpegInstalled = await checkCommandExists("ffmpeg");

  if (!ytDlpInstalled) {
    console.warn(
      "yt-dlp is not installed. Please install it by running: pip install yt-dlp"
    );
  }

  if (!ffmpegInstalled) {
    console.warn(
      "FFmpeg is not installed. Please install it. Visit: https://ffmpeg.org/download.html"
    );
  }

  if (ytDlpInstalled && ffmpegInstalled) {
    console.log("All required dependencies are installed.");
  }
})();
