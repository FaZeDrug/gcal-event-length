const fieldset = document.querySelector('fieldset');
const toggle = document.querySelector('#enabled');
const status = document.querySelector('#status');

function show(enabled) {
  toggle.checked = enabled;
  document.body.classList.toggle('off', !enabled);
  status.textContent = enabled ? '✓ Saved automatically' : 'Off · preference saved';
}

async function load() {
  try {
    const { durationStyle, durationEnabled } = await chrome.storage.local.get(['durationStyle', 'durationEnabled']);
    document.querySelector(`input[value="${durationStyle === 'text' ? 'text' : 'box'}"]`).checked = true;
    show(durationEnabled !== false);
    fieldset.disabled = toggle.disabled = false;
  } catch {
    status.textContent = 'Could not load. Reopen to retry.';
  }
}

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  document.body.classList.toggle('off', !enabled);
  toggle.disabled = true;
  status.textContent = 'Saving…';
  try {
    await chrome.storage.local.set({ durationEnabled: enabled });
    show(enabled);
  } catch {
    show(!enabled);
    status.textContent = 'Could not save. Try the switch again.';
  } finally {
    toggle.disabled = false;
    toggle.focus();
  }
});

fieldset.addEventListener('change', async (event) => {
  fieldset.disabled = true;
  status.textContent = 'Saving…';
  try {
    await chrome.storage.local.set({ durationStyle: event.target.value });
    show(toggle.checked);
  } catch {
    status.textContent = 'Could not save. Select a style to retry.';
    event.target.checked = false;
  } finally {
    fieldset.disabled = false;
    event.target.focus();
  }
});

load();
