(() => {
  if (globalThis.__calendarLengthStarted) return;
  globalThis.__calendarLengthStarted = true;
  const eventSelector = '[data-eventid][role="button"], [data-eventid] > [role="button"]';
  const timeSelector = '.Jmftzc.gVNoLb.EiZ8Dd';
  const badgeSelector = '[data-calendar-length]';
  const { duration, format } = globalThis.CalendarLength;
  let queued = false;

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
          times[0].after(badge);
        }
        if (badge.previousElementSibling !== times[0]) times[0].after(badge);
        if (badge.textContent !== format(minutes)) badge.textContent = format(minutes);
        kept.add(badge);
      }
    }
    for (const badge of document.querySelectorAll(badgeSelector)) {
      if (!kept.has(badge)) badge.remove();
    }
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['class', 'role', 'data-eventid', 'aria-label']
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(refresh, 80);
  }

  const observer = new MutationObserver(schedule);
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedule();
    }
  }, 500);
  window.addEventListener('popstate', schedule);
  window.addEventListener('pageshow', schedule);
  refresh();
})();
