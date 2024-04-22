import React, { useState, useEffect } from "react";
import { Notification } from "./Notification";
import cheerio from "cheerio";
import TweetTablePagination2 from "./TweetTablePagination2";



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

  const parseTweetData = (tweetsArray) => {
    return tweetsArray.map((tweet, index) => {
      const $ = cheerio.load(tweet.htmlContent);
      {/* const UserNameDiv = $('[data-testid="User-Name"]'); */ }
      const username = $('[data-testid="User-Name"] > div > div > a > div > div > span').text();
      const tweetText = $('div[data-testid="tweetText"] > span').text();
      return {
        id: tweet.id,
        tweetText: $('div[data-testid="tweetText"] > span').text(),
        username: $('[data-testid="User-Name"] > div > div > a > div > div > span').text(),
      }
    })
  }
  const displayTweetsData = (tweetsArray) => {
    const nodes = parseTweetData(tweetsArray);
    return (

      <div>
        <TweetTablePagination2 nodes={nodes} />
      </div>
    );
  };

  return (
    <section className="home">
      <h1 className="text-center text-3xl mb-4">SavedX: your X bookmarks</h1>

      {notificationMessage && (
        <Notification
          notificationClass={notificationClass}
          notificationMessage={notificationMessage}
        />
      )}
      <div className="text-center">
        {
          tweetsData && tweetsData.length > 0 ? displayTweetsData(tweetsData)
            :
            "There's nothing to show, bro 😣"
        }
        <div className="text-center my-4">
          <button className="btn btn-blue" onClick={logIntoX}>Go fetch tweets</button>
        </div>
      </div>
    </section>
  );
};
