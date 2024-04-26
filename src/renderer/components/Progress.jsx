import React from "react";
import { Title } from "./Title";
import { ProgressIcon } from "./ProgressIcon";

export const Progress = ({ state }) => {
    let logginClass = "flex items-center text-gray-400";
    let loginText = "Will log into X.";

    let scrapingClass = "flex items-center text-gray-400";
    let scrapingText = "Will scrape tweets."

    let logoutClass = "flex items-center text-gray-400";
    let logoutText = "Will log out of X.";

    if (state.logingIn) {
        logginClass = "flex items-center text-blue-500";
        loginText = "Logging into X...";
    }
    else if (state.loggedIn) {
        logginClass = "flex items-center text-blue-500";
        loginText = "Logged into X ✅";
    }

    if (state.scraping) {
        scrapingClass = "flex items-center text-blue-500";
        scrapingText = "Scraping bookmarks " + state.data;
    }
    else if (state.scraped) {
        scrapingClass = "flex items-center text-blue-500";
        scrapingText = "Scraped bookmarks ✅";
    }

    if (state.loggingOut) {
        logoutClass = "flex items-center text-blue-500";
        logoutText = "Logging out of X...";
    }

    else if (state.loggedOut) {
        logoutClass = "flex items-center text-blue-500";
        logoutText = "Logged out of X ✅";
    }


    return (
        <>
            <Title />
            Bro, we're working on it...⏱

            <div id="login" className={logginClass}>
                {loginText}
                {state.logingIn && <ProgressIcon />}
            </div>
            <div id="scraping" className={scrapingClass}>
                {scrapingText}
                {state.scraping && <ProgressIcon />}
            </div>
            <div id="logout" className={logoutClass}>
                {logoutText}
                {state.loggingOut && <ProgressIcon />}
                </div>
        </>
    )
}