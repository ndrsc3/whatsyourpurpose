import ThemeToggle from './components/common/ThemeToggle.js';
import UserSetup from './components/auth/UserSetup.js';
import AccountRecovery from './components/auth/AccountRecovery.js';
import Footer from './components/common/Footer.js';

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
        document.getElementById('main-app').classList.remove('hidden');
    } else {
        document.getElementById('user-setup').classList.remove('hidden');
    }
}); 