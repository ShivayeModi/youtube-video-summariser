function parseMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<(h2|h3|ul|blockquote)>/g, '<$1>');
  html = html.replace(/<\/(h2|h3|ul|blockquote)>\s*<\/p>/g, '</$1>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

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
    summaryDiv.innerHTML = '';
    summaryDiv.classList.remove('spinner');
    return;
  }

  chrome.tabs.sendMessage(tabs[0].id, { type: 'getSummary' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Refresh the YouTube page and try again', 'error');
      summaryDiv.innerHTML = '';
      summaryDiv.classList.remove('spinner');
      return;
    }
    if (response && response.summary) {
      chrome.storage.local.set({ summary: response.summary }, () => {
        summaryDiv.innerHTML = parseMarkdown(response.summary);
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
