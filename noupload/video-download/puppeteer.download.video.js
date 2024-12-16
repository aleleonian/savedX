const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let pupConfig = {
  headless: false,
  defaultViewport: null,
  ignoreDefaultArgs: ["--enable-automation"],
  args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
};

(async () => {
  const browser = await puppeteer.launch(pupConfig);
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  let videoUrl = null;

  // const playButton = await page.$('button[aria-label="Play"]');
  // if (playButton) {
  //   await playButton.click();
  //   console.log('Clicked the play button.');
  //   await page.waitForTimeout(2000); // Wait for the video request
  // }

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
      console.log('Video request intercepted:', url);
    }
    request.continue();  // Continue with the request
  });

  // Navigate to the webpage containing the embedded video
  await page.goto('https://x.com/ConnieKR016/status/1868082240405615091', {
    waitUntil: 'networkidle2',
  });

  await wait(5000);
  // Identify the HTML element that contains the embedded video

  if (!videoUrl) {
    console.log('No video URL was intercepted.');
    await browser.close();
    return;
  }

  const videoResponse = await page.goto(videoUrl);
  const videoBuffer = await videoResponse.buffer();

  const outputPath = path.join(__dirname, 'downloaded_video.mp4');
  fs.writeFileSync(outputPath, videoBuffer);
  console.log(`Video downloaded to: ${outputPath}`);

  await browser.close();
})();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}