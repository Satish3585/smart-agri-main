// image-preview.js - Fixed Image Upload Preview

(function() {
  'use strict';
  
  // Preview image function
  function preview_image(event) {
    const file = event.target.files[0];
    const output = document.getElementById('output-image');
    const placeholder = document.getElementById('upload-placeholder');
    const submitBtn = document.getElementById('submit-btn');
    const fileLabel = document.getElementById('file-label-text');
    
    // Validate file exists
    if (!file) {
      resetUpload();
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, JPEG, or PNG)');
      resetUpload();
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      resetUpload();
      return;
    }
    
    // Read and display the image
    const reader = new FileReader();
    
    reader.onload = function(e) {
      if (output && placeholder) {
        output.src = e.target.result;
        output.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
        }
        
        // Update file label
        if (fileLabel) {
          fileLabel.textContent = file.name;
        }
        
        // Add fade-in animation
        output.style.animation = 'fadeIn 0.3s ease';
      }
    };
    
    reader.onerror = function() {
      alert('Error reading file. Please try again.');
      resetUpload();
    };
    
    reader.readAsDataURL(file);
  }
  
  // Reset upload state
  function resetUpload() {
    const fileInput = document.getElementById('inputfile');
    const output = document.getElementById('output-image');
    const placeholder = document.getElementById('upload-placeholder');
    const submitBtn = document.getElementById('submit-btn');
    const fileLabel = document.getElementById('file-label-text');
    
    if (fileInput) fileInput.value = '';
    if (output) {
      output.src = '';
      output.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (submitBtn) submitBtn.disabled = true;
    if (fileLabel) fileLabel.textContent = 'Choose Image';
  }
  
  // Initialize when DOM is ready
  function init() {
    const fileInput = document.getElementById('inputfile');
    if (fileInput) {
      fileInput.addEventListener('change', preview_image);
    }
  }
  
  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Export for external use
  window.preview_image = preview_image;
})();
