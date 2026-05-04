// Mobile menu
function toggleMobileMenu() {
  document.getElementById('mobileNav').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobileNav').classList.remove('open');
}

window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Bottom nav active state
document.querySelectorAll('.bottom-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Services dropdown tab switching
document.querySelectorAll('.dropdown-tab').forEach(tab => {
  const switchTab = () => {
    const target = tab.dataset.tab;

    document.querySelectorAll('.dropdown-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + target);
    if (panel) panel.classList.add('active');
  };

  tab.addEventListener('mouseenter', switchTab);
  tab.addEventListener('click', switchTab);
});

// Ovulation calculator
function calculateOvulation(e) {
  e.preventDefault();
  const lastPeriodVal = document.getElementById('lastPeriod').value;
  const cycleLength = parseInt(document.getElementById('cycleLength').value);
  const result = document.getElementById('calcResult');
  if (!lastPeriodVal) return;

  const last = new Date(lastPeriodVal);
  const ovDay = cycleLength - 14;
  const ovulation = new Date(last); ovulation.setDate(last.getDate() + ovDay);
  const fertStart = new Date(ovulation); fertStart.setDate(ovulation.getDate() - 5);
  const fertEnd = new Date(ovulation); fertEnd.setDate(ovulation.getDate() + 1);
  const nextPeriod = new Date(last); nextPeriod.setDate(last.getDate() + cycleLength);

  const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  result.innerHTML = `
    <strong>Fertile Window</strong>
    ${fmt(fertStart)} – ${fmt(fertEnd)}
    <strong>Estimated Ovulation</strong>
    ${fmt(ovulation)}
    <strong>Next Period</strong>
    ${fmt(nextPeriod)}
  `;
  result.classList.add('show');
}

window.calculateOvulation = calculateOvulation;

// Intersection Observer — fade-up animations
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .advantage-item, .stat-card, .testimonial-card, .location-card, .hero-text, .hero-image-wrap')
  .forEach(el => { el.classList.add('anim'); io.observe(el); });

// Animated counters
function runCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Progress bars
function runBars() {
  document.querySelectorAll('.progress-fill').forEach(bar => {
    const w = getComputedStyle(bar).getPropertyValue('--w').trim();
    bar.style.width = w;
  });
}

const statsOb = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    runCounters();
    runBars();
    statsOb.disconnect();
  }
}, { threshold: 0.25 });
const statsSection = document.querySelector('.stats-section');
if (statsSection) statsOb.observe(statsSection);

// Close mobile menu on outside click
document.addEventListener('click', e => {
  const nav = document.getElementById('mobileNav');
  const hamburger = document.querySelector('.hamburger');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
    nav.classList.remove('open');
  }
});
