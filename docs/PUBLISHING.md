# Publish to the Chrome Web Store

You can use the extension locally right now. Publishing is a separate process: **you** register a developer account, pay Google's registration fee, make the required declarations, and submit it for review. This change does not upload or publish anything.

## 1. Do the last manual checks

Use the 0.6.0 install ZIP on your own Chrome before submitting:

- [ ] Load/reload the extension and refresh Calendar.
- [ ] Open the toolbar popup; confirm the 300×400 layout and keyboard focus are readable.
- [ ] Turn **Show durations** Off (labels disappear) and On (labels return).
- [ ] Switch both styles, reopen the popup, and verify two open Calendar tabs update.
- [ ] Check Day/Week navigation, an event time edit, clicks, dragging, and resizing in a test calendar.
- [ ] Check noon/midnight and a 24-hour range, all-day skips, and a narrow event.
- [ ] Enable reduced motion and verify static artwork; close the popup when not using it.
- [ ] Capture at least one screenshot using a test calendar with no personal information.

Automated tests load the real unpacked extension, but Calendar interactions are exercised against controlled fixtures. Do not represent fixture screenshots as live Calendar evidence.

## 2. Register your publisher account

Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), sign in with the Google account you want to own the listing, accept Google's developer agreement, and pay the **one-time registration fee shown at checkout**. Turn on Google Account **2-Step Verification**, which is required to publish or update an extension. Set your publisher name and verify the developer/contact email.

Google may ask for additional publisher verification or regional disclosures. Complete the current dashboard requirements truthfully; do not use a made-up address or identity. Keep access to this account—future releases use the same store item.

## 3. Upload the correct ZIP

Run `python3 scripts/package.py`, or use the supplied **`google-calendar-event-length-0.6.0-store.zip`**.

Choose **Add new item → Choose file → Upload** in the dashboard. Upload the ZIP as-is. `manifest.json` must be at its root.

Do not upload the install ZIP with its wrapper folder, the entire repository, `node_modules`, tests, or a `.crx` file. The packaging script includes only `extension/` and its local assets/licenses.

## 4. Fill in the listing

Copy the description and field suggestions from [STORE-LISTING.md](STORE-LISTING.md). Keep the listing clear that this is independent software, not an official Google extension.

Prepare these graphics:

| Asset | Size | Where to get it |
| --- | --- | --- |
| Store icon | 128×128 PNG | `extension/icons/icon128.png` |
| Screenshot | Prefer 1280×800; at least one | Use the prepared popup artwork in `docs/store-assets/`, and add a sanitized live Calendar screenshot before submission |
| Small promotional tile | 440×280 PNG/JPEG | `docs/store-assets/promo-440x280.png` |
| Optional marquee | 1400×560 | Only needed if you choose to supply it |
| Optional promotional video | YouTube URL | The supplied MP4 can be used to create a video; no upload was performed |

The prepared screenshot artwork incorporates the **real unpacked popup**, not a fake Calendar page. Review it before publishing. Google allows up to five screenshots; its image guidance also accepts 640×400, though 1280×800 is preferred. Follow any current dashboard validation if it differs.

## 5. Complete privacy and testing fields

Use the single-purpose statement and permission explanations in [STORE-LISTING.md](STORE-LISTING.md).

**Local-only does not mean “no user data handling.”** The extension reads Calendar page content locally. Disclose that behavior in the Privacy tab, while explaining that no event content is transmitted or stored. The only persisted value is the display preference. Read and confirm all certifications yourself.

Publish the [privacy policy](../PRIVACY.md) at a publicly accessible URL. Once this PR is merged, the public GitHub `blob/main/PRIVACY.md` link is one option; verify it in an incognito window before entering it in the dashboard. A dedicated GitHub Pages/site URL is another option. Do not paste a local file path or a private Capy link.

Add reviewer instructions from the listing-copy document. Reviewers can use their own Google account; this extension has no separate credentials. Never submit your personal Google password.

## 6. Choose distribution and submit

Select the countries/regions and visibility you want. For a limited first release, consider **Unlisted** if the dashboard offers it: people need the listing link, but it still goes through review. Review all fields, then select **Submit for review**.

If you want to choose the launch time, use **deferred/manual publishing** rather than automatic publishing after approval. Google controls review time and approval; no exact turnaround is guaranteed. Monitor your developer email for questions or required changes.

## 7. Publish updates later

Increase `extension/manifest.json`'s version for every release, run tests, rebuild the **store ZIP**, and upload it to the **existing item**, not a new listing. Review/update descriptions, screenshots, and privacy details when behavior changes, then submit the update. Store-installed copies and unpacked copies are separate installations; disable the unpacked one when testing the store version to avoid duplicate labels.

## Official references

Checked against Google's documentation on October 12, 2026:

- [Register a developer account](https://developer.chrome.com/docs/webstore/register)
- [Required 2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)
- [Prepare the manifest and root-level ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Upload, review, and deferred publishing](https://developer.chrome.com/docs/webstore/publish)
- [Image requirements](https://developer.chrome.com/docs/webstore/images)
- [User-data FAQ, including local-only processing](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

This is a practical checklist, not a guarantee of store approval or legal advice. Review the current policies at submission time.
