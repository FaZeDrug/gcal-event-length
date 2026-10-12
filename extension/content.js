(() => {
  if (globalThis.__calendarLengthStarted) return;
  globalThis.__calendarLengthStarted = true;
  const eventSelector = '[data-eventid][role="button"], [data-eventid] > [role="button"]';
  const timeSelector = '.gVNoLb.EiZ8Dd';
  const badgeSelector = '[data-calendar-length]';
  const { duration, format } = globalThis.CalendarLength;
  let queued = false;
  let started = false;
  let settleTimer;
  let startupLimit;
  const sizedEvents = new Set();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const colors = canvas.getContext('2d', { willReadFrequently: true });

  function contrastColor(element) {
    let rgb = [0, 0, 0];
    let remaining = 1;
    for (let node = element; node && remaining > 0; node = node.parentElement) {
      colors.clearRect(0, 0, 1, 1);
      colors.fillStyle = getComputedStyle(node).backgroundColor;
      colors.fillRect(0, 0, 1, 1);
      const pixel = colors.getImageData(0, 0, 1, 1).data;
      const alpha = pixel[3] / 255;
      rgb = rgb.map((value, i) => value + pixel[i] * alpha * remaining);
      remaining *= 1 - alpha;
    }
    rgb = rgb.map((value) => (value + 255 * remaining) / 255);
    const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    return luminance > 0.179 ? '#000' : '#fff';
  }

  function refresh() {
    queued = false;
    observer.disconnect();
    const active = /\/r\/(day|week)(?:\/|$)/.test(location.pathname);
    const kept = new Set();
    if (active) {
      for (const event of document.querySelectorAll(eventSelector)) {
        if (!event.closest('[role="main"]') || event.closest('[role="dialog"]')) continue;
        if (/\ball[ -]day\b/i.test(event.getAttribute('aria-label') || '')) continue;
        const times = [...event.querySelectorAll(timeSelector)].filter((node) =>
          node.closest(eventSelector) === event && !node.querySelector(timeSelector)
        );
        const parsed = times.map((node) => duration(node.textContent));
        if (parsed.length !== 1 || parsed[0] === null) continue;
        const minutes = parsed[0];
        let badge = event.querySelector(badgeSelector);
        if (!badge) {
          badge = document.createElement('span');
          badge.setAttribute('data-calendar-length', '');
          badge.setAttribute('aria-hidden', 'true');
          badge.dataset.layout = 'hidden';
          times[0].after(badge);
        }
        if (badge.previousElementSibling !== times[0]) times[0].after(badge);
        const color = contrastColor(times[0]);
        if (badge.dataset.color !== color) {
          badge.style.color = color;
          badge.dataset.color = color;
        }
        if (badge.textContent !== format(minutes)) badge.textContent = format(minutes);
        const timeRect = times[0].getBoundingClientRect();
        const eventRect = event.getBoundingClientRect();
        const parentRect = times[0].parentElement.getBoundingClientRect();
        const badgeStyle = getComputedStyle(badge);
        colors.font = `${badgeStyle.fontWeight} ${badgeStyle.fontSize} ${badgeStyle.fontFamily}`;
        const badgeWidth = Math.ceil(colors.measureText(badge.textContent).width) + 8;
        const badgeHeight = 17;
        const bottom = eventRect.bottom - parseFloat(getComputedStyle(event).paddingBottom || 0);
        const available = Math.min(parentRect.right, eventRect.right - parseFloat(getComputedStyle(event).paddingRight || 0)) - timeRect.left;
        const hasLocation = [...event.querySelectorAll('.K9QN7e.EiZ8Dd')].some((node) =>
          node.closest(eventSelector) === event && node.textContent.trim() && node.getClientRects().length && getComputedStyle(node).display !== 'none'
        );
        let layout = 'below';
        if (hasLocation || bottom - timeRect.bottom < badgeHeight + 2) {
          const range = document.createRange();
          range.selectNodeContents(times[0]);
          const textWidth = range.getBoundingClientRect().width;
          if (textWidth + badgeWidth + 6 <= available && timeRect.top + badgeHeight <= bottom) {
            layout = 'inline';
          } else {
            layout = 'hidden';
          }
        } else if (badgeWidth > available) {
          layout = 'hidden';
        }
        if (times[0].hasAttribute('data-calendar-length-inline') !== (layout === 'inline')) times[0].toggleAttribute('data-calendar-length-inline', layout === 'inline');
        if (badge.dataset.layout !== layout) badge.dataset.layout = layout;
        if (!sizedEvents.has(event)) {
          sizedEvents.add(event);
          resizeObserver.observe(event);
        }
        kept.add(badge);
      }
    }
    for (const badge of document.querySelectorAll(badgeSelector)) {
      if (!kept.has(badge)) badge.remove();
    }
    for (const time of document.querySelectorAll('[data-calendar-length-inline]')) {
      if (!kept.has(time.nextElementSibling)) time.removeAttribute('data-calendar-length-inline');
    }
    for (const event of sizedEvents) {
      if (!event.isConnected || !event.querySelector(badgeSelector)) {
        resizeObserver.unobserve(event);
        sizedEvents.delete(event);
      }
    }
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'style', 'role', 'data-eventid', 'aria-label']
    });
  }

  function schedule() {
    if (!started) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(start, 250);
      return;
    }
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function start() {
    if (started) return;
    started = true;
    clearTimeout(settleTimer);
    clearTimeout(startupLimit);
    schedule();
  }

  const observer = new MutationObserver(schedule);
  const resizeObserver = new ResizeObserver(schedule);
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedule();
    }
  }, 500);
  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  observer.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'style', 'role', 'data-eventid', 'aria-label']
  });
  startupLimit = setTimeout(start, 2000);
  schedule();
})();
