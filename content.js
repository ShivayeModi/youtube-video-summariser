let latestTranscript = null;

function updateStatus(text, type) {
  chrome.storage.local.set({ ytSummaryStatus: { text, type } });
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'YT_CAPTIONS_CAPTURED') {
    console.log('[YT Summary] Captions captured via interception');
    latestTranscript = event.data.transcript;
  }
  if (event.data?.type === 'YT_SUMMARIZER_CAPTIONS_DATA') {
    if (event.data.transcript) {
      latestTranscript = event.data.transcript;
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSummary') {
    console.log('[YT Summary] Message received');
    const videoId = new URLSearchParams(window.location.search).get('v');
    console.log('[YT Summary] Video ID:', videoId);
    if (!videoId) {
      sendResponse({ error: 'Could not get YouTube video ID.' });
      return;
    }

    const cacheKey = `summary_${videoId}`;

    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        console.log('[YT Summary] Cache hit');
        updateStatus('Loaded from cache', 'done');
        sendResponse({ summary: result[cacheKey] });
      } else {
        console.log('[YT Summary] Cache miss, getting transcript...');

        if (latestTranscript && latestTranscript.trim().length > 10) {
          console.log('[YT Summary] Using already captured transcript');
          updateStatus('Captions found, summarizing...', 'loading');
          summarizeTranscript(latestTranscript, videoId, cacheKey, sendResponse);
          return;
        }

        updateStatus('Waiting for captions (enable CC)...', 'waiting');
        console.log('[YT Summary] Requesting captions from inject script...');
        window.postMessage({ type: 'YT_SUMMARIZER_GET_CAPTIONS' }, '*');

        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (latestTranscript && latestTranscript.trim().length > 10) {
            clearInterval(checkInterval);
            console.log('[YT Summary] Got transcript from injection, length:', latestTranscript.length);
            updateStatus('Captions found, summarizing...', 'loading');
            summarizeTranscript(latestTranscript, videoId, cacheKey, sendResponse);
          } else if (attempts >= 10) {
            updateStatus('Waiting for captions...', 'waiting');
          } else if (attempts >= 30) {
            clearInterval(checkInterval);
            updateStatus('No captions found', 'error');
            sendResponse({ error: 'No captions found. Make sure captions/subtitles are enabled on the video (click the CC button).' });
          }
        }, 1000);
      }
    });

    return true;
  }
});

function summarizeTranscript(transcript, videoId, cacheKey, sendResponse) {
  updateStatus('Summarizing with AI...', 'loading');
  summarize(transcript).then(summary => {
    chrome.storage.local.set({ [cacheKey]: summary }, () => {
      updateStatus('Done', 'done');
      sendResponse({ summary: summary });
    });
  }).catch(error => {
    console.error('[YT Summary] Summarize error:', error);
    updateStatus('Server error', 'error');
    sendResponse({ error: error.message });
  });
}

function summarize(text) {
  return new Promise((resolve, reject) => {
    const url = 'https://youtube-video-summariser-ganm.onrender.com/get-summary';

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: text.substring(0, 5000)
      })
    })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server is waking up. Please try again in 30 seconds.');
      }
      return response.json();
    })
    .then(data => {
      if (data.summary) {
        resolve(data.summary);
      } else {
        reject(new Error(data.error ? data.error : 'Could not summarize text.'));
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}
