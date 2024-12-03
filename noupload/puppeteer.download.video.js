const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the webpage containing the embedded video
  await page.goto('https://example.com');

  // Identify the HTML element that contains the embedded video
  const videoElementHandle = await page.$('video'); // Assuming the video is embedded in a <video> tag
  
  if (videoElementHandle) {
    // Extract the source URL of the video
    const videoSrc = await page.evaluate(video => video.src, videoElementHandle);
    
    // Navigate to the source URL of the video
    await page.goto(videoSrc);

    // Extract the URL of the video file
    const videoFileUrl = page.url();

    // Download the video file
    const videoBuffer = await page.evaluate(() => {
      return fetch(window.location.href)
        .then(response => response.arrayBuffer())
        .then(buffer => buffer);
    });

    // Save the video file to disk
    fs.writeFileSync('video.mp4', Buffer.from(videoBuffer));
  } else {
    console.error('Embedded video not found');
  }

  await browser.close();
})();
