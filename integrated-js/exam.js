
    document.addEventListener('DOMContentLoaded', () => {
      const menuToggle = document.querySelector('.nav-hamburger-btn') || document.getElementById('menu-toggle');
      const dropdownMenu = document.querySelector('.nav-dropdown-glass-container');
      
      if (menuToggle && dropdownMenu) {
        menuToggle._hasToggleListener = true;
        menuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('active');
          // Smoothly transition aria attributes for universal accessibility updates
          const isExpanded = dropdownMenu.classList.contains('active');
          menuToggle.setAttribute('aria-expanded', isExpanded);
        });
        
        // Force close the overlay dropdown if the user clicks anywhere outside of it
        document.addEventListener('click', (e) => {
          if (!dropdownMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
