const fieldset = document.querySelector('fieldset');
const toggle = document.querySelector('#enabled');
const state = document.querySelector('#state');
const status = document.querySelector('#status');

function show(enabled) {
  toggle.checked = enabled;
  state.textContent = enabled ? 'On' : 'Off';
  document.body.classList.toggle('off', !enabled);
}

async function load() {
  try {
    const { durationStyle, durationEnabled } = await chrome.storage.local.get(['durationStyle', 'durationEnabled']);
    document.querySelector(`input[value="${durationStyle === 'text' ? 'text' : 'box'}"]`).checked = true;
    show(durationEnabled !== false);
    fieldset.disabled = toggle.disabled = false;
    status.textContent = 'Preferences saved on this device.';
  } catch {
    status.textContent = 'Could not load. Reopen to retry.';
  }
}

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  show(enabled);
  toggle.disabled = true;
  status.textContent = 'Saving…';
  try {
    await chrome.storage.local.set({ durationEnabled: enabled });
    status.textContent = enabled ? 'Durations on.' : 'Durations off.';
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
    status.textContent = 'Saved.';
  } catch {
    status.textContent = 'Could not save. Select a style to retry.';
    event.target.checked = false;
  } finally {
    fieldset.disabled = false;
  }
});

load();
