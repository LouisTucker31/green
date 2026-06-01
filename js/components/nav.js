// Green PWA | Component — bottom nav active state

const navItems = document.querySelectorAll('.nav-item:not(.nav-add)');
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

navItems.forEach(item => {
  item.classList.remove('active');
  const href = item.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    item.classList.add('active');
  }
});