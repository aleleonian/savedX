"use strict";

let tt = require("twitter-dl");

let folder = "/tmp";
let video = "https://x.com/ConnieKR016/status/1868082240405615091";

tt.download(video, folder)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });
