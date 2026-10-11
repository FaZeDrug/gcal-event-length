(() => {
  const time = '(?:noon|midnight|\\d{1,2}(?::\\d{2})?\\s*(?:[ap]\\.?m\\.?)?)';
  const range = new RegExp(`^(${time})\\s*(?:[–—-]|to)\\s*(${time})$`, 'i');

  function parseTime(text) {
    if (text === 'noon') return { hour: 12, minute: 0, period: 'pm' };
    if (text === 'midnight') return { hour: 12, minute: 0, period: 'am' };
    const match = /^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/.exec(text)
      || /^(\d{1,2})(?::(\d{2}))?$/.exec(text);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const period = match[3] ? `${match[3]}m` : null;
    if (minute > 59 || hour > (period ? 12 : 23) || (period && hour < 1)) return null;
    return { hour, minute, period, colon: match[2] !== undefined };
  }

  function duration(text) {
    const match = range.exec(text.toLowerCase().replace(/[\u00a0\u202f]/g, ' ').trim());
    if (!match) return null;
    const start = parseTime(match[1].trim());
    const end = parseTime(match[2].trim());
    if (!start || !end) return null;
    if (start.period && !end.period) return null;
    if (!start.period && end.period) {
      if (start.hour < 1 || start.hour > 12) return null;
      start.period = end.period;
    }
    if (!start.period && (!start.colon || !end.colon)) return null;
    const minutes = (t) => (t.period ? t.hour % 12 + (t.period === 'pm' ? 12 : 0) : t.hour) * 60 + t.minute;
    const result = minutes(end) - minutes(start);
    return result > 0 ? result : null;
  }

  function format(minutes) {
    return [minutes >= 60 ? `${Math.floor(minutes / 60)}h` : '', minutes % 60 ? `${minutes % 60}m` : ''].filter(Boolean).join(' ');
  }

  globalThis.CalendarLength = Object.freeze({ duration, format });
})();
