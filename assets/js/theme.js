const themeStorageKey = "japanote-theme";
const themeModes = ["system", "light", "dark"];

function getSavedThemeMode() {
  const saved = localStorage.getItem(themeStorageKey);
  return themeModes.includes(saved) ? saved : "system";
}

function applyThemeMode(mode) {
  const root = document.documentElement;
  const nextMode = themeModes.includes(mode) ? mode : "system";

  if (nextMode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", nextMode);
  }

  root.setAttribute("data-theme-mode", nextMode);
  updateThemeToggleLabel(nextMode);
}

function updateThemeToggleLabel(mode = getSavedThemeMode()) {
  const labelMap = {
    system: "\uD14C\uB9C8\uB294 \uAE30\uAE30\uC5D0 \uB9DE\uCD9C\uAC8C\uC694",
    light: "\uBC1D\uAC8C \uBCFC\uAE4C\uC694?",
    dark: "\uCC28\uBD84\uD558\uAC8C \uBCFC\uAE4C\uC694?"
  };

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.textContent = "";
    button.dataset.themeMode = mode;
    button.setAttribute("aria-label", labelMap[mode]);
    button.setAttribute("title", labelMap[mode]);
  });
}

function cycleThemeMode() {
  const current = getSavedThemeMode();
  const currentIndex = themeModes.indexOf(current);
  const nextMode = themeModes[(currentIndex + 1) % themeModes.length];

  localStorage.setItem(themeStorageKey, nextMode);
  applyThemeMode(nextMode);
}

function updateNavToggleLabel(button, expanded) {
  const label = button.querySelector("[data-nav-toggle-label]");
  const icon = button.querySelector(".material-symbols-rounded");
  const text = expanded ? "\uB2EB\uAE30" : "\uBA54\uB274";
  const iconName = expanded ? "close" : "menu";
  const title = expanded
    ? "\uBA54\uB274 \uB2EB\uAE30"
    : "\uBA54\uB274 \uC5F4\uAE30";

  if (label) {
    label.textContent = text;
  }
  if (icon) {
    icon.textContent = iconName;
  }

  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute("aria-label", title);
  button.setAttribute("title", title);
}

function initializeMobileNav() {
  document.querySelectorAll(".topbar").forEach((header, index) => {
    const nav = header.querySelector(".nav-links");
    const themeButton = header.querySelector("[data-theme-toggle]");

    if (!nav || !themeButton) {
      return;
    }

    let actions = header.querySelector(".topbar-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "topbar-actions";
      header.appendChild(actions);
    }

    if (!actions.contains(themeButton)) {
      actions.appendChild(themeButton);
    }

    let navToggle = actions.querySelector("[data-nav-toggle]");
    if (!navToggle) {
      navToggle = document.createElement("button");
      navToggle.type = "button";
      navToggle.className = "secondary-btn button-with-icon nav-toggle";
      navToggle.setAttribute("data-nav-toggle", "");
      navToggle.innerHTML =
        '<span class="material-symbols-rounded" aria-hidden="true">menu</span><span data-nav-toggle-label>\uBA54\uB274</span>';
      actions.insertBefore(navToggle, actions.firstChild);
    }

    const navId = nav.id || `topbar-nav-${index + 1}`;
    nav.id = navId;
    navToggle.setAttribute("aria-controls", navId);

    const closeMenu = () => {
      header.classList.remove("is-nav-open");
      updateNavToggleLabel(navToggle, false);
    };

    navToggle.addEventListener("click", () => {
      const nextExpanded = !header.classList.contains("is-nav-open");
      header.classList.toggle("is-nav-open", nextExpanded);
      updateNavToggleLabel(navToggle, nextExpanded);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    header.dataset.mobileNav = "ready";
    updateNavToggleLabel(navToggle, header.classList.contains("is-nav-open"));
  });
}

function initializeTheme() {
  applyThemeMode(getSavedThemeMode());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", cycleThemeMode);
  });
}

initializeMobileNav();
initializeTheme();
