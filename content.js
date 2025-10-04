chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSummary') {
    getTranscript().then(transcript => {
      summarize(transcript).then(summary => {
        sendResponse({ summary: summary });
      }).catch(error => {
        sendResponse({ error: error.message });
      });
    }).catch(error => {
      sendResponse({ error: error.message });
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
    // For local development, replace 'YOUR_GEMINI_API_KEY' with your actual key.
    // For production, consider a build step to inject the key or use client-side storage.
    const apiKey = 'YOUR_GEMINI_API_KEY'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Summarize the following YouTube video transcript:\n\n${text}`
          }]
        }]
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        resolve(data.candidates[0].content.parts[0].text);
      } else {
        reject(new Error(data.error ? data.error.message : 'Could not summarize text.'));
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}