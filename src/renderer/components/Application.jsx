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
    logingIn: false,
    loggedIn: false,
    scraping: false,
    scraped: false,
    loggingOut: false,
    loggedOut: false,
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
      const progressStages = event.detail.progressStages;
      const data = event.detail.data ? event.detail.data : null;

      const newShowProgress = { ...progressState };
      if (data) newShowProgress.data = data;

      if (progressStages === constants.progress.INIT_PROGRESS) {
        newShowProgress.active = true;
      }
      if (progressStages === constants.progress.HIDE_PROGRESS) {
        newShowProgress.active = false;
        newShowProgress.logingIn = false;
        newShowProgress.loggedIn = false;
        newShowProgress.scraping = false;
        newShowProgress.scraped = false;
        newShowProgress.loggingOut = false;
        newShowProgress.loggedOut = false;
      }
      if (progressStages & constants.progress.LOGGING_IN) {
        newShowProgress.logingIn = true;
      }
      if (progressStages & constants.progress.LOGGED_IN) {
        newShowProgress.logingIn = false;
        newShowProgress.loggedIn = true;
      }
      if (progressStages & constants.progress.SCRAPING) {
        newShowProgress.scraping = true;
      }
      if (progressStages & constants.progress.SCRAPED) {
        newShowProgress.scraping = false;
        newShowProgress.scraped = true;
      }
      if (progressStages & constants.progress.LOGGING_OUT) {
        newShowProgress.loggingOut = true;
      }
      if (progressStages & constants.progress.LOGGED_OUT) {
        newShowProgress.loggingOut = false;
        newShowProgress.loggedOut = true;
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
      const username = $('[data-testid="User-Name"] > div > div > a > div > div > span').text();
      const tweetText = $('div[data-testid="tweetText"] > span').text();

      // $('[data-testid="User-Name"]').text(); <- this will return name, username and date all in one ine
      
      // $('[data-testid="User-Name"] a').eq(2).attr('href') is the original url for that saved tweet
      
      // if data-testid="videoPlayer" exists, then $('[data-testid="videoPlayer"] video').attr('poster');
      // if ($('[data-testid="videoPlayer"]').length > 0) {
      //   const videoPoster = $('[data-testid="videoPlayer"] video').attr('poster')
      // }
      // else {
      //   const imgSrc = $('[data-testid="tweetPhoto"] img').attr('src');
      // }

      return {
        id: tweet.id,
        tweetText,
        username,
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
