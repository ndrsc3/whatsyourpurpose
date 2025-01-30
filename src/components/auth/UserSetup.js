import { generateDeviceFingerprint } from '../../utils/deviceUtils.js';
import { fetchWithAuth } from '../../utils/authUtils.js';
import App from '../../app.js';

export class UserSetup {

    constructor() {

        this.userId = null;
        this.deviceId = null;
        this.username = null;

        this.container = document.getElementById('user-setup');
        this.form = document.getElementById('user-setup-form');
        this.usernameInput = document.getElementById('username');
        this.saveButton = document.getElementById('save-username');
        this.errorElement = document.getElementById('username-error');
        this.recoveryLink = document.getElementById('show-recovery');
        
        this.bindEvents();
    }

    bindEvents() {
        this.saveButton.addEventListener('click', () => this.handleSaveUser());
        this.recoveryLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
            document.getElementById('account-recovery').classList.remove('hidden');
        });
    }

    async handleSaveUser() {
        console.group('🔵 [User] Save Username Process');
        try {
            const username = this.usernameInput.value.trim();
            
            if (!username) {
                this.showError('Please enter a username');
                return;
            }
        
            // Check username availability
            const checkResponse = await fetch('/api/check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (checkResponse.status === 409) {
                console.warn('🟡 [User] Username taken:', username);
                this.errorElement.textContent = 'Username already taken';
                this.errorElement.classList.remove('hidden');
                this.usernameInput.classList.add('error');
                return;
            }

            // Generate userId if not exists
            if (!this.userId) {
                this.userId = crypto.randomUUID();
            }

            // Get device information
            const deviceFingerprint = await generateDeviceFingerprint();

            // Show recovery question and get answer
            this.form.classList.add('hidden');

            const recoveryMessage = `
                <div class="recovery-code-container">
                    <h3>🤔 One Last Fun Question</h3>
                    <p>If you could shoot a liquid out of your index finger, what would it be?</p>
                    <input type="password" id="recovery-answer" class="recovery-input" placeholder="Your answer..." autocomplete="new-password">
                    <p class="recovery-warning">Remember your answer! You'll need it if you want to recover your account on a new device.</p>
                    <button id="confirm-recovery" class="primary-button">Save My Answer</button>
                    <p id="recovery-error" class="error hidden"></p>
                </div>
            `;

            const recoveryDisplay = document.getElementById('recovery-code-display');
            if (!recoveryDisplay) {
                throw new Error('Recovery display element not found');
            }

            recoveryDisplay.innerHTML = recoveryMessage;
            recoveryDisplay.classList.remove('hidden');

            // Wait for user to answer
            const recoveryAnswer = await new Promise((resolve, reject) => {
                const confirmButton = document.getElementById('confirm-recovery');
                
                if (!confirmButton) {
                    reject(new Error('Confirm button not found'));
                    return;
                }

                const handleClick = () => {
                    const answerInput = document.getElementById('recovery-answer');
                    if (!answerInput) {
                        reject(new Error('Answer input not found'));
                        return;
                    }

                    const answer = answerInput.value.trim();
                    if (!answer) {
                        const recoveryError = document.getElementById('recovery-error');
                        if (recoveryError) {
                            recoveryError.textContent = 'Please enter an answer';
                            recoveryError.classList.remove('hidden');
                        }
                        return;
                    }

                    // Clean up event listener
                    confirmButton.removeEventListener('click', handleClick);
                    resolve(answer);
                };

                confirmButton.addEventListener('click', handleClick);
            });

            // Save user with recovery answer
            const saveResponse = await fetch('/api/save-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    username,
                    deviceId: this.deviceId,
                    deviceFingerprint,
                    recoveryAnswer
                })
            });

            if (!saveResponse.ok) {
                throw new Error(`HTTP error! status: ${saveResponse.status}`);
            }

            const result = await saveResponse.json();

            // Store tokens in localStorage
            localStorage.setItem('dev_authTokens', JSON.stringify({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                userId: this.userId,
                username: username
            }));

            // Update UI
            document.getElementById('recovery-code-display').classList.add('hidden');
            document.getElementById('user-setup').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');

            // Initialize the app
            App.initializeApp();

            console.debug('🔵 [User] User setup completed successfully:', {
                username: this.username,
                userId: this.userId
            });
        } catch (error) {
            console.error('🔴 [User] Error saving username:', error);
            this.showError('Failed to save username. Please try again.');
        }
        console.groupEnd();
    }

    async refreshAccessToken() {
        try {
            // Get current auth data
            const authData = JSON.parse(localStorage.getItem('dev_authTokens'));
            if (!authData?.refreshToken) {
                throw new Error('No refresh token available');
            }
            this.refreshToken = authData.refreshToken;

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const { accessToken } = await response.json();
            
            // Update instance and localStorage
            this.accessToken = accessToken;
            const updatedAuthData = {
                ...authData,
                accessToken
            };
            localStorage.setItem('dev_authTokens', JSON.stringify(updatedAuthData));
            
            return true;
        } catch (error) {
            console.error('🔴 Failed to refresh token:', error);
            return false;
        }
    }

    async fetchWithAuth(url, options = {}) {
        // Get the latest tokens from localStorage
        const authData = JSON.parse(localStorage.getItem('dev_authTokens'));
        if (authData?.accessToken) {
            this.accessToken = authData.accessToken;
            this.refreshToken = authData.refreshToken;
            this.userId = authData.userId;
            this.username = authData.username;
        }

        // Add authorization header
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            // If token expired, try to refresh
            if (response.status === 401) {
                const data = await response.json();
                if (data.code === 'TOKEN_EXPIRED' && await this.refreshAccessToken()) {
                    // Update localStorage with new token
                    const updatedAuthData = {
                        ...authData,
                        accessToken: this.accessToken
                    };
                    localStorage.setItem('dev_authTokens', JSON.stringify(updatedAuthData));
                    
                    // Retry with new token
                    headers.Authorization = `Bearer ${this.accessToken}`;
                    return fetch(url, { ...options, headers });
                }
            }
            
            return response;
        } catch (error) {
            console.error('🔴 Request failed:', error);
            throw error;
        }
    }


    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.classList.remove('hidden');
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new UserSetup(); 