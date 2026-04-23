import { generateDeviceFingerprint } from '../../utils/deviceUtils.js';
import App from '../../app.js';
import type { AuthData } from '../../types.js';

export class AccountRecovery {
    private container: HTMLElement | null;
    private usernameInput: HTMLInputElement | null;
    private answerInput: HTMLInputElement | null;
    private recoverButton: HTMLElement | null;
    private errorElement: HTMLElement | null;
    private codeContainer: HTMLElement | null;
    private signupLink: HTMLElement | null;
    private deviceId: string | null;

    constructor() {
        this.container = document.getElementById('account-recovery');
        this.usernameInput = document.getElementById('recovery-username') as HTMLInputElement | null;
        this.answerInput = document.getElementById('recovery-answer') as HTMLInputElement | null;
        this.recoverButton = document.getElementById('recover-account');
        this.errorElement = document.getElementById('recovery-error');
        this.codeContainer = document.getElementById('recovery-code-container');
        this.signupLink = document.getElementById('show-signup');
        this.deviceId = null;

        this.bindEvents();
    }

    bindEvents(): void {
        this.recoverButton?.addEventListener('click', () => this.handleRecovery());
        this.signupLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
            document.getElementById('user-setup')?.classList.remove('hidden');
        });
    }

    async handleRecovery(): Promise<void> {
        console.group('🔵 [User] Account Recovery Process');
        try {
            const username = this.usernameInput?.value.trim() ?? '';
            const recoveryAnswer = this.answerInput?.value.trim() ?? '';

            if (!username) {
                this.showError('Please enter your username');
                return;
            }

            const deviceFingerprint = await generateDeviceFingerprint();

            const response = await fetch('/api/auth-recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    recoveryAnswer,
                    deviceId: this.deviceId,
                    deviceFingerprint,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 && !recoveryAnswer) {
                    document.getElementById('recovery-code-container')?.classList.remove('hidden');
                    const question = document.getElementById('recovery-question');
                    if (question) {
                        question.textContent =
                            'If you could shoot a liquid out of your index finger, what would it be?';
                    }
                    this.showError('Please answer the recovery question');
                    return;
                }
                this.showError(result.error || 'Recovery failed');
                return;
            }

            if (
                typeof result.accessToken !== 'string' ||
                typeof result.refreshToken !== 'string' ||
                typeof result.userId !== 'string' ||
                typeof result.username !== 'string'
            ) {
                throw new Error('Incomplete authentication data received');
            }

            const authData: AuthData = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                userId: result.userId,
                username: result.username,
            };

            localStorage.setItem('appWMP_auth', JSON.stringify(authData));

            this.container?.classList.add('hidden');
            document.getElementById('recovery-code-display')?.classList.add('hidden');
            document.getElementById('user-setup')?.classList.add('hidden');
            document.getElementById('main-app')?.classList.remove('hidden');

            App.initializeApp();

            console.debug('🔵 [User] Account recovered successfully:', {
                username: authData.username,
                userId: authData.userId,
            });
        } catch (error) {
            console.error('🔴 [User] Error recovering account:', error);
            this.showError('Failed to recover account. Please try again.');
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
        this.codeContainer?.classList.add('hidden');
        if (this.usernameInput) this.usernameInput.value = '';
        if (this.answerInput) this.answerInput.value = '';
        this.errorElement?.classList.add('hidden');
    }

    hide(): void {
        this.container?.classList.add('hidden');
    }
}

export default new AccountRecovery();
