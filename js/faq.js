/**
 * PrimeFactor.app — System Architecture & Protocols FAQ Engine
 * 200 High-Fidelity Questions · 10 Roadmap Pages · Single-Open Accordion UX
 * Persistent Read State · Real-Time Progress Tracker · Fast Search & Filters
 */

import { initGlobalHeader, renderFooter } from './header.js';
import { FAQ_ROADMAP_PAGES, FAQ_QUESTIONS } from './faq-data.js';

const STORAGE_KEY_FAQ_READ = 'primefactor_faq_read';
const TOTAL_QUESTIONS_COUNT = 200;
const QUESTIONS_PER_PAGE = 20;

// Application State
let currentPage = 1;
let selectedPriority = 'all'; // 'all' | 5 | 4 | 3 | 2 | 1
let searchQuery = '';
let expandedQuestionId = null; // Single-open constraint enforcement

// --- Persistent Storage Helpers ---
function getReadQuestionsSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAQ_READ);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.warn('[FAQ] Failed to parse read cache', err);
    return new Set();
  }
}

function saveReadQuestionsSet(readSet) {
  try {
    localStorage.setItem(STORAGE_KEY_FAQ_READ, JSON.stringify(Array.from(readSet)));
  } catch (err) {
    console.warn('[FAQ] Failed to save read cache', err);
  }
}

function markQuestionAsRead(id) {
  const readSet = getReadQuestionsSet();
  if (!readSet.has(id)) {
    readSet.add(id);
    saveReadQuestionsSet(readSet);
    updateProgressTracker();
    
    // Update card visual state in-place
    const cardEl = document.querySelector(`.faq-card[data-id="${id}"]`);
    if (cardEl) {
      cardEl.classList.add('is-read');
    }
  }
}

function toggleQuestionRead(id, event) {
  if (event) event.stopPropagation();
  const readSet = getReadQuestionsSet();
  const cardEl = document.querySelector(`.faq-card[data-id="${id}"]`);
  
  if (readSet.has(id)) {
    readSet.delete(id);
    if (cardEl) cardEl.classList.remove('is-read');
  } else {
    readSet.add(id);
    if (cardEl) cardEl.classList.add('is-read');
  }
  
  saveReadQuestionsSet(readSet);
  updateProgressTracker();
  
  // Update toggle button text if inside expanded body
  const toggleBtn = document.querySelector(`.faq-toggle-read-btn[data-id="${id}"]`);
  if (toggleBtn) {
    toggleBtn.textContent = readSet.has(id) ? 'Mark as Unread' : 'Mark as Read';
  }
}

// --- Real-time Progress Tracker ---
function updateProgressTracker() {
  const readSet = getReadQuestionsSet();
  const readCount = readSet.size;
  const pct = Math.round((readCount / TOTAL_QUESTIONS_COUNT) * 100);

  const fractionEl = document.getElementById('faq-read-fraction');
  const barFillEl = document.getElementById('faq-bar-fill');

  if (fractionEl) {
    fractionEl.textContent = `${readCount} / ${TOTAL_QUESTIONS_COUNT} Read (${pct}%)`;
  }
  if (barFillEl) {
    barFillEl.style.width = `${pct}%`;
  }
}

// --- Data Filtering and Pagination ---
function getFilteredQuestions() {
  let list = FAQ_QUESTIONS;

  // Filter by priority
  if (selectedPriority !== 'all') {
    const priorityNum = Number(selectedPriority);
    list = list.filter(q => q.priority === priorityNum);
  }

  // Filter by search query
  if (searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    list = list.filter(q => 
      q.question.toLowerCase().includes(query) ||
      q.answer.toLowerCase().includes(query) ||
      q.category.toLowerCase().includes(query) ||
      `#${q.id}`.includes(query)
    );
  }

  return list;
}

// --- Render Methods ---
function renderStarRanking(priority) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < priority ? '★' : '☆';
  }
  return stars;
}

function renderChapterBanner(currentItems, totalPages) {
  const bannerContainer = document.getElementById('faq-chapter-banner-slot');
  if (!bannerContainer) return;

  const isDefaultView = selectedPriority === 'all' && searchQuery.trim() === '';

  if (isDefaultView && currentPage >= 1 && currentPage <= FAQ_ROADMAP_PAGES.length) {
    const roadmap = FAQ_ROADMAP_PAGES[currentPage - 1];
    bannerContainer.innerHTML = `
      <div class="faq-chapter-banner">
        <div class="faq-chapter-title-group">
          <h2>Chapter ${roadmap.page}: ${roadmap.title}</h2>
          <p>${roadmap.subtitle}</p>
        </div>
        <div class="faq-chapter-badge">ROADMAP PART ${roadmap.page} OF 10</div>
      </div>
    `;
    bannerContainer.style.display = 'block';
  } else if (!isDefaultView) {
    bannerContainer.innerHTML = `
      <div class="faq-chapter-banner">
        <div class="faq-chapter-title-group">
          <h2>Filtered Architecture Inquiries</h2>
          <p>Showing ${currentItems.length} matching questions across ${totalPages} page${totalPages === 1 ? '' : 's'}.</p>
        </div>
        <div class="faq-chapter-badge">${searchQuery ? `SEARCH: "${searchQuery}"` : `PRIORITY: ${selectedPriority}★`}</div>
      </div>
    `;
    bannerContainer.style.display = 'block';
  } else {
    bannerContainer.innerHTML = '';
    bannerContainer.style.display = 'none';
  }
}

function renderQuestionsFeed() {
  const listContainer = document.getElementById('faq-questions-list');
  if (!listContainer) return;

  const filtered = getFilteredQuestions();
  const totalPages = Math.max(1, Math.ceil(filtered.length / QUESTIONS_PER_PAGE));

  // Constrain currentPage
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  renderChapterBanner(filtered, totalPages);

  if (pageItems.length === 0) {
    listContainer.innerHTML = `
      <div class="faq-empty-state">
        <div class="faq-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3 class="faq-empty-title">No Matching System Queries Found</h3>
        <p class="faq-empty-subtitle">Try adjusting your keyword filter or switching star priority categories.</p>
      </div>
    `;
    renderPagination(totalPages);
    return;
  }

  const readSet = getReadQuestionsSet();

  listContainer.innerHTML = pageItems.map(q => {
    const isRead = readSet.has(q.id);
    const isExpanded = expandedQuestionId === q.id;
    const padId = String(q.id).padStart(3, '0');
    const stars = renderStarRanking(q.priority);

    return `
      <div class="faq-card ${isRead ? 'is-read' : ''} ${isExpanded ? 'is-expanded' : ''}" data-id="${q.id}">
        <div class="faq-card-header" data-id="${q.id}" role="button" tabindex="0" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="faq-body-${q.id}" aria-label="Toggle answer for question #${padId}">
          <div class="faq-card-main">
            <div class="faq-card-topline">
              <span class="faq-id-tag">#${padId}</span>
              <span class="faq-category-tag">${q.category}</span>
              <span class="faq-stars" title="Priority: ${q.priority} of 5 Stars">${stars}</span>
              <span class="faq-read-pill">Read</span>
            </div>
            <h3 class="faq-card-title">${q.question}</h3>
          </div>
          <div class="faq-chevron" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <div class="faq-card-body" id="faq-body-${q.id}">
          <div class="faq-body-inner">
            <p class="faq-answer-text">${q.answer}</p>
            <div class="faq-body-footer">
              <div class="faq-priority-meta">
                <span>Critical Priority: <strong>${q.priority}★ / 5★</strong></span>
                <span>•</span>
                <span>Archive Index: <strong>${q.id} of 200</strong></span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="faq-collapse-card-btn" data-id="${q.id}" type="button" title="Close this question card">
                  Collapse ▲
                </button>
                <button class="faq-toggle-read-btn" data-id="${q.id}" type="button">
                  ${isRead ? 'Mark as Unread' : 'Mark as Read'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachCardEventListeners();
  renderPagination(totalPages);
}

// --- Accordion Single-Open & Manual Collapse Interaction ---
function attachCardEventListeners() {
  const cards = document.querySelectorAll('.faq-card');

  cards.forEach(card => {
    const header = card.querySelector('.faq-card-header');
    const id = Number(card.getAttribute('data-id'));

    // Click on header triggers toggle (expand or manual collapse)
    header.addEventListener('click', () => {
      handleCardToggle(id);
    });

    // Keyboard navigation (Enter / Space) to toggle
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardToggle(id);
      }
    });

    // Manual collapse button inside expanded body
    const collapseBtn = card.querySelector('.faq-collapse-card-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCardToggle(id);
      });
    }

    // Toggle read button
    const toggleBtn = card.querySelector('.faq-toggle-read-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        toggleQuestionRead(id, e);
      });
    }
  });
}

function handleCardToggle(id) {
  const previousExpandedId = expandedQuestionId;

  // Single-Open constraint & Manual Collapse Feature:
  // If clicked card is already open, immediately close/collapse it.
  if (previousExpandedId === id) {
    expandedQuestionId = null;
    const currentCard = document.querySelector(`.faq-card[data-id="${id}"]`);
    if (currentCard) {
      currentCard.classList.remove('is-expanded');
      const header = currentCard.querySelector('.faq-card-header');
      if (header) header.setAttribute('aria-expanded', 'false');
    }
    return;
  }

  // Otherwise, close previously opened card to enforce strict single-open constraint
  if (previousExpandedId) {
    const prevCard = document.querySelector(`.faq-card[data-id="${previousExpandedId}"]`);
    if (prevCard) {
      prevCard.classList.remove('is-expanded');
      const prevHeader = prevCard.querySelector('.faq-card-header');
      if (prevHeader) prevHeader.setAttribute('aria-expanded', 'false');
    }
  }

  // Expand the newly clicked card
  expandedQuestionId = id;
  // Mark as read immediately on open
  markQuestionAsRead(id);

  const currentCard = document.querySelector(`.faq-card[data-id="${id}"]`);
  if (currentCard) {
    currentCard.classList.add('is-expanded');
    const header = currentCard.querySelector('.faq-card-header');
    if (header) header.setAttribute('aria-expanded', 'true');
  }
}

// --- Pagination Controls ---
function renderPagination(totalPages) {
  const paginationSlot = document.getElementById('faq-pagination');
  if (!paginationSlot) return;

  if (totalPages <= 1) {
    paginationSlot.innerHTML = '';
    return;
  }

  let html = `
    <button class="faq-page-btn" id="faq-prev-page" ${currentPage === 1 ? 'disabled' : ''} title="Previous Page">
      &larr; Prev
    </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    html += `
      <button class="faq-page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">
        ${p}
      </button>
    `;
  }

  html += `
    <button class="faq-page-btn" id="faq-next-page" ${currentPage === totalPages ? 'disabled' : ''} title="Next Page">
      Next &rarr;
    </button>
  `;

  paginationSlot.innerHTML = html;

  // Wire up pagination clicks
  const prevBtn = document.getElementById('faq-prev-page');
  const nextBtn = document.getElementById('faq-next-page');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        changePage(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        changePage(currentPage + 1);
      }
    });
  }

  const pageButtons = paginationSlot.querySelectorAll('button[data-page]');
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = Number(btn.getAttribute('data-page'));
      if (pageNum !== currentPage) {
        changePage(pageNum);
      }
    });
  });
}

function changePage(newPage) {
  currentPage = newPage;
  expandedQuestionId = null; // Close any open accordion on page transition
  renderQuestionsFeed();
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// --- Controls Setup ---
function setupControls() {
  // Search input
  const searchInput = document.getElementById('faq-search-input');
  const clearBtn = document.getElementById('faq-search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearBtn) {
        if (searchQuery.length > 0) {
          clearBtn.classList.add('visible');
        } else {
          clearBtn.classList.remove('visible');
        }
      }
      currentPage = 1;
      expandedQuestionId = null;
      renderQuestionsFeed();
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.remove('visible');
      currentPage = 1;
      expandedQuestionId = null;
      renderQuestionsFeed();
      searchInput.focus();
    });
  }

  // Star filter tabs
  const tabButtons = document.querySelectorAll('.faq-tab-btn');
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      selectedPriority = tab.getAttribute('data-priority');
      currentPage = 1;
      expandedQuestionId = null;
      renderQuestionsFeed();
    });
  });

  // Progress actions
  const resetBtn = document.getElementById('faq-reset-read-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      saveReadQuestionsSet(new Set());
      updateProgressTracker();
      renderQuestionsFeed();
    });
  }

  const markAllBtn = document.getElementById('faq-mark-all-read-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      const allIds = FAQ_QUESTIONS.map(q => q.id);
      saveReadQuestionsSet(new Set(allIds));
      updateProgressTracker();
      renderQuestionsFeed();
    });
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initGlobalHeader();
  renderFooter();
  setupControls();
  updateProgressTracker();
  renderQuestionsFeed();
});
