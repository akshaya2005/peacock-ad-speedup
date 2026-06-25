// Peacock Ad Speedup - content.js
//
// ── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  adSpeed:      16,   // playbackRate during ads  (try 8 if audio glitches)
  defaultSpeed:  1,   // normal playback speed, used until the user picks one
  checkMs:     100,   // how often to poll for ad state (ms)
};
const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const STORAGE_KEY = 'peacockAdSpeedup.normalSpeed';
// ─────────────────────────────────────────────────────────────────────────────

// The countdown timer Peacock renders during ad breaks.
// This is the only reliable indicator found in Peacock's DOM.
const AD_SELECTOR = '[data-testid="countdown"]';

// ── State ─────────────────────────────────────────────────────────────────────
let adActive = false;
// User-chosen normal speed, set via the on-page control — not inferred from
// the video element, since the player can't be trusted to hold a stable rate.
let normalSpeed = Number(localStorage.getItem(STORAGE_KEY)) || CONFIG.defaultSpeed;

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

function buildSpeedControl() {
  // guard to prevent multiple instances of the control
  if (document.getElementById('__peacock_speed_control__')) return;

  const box = document.createElement('div');
  box.id = '__peacock_speed_control__';
  // style the control box
  Object.assign(box.style, {
    position:      'fixed',
    top:           '20px',
    right:         '20px',
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
    background:    'rgba(0,0,0,0.75)',
    color:         '#fff',
    padding:       '6px 10px',
    borderRadius:  '6px',
    fontSize:      '13px',
    fontFamily:    'sans-serif',
    fontWeight:    '600',
    zIndex:        '2147483647',
  });

  const label = document.createElement('span');
  label.textContent = 'Speed';
  box.appendChild(label);

  const select = document.createElement('select');
  Object.assign(select.style, {
    background:   '#222',
    color:        '#fff',
    border:       'none',
    borderRadius: '4px',
    fontSize:     '13px',
    padding:      '2px 4px',
  });
  SPEED_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `${s}×`;
    if (s === normalSpeed) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    normalSpeed = Number(select.value);
    localStorage.setItem(STORAGE_KEY, normalSpeed);
    console.log(`[PeacockAdSpeedup] normalSpeed → ${normalSpeed}x`);
    if (!adActive) setSpeed(normalSpeed);
  });
  box.appendChild(select);

  document.body.appendChild(box);
}

// ── Poll loop ─────────────────────────────────────────────────────────────────
setInterval(() => {
  const v = getVideo();
  const nowAd = !!document.querySelector(AD_SELECTOR);

  if (nowAd && !adActive) {
    adActive = true;
    console.log('[PeacockAdSpeedup] Ad started');
  } else if (!nowAd && adActive) {
    adActive = false;
    console.log('[PeacockAdSpeedup] Ad ended');
  }
  // Re-apply every tick (not just on the transition edge) since the player
  // can reset playbackRate asynchronously — e.g. on src swap — after we've
  // already corrected it once. This keeps both the ad and normal speed
  // self-healing instead of being a one-shot, fire-and-hope assignment.
  if (v) {
    setSpeed(adActive ? CONFIG.adSpeed : normalSpeed);
  }
}, CONFIG.checkMs);

buildSpeedControl();

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
