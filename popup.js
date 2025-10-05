chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: 'getSummary' }, (response) => {
    const summaryDiv = document.getElementById('summary');
    if (chrome.runtime.lastError) {
      summaryDiv.innerText = 'Error: Could not connect to the content script. Please refresh the YouTube page.';
      summaryDiv.classList.add('error-message');
      return;
    }
    if (response && response.summary) {
      summaryDiv.innerText = response.summary;
    } else if (response && response.error) {
      summaryDiv.innerText = `Error: ${response.error}`;
      summaryDiv.classList.add('error-message');
    } else {
      summaryDiv.innerText = 'No summary available.';
    }
  });
});