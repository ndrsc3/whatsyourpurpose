import { generateDeviceFingerprint } from '../../utils/deviceUtils.js';
import App from '../../app.js';

export class AccountRecovery {
    constructor() {
        this.container = document.getElementById('account-recovery');
        this.usernameInput = document.getElementById('recovery-username');
        this.answerInput = document.getElementById('recovery-answer');
        this.recoverButton = document.getElementById('recover-account');
        this.errorElement = document.getElementById('recovery-error');
        this.codeContainer = document.getElementById('recovery-code-container');
        this.signupLink = document.getElementById('show-signup');
        
        this.bindEvents();
    }

    bindEvents() {
        this.recoverButton.addEventListener('click', () => this.handleRecovery());
        this.signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
            document.getElementById('user-setup').classList.remove('hidden');
        });
    }

    async handleRecovery() {
        console.group('🔵 [User] Account Recovery Process');
        try {

            const username = this.usernameInput.value.trim();
            const recoveryAnswer = this.answerInput.value.trim();

            if (!username) {
                this.showError('Please enter your username');
                return;
            }

            // Get device information
            const deviceFingerprint = await generateDeviceFingerprint();

            // Try to recover without answer first (for known devices)
            const response = await fetch('/api/auth-recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username, 
                    recoveryAnswer,
                    deviceId: this.deviceId,
                    deviceFingerprint
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 && !recoveryAnswer) {
                    document.getElementById('recovery-code-container').classList.remove('hidden');
                    document.getElementById('recovery-question').textContent = 
                        'If you could shoot a liquid out of your index finger, what would it be?';
                    this.showError('Please answer the recovery question', 'recovery-error');
                    return;
                }
                this.showError(result.error || 'Recovery failed', 'recovery-error');
                return;
            }

            // Store tokens and user info
            const authData = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                userId: result.userId,
                username: result.username
            };

            // Validate required fields
            if (!authData.accessToken || !authData.refreshToken || !authData.userId || !authData.username) {
                throw new Error('Incomplete authentication data received');
            }

            // Update instance properties
            Object.assign(this, authData);

            // Store in localStorage
            localStorage.setItem('appWMP_auth', JSON.stringify(authData));

            // Update UI and initialize app
            this.container.classList.add('hidden');
            document.getElementById('recovery-code-display').classList.add('hidden');
            document.getElementById('user-setup').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');

            // Initialize the app
            App.initializeApp();

            console.debug('🔵 [User] Account recovered successfully:', {
                username: this.username,
                userId: this.userId
            });
        } catch (error) {
            console.error('🔴 [User] Error recovering account:', error);
            this.showError('Failed to recover account. Please try again.', 'recovery-error');
        }
        console.groupEnd();
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.classList.remove('hidden');
    }

    show() {
        this.container.classList.remove('hidden');
        this.codeContainer.classList.add('hidden');
        this.usernameInput.value = '';
        this.answerInput.value = '';
        this.errorElement.classList.add('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new AccountRecovery(); 