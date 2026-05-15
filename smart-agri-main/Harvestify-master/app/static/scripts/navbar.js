// navbar.js - Navbar Active State, Mobile Menu, and Scroll Effects

(function () {
  "use strict";

  // Set active nav item based on current URL
  function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      const navItem = link.closest(".nav-item");

      if (
        currentPath === linkPath ||
        (currentPath === "/" && linkPath === "/")
      ) {
        navItem.classList.add("active");
      } else {
        navItem.classList.remove("active");
      }
    });
  }

  // Close mobile navbar when clicking a link
  function setupMobileNavClose() {
    const navLinks = document.querySelectorAll(".nav-link");
    const navbarCollapse = document.getElementById("navbarResponsive");

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navbarCollapse && navbarCollapse.classList.contains("show")) {
          const navbarToggler = document.querySelector(".navbar-toggler");
          if (navbarToggler) {
            navbarToggler.click();
          }
        }
      });
    });
  }

  // Add scroll effect to navbar
  function handleNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  // Initialize navbar functionality
  function initNavbar() {
    setActiveNavItem();
    setupMobileNavClose();
    handleNavbarScroll(); // Initial check

    // Add scroll event listener
    window.addEventListener("scroll", handleNavbarScroll);
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavbar);
  } else {
    initNavbar();
  }
})();
