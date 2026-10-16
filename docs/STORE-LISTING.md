# Chrome Web Store listing copy

Review this before submitting; it describes version 0.6.0, not planned features.

## Name

Google Calendar Event Length

This is an independent extension, not an official Google product. Use your own publisher name and the supplied original icon—not Google's Calendar logo. Check the current Google branding rules before submission; the store may ask for naming changes.

## Short description

Display durations on supported Google Calendar Day and Week event blocks.

This matches the manifest and is below Chrome's 132-character limit.

## Detailed description — paste this

See how long your Google Calendar events last without doing the math.

Google Calendar Event Length adds a compact duration immediately beside the time in supported Day and Week event blocks. For example, 9:11–11:32pm displays “2h 21m.”

Choose the style you prefer:
• Outlined badges, such as “1h 30m”
• Simple parentheses, such as “(1 hr 30 min)”

Open the extension's popup to turn durations on or off and switch styles. Your preferences save automatically and update open Calendar tabs. The popup shows a small animated ASCII tear-away calendar and respects your system's reduced-motion preference.

Designed to stay out of your way:
• Duration text uses black or white for contrast.
• Labels stay beside the original time and are omitted when they cannot fit.
• Short events that show only a start time still get a label, and clicking any event shows its duration in the details popup.
• Labels do not intercept event clicks or add keyboard tab stops.
• Calendar data is processed locally; event content is not stored or sent anywhere.
• No separate account, backend, analytics, or external API is required.

Current limits: supports unambiguous same-day time ranges in English AM/PM and 24-hour formats. Events too narrow for the label keep their time and skip the label; click the event to see its duration in the details popup. All-day events, overnight/multi-day ranges, ambiguous times, and unsupported locales are also skipped. Google Calendar interface changes may require extension updates.

This is an independent extension and is not affiliated with or endorsed by Google.

## Suggested listing fields

- Category: **Productivity**, or the closest productivity category offered in the current dashboard.
- Language: **English**.
- Support URL: `https://github.com/FaZeDrug/gcal-event-length/issues`
- Homepage: `https://github.com/FaZeDrug/gcal-event-length`
- Privacy policy, once this PR is merged and the URL is publicly reachable: `https://github.com/FaZeDrug/gcal-event-length/blob/main/PRIVACY.md`

## Single-purpose statement

Calculate and display the duration of supported Google Calendar events directly beside their time ranges, with a user-selectable display style and an on/off switch.

## Permission justifications

**storage:** Save the user's on/off choice and duration display style locally and propagate changes to other open Calendar tabs. No event content is persisted.

**calendar.google.com site access/content scripts:** Read displayed event time ranges and nearby DOM metadata to identify supported timed event blocks, calculate their durations, and insert non-interactive labels. Processing stays inside the user's browser.

**Remote code:** None. All JavaScript, HTML, CSS, fonts, icons, and illustration assets are included in the submitted ZIP. There is no CDN, eval-based loader, backend, or external API.

## Privacy declarations: important distinction

Do **not** declare that the extension never accesses user data. It accesses **website content**, including displayed Calendar event times and nearby metadata, locally to provide its feature. Google explicitly requires disclosure even for local-only processing. Match the dashboard's current data categories to that behavior, explain that there is no transmission/retention of event content, and ensure the declarations agree with `PRIVACY.md`. Review all certifications yourself before submitting.

## Reviewer test instructions

1. Install the extension, open Google Calendar using a reviewer-controlled Google account, and select Week or Day view. No extension-specific login is required; do not supply the developer's account credentials.
2. Create a test event with a same-day range such as 9:11pm–11:32pm and sufficient horizontal width. Confirm the outlined “2h 21m” label beside the time.
3. Open Google Calendar Event Length from Chrome's Extensions menu. Choose Parentheses and confirm “(2 hr 21 min)” appears in the existing Calendar tab.
4. Turn **Show durations** Off and confirm every label disappears from the Calendar tab; turn it On and confirm labels return.
5. Open another supported Calendar tab, change the style, and confirm both tabs update. Close/reopen the popup to verify persistence.
6. Check a 12pm–1pm event, a 24-hour display, an all-day event, and a very narrow block. Unsupported or non-fitting events should not receive a misleading label.
7. Enable system reduced motion to see the static popup artwork. The popup animation never runs inside Calendar event labels.
