import React, { useState, useEffect } from "react";
import { Notification } from "./Notification";
// import DOMPurify from "dompurify";
import cheerio from "cheerio";

export const Application = () => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  const [tweetsData, setTweetsData] = useState(null);

  useEffect(() => {
    // Listen for messages from the preload script
    const notificationEventListener = (event) => {
      if (event.detail) {
        const data = event.detail.split("--");
        setNotificationClass(data[0]);
        setNotificationMessage(data[1]);
        setTimeout(() => {
          setNotificationMessage(null);
        }, 2000);
      }
    };

    const contentEventListener = (event) => {
      setTweetsData(event.detail);
    };
    window.addEventListener("NOTIFICATION", notificationEventListener);
    window.addEventListener("CONTENT", contentEventListener);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  function logIntoX() {
    window.savedXApi.logIntoX();
  }

  const displayTweetsData = (tweetsArray) => {
    return (
      <div>
        {tweetsArray.map((tweet, index) => {
          const $ = cheerio.load(tweet.htmlContent);
          // Select all <span> tags inside the <div> with data-testid="tweetText"
          const spanText = $('div[data-testid="tweetText"] > span').text();
          return <div key={index}>{spanText}</div>;
        })}
        {/* {tweetsArray.map((tweet, index) => {
          const sanitizedHtml = DOMPurify.sanitize(tweet.htmlContent);
          return <div key={index} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
        })} */}
      </div>
    );
  };

  return (
    <section>
      <h1>Hi, bros!</h1>
      <button onClick={logIntoX}>Log into X</button>
      {notificationMessage && (
        <Notification
          notificationClass={notificationClass}
          notificationMessage={notificationMessage}
        />
      )}
      {tweetsData && tweetsData.length > 0 && displayTweetsData(tweetsData)}
    </section>
  );
};
