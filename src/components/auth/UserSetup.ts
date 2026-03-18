import { generateDeviceFingerprint } from '../../utils/deviceUtils.js';
import App from '../../app.js';
import type { AuthData } from '../../types.js';

export class UserSetup {
    private userId: string | null;
    private deviceId: string | null;
    private username: string | null;
    private container: HTMLElement | null;
    private form: HTMLElement | null;
    private usernameInput: HTMLInputElement | null;
    private saveButton: HTMLElement | null;
    private errorElement: HTMLElement | null;
    private recoveryLink: HTMLElement | null;

    constructor() {
        this.userId = null;
        this.deviceId = null;
        this.username = null;

        this.container = document.getElementById('user-setup');
        this.form = document.getElementById('user-setup-form');
        this.usernameInput = document.getElementById('username') as HTMLInputElement | null;
        this.saveButton = document.getElementById('save-username');
        this.errorElement = document.getElementById('username-error');
        this.recoveryLink = document.getElementById('show-recovery');

        this.bindEvents();
    }

    bindEvents(): void {
        this.saveButton?.addEventListener('click', () => this.handleSaveUser());
        this.recoveryLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
            document.getElementById('account-recovery')?.classList.remove('hidden');
        });
    }

    async handleSaveUser(): Promise<void> {
        console.group('🔵 [User] Save Username Process');
        try {
            const username = this.usernameInput?.value.trim() ?? '';

            if (!username) {
                this.showError('Please enter a username');
                return;
            }

            const checkResponse = await fetch('/api/auth-check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (checkResponse.status === 409) {
                console.warn('🟡 [User] Username taken:', username);
                if (this.errorElement) {
                    this.errorElement.textContent = 'Username already taken';
                    this.errorElement.classList.remove('hidden');
                }
                this.usernameInput?.classList.add('error');
                return;
            }

            if (!this.userId) {
                this.userId = crypto.randomUUID();
            }

            const deviceFingerprint = await generateDeviceFingerprint();

            this.form?.classList.add('hidden');

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

            const recoveryAnswer = await new Promise<string>((resolve, reject) => {
                const confirmButton = document.getElementById('confirm-recovery');

                if (!confirmButton) {
                    reject(new Error('Confirm button not found'));
                    return;
                }

                const handleClick = () => {
                    const answerInput = document.getElementById('recovery-answer') as HTMLInputElement | null;
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

                    confirmButton.removeEventListener('click', handleClick);
                    resolve(answer);
                };

                confirmButton.addEventListener('click', handleClick);
            });

            const saveResponse = await fetch('/api/auth-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    username,
                    deviceId: this.deviceId,
                    deviceFingerprint,
                    recoveryAnswer,
                }),
            });

            if (!saveResponse.ok) {
                throw new Error(`HTTP error! status: ${saveResponse.status}`);
            }

            const result = await saveResponse.json();

            const authData: AuthData = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                userId: this.userId,
                username,
            };
            localStorage.setItem('appWMP_auth', JSON.stringify(authData));

            document.getElementById('recovery-code-display')?.classList.add('hidden');
            document.getElementById('user-setup')?.classList.add('hidden');
            document.getElementById('main-app')?.classList.remove('hidden');

            App.initializeApp();

            console.debug('🔵 [User] User setup completed successfully:', {
                username: this.username,
                userId: this.userId,
            });
        } catch (error) {
            console.error('🔴 [User] Error saving username:', error);
            this.showError('Failed to save username. Please try again.');
        }
        console.groupEnd();
    }

    showError(message: string): void {
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.classList.remove('hidden');
        }
    }

    show(): void {
        this.container?.classList.remove('hidden');
    }

    hide(): void {
        this.container?.classList.add('hidden');
    }
}

export default new UserSetup();
