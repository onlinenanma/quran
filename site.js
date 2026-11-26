/* player.js - Handles audio playback, reciter selection, queue management, 
   options panel state, and robust screen wake lock handling. */
(function() {
  'use strict';

  var wakeLockSentinel = null;
  var userWakeToggled = false;

  /* Helper to find screen wake lock checkbox */
  function getWakeCheckbox() {
    var direct = document.getElementById('opt-wake');
    if (direct) return direct;
    var inputs = document.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < inputs.length; i++) {
      var cb = inputs[i];
      var idName = ((cb.id || '') + ' ' + (cb.name || '')).toLowerCase();
      var lblText = ((cb.closest && cb.closest('label') ? cb.closest('label').textContent : '') || '').toLowerCase();
      if (/wake|screen|സ്ക്രീൻ|സ്‌ക്രീൻ/.test(idName + ' ' + lblText)) return cb;
    }
    return null;
  }

  /* Release active screen wake lock */
  function releaseWake() {
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release();
      } catch(e) {}
      wakeLockSentinel = null;
    }
  }
  window.releaseWake = releaseWake;

  /* Request screen wake lock */
  async function requestWake() {
    var cb = getWakeCheckbox();
    if (!cb || !cb.checked) return;
    if (!('wakeLock' in navigator) || !navigator.wakeLock) return;
    if (wakeLockSentinel) return;

    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', function() {
        wakeLockSentinel = null;
      });
    } catch(e) {
      wakeLockSentinel = null;
    }
  }
  window.requestWake = requestWake;

  /* Ensure screen wake is OFF by default on page load & clean up on stop/exit */
  function initPlayerWakeState() {
    // Clear any previously persisted wake preference from localStorage
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && /wake/i.test(k)) localStorage.removeItem(k);
      }
    } catch(e) {}

    function resetWakeCheckbox() {
      if (userWakeToggled) return;
      var cb = getWakeCheckbox();
      if (cb) {
        cb.checked = false;
        cb.removeAttribute('checked');
        if (!cb.getAttribute('data-wake-init')) {
          cb.setAttribute('data-wake-init', '1');
          cb.addEventListener('change', function() {
            userWakeToggled = true;
            if (cb.checked) {
              requestWake();
            } else {
              releaseWake();
            }
          });
        }
      }
      releaseWake();
    }

    resetWakeCheckbox();
    window.addEventListener('load', resetWakeCheckbox);
    window.addEventListener('pageshow', resetWakeCheckbox);

    // MutationObserver to catch dynamically rendered panel controls
    if (typeof MutationObserver !== 'undefined') {
      var root = document.getElementById('panel') || document.body;
      if (root) {
        var obs = new MutationObserver(function() {
          if (!userWakeToggled) resetWakeCheckbox();
        });
        obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['checked'] });
      }
    }

    // Release lock on tab hide / navigate away
    window.addEventListener('pagehide', releaseWake);
    window.addEventListener('beforeunload', releaseWake);
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) releaseWake();
    });
  }

  // Execute initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayerWakeState);
  } else {
    initPlayerWakeState();
  }

  /* Hooks for audio playback termination */
  var origStopAll = window.stopAll;
  window.stopAll = function() {
    releaseWake();
    if (typeof origStopAll === 'function') origStopAll.apply(this, arguments);
  };

  var origStopSpeech = window.stopSpeech;
  window.stopSpeech = function() {
    releaseWake();
    if (typeof origStopSpeech === 'function') origStopSpeech.apply(this, arguments);
  };
})();
