// scroll-to-top.js - Scroll to Top Button Functionality

(function() {
  'use strict';
  
  const SCROLL_THRESHOLD = 300; // Show button after scrolling 300px
  
  // Scroll to top function
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Set focus to skip content or main heading for accessibility
    setTimeout(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        mainContent.removeAttribute('tabindex');
      }
    }, 500);
  }
  
  // Show/hide scroll button based on scroll position
  function handleScroll() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;
    
    if (window.pageYOffset > SCROLL_THRESHOLD) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  }
  
  // Initialize scroll to top functionality
  function initScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;
    
    // Add click event
    scrollBtn.addEventListener('click', scrollToTop);
    
    // Add keyboard support
    scrollBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToTop();
      }
    });
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollToTop);
  } else {
    initScrollToTop();
  }
  
  // Export for external use
  window.scrollToTop = scrollToTop;
})();
