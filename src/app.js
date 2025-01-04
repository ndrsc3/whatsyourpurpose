import ThemeToggle from './components/common/ThemeToggle.js';
import UserSetup from './components/auth/UserSetup.js';
import AccountRecovery from './components/auth/AccountRecovery.js';
import Footer from './components/common/Footer.js';
import ValuesSelection from './components/purpose/ValuesSelection.js';
import StrengthsSelection from './components/purpose/StrengthsSelection.js';
import QuestionsForm from './components/purpose/QuestionsForm.js';

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
        document.getElementById('main-app').classList.remove('hidden');
        
        // Determine which component to show based on progress
        const hasValues = localStorage.getItem('selectedValues');
        const hasStrengths = localStorage.getItem('selectedStrengths');
        const hasAnswers = localStorage.getItem('questionAnswers');

        if (!hasValues) {
            ValuesSelection.show();
        } else if (!hasStrengths) {
            StrengthsSelection.show();
        } else if (!hasAnswers) {
            QuestionsForm.show();
        }
    } else {
        document.getElementById('user-setup').classList.remove('hidden');
    }
}); 