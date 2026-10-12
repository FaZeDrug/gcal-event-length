(() => {
  if (globalThis.__calendarLengthStarted) return;
  globalThis.__calendarLengthStarted = true;
  const eventSelector = '[data-eventid][role="button"], [data-eventid] > [role="button"]';
  const timeSelector = '.gVNoLb.EiZ8Dd';
  const badgeSelector = '[data-calendar-length]';
  const { duration, format } = globalThis.CalendarLength;
  let queued = false;
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
    for (const time of document.querySelectorAll('[data-calendar-length-inline]')) time.removeAttribute('data-calendar-length-inline');
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
          times[0].after(badge);
        }
        if (badge.previousElementSibling !== times[0]) times[0].after(badge);
        badge.style.color = contrastColor(times[0]);
        if (badge.textContent !== format(minutes)) badge.textContent = format(minutes);
        badge.dataset.layout = 'below';
        badge.style.visibility = 'hidden';
        const timeRect = times[0].getBoundingClientRect();
        const eventRect = event.getBoundingClientRect();
        const badgeRect = badge.getBoundingClientRect();
        const bottom = eventRect.bottom - parseFloat(getComputedStyle(event).paddingBottom || 0);
        if (bottom - timeRect.bottom < badgeRect.height + 2) {
          const range = document.createRange();
          range.selectNodeContents(times[0]);
          const textWidth = range.getBoundingClientRect().width;
          const available = Math.min(timeRect.right, eventRect.right) - timeRect.left;
          if (textWidth + Math.max(badgeRect.width, badge.scrollWidth + 2) + 6 <= available && timeRect.top + badgeRect.height <= bottom) {
            times[0].setAttribute('data-calendar-length-inline', '');
            badge.dataset.layout = 'inline';
          } else {
            badge.dataset.layout = 'hidden';
          }
        } else if (badge.scrollWidth > badge.clientWidth) {
          badge.dataset.layout = 'hidden';
        }
        badge.style.visibility = '';
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
    if (queued) return;
    queued = true;
    setTimeout(refresh, 80);
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
  refresh();
})();
