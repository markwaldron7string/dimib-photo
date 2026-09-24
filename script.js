/* Tabs */
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".gallery-panel");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    document
      .getElementById("tab-" + btn.dataset.tab)
      .classList.add("active");

    currentItems = getActiveItems();
  });
});

/* Tab underline */
const underline = document.querySelector(".tab-underline");

function moveUnderline(el) {
  const text = el.querySelector("span");

  const rect = text.getBoundingClientRect();
  const parentRect = el.parentElement.getBoundingClientRect();

  underline.style.width = rect.width + "px";
  underline.style.left = (rect.left - parentRect.left) + "px";
}

// set initial position (after page loads)
moveUnderline(document.querySelector(".tab-btn.active"));

// update underline on click, and bring the tab fully into view on narrow screens
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    moveUnderline(btn);
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  });
});

/* Tab scroll arrows */
const tabsScroller = document.querySelector(".tabs-scroller");
const tabsBar = tabsScroller.querySelector(".gallery-tabs");

function updateTabArrows() {
  const { scrollLeft, scrollWidth, clientWidth } = tabsBar;
  tabsScroller.classList.toggle("can-left", scrollLeft > 4);
  tabsScroller.classList.toggle("can-right", scrollLeft + clientWidth < scrollWidth - 4);
}

tabsScroller.querySelectorAll(".tabs-arrow").forEach((arrow) => {
  arrow.addEventListener("click", () => {
    const dir = arrow.classList.contains("tabs-arrow-left") ? -1 : 1;
    tabsBar.scrollBy({ left: dir * tabsBar.clientWidth * 0.7, behavior: "smooth" });
  });
});

tabsBar.addEventListener("scroll", updateTabArrows, { passive: true });
window.addEventListener("resize", updateTabArrows);
updateTabArrows();


/* Nav */
const toggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-links");
const navLinks = document.querySelectorAll(".nav-links a");

// Toggle menu
toggle.addEventListener("click", (e) => {
  e.stopPropagation();
  navMenu.classList.toggle("open");
  toggle.classList.toggle("open");
  document.querySelector("nav").classList.toggle("menu-open");
});

// Close menu when clicking a link
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    toggle.classList.remove("open");
    document.querySelector("nav").classList.remove("menu-open");
  });
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest("nav")) {
    navMenu.classList.remove("open");
    toggle.classList.remove("open");
    document.querySelector("nav").classList.remove("menu-open");
  }
});


/* Lightbox */
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
const lbCap = document.getElementById("lightbox-caption");
const lbClose = document.getElementById("lightbox-close");
const lbPrev = document.getElementById("lightbox-prev");
const lbNext = document.getElementById("lightbox-next");

let lbIdx = 0;
let currentItems = [];

function getActiveItems() {
  const activePanel = document.querySelector(".gallery-panel.active");
  return Array.from(activePanel.querySelectorAll(".photo-item"));
}

currentItems = getActiveItems();

// Full-size images, loaded ahead of time so stepping through feels instant
const fullImages = new Map();

function loadFull(item) {
  const src = item.dataset.src || item.querySelector("img").src;
  if (!fullImages.has(src)) {
    const img = new Image();
    img.src = src;
    fullImages.set(src, img);
  }
  return fullImages.get(src);
}

function openLightbox(idx) {
  lbIdx = idx;
  const item = currentItems[idx];
  const thumb = item.querySelector("img");
  const full = loadFull(item);

  // Show the already-cached grid thumbnail right away, then swap in the sharp version
  if (full.complete && full.naturalWidth) {
    lbImg.src = full.src;
  } else {
    lbImg.src = thumb.currentSrc || thumb.src;
    full.addEventListener(
      "load",
      () => {
        if (currentItems[lbIdx] === item) lbImg.src = full.src;
      },
      { once: true }
    );
  }
  lbImg.alt = thumb.alt;
  lbCap.textContent = item.dataset.caption || "";

  lb.classList.add("open");
  document.body.style.overflow = "hidden";

  // Neighbours next, so the next step is ready before it's needed
  const n = currentItems.length;
  loadFull(currentItems[(idx + 1) % n]);
  loadFull(currentItems[(idx - 1 + n) % n]);
}

function closeLightbox() {
  lb.classList.remove("open");
  document.body.style.overflow = "";
}

function stepLightbox(dir) {
  lbIdx = (lbIdx + dir + currentItems.length) % currentItems.length;
  openLightbox(lbIdx);
}

// Open
document.addEventListener("click", (e) => {
  const item = e.target.closest(".photo-item");
  if (item) {
    currentItems = getActiveItems();
    openLightbox(currentItems.indexOf(item));
  }
});

// Controls
lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => stepLightbox(-1));
lbNext.addEventListener("click", () => stepLightbox(1));

// Close on background click
lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox();
});

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});


/* Fade-up on scroll */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0, rootMargin: "0px 0px -100px 0px" }
);

document.querySelectorAll(".fade-up").forEach((el) => {
  const rect = el.getBoundingClientRect();

  if (rect.top < window.innerHeight) {
    el.classList.add("visible");
  } else {
    observer.observe(el);
  }
});


/* Active nav link */
const sections = document.querySelectorAll("section[id]");

window.addEventListener(
  "scroll",
  () => {
    let cur = "";

    sections.forEach((s) => {
      if (window.scrollY >= s.offsetTop - 100) {
        cur = s.id;
      }
    });

    // The last section is too short to reach the top of the viewport,
    // so treat hitting the bottom of the page as being on it
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) cur = sections[sections.length - 1].id;

    navLinks.forEach((a) => {
      a.classList.toggle(
        "active",
        a.getAttribute("href") === "#" + cur
      );
    });
  },
  { passive: true }
);


/* Contact form: submit in the background and report the result inline */
const contactForm = document.querySelector(".contact-form");
const formStatus = contactForm.querySelector(".form-status");
const formSubmit = contactForm.querySelector(".form-submit");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  formStatus.classList.remove("error");
  formStatus.textContent = "";
  formSubmit.disabled = true;
  formSubmit.textContent = "Sending…";

  try {
    const res = await fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(res.status);

    contactForm.reset();
    formStatus.textContent =
      "Thanks, your message is on its way. I'll get back to you within 48 hours.";
  } catch {
    formStatus.classList.add("error");
    formStatus.innerHTML =
      'Sorry, that didn\'t go through. Please email me directly at <a href="mailto:dimibphoto@gmail.com">dimibphoto@gmail.com</a>.';
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = "Send message";
  }
});
