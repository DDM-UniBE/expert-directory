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

/* ── Area/Expertise trigger words — typing these matches the whole category ── */
const AREA_TRIGGERS = {
  "Artificial Intelligence & Data Science": [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "neural network", "llm", "llms", "large language model", "large language models",
    "nlp", "natural language processing", "data science", "algorithm"
  ],
  "Biomedical Engineering & Biomedical Research": [
    "biomedical engineering", "biomedical research", "bioengineering",
    "organ on chip", "organs on chip", "microfluidics", "biosensor",
    "biomechanics", "biofluids", "nanomaterial"
  ],
  "Cancer & Oncology": [
    "cancer", "oncology", "tumour", "tumor", "neoplasm", "carcinoma",
    "malignancy", "chemotherapy", "radiotherapy", "immunotherapy", "metastasis"
  ],
  "Cardiovascular Medicine": [
    "heart", "cardiac", "cardiovascular", "cardiology", "coronary",
    "artery", "vascular", "echocardiography", "myocarditis", "cardiomyopathy"
  ],
  "Clinical Research & Epidemiology": [
    "clinical research", "epidemiology", "clinical trial", "clinical trials",
    "evidence based", "public health", "patient safety", "quality of care"
  ],
  "Digital Pathology": [
    "pathology", "digital pathology", "histology", "tissue", "biopsy",
    "histopathology", "spatial profiling", "slide"
  ],
  "Ethics & Responsible AI": [
    "ethics", "responsible ai", "ai ethics", "fairness", "bias",
    "governance", "explainability", "transparency"
  ],
  "Genomics & Precision Medicine": [
    "genomics", "genome", "genetics", "omics", "multi-omics", "proteomics",
    "transcriptomics", "metabolomics", "sequencing", "precision medicine",
    "personalised medicine", "personalized medicine", "bioinformatics",
    "computational biology", "single cell", "spatial omics"
  ],
  "Medical Education": [
    "medical education", "education", "teaching", "learning", "curriculum",
    "simulation", "pedagogy", "cognitive science"
  ],
  "Medical Imaging": [
    "imaging", "medical imaging", "mri", "magnetic resonance", "ct scan",
    "radiology", "radiologist", "ultrasound", "pet scan", "x-ray",
    "lung imaging", "vascular imaging", "neuroradiology", "spectroscopy"
  ],
  "Neuroscience & Neurology": [
    "brain", "neuro", "neuroscience", "neurology", "neuroimaging",
    "neuroradiology", "multiple sclerosis", "epilepsy", "dementia",
    "alzheimer", "parkinson", "stroke", "glioblastoma", "medulloblastoma"
  ],
  "Surgery & Interventional Medicine": [
    "surgery", "surgical", "interventional", "minimally invasive",
   "laparoscopic", "navigation"
  ],
};

const EXPERTISE_TRIGGERS = {
  "AI & Data Science": [
    "ai", "artificial intelligence", "machine learning", "deep learning", "data science"
  ],
  "Bioinformatics & Omics": [
    "bioinformatics", "omics", "genomics", "proteomics", "transcriptomics", "sequencing"
  ],
  "Biomedical Engineering": [
    "biomedical engineering", "bioengineering", "biomechanics", "biofluids"
  ],
  "Clinical Research & Evidence": [
    "clinical research", "clinical trial", "evidence based", "epidemiology"
  ],
  "Clinical Specialities": [
    "clinical", "medicine", "physician", "clinician"
  ],
  "Digital Health & Health Informatics": [
    "digital health", "health informatics", "ehr", "electronic health record", "digital medicine"
  ],
  "Ethics, Policy & Education": [
    "ethics", "policy", "education", "responsible ai", "governance"
  ],
  "Medical Imaging": [
    "imaging", "mri", "ct scan", "radiology", "ultrasound"
  ],
  "Pathology & Molecular Medicine": [
    "pathology", "molecular medicine", "histology", "tissue", "biopsy"
  ],
};

/* ── Area aliases — maps researcher area values to AREA_TRIGGERS keys ── */
const AREA_ALIASES = {
  "data science":                        "Artificial Intelligence & Data Science",
  "artificial intelligence & data science": "Artificial Intelligence & Data Science",
  "cancer & oncology":                   "Cancer & Oncology",
  "cardiovascular medicine":             "Cardiovascular Medicine",
  "biomedical engineering & biomedical research": "Biomedical Engineering & Biomedical Research",
  "genomics & precision medicine":       "Genomics & Precision Medicine",
  "neuroscience & neurology":            "Neuroscience & Neurology",
  "surgery & interventional medicine":   "Surgery & Interventional Medicine",
  "medical imaging":                     "Medical Imaging",
  "medical education":                   "Medical Education",
  "digital pathology":                   "Digital Pathology",
  "ethics & responsible ai":             "Ethics & Responsible AI",
  "clinical research & epidemiology":    "Clinical Research & Epidemiology",
};

function getAreaMatches(q) {
  const matchedAreaKeys = new Set();
  for (const [area, triggers] of Object.entries(AREA_TRIGGERS)) {
    if (triggers.some(t => {
      const re = new RegExp(`(^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(\\s|$)`, 'i');
      return re.test(q);
    })) {
      matchedAreaKeys.add(area.toLowerCase());
    }
  }
  return [...matchedAreaKeys];
}

function wordMatch(fields, term) {
  // Prefix matching: term must appear at the START of a word.
  // So "chri" matches "christoph", "pedia" matches "pediatrics",
  // but "uro" will NOT match "neuro" (not at a word boundary).
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[\\s,;&/\\-])${escaped}`, 'i');
  return regex.test(fields);
}

/* ── Filter logic ── */
function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const areas = selectedFilters.area;
  const exps  = selectedFilters.exp;
  const insts = selectedFilters.inst;

  // Get areas that the query maps to
  const triggeredAreas = q ? getAreaMatches(q) : [];

  const searchFields = r => [
    r.name, r.group, r.tag, r.area,
    r.expertise, r.keywords || '', r.institute
  ].join(' , ').toLowerCase();

  const filtered = researchers.filter(r => {
    const fields = searchFields(r);
    // Resolve researcher's area(s) to canonical trigger keys via aliases
    const researcherAreaKey = (AREA_ALIASES[r.area.toLowerCase()] || r.area).toLowerCase();
    const matchesSearch = !q || (
      wordMatch(fields, q) ||
      triggeredAreas.some(a => researcherAreaKey.includes(a) || r.area.toLowerCase().includes(a))
    );
    return (
      matchesSearch &&
      (areas.size === 0 || [...areas].some(a => r.area.toLowerCase().includes(a.toLowerCase()))) &&
      (exps.size  === 0 || [...exps].some(e => r.expertise.toLowerCase().includes(e.toLowerCase()))) &&
      (insts.size === 0 || [...insts].some(i => r.institute.toLowerCase().includes(i.toLowerCase())))
    );
  });
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

/* ── Mobile slide-up menu (two-level) ── */
const mobileMenuBtn     = document.getElementById('mobileMenuBtn');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose   = document.getElementById('mobileMenuClose');
const mobileMenuLevel1  = document.getElementById('mobileMenuLevel1');
const mobileMenuLevel2  = document.getElementById('mobileMenuLevel2');
const researchToggle    = document.getElementById('researchMenuToggle');
const researchBack      = document.getElementById('researchMenuBack');

function showLevel2() {
  if (mobileMenuLevel1) mobileMenuLevel1.style.display = 'none';
  if (mobileMenuLevel2) mobileMenuLevel2.style.display = 'block';
}
function showLevel1() {
  if (mobileMenuLevel1) mobileMenuLevel1.style.display = 'block';
  if (mobileMenuLevel2) mobileMenuLevel2.style.display = 'none';
}

function openMobileMenu() {
  mobileMenuOverlay.classList.add('open');
  mobileMenuOverlay.setAttribute('aria-hidden', false);
  document.body.style.overflow = 'hidden';
  // The directory lives under Research → Collaborate, so open straight to the Research submenu
  showLevel2();
}
function closeMobileMenu() {
  mobileMenuOverlay.classList.remove('open');
  mobileMenuOverlay.setAttribute('aria-hidden', true);
  document.body.style.overflow = '';
}

if (mobileMenuBtn)   mobileMenuBtn.addEventListener('click', openMobileMenu);
if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);

// Back link → return to main menu (level 1)
if (researchBack) {
  researchBack.addEventListener('click', e => {
    e.preventDefault();
    showLevel1();
  });
}

// Close when an actual link (with real href) is tapped
if (mobileMenuOverlay) {
  mobileMenuOverlay.querySelectorAll('a[href]:not([href="#"])').forEach(link => {
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
