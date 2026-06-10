// Peacock Ad Speedup - content.js
//
// ── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  adSpeed:     16,   // playbackRate during ads  (try 8 if audio glitches)
  normalSpeed:  1,   // playbackRate after ads
  checkMs:    400,   // how often to poll for ad state (ms)
};
// ─────────────────────────────────────────────────────────────────────────────

// The countdown timer Peacock renders during ad breaks.
// This is the only reliable indicator found in Peacock's DOM.
const AD_SELECTOR = '[data-testid="countdown"]';

// ── State ─────────────────────────────────────────────────────────────────────
let adActive = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVideo() {
  return document.querySelector('video');
}

function setSpeed(speed) {
  const v = getVideo();
  if (v && v.playbackRate !== speed) {
    v.playbackRate = speed;
    showToast(speed);
    console.log(`[PeacockAdSpeedup] playbackRate → ${speed}x`);
  }
}

function showToast(speed) {
  let toast = document.getElementById('__peacock_ad_toast__');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__peacock_ad_toast__';
    Object.assign(toast.style, {
      position:      'fixed',
      top:           '64px',
      right:         '20px',
      background:    'rgba(0,0,0,0.75)',
      color:         '#fff',
      padding:       '7px 14px',
      borderRadius:  '6px',
      fontSize:      '13px',
      fontFamily:    'sans-serif',
      fontWeight:    '600',
      zIndex:        '2147483647',
      pointerEvents: 'none',
      transition:    'opacity 0.3s',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = speed > 1 ? `⏩ Ad — ${speed}×` : `▶ ${speed}× restored`;
  toast.style.opacity = '1';
  clearTimeout(toast._hide);
  toast._hide = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ── Poll loop ─────────────────────────────────────────────────────────────────
setInterval(() => {
  const nowAd = !!document.querySelector(AD_SELECTOR);

  if (nowAd && !adActive) {
    adActive = true;
    console.log('[PeacockAdSpeedup] Ad started');
    setSpeed(CONFIG.adSpeed);
  } else if (!nowAd && adActive) {
    adActive = false;
    console.log('[PeacockAdSpeedup] Ad ended');
    setSpeed(CONFIG.normalSpeed);
  }

  // Re-apply each tick while ad is active in case the player resets the rate
  if (adActive) {
    const v = getVideo();
    if (v && v.playbackRate !== CONFIG.adSpeed) {
      v.playbackRate = CONFIG.adSpeed;
    }
  }
}, CONFIG.checkMs);

// ── SPA navigation reset ──────────────────────────────────────────────────────
let lastHref = location.href;
new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    adActive = false;
    console.log('[PeacockAdSpeedup] Navigation detected — state reset');
  }
}).observe(document, { subtree: true, childList: true });

console.log('[PeacockAdSpeedup] Active ✓');
