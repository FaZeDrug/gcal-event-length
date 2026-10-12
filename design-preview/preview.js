const statusLine = document.querySelector('.status');
const fieldset = document.querySelector('fieldset');
const states = {
  loading: 'Loading preference…', saving: 'Saving…', saved: 'Saved.',
  error: 'Could not save. Select a style to retry.',
  'load-error': 'Could not load. Reopen to retry.'
};
const state = new URLSearchParams(location.search).get('state');
if (states[state]) statusLine.textContent = states[state];
if (state === 'error') document.querySelector('input:checked').checked = false;
fieldset.disabled = ['loading', 'saving', 'load-error'].includes(state);
if (state === 'focus') document.querySelector('input').focus();
fieldset.onchange = () => {
  statusLine.textContent = 'Saving…';
  fieldset.disabled = true;
  setTimeout(() => { statusLine.textContent = 'Saved.'; fieldset.disabled = false; }, 350);
};
