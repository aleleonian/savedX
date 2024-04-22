import React, { useState, useEffect } from "react";
import { Notification } from "./Notification";
import cheerio from "cheerio";
import TweetsTable from "./TweetsTable";
import { Title } from './Title';


export const Application = () => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
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

    const progressEventListener = (event) => {
      setShowProgress(event.detail);
    }

    const contentEventListener = (event) => {
      setTweetsData(event.detail);
    };
    window.addEventListener("NOTIFICATION", notificationEventListener);
    window.addEventListener("CONTENT", contentEventListener);
    window.addEventListener("SHOW_PROGRESS", progressEventListener);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("CONTENT", contentEventListener);
      window.removeEventListener("SHOW_PROGRESS", progressEventListener);
    };
  }, []); // Empty dependency array ensures this effect runs only once after mount

  function goFetchTweets() {
    window.savedXApi.goFetchTweets();
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
        <TweetsTable nodes={nodes} />
      </div>
    );
  };

  if (showProgress) {
    return (
      <>
        <Title />
        Bro, we're working on it...⏱
      </>
    )
  }
  return (
    <section className="home">
      <Title />

      {notificationMessage && (
        <Notification
          notificationClass={notificationClass}
          notificationMessage={notificationMessage}
        />
      )}
      <div className="text-center">
        {
          !showProgress &&
            tweetsData && tweetsData.length > 0 ? displayTweetsData(tweetsData)
            :
            "There's nothing to show, bro 😣"
        }
        <div className="text-center my-4">
          <button className="btn btn-blue" onClick={goFetchTweets}>Go fetch tweets</button>
        </div>
      </div>
    </section>
  );
};
