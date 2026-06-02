/* ═══════════════════════════════════════════════════
   DDM Researcher Directory — App Logic
   ═══════════════════════════════════════════════════

   TO ADD A RESEARCHER:
   Edit data/researchers.json — add a new object to the array.

   Fields:
     initials   → 2-letter fallback shown when no photo
     firstName  → first name only, used for alphabetical sorting
     photo      → path to image, e.g. "assets/headshots/name.jpg"
                  leave "" to show initials instead
     name       → full display name
     group      → research group shown on card
     institute  → institution(s) shown on card
     area       → research area (used by Research area filter)
     expertise  → expertise (used by Expertise filter)
     tag        → label on the red pill badge
     profileUrl → URL opened when clicking the card (opens in new tab)
   ═══════════════════════════════════════════════════ */

const arrowSVG = `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3.5 9h11M10 4.5l4.5 4.5L10 13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

let researchers = [];

/* ── Load data from JSON ── */
fetch('data/researchers.json')
  .then(res => res.json())
  .then(data => {
    researchers = data.sort((a, b) => a.firstName.localeCompare(b.firstName));
    initMultiSelects();
    renderGrid(researchers);
  })
  .catch(err => {
    console.error('Could not load researchers.json:', err);
    document.getElementById('grid').innerHTML =
      '<div class="no-results">Could not load researcher data.<br>Please run this page from a local server or hosting.</div>';
  });

/* ── Multi-select state ── */
const selectedFilters = { area: new Set(), exp: new Set(), inst: new Set() };

/* ── Filter logic ── */
function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const areas = selectedFilters.area;
  const exps  = selectedFilters.exp;
  const insts = selectedFilters.inst;

  const filtered = researchers.filter(r =>
    (!q || r.name.toLowerCase().includes(q) ||
       r.group.toLowerCase().includes(q) ||
       r.tag.toLowerCase().includes(q) ||
       r.area.toLowerCase().includes(q) ||
       r.expertise.toLowerCase().includes(q) ||
       r.institute.toLowerCase().includes(q)) &&
    (areas.size === 0 || [...areas].some(a => r.area.toLowerCase().includes(a.toLowerCase()))) &&
    (exps.size  === 0 || [...exps].some(e => r.expertise.toLowerCase().includes(e.toLowerCase()))) &&
    (insts.size === 0 || [...insts].some(i => r.institute.toLowerCase().includes(i.toLowerCase())))
  );
  renderGrid(filtered);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  ['area','exp','inst'].forEach(k => {
    selectedFilters[k].clear();
    renderTags(k);
    renderOptions(k);
  });
  renderGrid(researchers);
}

/* ── Multi-select dropdown logic ── */
const MS_DATA = {
  area: [
    "Biomedical Engineering & Biomedical Research",
    "Cancer & Oncology",
    "Cardiovascular Medicine",
    "Clinical Research & Epidemiology",
    "Data Science",
    "Digital Pathology",
    "Ethics & Responsible AI",
    "Genomics & Precision Medicine",
    "Medical Education",
    "Medical Imaging",
    "Neuroscience & Neurology",
    "Surgery & Interventional Medicine"
  ],
  exp: [
    "AI & Data Science",
    "Bioinformatics & Omics",
    "Biomedical Engineering",
    "Clinical Research & Evidence",
    "Clinical Specialities",
    "Digital Health & Health Informatics",
    "Ethics, Policy & Education",
    "Medical Imaging",
    "Pathology & Molecular Medicine"
  ],
  inst: ["University of Bern", "Inselspital", "sitem-insel"]
};

function renderOptions(key, filter = '') {
  const container = document.getElementById('ms-opts-' + key);
  if (!container) return;
  const items = MS_DATA[key].filter(i => i.toLowerCase().includes(filter.toLowerCase()));
  container.innerHTML = items.map(item => `
    <label class="ms-option ${selectedFilters[key].has(item) ? 'ms-selected' : ''}">
      <input type="checkbox" ${selectedFilters[key].has(item) ? 'checked' : ''}
        onchange="toggleItem('${key}', '${item.replace(/&/g,'&amp;').replace(/'/g,"\\'")}', this.checked)" />
      ${item}
    </label>
  `).join('');
}

function renderTags(key) {
  const box  = document.getElementById('ms-box-' + key);
  const ph   = document.getElementById('ms-ph-' + key);
  const chev = document.getElementById('ms-chev-' + key);
  if (!box) return;
  box.querySelectorAll('.ms-pill').forEach(t => t.remove());
  const tags = [...selectedFilters[key]];
  ph.style.display = tags.length === 0 ? '' : 'none';
  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'ms-pill';
    pill.innerHTML = `${tag} <button onclick="removeTag('${key}','${tag.replace(/&/g,'&amp;').replace(/'/g,"\\'")}',event)">×</button>`;
    box.insertBefore(pill, chev);
  });
}

function toggleItem(key, item, checked) {
  if (checked) selectedFilters[key].add(item); else selectedFilters[key].delete(item);
  renderTags(key);
  renderOptions(key);
  applyFilters();
}

function removeTag(key, item, e) {
  e.stopPropagation();
  selectedFilters[key].delete(item);
  renderTags(key);
  renderOptions(key);
  applyFilters();
}

function msFilterOptions(key, val) { renderOptions(key, val); }

function toggleDropdown(key) {
  const dd   = document.getElementById('ms-dd-' + key);
  const chev = document.getElementById('ms-chev-' + key);
  if (!dd) return;
  const isOpen = dd.classList.contains('ms-open');
  ['area','exp','inst'].forEach(k => {
    const d = document.getElementById('ms-dd-' + k);
    const c = document.getElementById('ms-chev-' + k);
    if (d) d.classList.remove('ms-open');
    if (c) c.classList.remove('ms-chev-open');
  });
  if (!isOpen) {
    dd.classList.add('ms-open');
    chev.classList.add('ms-chev-open');
    renderOptions(key);
    setTimeout(() => { const si = dd.querySelector('.ms-search'); if(si) si.focus(); }, 50);
  }
}

document.addEventListener('click', e => {
  ['area','exp','inst'].forEach(k => {
    const ms = document.getElementById('ms-wrap-' + k);
    if (ms && !ms.contains(e.target)) {
      const d = document.getElementById('ms-dd-' + k);
      const c = document.getElementById('ms-chev-' + k);
      if (d) d.classList.remove('ms-open');
      if (c) c.classList.remove('ms-chev-open');
    }
  });
});

function initMultiSelects() {
  ['area','exp','inst'].forEach(k => renderOptions(k));
}

const CARDS_PER_PAGE = 8;
let currentPage = 1;
let filteredList = [];

/* ── Render cards ── */
function renderGrid(list) {
  filteredList = list;
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById('grid');
  const total = filteredList.length;
  const totalPages = Math.ceil(total / CARDS_PER_PAGE);
  const start = (currentPage - 1) * CARDS_PER_PAGE;
  const end = Math.min(start + CARDS_PER_PAGE, total);
  const pageItems = filteredList.slice(start, end);

  document.getElementById('resultsMeta').innerHTML = total
    ? `Showing <strong>${start + 1}–${end}</strong> of <strong>${total}</strong> profile${total !== 1 ? 's' : ''}`
    : `Showing <strong>0</strong> profiles`;

  if (!total) {
    grid.innerHTML = '<div class="no-results">No researchers match your search.<br>Try different keywords or clear the filters.</div>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  grid.innerHTML = pageItems.map(r => {
    const photoEl = r.photo
      ? `<div class="card-photo"><img src="${r.photo}" alt="Photo of ${r.name}" /></div>`
      : `<div class="card-photo-initials">${r.initials}</div>`;
    return `
      <a class="card" href="${r.profileUrl}" target="_blank" role="listitem" aria-label="${r.name}, ${r.group}">
        <div class="card-head"><span class="card-tag">${r.tag}</span></div>
        <div class="card-body">
          <div class="card-name">${r.name}</div>
          <div class="card-group">${r.group}</div>
          <div class="card-institute" style="margin-top:6px;">${r.institute}</div>
        </div>
        <div class="card-bottom">${photoEl}<div class="card-arrow">${arrowSVG}</div></div>
      </a>`;
  }).join('');

  const pagination = document.getElementById('pagination');
  pagination.style.display = 'flex';
  document.getElementById('paginationInfo').innerHTML = `Showing ${start + 1}–${end} of ${total} profiles`;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

/* ── Live search ── */
document.getElementById('searchInput').addEventListener('input', applyFilters);

/* ── Hamburger menu toggle ── */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const greenNav     = document.getElementById('greenNav');
if (hamburgerBtn && greenNav) {
  hamburgerBtn.addEventListener('click', () => {
    const isOpen = greenNav.classList.toggle('open');
    hamburgerBtn.classList.toggle('open', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', isOpen);
  });
  greenNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      greenNav.classList.remove('open');
      hamburgerBtn.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', false);
    });
  });
}

/* ── Mobile breadcrumb dropdown ── */
const breadcrumbToggle = document.getElementById('breadcrumbToggle');
const breadcrumbPanel  = document.getElementById('breadcrumbPanel');
if (breadcrumbToggle && breadcrumbPanel) {
  breadcrumbToggle.addEventListener('click', () => {
    const isOpen = breadcrumbPanel.classList.toggle('open');
    breadcrumbToggle.classList.toggle('open', isOpen);
    breadcrumbToggle.setAttribute('aria-expanded', isOpen);
  });
}

/* ── Mobile slide-up menu ── */
const mobileMenuBtn     = document.getElementById('mobileMenuBtn');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose   = document.getElementById('mobileMenuClose');

function openMobileMenu() {
  mobileMenuOverlay.classList.add('open');
  mobileMenuOverlay.setAttribute('aria-hidden', false);
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  mobileMenuOverlay.classList.remove('open');
  mobileMenuOverlay.setAttribute('aria-hidden', true);
  document.body.style.overflow = '';
}

if (mobileMenuBtn)   mobileMenuBtn.addEventListener('click', openMobileMenu);
if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);

// Close when a nav link is tapped
if (mobileMenuOverlay) {
  mobileMenuOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
}

/* ── Pagination buttons — slide carousel ── */
function slideTo(direction) {
  const grid = document.getElementById('grid');
  const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
  const inClass  = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

  grid.classList.add(outClass);
  setTimeout(() => {
    grid.classList.remove(outClass);
    if (direction === 'next') {
      currentPage++;
    } else {
      currentPage--;
    }
    renderPage();
    grid.classList.add(inClass);
    setTimeout(() => grid.classList.remove(inClass), 350);
  }, 250);
}

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage > 1) slideTo('prev');
});
document.getElementById('nextBtn').addEventListener('click', () => {
  const totalPages = Math.ceil(filteredList.length / CARDS_PER_PAGE);
  if (currentPage < totalPages) slideTo('next');
});
