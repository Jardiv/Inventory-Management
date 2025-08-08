// Theme Management Script
// public/script/script.js

// Initialize theme on page load
function initializeTheme() {
    // Get saved theme from localStorage, default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply theme to document
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Update theme toggle icons if they exist
    updateThemeIcons(savedTheme);
}

// Update theme toggle button icons
function updateThemeIcons(theme) {
    const lightIcon = document.querySelector('.light-icon');
    const darkIcon = document.querySelector('.dark-icon');
    
    if (lightIcon && darkIcon) {
        if (theme === 'dark') {
            lightIcon.classList.remove('active');
            darkIcon.classList.add('active');
        } else {
            lightIcon.classList.add('active');
            darkIcon.classList.remove('active');
        }
    }
}

// Toggle theme function (enhanced version)
function toggleTheme() {
    console.log("Toggle Theme");
    
    const btnTheme = document.querySelector(".btn-theme");
    const lightIcon = document.querySelector(".light-icon");
    const darkIcon = document.querySelector(".dark-icon");
    
    // Get current theme
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Remove active class and animation
    if (btnTheme) {
        btnTheme.classList.remove("active");
        // Force reflow to restart animation
        void btnTheme.offsetWidth;
        // Add active class to trigger animation
        btnTheme.classList.add("active");
    }
    
    // Toggle theme class
    document.documentElement.classList.toggle('dark');
    
    // Update icons
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle("active");
        darkIcon.classList.toggle("active");
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', newTheme);
    
    console.log(`Theme switched to: ${newTheme}`);
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Also initialize immediately in case DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}

// Listen for storage changes (for cross-tab synchronization)
window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
        initializeTheme();
    }
});

// Expose toggleTheme globally for inline onclick handlers
window.toggleTheme = toggleTheme;

// Sidebar Management Functions - 3-Mode System
let currentSidebarMode = 'expanded'; // 'expanded', 'collapsed', 'hover'

// Initialize sidebar on page load
function initializeSidebar() {
    const savedMode = localStorage.getItem('sidebarMode') || 'expanded';
    applySidebarModeInternal(savedMode);
}

// Initialize sidebar immediately and on DOM ready
function earlyInitializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const savedMode = localStorage.getItem('sidebarMode') || 'expanded';
        applySidebarModeInternal(savedMode);
    } else {
        // If sidebar not found, try again after a brief delay
        setTimeout(earlyInitializeSidebar, 10);
    }
}

// Toggle sidebar control dropdown
function toggleSidebarDropdown() {
    const dropdown = document.getElementById('sidebarDropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.classList.contains('show');
    
    if (isVisible) {
        closeSidebarDropdown();
    } else {
        openSidebarDropdown();
    }
}

// Open sidebar control dropdown
function openSidebarDropdown() {
    const dropdown = document.getElementById('sidebarDropdown');
    if (!dropdown) return;
    
    // Set current mode in radio buttons
    const currentRadio = document.querySelector(`input[name="sidebarMode"][value="${currentSidebarMode}"]`);
    if (currentRadio) {
        currentRadio.checked = true;
    }
    
    // Show dropdown with animation
    dropdown.classList.remove('hidden');
    dropdown.classList.add('show');
    
    // Add event listener for clicks outside
    setTimeout(() => {
        document.addEventListener('click', handleDropdownOutsideClick);
    }, 10);
}

// Close sidebar control dropdown
function closeSidebarDropdown() {
    const dropdown = document.getElementById('sidebarDropdown');
    if (!dropdown) return;
    
    // Hide dropdown with animation
    dropdown.classList.remove('show');
    
    setTimeout(() => {
        dropdown.classList.add('hidden');
    }, 200);
    
    // Remove event listener
    document.removeEventListener('click', handleDropdownOutsideClick);
}

// Handle clicks outside dropdown
function handleDropdownOutsideClick(event) {
    const dropdown = document.getElementById('sidebarDropdown');
    const button = document.querySelector('.btn-sidebar-toggle');
    
    if (!dropdown || !button) return;
    
    // Check if click is outside both dropdown and button
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        closeSidebarDropdown();
    }
}

// Apply selected sidebar mode from dropdown
function applySidebarMode() {
    const selectedMode = document.querySelector('input[name="sidebarMode"]:checked')?.value;
    if (selectedMode) {
        applySidebarModeInternal(selectedMode);
        localStorage.setItem('sidebarMode', selectedMode);
        closeSidebarDropdown();
    }
}

// Internal function to apply sidebar mode
function applySidebarModeInternal(mode) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    currentSidebarMode = mode;
    
    // Clear all previous attributes
    sidebar.removeAttribute('data-state');
    sidebar.removeAttribute('data-collapsible');
    sidebar.removeAttribute('data-mode');
    
    // Apply mode-specific attributes
    switch (mode) {
        case 'expanded':
            sidebar.setAttribute('data-state', 'expanded');
            break;
        case 'collapsed':
            sidebar.setAttribute('data-state', 'collapsed');
            sidebar.setAttribute('data-collapsible', 'icon');
            break;
        case 'hover':
            sidebar.setAttribute('data-mode', 'hover');
            sidebar.setAttribute('data-collapsible', 'icon');
            break;
    }
}

// Add event listener for radio button changes to apply mode immediately
document.addEventListener('change', function(event) {
    if (event.target.name === 'sidebarMode') {
        applySidebarMode();
    }
});

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSidebar);

// Also initialize immediately to prevent flashing
earlyInitializeSidebar();

// Expose sidebar functions globally
window.toggleSidebarDropdown = toggleSidebarDropdown;
window.openSidebarDropdown = openSidebarDropdown;
window.closeSidebarDropdown = closeSidebarDropdown;
window.applySidebarMode = applySidebarMode;
window.initializeSidebar = initializeSidebar;

// Simple toggle function for quick switching between expanded and collapsed
function toggleSidebar() {
    if (currentSidebarMode === 'expanded') {
        applySidebarModeInternal('collapsed');
        localStorage.setItem('sidebarMode', 'collapsed');
    } else {
        applySidebarModeInternal('expanded');
        localStorage.setItem('sidebarMode', 'expanded');
    }
}

window.toggleSidebar = toggleSidebar;
