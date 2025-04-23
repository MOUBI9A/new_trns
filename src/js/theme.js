// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateIcon(savedTheme, icon);
    } else {
        // Use system preference if available
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDarkMode ? 'dark' : 'light';
        htmlElement.setAttribute('data-bs-theme', initialTheme);
        updateIcon(initialTheme, icon);
    }
    
    // Toggle theme
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateIcon(newTheme, icon);
    });
});

// Update icon based on current theme
function updateIcon(theme, iconElement) {
    if (theme === 'dark') {
        iconElement.classList.remove('bi-moon-stars');
        iconElement.classList.add('bi-sun');
    } else {
        iconElement.classList.remove('bi-sun');
        iconElement.classList.add('bi-moon-stars');
    }
} 