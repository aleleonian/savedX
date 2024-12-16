const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,  // Set to true to run in the background
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Variable to store the video URL
    let videoUrl = null;

    // Enable request interception to capture network requests
    await page.setRequestInterception(true);

    // Intercept all requests and look for video requests
    page.on('request', (request) => {
        const url = request.url();
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
            console.log('Video request intercepted:', url);
            videoUrl = url;  // Store the video URL
        }
        request.continue();  // Continue with the request
    });

    // Navigate to the page containing the video
    await page.goto('https://x.com/ConnieKR016/status/1868082240405615091', {
        waitUntil: 'networkidle2',
    });

    // Ensure the video element is ready
    const videoElementHandle = await page.$('video');
    await page.waitForFunction(
        (video) => video && video.readyState >= 3,  // Check if the video is ready to play
        {},
        videoElementHandle
    );

    // Wait a bit to capture the request if the video auto-plays
    await wait(5000); // Adjust as needed

    if (videoUrl) {
        console.log('Downloading video from:', videoUrl);
        // Download the video
        const filePath = 'downloaded_video.mp4';
        const file = fs.createWriteStream(filePath);

        https.get(videoUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Video saved to', filePath);
            });
        }).on('error', (err) => {
            console.error('Error downloading video:', err);
            fs.unlink(filePath, () => { }); // Delete the file if an error occurs
        });
    } else {
        console.log('No video URL was intercepted.');
    }

    // Close the browser
    await browser.close();
})();

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}