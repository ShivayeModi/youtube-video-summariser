document.addEventListener('DOMContentLoaded', () => {
  const summaryContentDiv = document.getElementById('summary-content');
  chrome.storage.local.get(['summary'], (result) => {
    if (result.summary) {
      summaryContentDiv.innerText = result.summary;
    } else {
      summaryContentDiv.innerText = 'No summary found in storage.';
    }
  });
});