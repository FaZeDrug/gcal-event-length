history.replaceState({}, '', '/calendar/u/0/r/week');
const grid = document.querySelector('#grid');
const status = document.querySelector('#status');
let edited = false;
let next = false;
function render() {
  grid.innerHTML = `
    <section class="day"><h3>MON ${next ? '19' : '12'}</h3><div class="event" data-eventid="sample-evening" role="button" tabindex="0" draggable="true"><strong>Evening focus</strong><div class="Jmftzc gVNoLb EiZ8Dd">9:11–11:32pm</div></div></section>
    <section class="day"><h3>TUE ${next ? '20' : '13'}</h3><div class="event purple" data-eventid="sample-noon" role="button" tabindex="0" draggable="true"><strong>Lunch & a walk</strong><div class="Jmftzc gVNoLb EiZ8Dd">12pm–1pm</div><div class="K9QN7e EiZ8Dd">Example café</div></div></section>
    <section class="day"><h3>WED ${next ? '21' : '14'}</h3><div class="event blue" data-eventid="sample-24h" role="button" tabindex="0" draggable="true"><strong>Design review</strong><div class="Jmftzc gVNoLb EiZ8Dd">14:00–14:45</div></div></section>
    <section class="day"><h3>THU ${next ? '22' : '15'}</h3><div class="event gray" data-eventid="sample-all-day" role="button" tabindex="0"><strong>Out of office</strong><div class="Jmftzc gVNoLb EiZ8Dd">All day</div></div><div class="event gray" data-eventid="sample-ambiguous" role="button" tabindex="0"><strong>Ambiguous time · skipped</strong><div class="Jmftzc gVNoLb EiZ8Dd">11–1</div></div></section>`;
  edited = false;
}
render();
document.querySelector('#edit').onclick = () => {
  edited = !edited;
  document.querySelector('[data-eventid="sample-evening"] .Jmftzc').textContent = edited ? '9:11–10:11pm' : '9:11–11:32pm';
};
document.querySelector('#next').onclick = () => {
  next = !next;
  document.querySelector('h2').textContent = next ? 'October 18–24' : 'October 11–17';
  render();
};
document.querySelector('#view').onclick = (event) => {
  const day = grid.classList.toggle('day-view');
  history.pushState({}, '', `/calendar/u/0/r/${day ? 'day' : 'week'}`);
  document.querySelector('#view-name').textContent = day ? 'Day fixture layout' : 'Week view';
  event.target.textContent = day ? 'Switch to Week' : 'Switch to Day';
};
grid.addEventListener('click', (event) => {
  const block = event.target.closest('[data-eventid]');
  if (block) status.textContent = `Opened: ${block.querySelector('strong').textContent}`;
});
grid.addEventListener('dragstart', () => { status.textContent = 'Drag started — original handler preserved.'; });
