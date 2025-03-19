const { exec } = require("child_process");
const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Get Chrome window ID
    exec("xdotool search --onlyvisible --name 'Chrome'", (err, stdout) => {
        const windowId = stdout.trim();
        if (!windowId) return console.error("❌ Chrome window not found");

        console.log("🙈 Hiding Chrome...");
        exec(`xdotool windowminimize ${windowId}`);
    });

    // Wait before restoring
    await page.goto("https://www.latigo.com.ar");
    await wait(3000);
    // Restore Chrome
    exec("xdotool search --onlyvisible --name 'Chrome'", (err, stdout) => {
        const windowId = stdout.trim();
        if (!windowId) return console.error("❌ Chrome window not found");

        console.log("👀 Restoring Chrome...");
        exec(`xdotool windowactivate ${windowId}`);
    });

    await wait(3000);
    await browser.close();
})();


function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}