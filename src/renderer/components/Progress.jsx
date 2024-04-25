import React from "react";
import { Title } from "./Title";

export const Progress = ({ state }) => {
    let logginClass = "text-gray-400";
    let loginText = "Will log into X.";

    let scrapingClass = "text-gray-400";
    let scrapingText = "Will scrape tweets."
    
    if (state.logingIn) {
        logginClass = "text-blue-500";
        loginText = "Logging into X...";
    }
    else if (state.loggedIn) {
        logginClass = "text-blue-500";
        loginText = "Logged into X ✅";
    }

    if(state.scraping){
        scrapingClass = "text-blue-500";
        scrapingText = "Scraping bookmarks " + state.data;
    }
    else if (state.scraped){
        scrapingClass = "text-blue-500";
        scrapingText = "Scraped bookmarks ✅";
    }

    const logoutClass = !state.logout ? "text-gray-400" : "text-blue-500";
    const logoutText = !state.logout ? "Logging out of X..." : "Logged out of X ✅";

    return (
        <>
            <Title />
            Bro, we're working on it...⏱

            <div id="login" className={logginClass}>{loginText}</div>
            <div id="scraping" className={scrapingClass}>{scrapingText}</div>
            <div id="logout" className={logoutClass}>{logoutText}</div>
        </>
    )
}