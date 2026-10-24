# Privacy policy — Google Calendar Event Length

Effective date: October 12, 2026. Applies to version 0.6.1.

Google Calendar Event Length is an independent browser extension and is not affiliated with or endorsed by Google.

## Data used on your device

The extension accesses Google Calendar page content on `https://calendar.google.com/*`. It reads displayed event time ranges and nearby event metadata/DOM attributes to identify supported event blocks, calculate durations, choose contrasting text, and position labels. This processing happens locally in your browser. Calendar content is not saved by the extension or transmitted to the developer or any third party.

The popup saves two preferences using Chrome's local extension storage: `durationEnabled` (`true` or `false`) and `durationStyle` (`box` or `text`). They are used only to remember whether durations are shown and in which style, and notify other open Calendar tabs of changes. These preferences are not synced by the extension to other devices and is not transmitted to the developer.

## What we do not collect or share

The extension has no developer-operated backend, analytics, advertising, telemetry, remote fonts, or external API requests. It does not collect account credentials or cookies, record browsing history, sell data, or share event information. The calendar animation runs locally and uses no user data.

Google Calendar itself and Chrome operate independently under their own policies. This policy covers this extension, not Google's services. If you contact the developer or open a GitHub issue, information you voluntarily submit is handled by that communication service; do not include private calendar data in public issues.

## Retention and control

Event content is used transiently while the Calendar page is open and is not retained by the extension. The display preference remains in local extension storage until you change it or uninstall the extension. Removing the extension removes its Chrome-managed local storage. Disabling it stops future content-script injection; refresh open Calendar tabs to remove existing labels and stop their scripts.

## Changes and contact

If behavior changes, this policy will be updated with the corresponding release. For questions, use the project's [GitHub issue tracker](https://github.com/FaZeDrug/gcal-event-length/issues). Avoid sharing passwords or private event information.
