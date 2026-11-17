/**
 * PrimeFactor.app — Dedicated Platform Services & Facilities Controller
 * Coordinates the 15 enterprise-grade facilities, interactive category filters,
 * live real-time search, and spatial 3D card tilt interactions.
 */

import { initGlobalHeader, renderFooter } from "./header.js";
import { playSound } from "./audio.js";

let activeCategory = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  initGlobalHeader();
  renderFooter();
  initServiceCards();
  initFiltersAndSearch();
});

function initFiltersAndSearch() {
  const filterButtons = document.querySelectorAll(".filter-tab-btn");
  const searchInput = document.getElementById("services-search-input");
  const clearBtn = document.getElementById("services-search-clear");
  const activeCountEl = document.getElementById("services-active-count");
  const emptyState = document.getElementById("services-empty-state");
  const cards = Array.from(document.querySelectorAll(".service-facility-card"));

  function applyFilters() {
    let visibleCount = 0;
    const q = searchQuery.toLowerCase().trim();

    const matchedCards = [];
    const hiddenCards = [];

    cards.forEach((card) => {
      const cardCategory = card.getAttribute("data-category") || "core";
      const cardTitle = (
        card.querySelector(".service-card-title")?.textContent || ""
      ).toLowerCase();
      const cardKicker = (
        card.querySelector(".service-card-kicker")?.textContent || ""
      ).toLowerCase();
      const cardDesc = (
        card.querySelector(".service-card-desc")?.textContent || ""
      ).toLowerCase();
      const cardBadge = (
        card.querySelector(".service-card-badge")?.textContent || ""
      ).toLowerCase();
      const cardStatus = (
        card.querySelector(".service-status-pill")?.textContent || ""
      ).toLowerCase();
      const features = Array.from(
        card.querySelectorAll(".service-card-features li"),
      )
        .map((li) => li.textContent.toLowerCase())
        .join(" ");

      const matchesCategory =
        activeCategory === "all" || cardCategory === activeCategory;
      const matchesSearch =
        !q ||
        cardTitle.includes(q) ||
        cardKicker.includes(q) ||
        cardDesc.includes(q) ||
        cardBadge.includes(q) ||
        cardStatus.includes(q) ||
        features.includes(q);

      if (matchesCategory && matchesSearch) {
        matchedCards.push(card);
        visibleCount++;
      } else {
        hiddenCards.push(card);
      }
    });

    // Update active counter
    if (activeCountEl) {
      activeCountEl.textContent = `${visibleCount} of ${cards.length}`;
    }

    // Toggle empty state
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }

    // Animate hiding
    hiddenCards.forEach((card) => {
      if (card.style.display !== "none") {
        if (window.gsap) {
          window.gsap.to(card, {
            opacity: 0,
            scale: 0.95,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () => {
              card.style.display = "none";
            },
          });
        } else {
          card.style.display = "none";
        }
      }
    });

    // Animate showing
    matchedCards.forEach((card, idx) => {
      const wasHidden = card.style.display === "none";
      card.style.display = "flex";
      if (wasHidden && window.gsap) {
        window.gsap.fromTo(
          card,
          { opacity: 0, scale: 0.95, y: 10 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            delay: Math.min(idx * 0.04, 0.25),
            ease: "power2.out",
          },
        );
      } else if (window.gsap) {
        window.gsap.to(card, { opacity: 1, scale: 1, y: 0, duration: 0.25 });
      }
    });
  }

  // Filter tab events
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-filter") || "all";
      playSound("click");
      applyFilters();
    });
  });

  // Search input events
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = searchQuery ? "block" : "none";
      }
      applyFilters();
    });
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchQuery = "";
        clearBtn.style.display = "none";
        playSound("click");
        applyFilters();
        searchInput.focus();
      }
    });
  }
}

function initServiceCards() {
  const cards = document.querySelectorAll(".service-facility-card");

  cards.forEach((card) => {
    // Spatial 3D hover tracking with GSAP
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      if (window.gsap) {
        window.gsap.to(card, {
          transformPerspective: 800,
          rotateX,
          rotateY,
          duration: 0.25,
          ease: "power1.out",
        });
      }
    });

    card.addEventListener("mouseleave", () => {
      if (window.gsap) {
        window.gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    });

    const linkBtn = card.querySelector(".service-card-action");
    if (linkBtn) {
      linkBtn.addEventListener("click", () => {
        playSound("click");
      });
    }
  });
}
