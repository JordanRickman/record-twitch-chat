// Define function to generate guid
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

// Assign this Chrome tab a unique guid
RecordTwitchChat_page_id = guid();
console.log("PAGE ID: " + RecordTwitchChat_page_id);
// Tell the extension about this tab
chrome.runtime.sendMessage({
	event: "StartChatLog",
	id: RecordTwitchChat_page_id
});

/**
 * Send a message to the extension for a single line of chat.
 * Input: The DOM element for the line of chat.
 */
function processElement(elem) {
	//console.log("Sending ChatLine:\n"+elem.outerHTML); //DEBUG
	chrome.runtime.sendMessage({
		event: "ChatLine",
		id: RecordTwitchChat_page_id,
		html: elem.outerHTML
	});
}

/**
 * Handle a summary of changes from the mutation-summary API.
 * Picks out the changes we care about, and sends them to the extension.
 */
function processElements(response) {
	for ( let i = 0; i < response.length; i++ ) {
		summary = response[i];
		if ( summary.added ) {
			for ( let j = 0; j < summary.added.length; j++ ) {
				processElement(summary.added[i]);
			}
		}
	}
}

// Register an observer with the mutation-summary API for the chat lines
// See documentation: https://github.com/rafaelw/mutation-summary
let observer = new MutationSummary({
	callback: processElements,
	queries: [
		{
			element: constants.SELECTOR_CHAT_LINE
		}
	]
});

// Listener for when the user clicks the extension's icon in the toolbar.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if ( request.event && request.event == "SaveLogs" ) {
		console.log("Received SaveLogs request."); // DEBUG
		sendResponse({
			event: "SaveLogs",
			id: RecordTwitchChat_page_id
		});
	}
})

// Captures the count of live viewers every 10 seconds
setInterval(function() {
	let selector = $(constants.SELECTOR_VIEW_COUNT);
	if ( selector.length > 0 ) {
		let timestamp = moment().format('h:mm'); // Record the current time.
		chrome.runtime.sendMessage({ // Send a message to the extension
			event: "UpdateViewCount",
			viewCount: selector.text().trim(),
			timestamp: timestamp,
			id: RecordTwitchChat_page_id
		});
	}

}, constants.VIEW_COUNT_INTERVAL);
