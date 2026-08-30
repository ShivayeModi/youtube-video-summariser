function sanitizeHTML(html) {
  const allowed = ['h2', 'h3', 'p', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'blockquote', 'br'];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  function clean(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        if (!allowed.includes(tag)) {
          child.replaceWith(...child.childNodes);
        } else {
          [...child.attributes].forEach(a => child.removeAttribute(a.name));
          clean(child);
        }
      }
    }
  }
  clean(doc.body);
  return doc.body.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const summaryContentDiv = document.getElementById('summary-content');
  chrome.storage.local.get(['summary'], (result) => {
    if (result.summary) {
      summaryContentDiv.innerHTML = sanitizeHTML(result.summary);
    } else {
      summaryContentDiv.innerText = 'No summary found in storage.';
    }
  });
});
