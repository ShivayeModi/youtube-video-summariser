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
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<(h2|h3|ul|blockquote)>/g, '<$1>');
  html = html.replace(/<\/(h2|h3|ul|blockquote)>\s*<\/p>/g, '</$1>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

document.addEventListener('DOMContentLoaded', () => {
  const summaryContentDiv = document.getElementById('summary-content');
  chrome.storage.local.get(['summary'], (result) => {
    if (result.summary) {
      summaryContentDiv.innerHTML = parseMarkdown(result.summary);
    } else {
      summaryContentDiv.innerText = 'No summary found in storage.';
    }
  });
});
