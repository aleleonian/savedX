import React, { useState } from "react";

export const VideoPlayer = ({ videoSrc }) => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Video Player</h1>
      {videoSrc && (
        <video
          src={videoSrc}
          controls
          style={{ width: "100%", maxWidth: "600px", borderRadius: "10px" }}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};
