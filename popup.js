const summaryDiv = document.getElementById('summary');
const openInTabBtn = document.getElementById('open-in-tab-btn');

// Fetch and display the summary
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: 'getSummary' }, (response) => {
    if (chrome.runtime.lastError) {
      summaryDiv.innerText = 'Error: Could not connect to the content script. Please refresh the YouTube page.';
      summaryDiv.classList.add('error-message');
      return;
    }
    if (response && response.summary) {
      // Save summary to storage for the new tab page
      chrome.storage.local.set({ summary: response.summary }, () => {
        summaryDiv.innerText = response.summary;
        openInTabBtn.style.display = 'block'; // Show the button
      });
    } else if (response && response.error) {
      summaryDiv.innerText = `Error: ${response.error}`;
      summaryDiv.classList.add('error-message');
    } else {
      summaryDiv.innerText = 'No summary available.';
    }
  });
});

// Handle button click to open summary in a new tab
openInTabBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('summary.html') });
});