// theme-toggle.js - Fixed Theme Toggle (Shows opposite mode)

(function () {
  "use strict";

  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");
  const html = document.documentElement;

  // Load saved theme on page load
  function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    html.setAttribute("data-theme", savedTheme);
    updateButton(savedTheme);
  }

  // Update button to show OPPOSITE theme (what you can switch TO)
  function updateButton(currentTheme) {
    if (currentTheme === "dark") {
      // Currently in DARK mode, show LIGHT button (what you can switch to)
      themeIcon.textContent = "☀️";
      themeText.textContent = "Light";
    } else {
      // Currently in LIGHT mode, show DARK button (what you can switch to)
      themeIcon.textContent = "🌙";
      themeText.textContent = "Dark";
    }
  }

  // Toggle theme
  function toggleTheme() {
    const currentTheme = html.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateButton(newTheme);
  }

  // Initialize
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Load theme immediately
  loadTheme();
})();
