const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    let videoUrl = null;

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const url = request.url();
        if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
            console.log('Video request intercepted:', url);
            videoUrl = url;
        }
        request.continue();
    });

    // page.on('request', (request) => {
    //     console.log(`Request: ${request.url()}`);
    //     request.continue();
    // });

    page.on('response', (response) => {
        console.log(`Response: ${response.url()} - Status: ${response.status()}`);
    });


    // Navigate to the page containing the video
    await page.goto('https://x.com/ConnieKR016/status/1868082240405615091', {
        waitUntil: 'networkidle2',
    });


    // Wait for the video element and get its duration
    const videoDuration = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.duration : null;
    });

    if (videoDuration) {
        console.log(`Video duration: ${videoDuration} seconds. Waiting...`);
        await wait(videoDuration * 1000 + 5000); // Add a 5-second buffer
    } else {
        console.log('Could not determine video duration. Waiting for 60 seconds...');
        await wait(60000); // Default wait time
    }

    if (videoUrl) {
        console.log(`Intercepted video URL: ${videoUrl}`);
        console.log('Downloading video...');
        const file = fs.createWriteStream('video.mp4');
        // https.get(videoUrl, (response) => {
        //     response.pipe(file);
        //     file.on('finish', () => {
        //         file.close();
        //         console.log('Video downloaded as video.mp4');
        //     });
        // });
        https.get(videoUrl, (response) => {
            console.log(`Response status: ${response.statusCode}`);
            let totalSize = 0;

            response.on('data', (chunk) => {
                totalSize += chunk.length;
            });

            response.on('end', () => {
                console.log(`Download complete. Total size: ${totalSize} bytes`);
            });

            response.pipe(file);
        });

    } else {
        console.log('No video URL was intercepted.');
    }

    await browser.close();
})();


function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}