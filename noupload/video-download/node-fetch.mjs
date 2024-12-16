import fetch from 'node-fetch';
// const fs = require('fs');
// const path = require('path');
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname); // Now you have the equivalent of __dirname


const downloadVideo = async (videoUrl) => {
  const res = await fetch(videoUrl);
  const dest = fs.createWriteStream(path.resolve(__dirname, 'video.mp4'));
  res.body.pipe(dest);

  res.body.on('end', () => {
    console.log('Video downloaded successfully!');
  });
};

const videoUrl = 'https://x.com/ConnieKR016/status/1868082240405615091';
downloadVideo(videoUrl);
