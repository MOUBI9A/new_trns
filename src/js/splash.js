// Handle splash screen animation and timing
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    
    // Show splash screen for 2 seconds, then fade out
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        
        // After fade animation completes, hide splash screen
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }, 2000);
}); 