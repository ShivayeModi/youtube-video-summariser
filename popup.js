const summaryDiv = document.getElementById('summary');
const openInTabBtn = document.getElementById('open-in-tab-btn');
const statusDiv = document.getElementById('status');

function setStatus(text, type) {
  const dots = { waiting: 'dot-waiting', loading: 'dot-loading', done: 'dot-done', error: 'dot-error' };
  statusDiv.innerHTML = `<span class="dot ${dots[type] || ''}"></span>${text}`;
}

setStatus('Connecting to page...', 'loading');

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.ytSummaryStatus) {
    const { text, type } = changes.ytSummaryStatus.newValue || {};
    if (text) setStatus(text, type || 'loading');
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.url?.includes('youtube.com/watch')) {
    setStatus('Open a YouTube video to summarize', 'waiting');
    summaryDiv.innerText = '';
    summaryDiv.classList.remove('spinner');
    return;
  }

  chrome.tabs.sendMessage(tabs[0].id, { type: 'getSummary' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Refresh the YouTube page and try again', 'error');
      summaryDiv.innerText = '';
      summaryDiv.classList.remove('spinner');
      return;
    }
    if (response && response.summary) {
      chrome.storage.local.set({ summary: response.summary }, () => {
        summaryDiv.innerText = response.summary;
        summaryDiv.classList.remove('spinner');
        openInTabBtn.style.display = 'block';
        setStatus('Done', 'done');
      });
    } else if (response && response.error) {
      summaryDiv.innerText = `Error: ${response.error}`;
      summaryDiv.classList.add('error-message');
      summaryDiv.classList.remove('spinner');
      setStatus('Failed', 'error');
    } else {
      summaryDiv.innerText = 'No summary available.';
      summaryDiv.classList.remove('spinner');
    }
  });
});

openInTabBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('summary.html') });
});
