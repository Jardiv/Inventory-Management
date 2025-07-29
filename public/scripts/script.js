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