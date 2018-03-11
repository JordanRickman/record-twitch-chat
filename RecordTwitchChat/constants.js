const constants = {
  // Configuration
  VIEW_COUNT_INTERVAL: 10000, // How often in milliseconds to record the count of live viewers
  FILESYSTEM_SIZE: 100*1024*1024 /*100 MB*/, // How many bytes of total storage for the chat logs
  CSV_HEADER_LINE: "Timestamp,User,Message,View Count\n", // Header row for the CSV files

  // CSS Selectors for various elements on a Twitch.tv stream page - you may need to change these if Twitch changes
  SELECTOR_CHAT_LINE: '[data-a-target="chat-line-message"]', // A single line of chat.
  SELECTOR_VIEW_COUNT: '[data-a-target="channel-viewers-count"] > [data-a-target="tw-stat-value"]',  // The view counter
  SELECTOR_CHAT_TIMESTAMP: '[data-a-target="chat-timestamp"]', // The timestamp within a line of chat
  SELECTOR_CHAT_USERNAME: '[data-a-target="chat-message-username"]', // The username within a line of chat
  SELECTOR_CHAT_TEXT_ITEM: '[data-a-target="emote-name"] > img, [data-a-target="chat-message-text"]', // emotes and text <span>s within a line of chat
  SELECTOR_CHAT_EMOTE: '[data-a-target="emote-name"] > img' // An emote <img> within a line of chat
};
