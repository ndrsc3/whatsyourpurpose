import { fetchWithAuth } from '../../utils/authUtils.js';
import type { UserData, GeneratePurposeResponse } from '../../types.js';

export class PurposeView {
    private container: HTMLElement | null;
    private data: UserData | null;
    private updateCallback: ((data: UserData) => void) | null;
    private isGenerating: boolean;
    private userId: string | null;
    private promptNames: string[];

    constructor() {
        this.container = document.getElementById('purpose-view');
        this.data = null;
        this.updateCallback = null;
        this.isGenerating = false;
        this.userId = null;

        this.promptNames = ['Classic Purpose', "Hero's Journey", 'Impact Focus'];
    }

    initialize(updateCallback: (data: UserData) => void, userId: string): void {
        if (!userId) {
            console.error('🔴 [PurposeView] No userId provided during initialization');
            return;
        }
        this.updateCallback = updateCallback;
        this.userId = userId;
        this.bindEvents();
    }

    setData(data: UserData): void {
        this.data = data;
        this.render();
    }

    async generatePurpose(): Promise<void> {
        if (this.isGenerating) return;

        if (!this.userId) {
            this.showError('User ID not found. Please try logging in again.');
            return;
        }

        this.isGenerating = true;
        this.updateGeneratingState();

        try {
            const response = await fetchWithAuth('/api/generate-purpose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result: GeneratePurposeResponse = await response.json();

            if (typeof result.purposeStatement !== 'string') {
                throw new Error('Invalid purpose statement format received');
            }

            const saveResponse = await fetchWithAuth('/api/save-purpose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purposeStatement: result.purposeStatement }),
            });

            if (!saveResponse.ok) {
                throw new Error('Failed to save purpose statement to database');
            }

            const newData: UserData = {
                ...this.data!,
                purposeStatement: result.purposeStatement,
                needsNewPurpose: false,
                lastUsedPromptIndex: result.promptIndex,
            };

            this.updateCallback!(newData);
        } catch (error) {
            console.error('Error generating purpose:', {
                error: (error as Error).message,
                stack: (error as Error).stack,
            });
            this.showError('Failed to generate purpose statement. Please try again.');
        } finally {
            this.isGenerating = false;
            this.updateGeneratingState();
        }
    }

    updateGeneratingState(): void {
        if (!this.container) return;

        const generateButton = this.container.querySelector<HTMLButtonElement>('#generate-purpose');
        if (generateButton) {
            generateButton.disabled = this.isGenerating;
            generateButton.textContent = this.isGenerating ? 'Generating...' : 'Generate Purpose';
        }
    }

    showError(message: string): void {
        const errorElement = this.container?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    render(): void {
        if (!this.container || !this.data) return;

        console.log('🔵 [PurposeView] Rendering with data:', this.data);

        const content = `
            <div class="purpose-header">
                <h3>Your Life Purpose</h3>
                <p>Based on your values, strengths, and aspirations</p>
            </div>

            <div class="purpose-container">
                ${
                    this.data.purposeStatement
                        ? `
                    <div class="purpose-statement">
                        ${
                            this.data.needsNewPurpose
                                ? `
                            <div class="update-notice">
                                <p>Your inputs have changed since your last purpose was generated.</p>
                                <button id="regenerate-purpose" class="primary-button">Generate Updated Purpose</button>
                            </div>
                        `
                                : `
                            <div class="purpose-header">
                                <span class="prompt-label">${this.promptNames[this.data.lastUsedPromptIndex] || 'Classic Purpose'}</span>
                                <button id="regenerate-purpose" class="icon-button" title="Generate Another Purpose Statement">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                                    </svg>
                                </button>
                            </div>
                        `
                        }
                        <p>${this.data.purposeStatement}</p>
                    </div>
                    <div class="purpose-actions">
                        <!-- <button id="share-purpose" class="primary-button">Share Purpose</button> -->
                    </div>
                `
                        : `
                    <div class="purpose-intro">
                        <p>Ready to discover your purpose? Click below to generate your personalized purpose statement.</p>
                        <button id="generate-purpose" class="primary-button">
                            Generate Purpose
                        </button>
                    </div>
                `
                }
                <p class="error-message hidden"></p>
            </div>
        `;

        this.container.innerHTML = content;
        this.updateGeneratingState();
    }

    bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('#generate-purpose, #regenerate-purpose')) {
                await this.generatePurpose();
            } else if (target.closest('#share-purpose')) {
                alert('Sharing functionality coming soon!');
            }
        });
    }

    show(): void {
        this.container?.classList.remove('hidden');
    }

    hide(): void {
        this.container?.classList.add('hidden');
    }
}

export default new PurposeView();
