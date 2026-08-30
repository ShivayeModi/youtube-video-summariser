(() => {
  const capturedCaptions = {};

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function parseXML(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const texts = doc.querySelectorAll('text');
    const segments = [];
    let currentTime = 0;
    for (const node of texts) {
      const start = parseFloat(node.getAttribute('start')) || currentTime;
      const text = node.textContent.trim();
      if (text) {
        segments.push(`[${formatTime(start)}] ${text}`);
        currentTime = start;
      }
    }
    return segments.join(' ');
  }

  function parseJSON3(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      const segments = [];
      for (const e of (data.events || [])) {
        if (e.tStartMs != null && e.segs) {
          const start = e.tStartMs / 1000;
          const text = e.segs.map(s => s.utf8 || '').join('').trim();
          if (text) {
            segments.push(`[${formatTime(start)}] ${text}`);
          }
        }
      }
      return segments.join(' ');
    } catch {
      return null;
    }
  }

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (url.includes('/api/timedtext') || url.includes('timedtext')) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        if (text && text.length > 10) {
          let transcript = null;
          if (url.includes('fmt=json3')) {
            transcript = parseJSON3(text);
          } else {
            transcript = parseXML(text);
          }
          if (transcript && transcript.trim().length > 10) {
            const urlObj = new URL(url, window.location.origin);
            const lang = urlObj.searchParams.get('lang') || 'en';
            capturedCaptions[lang] = transcript;
            window.postMessage({ type: 'YT_CAPTIONS_CAPTURED', transcript }, '*');
          }
        }
      } catch {}
    }
    return response;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      if (this._url && (this._url.includes('/api/timedtext') || this._url.includes('timedtext'))) {
        try {
          const text = this.responseText;
          if (text && text.length > 10) {
            let transcript = null;
            if (this._url.includes('fmt=json3')) {
              transcript = parseJSON3(text);
            } else {
              transcript = parseXML(text);
            }
            if (transcript && transcript.trim().length > 10) {
              const urlObj = new URL(this._url, window.location.origin);
              const lang = urlObj.searchParams.get('lang') || 'en';
              capturedCaptions[lang] = transcript;
              window.postMessage({ type: 'YT_CAPTIONS_CAPTURED', transcript }, '*');
            }
          }
        } catch {}
      }
    });
    return origSend.apply(this, args);
  };

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'YT_SUMMARIZER_GET_CAPTIONS') {
      const transcripts = Object.values(capturedCaptions);
      const best = transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;
      window.postMessage({ type: 'YT_SUMMARIZER_CAPTIONS_DATA', transcript: best }, '*');
    }
  });
})();
