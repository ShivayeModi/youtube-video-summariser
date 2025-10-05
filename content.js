chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSummary') {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
      sendResponse({ error: 'Could not get YouTube video ID.' });
      return;
    }

    const cacheKey = `summary_${videoId}`;

    // Check cache first
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        // Cache hit
        sendResponse({ summary: result[cacheKey] });
      } else {
        // Cache miss
        getTranscript().then(transcript => {
          summarize(transcript).then(summary => {
            // Save to cache
            chrome.storage.local.set({ [cacheKey]: summary }, () => {
              sendResponse({ summary: summary });
            });
          }).catch(error => {
            sendResponse({ error: error.message });
          });
        }).catch(error => {
          sendResponse({ error: error.message });
        });
      }
    });

    return true; // Indicates that the response is sent asynchronously
  }
});

function getTranscript() {
  return new Promise((resolve, reject) => {
    const transcriptButton = document.querySelector('ytd-video-description-transcript-section-renderer.style-scope:nth-child(3) > div:nth-child(3) > div:nth-child(1) > ytd-button-renderer:nth-child(1) > yt-button-shape:nth-child(1) > button:nth-child(1) > yt-touch-feedback-shape:nth-child(2)');
    if (transcriptButton) {
      transcriptButton.click();
      setTimeout(() => { // Wait for the transcript to load
        const transcriptContainer = document.querySelector('ytd-transcript-renderer');
        if (transcriptContainer) {
          const transcriptText = Array.from(transcriptContainer.querySelectorAll('ytd-transcript-segment-renderer')).map(segment => segment.innerText).join(' ');
          resolve(transcriptText);
        } else {
          reject(new Error('Could not find transcript container.'));
        }
      }, 1000);
    } else {
      reject(new Error('Could not find transcript button.'));
    }
  });
}

function summarize(text) {
  return new Promise((resolve, reject) => {
    const url = 'http://localhost:3000/get-summary';

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: text
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.summary) {
        resolve(data.summary);
      } else {
        reject(new Error(data.error ? data.error.message : 'Could not summarize text.'));
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}