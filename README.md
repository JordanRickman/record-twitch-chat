# RecordTwitchChat Chrome Extension

This is a Google Chrome extension for recording chat on [Twitch.tv](https://www.twitch.tv/). It saves all lines of chat, including username and timestamp, in both HTML and CSV format. Additionally, it records the count of live viewers at ten-second intervals. It can record Twitch chat from multiple streams open simultaneously (in browser tabs).

The HTML format will be identical HTML source code to the chat elements as they appear on Twitch. CSS files will not be included, so formatting and colors will look different. However, Twitch emotes should be rendered the same. You can probably get the HTML log to open in Microsoft Word, Google Docs, or other word processors, or copy/paste sections into them. You can also print to PDF.

CSV is a simple spreadsheet format and can be opened by Microsoft Excel, Google Sheets, and similar applications. The CSV logs will have four columns:
- **Timestamp** The time at which the chat occurred, including hours and minutes (the format in which Twitch displays the time).
- **User** The username of the user who sent the message.
- **Message** The message text. Emotes are included as the emote name/code surrounded by [square brackets].
- **View Count** A count of the live viewers at this point in time. For most rows in the spreadsheet, this will be blank. Every ten seconds, the live view count is recorded with a line in which only this column and the timestamp column are filled in. A live view count message is also recorded in the HTML file every ten seconds.

:warning:_This extension may break at any time!_:warning: This extension does not use any public-facing API that Twitch has committed to maintaining for developers to use. Rather, it is a "screen-scraping" application; it grabs chat messages directly from the stream page, by knowing the structure and pattern of HTML that Twitch uses for its chat feature. A company like Twitch is constantly tweaking and updating their web app, and could make changes to their HTML layout that breaks some or all of this extensions features.

### License
This software is licensed open-source under the [Apache License, version 2.0](https://www.apache.org/licenses/LICENSE-2.0). You can find a copy of the license as the file named LICENSE at the root of this repository.

### Dependencies
Thank you to the following open-source projects that this extension makes use of:
- Moment.js http://momentjs.com/, MIT License
- jQuery https://jquery.com/, Apache License v2.0
- mutation-summary https://github.com/rafaelw/mutation-summary, Apache License v2.0

## Usage
This Chrome extension has not been registered with the Google Chrome webstore, so you will need to enable developer mode extensions to use it. (And you should get a developer friend to glance over the source code and verify that it won't steal your passwords or credit card number.)

1. Download the repository as a ZIP file from the "Clone or Download" button at the top of the page. Unzip the file and move its contents wherever you want to keep them.
2. Open the Chrome menu (three dots in the upper right), and select "More Tools" > "Extensions".
3. Check the box at the top for "Developer mode".
4. You should now see a button that says "Load unpacked extension...". Click it.
5. Navigate to wherever you put the unzipped project contents, and select the folder named **RecordTwitchChat**.
6. Now that the extension is installed, you should see an icon in your toolbar at the top consisting of a grey square with a capital-letter "R" inside. Unless you are on a Twitch.tv page, the icon will be inactive and cannot be clicked.
6. Open any Twitch stream, live or archived. The toolbar icon should become a darker color. As soon as the page loads, the extension is recording chat.
7. Click the toolbar icon. Two new tabs should open, one containing the HTML logs, and the other one containing the CSV logs. Refresh the page on either of these two tabs, and they will be updated with the latest chat.
8. To save a chat log to your computer, simply press Ctrl-S (Cmd-S on a Mac), or go to Chrome Menu > More Tools > Save Page As. _You will need to save the logs in this way - you cannot bookmark the URL._ Until you save it manually like this, the chat log is a temporary file, and it will be lost when you close or restart Chrome.

Twitch streams can of course be very long-running, and the only way to record the whole thing using this extension is to leave it open in a browser tab on your desktop for the whole time. :weary: Make sure you have a reliable internet connection, and don't press the refresh button. Also, the extension defaults to a maximum of 100MB of storage space for the logs. That should be plenty, but if you need more, see information about **constants.js** in the section below. Also, its a good idea to restart your browser in between recording sessions, as this will empty old log files out of that 100MB of storage (make sure you've saved them!).

## Development and Configuration

This section is for developers who wish to extend or improve this software (or fix it when Twitch changes their web app). You should read up on the [Google Chrome extension development documentation](https://developer.chrome.com/extensions/devguide).

The extension structure has a single background page, as well as injecting Javascript code into every webpage on the Twitch.tv domain.

The injected code watches for page changes. If a page change looks like a line of chat being inserted, it captures the line as an HTML string and sends it to the background page via Chrome's message-passing mechanism. Similarly, every ten seconds it grabs the live view count from the page and sends it to the background page in a message.

The background page generates chat logs in the temporary filesystem that Chrome allows extensions to use. It listens for messages from the injected code, converts the HTML to CSV, and writes both the CSV and the original HTML to the chat log files. Each open Twitch.tv tab is given a separate pair of log files, and is identified and tracked by a randomly-generated guid (a UUID v4 according to [RFC 4122](https://tools.ietf.org/html/rfc4122.html)). Each message sent from the injected code includes the guid for that tab.

All extension files live in the **RecordTwitchChat** directory.
- Third-party libraries: **jquery-2.2.3.min.js**, **moment.min.js**, and **mutation-summary.js**.
- **manifest.json** is the manifest file that tells Chrome how to configure the extension.
- **chat-capture.js** is injected into all Twitch.tv pages (along with its dependencies).
- **main.js** runs in the background page (along with its dependencies).
- **constants.js** is a dependency for both **main.js** and **chat-capture.js**. It contains configurable constants such as how often to record the live view count, and how much filesystem space to reserve for the logs. It also contains CSS selectors for various elements on the Twitch page - if Twitch changes things and breaks the extension, you may only need to change these selectors to get it working again.
