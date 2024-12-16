const { exec } = require('child_process');

const downloadVideo = (url) => {
    const command = `yt-dlp -o "video.mp4" ${url}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing yt-dlp: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
};

const videoUrl = 'https://x.com/ConnieKR016/status/1868082240405615091';
downloadVideo(videoUrl);
