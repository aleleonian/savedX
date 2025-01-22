
# X Bookmark Manager

A cross-platform Electron application, built with React and Puppeteer, for scraping and managing your **X** (formerly Twitter) bookmarks. This app logs into your X account, scrapes all your saved bookmarks, optionally downloads any multimedia files, and can even delete bookmarks after scraping, all in a simple, user-friendly interface.

## Table of Contents

-   [Features](#features)
-   [Requirements](#requirements)
-   [Installation](#installation)
-   [Usage](#usage)
-   [File Storage & Configuration](#file-storage--configuration)
-   [Security and Privacy](#security-and-privacy)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)
-   [License](#license)

----------

## Features

-   **Scrape Bookmarks**: Automatically logs in and gathers all your saved bookmarks from X.
-   **Download Media**: Optionally download images, GIFs, and videos associated with your bookmarks.
-   **Delete Bookmarks**: Promptly remove your scraped bookmarks from your X account if desired.
-   **User-Friendly UI**: Built with React and Electron for a desktop-friendly user experience.
-   **Cross-Platform**: Works on macOS, Windows, and Linux.

----------

## Requirements

-   **Node.js** (Version 16 or above recommended)
-   **npm**
-   **X Account** (To authenticate and scrape bookmarks)

----------

## Installation

1.  **Clone the repository**:
    
    bash
    
    Copy
    
    `git clone https://github.com/YourUsername/your-repo-name.git
    cd your-repo-name` 
    
2.  **Install dependencies**:
    
    bash
    
    Copy
    
    `npm install` 
    
    or
    
    bash
    
    Copy
    
    `yarn` 
    

----------

## Usage

### Development

1.  **Run the app in development mode**:
    
    bash
    
    Copy
    
    `npm run start` 
    
    This command starts the Electron app and opens the development environment.
    
2.  **Open DevTools** if you need to debug React or Electron code:
    
    text
    
    Copy
    
    `Ctrl+Shift+I (Windows/Linux), or Cmd+Option+I (macOS)` 
    

### Production Build

1.  **Create the production build**:
    
    bash
    
    Copy
    
    `npm run make` 
    
    or for a web-only build (if configured):
    
    bash
    
    Copy
    
    `npm run build` 
    
2.  **Install or run the packaged app** based on your platform:
    -   macOS: `.dmg` or `.zip`
    -   Windows: `.exe`
    -   Linux: `.deb`/`.rpm` (depending on your configuration)

----------

## File Storage & Configuration

### Data Folder

All the app’s data is stored in **`~/savedX`** (the `savedX` folder in your user’s home directory):

-   **`Media`** folder: Stores downloaded images, GIFs, and videos from your bookmarks.
-   **`.env`** file: Contains environment variables to configure debugging and Puppeteer’s headless mode.
-   **`savedX.db`**: Local SQLite database containing your scraped bookmark data.

### Environment Variables

In your **`.env`** file (located in `~/savedX/.env`), you can set:

1.  **`DEBUG`**:
    
    -   If `true`, detailed debugging logs will be written to a log file (e.g., `my-log-file.log`) for troubleshooting.
    -   If `false`, logging is minimal.
2.  **`XBOT_HEADLESS`**:
    
    -   If `true`, Puppeteer (the remote-controlled browser) will run headlessly (without showing a browser window).
    -   If `false`, the browser window will be visible during scraping.

Example **`.env`** file:

ini

Copy

`DEBUG=false
XBOT_HEADLESS=false` 

----------

## Security and Privacy

-   **Login Info**: You’ll need to provide your X login details for scraping. The app will store these in `~/savedX` or use them temporarily for the session. Ensure you trust this software.
-   **Local Storage**: Bookmarks data and media files are saved locally and never uploaded elsewhere.
-   **Encryption**: Consider storing sensitive credentials or data in a secure/encrypted manner if security is a concern.

----------

## Troubleshooting

-   **Missing Modules**: If you see an error about missing modules:
    
    bash
    
    Copy
    
    `rm -rf node_modules
    npm install` 
    
-   **Scraping Issues**: Ensure your `.env` variables (`DEBUG`, `XBOT_HEADLESS`) are set correctly. If the browser fails to launch, install the required system dependencies for Puppeteer (e.g., `libX11` on Linux).
-   **Platform-Specific Errors**: On macOS, you may need to remove the quarantine attribute for the binary:
    
    bash
    
    Copy
    
    `xattr -rd com.apple.quarantine /path/to/yourApp.app` 
    

----------

## Contributing

1.  **Fork the repository**.
2.  **Create a new branch**:
    
    bash
    
    Copy
    
    `git checkout -b feature/amazing-feature` 
    
3.  **Commit changes**:
    
    bash
    
    Copy
    
    `git commit -m "Add amazing feature"` 
    
4.  **Push to the branch**:
    
    bash
    
    Copy
    
    `git push origin feature/amazing-feature` 
    
5.  **Create a Pull Request** in the main repository.

----------

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

----------

## Thank You

We appreciate your interest in **X Bookmark Manager**! If you have any questions or feedback, please open an issue or submit a pull request. Enjoy streamlined scraping and organizing of your X bookmarks!