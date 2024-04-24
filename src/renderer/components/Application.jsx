import React, { useState, useEffect } from "react";
import { Notification } from "./Notification";
import cheerio from "cheerio";
import TweetsTable from "./TweetsTable";
import { Title } from './Title';
import * as constants from "../../util/constants";
import { Progress } from "./Progress";

export const Application = () => {
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationClass, setNotificationClass] = useState(null);
  // this state is getting reset between re-renders
  const [progressState, setProgressState] = useState({
    active: false,
    login: false,
    scrape: false,
    logout: false
  });
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
      // debugger;
      const progressStages = event.detail;
      const newShowProgress = { ...progressState };
      if (progressStages === constants.progress.INIT_PROGRESS) {
        newShowProgress.active = true;
      }
      if (progressStages === constants.progress.HIDE_PROGRESS) {
        newShowProgress.active = false;
        newShowProgress.login = false;
        newShowProgress.scrape = false;
        newShowProgress.logout = false;

      }
      if (progressStages & constants.progress.LOGGED_IN) {
        newShowProgress.login = true;
      }
      if (progressStages & constants.progress.SCRAPING) {
        newShowProgress.scrape = true;
      }
      if (progressStages & constants.progress.LOGGED_OUT) {
        newShowProgress.logout = true;
      }
      setProgressState(newShowProgress);
    }

    const contentEventListener = (event) => {
      setTweetsData(event.detail);
    };
    window.addEventListener("NOTIFICATION", notificationEventListener);
    window.addEventListener("CONTENT", contentEventListener);
    window.addEventListener("SHOW_PROGRESS", progressEventListener);

    // Clean up event listener on component unmount
    return () => {
      // debugger;
      window.removeEventListener("NOTIFICATION", notificationEventListener);
      window.removeEventListener("CONTENT", contentEventListener);
      window.removeEventListener("SHOW_PROGRESS", progressEventListener);
    };
  }, [progressState]); // Empty dependency array ensures this effect runs only once after mount

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

  // debugger;
  if (progressState.active) {
    return (
      <>
        <Progress state={progressState} />
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
          !progressState.active &&
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
