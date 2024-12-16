const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,  // Set to true to run in the background
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Enable request interception to capture network requests
    await page.setRequestInterception(true);

    // Intercept all requests and look for video requests
    page.on('request', (request) => {
        const url = request.url();
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
            console.log('Video request intercepted:', url);
        }
        request.continue();  // Continue with the request
    });

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

    // Close the browser when done
    await browser.close();
})();

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}