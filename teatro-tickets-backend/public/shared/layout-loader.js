/**
 * Baco Teatro - Layout Loader
 * Loads shared headers and footers dynamically
 * Mobile-first design system
 */

(function() {
  'use strict';

  // Load component from shared folder
  async function loadComponent(componentPath, targetSelector, insertMode = 'replace') {
    try {
      const response = await fetch(componentPath);
      if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
      
      const html = await response.text();
      const target = document.querySelector(targetSelector);
      
      if (!target) {
        console.warn(`Target ${targetSelector} not found for ${componentPath}`);
        return false;
      }

      switch(insertMode) {
        case 'replace':
          target.innerHTML = html;
          break;
        case 'prepend':
          target.insertAdjacentHTML('afterbegin', html);
          break;
        case 'append':
          target.insertAdjacentHTML('beforeend', html);
          break;
      }

      return true;
    } catch (error) {
      console.error('Error loading component:', error);
      return false;
    }
  }

  // Detect which footer to use based on page context
  function detectFooterType() {
    const path = window.location.pathname;
    
    // Legal pages
    if (path.includes('terminos') || path.includes('privacidad') || path.includes('politica')) {
      return '/shared/footer-legal.html';
    }
    
    // Internal dashboard pages
    if (path.includes('/pages/roles/') || 
        path.includes('/pages/admin/') ||
        path.includes('/pages/grupos/') ||
        path.includes('/pages/obras/') ||
        path.includes('/pages/usuarios/')) {
      return '/shared/footer-interno.html';
    }
    
    // Public pages (default)
    return '/shared/footer-publico.html';
  }

  // Apply footer class based on page
  function applyFooterClass() {
    const path = window.location.pathname;
    const footerElement = document.querySelector('.baco-footer');
    
    if (!footerElement) return;
    
    // Index page gets transparent footer
    if (path === '/' || path === '/index.html') {
      footerElement.classList.add('footer-transparent');
    }
    // Login and auth pages get gradient footer
    else if (path.includes('login') || path.includes('/pages/auth/')) {
      footerElement.classList.add('footer-gradient');
    }
    // Dashboard pages get light footer
    else if (path.includes('/pages/roles/') || path.includes('/pages/admin/')) {
      footerElement.classList.add('footer-light');
    }
  }

  // Initialize layout components
  async function initLayout() {
    // Load public header if container exists
    if (document.getElementById('header-container')) {
      await loadComponent('/shared/header-public.html', '#header-container');
    }

    // Load dashboard header if container exists
    if (document.getElementById('dashboard-header-container')) {
      await loadComponent('/shared/header-dashboard.html', '#dashboard-header-container');
    }

    // Load appropriate footer if container exists
    if (document.getElementById('footer-container')) {
      const footerType = detectFooterType();
      await loadComponent(footerType, '#footer-container');
      
      // Wait a tick for the footer to be in the DOM
      setTimeout(applyFooterClass, 10);
    }

    // Emit event when layout is loaded
    document.dispatchEvent(new CustomEvent('bacoLayoutLoaded'));
  }

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }

  // Export to global scope for manual usage
  window.BacoLayout = {
    loadComponent,
    init: initLayout
  };
})();
