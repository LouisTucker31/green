// Green PWA | Page — passport tab switching

const tabs = document.querySelectorAll('.passport-tab');
const panels = document.querySelectorAll('.passport-main');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
  });
});