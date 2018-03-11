// Initialize state
let fileSystem = null;
let htmls = [];
let csvs = [];
let last_chat_line = "";

// Request local storage for chat logs
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(window.PERSISTENT, constants.FILESYSTEM_SIZE,
	function(fs) {
		fileSystem = fs;
	});

/**
 * Often, duplicate change events are fired for the same line of chat.
 * I dunno why, but I've only noticed them happening back-to-back.
 * So, by just caching the last chat line seen, we can avoid them.
 */
function chatLineIsDuplicate(chatLineHTML) {
	if (last_chat_line === chatLineHTML)
		return true;
	last_chat_line = chatLineHTML;
	return false;
}

/**
 * Convert a line of chat to a saveable form.
 * Input: the HTML string of the line of chat.
 * Output: an HTML string in a format compatible with the local filesystem.
 */
function toHTML(chatLineHTML) {
	let chatLine = $(chatLineHTML);

	// Add http: to emoticon URLs so they work from local filesystem
	/* After changes to Twitch, this is no longer needed, as the URLs are already absolute.
	 * Also, the selector below will not work.
	let emoticons = $('span.message img.emoticon', chatLine);
	for ( let i =0; i < emoticons.length; i++ ) {
		let emoticon = $(emoticons[i]);
		emoticon.attr('src', 'http:' + emoticon.attr('src'));
		emoticon.attr('srcset', 'http:' + emoticon.attr('srcset'));
	}
	*/

	//console.log("Transformed HTML:\n" + chatLine[0].outerHTML); // DEBUG
	return chatLine[0].outerHTML;
}

/**
 * Convert a line of chat to a line in our csv format.
 * Input: the HTML string of the line of chat.
 * Output: a string for a line of CSV (including an ending newline character)
 */
function toCSV(chatLineHTML) {
	let chatLine = $(chatLineHTML);
	let timestamp = $(constants.SELECTOR_CHAT_TIMESTAMP, chatLine).text();
	let user = $(constants.SELECTOR_CHAT_USERNAME, chatLine).text();

	let messageString = "";
	let chatElements = $(constants.SELECTOR_CHAT_TEXT_ITEM, chatLine);
	for ( let i =0; i < chatElements.length; i++ ) {
		let thisElement = $(chatElements[i]);
		if (thisElement.is(constants.SELECTOR_CHAT_EMOTE)) {
			// This chat element is an emote, replace it with the emote code/title
			let emoteText = '[' + thisElement.attr('alt') + ']';
			messageString += emoteText;
		} else {
			// This is just a span of text
			messageString += thisElement.text();
		}
	}
	messageString = messageString.replace(/\n */g, ' '); // Strip newlines and any indentation that follows them

	let csvLine = timestamp + ',' + user + ',"' + messageString + '",-\n';
	console.log("CSV Line:\n" + csvLine); // DEBUG
	return csvLine;
}

/**
 * Listener for messages sent to the extension. The meat of the logic is here.
 * - StartChatLog: Sent by a Twitch.tv tab when it first opens or on page reload.
 * - ChatLine: Sent by a Twitch.tv tab when a line of chat appears.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if ( request.event && request.event == "StartChatLog" ) {
		console.log("Starting chat log. ID: " + request.id); // DEBUG
		chrome.pageAction.show(sender.tab.id); // Activate the toolbar icon on the Twitch.tv tab

		// Open a new file for the HTML-format chat log
		fileSystem.root.getFile(request.id + ".html", {create: true}, function(fileEntry) {
			htmls[request.id] = fileEntry;
			// Uncomment the line below, and the log will immediately open, rather than waiting for you to click the icon in the toolbar.
			//chrome.tabs.create({url: fileEntry.toURL()}); // DEBUG
		});

		// Open a new file for the CSV-format chat log
		fileSystem.root.getFile(request.id + ".csv", {create: true}, function(fileEntry) {
			csvs[request.id] = fileEntry
			csvs[request.id].createWriter(function(fileWriter) { // Write header row
				fileWriter.seek(fileWriter.length);
				let blob = new Blob([constants.CSV_HEADER_LINE], {type: 'text/plain'});
				fileWriter.write(blob);
				// Uncomment the line below, and the log will immediately open, rather than waiting for you to click the icon in the toolbar.
				//chrome.tabs.create({url: fileEntry.toURL()}); // DEBUG
			});
		});
	}

	if ( request.event && request.event == "ChatLine" ) {
		console.log("Received chat line:\n" + request.html); // DEBUG

		if (chatLineIsDuplicate(request.html))
		{
			console.log("Skipped duplicate line: " + request.html); // DEBUG
			return;
		}

		// Write the line to the HTML log
		htmls[request.id].createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length);
			let transformedHTML = toHTML(request.html);
			let blob = new Blob([transformedHTML], {type: 'text/plain'});
			fileWriter.write(blob);
		});
		// Write the line to the CSV log
		csvs[request.id].createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length);
			let csvLine = toCSV(request.html);
			let blob = new Blob([csvLine], {type: 'text/plain'});
			fileWriter.write(blob);
		});
	}

	if ( request.event && request.event == "UpdateViewCount" ) {
		// Write a line to both HTML and CSV logs recording the timestamp and number of live viewers

		console.log("Received view count:\n" + request.viewCount);
		htmls[request.id].createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length);
			let viewCountHTML = "<li>" + request.timestamp +" [LIVE VIEW COUNT]: " + request.viewCount + "</li>\n";
			let blob = new Blob([viewCountHTML], {type: 'text/plain'});
			fileWriter.write(blob);
		});
		csvs[request.id].createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length);
			let csvViewCount = request.timestamp + ',-,-,"' + request.viewCount + '"\n';
			let blob = new Blob([csvViewCount], {type: 'text/plain'});
			fileWriter.write(blob);
		});
	}
});

/**
 * Listener for when the toolbar icon is clicked.
 * Opens (in new tabs) the HTML and CSV logs for that tab.
 */
chrome.pageAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {event: "SaveLogs"}, function(response) {
		console.log("Received SaveLogs response:\n" + response); // DEBUG
		chrome.tabs.create({url: htmls[response.id].toURL()});
		chrome.tabs.create({url: csvs[response.id].toURL()});
	})
})
