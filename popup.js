chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: 'getSummary' }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('summary').innerText = 'Error: Could not connect to the content script. Please make sure you are on a YouTube video page and refresh the page.';
      return;
    }
    if (response && response.summary) {
      document.getElementById('summary').innerText = response.summary;
    } else if (response && response.error) {
      document.getElementById('summary').innerText = `Error: ${response.error}`;
    } else {
      document.getElementById('summary').innerText = 'No summary available.';
    }
  });
});
