import { REFLECTION_QUESTIONS } from '../../constants.js';
import type { UserData } from '../../types.js';

export class SummaryView {
    private container: HTMLElement | null;
    private data: UserData | null;
    private updateCallback:
        | ((
              data: UserData & { currentSection: string; isNavigating: boolean; readyToGeneratePurpose: boolean }
          ) => void)
        | null;

    constructor() {
        this.container = document.getElementById('summary-view');
        this.data = null;
        this.updateCallback = null;
    }

    initialize(
        updateCallback: (
            data: UserData & { currentSection: string; isNavigating: boolean; readyToGeneratePurpose: boolean }
        ) => void
    ): void {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data: UserData): void {
        this.data = data;
        this.render();
    }

    render(): void {
        if (!this.container || !this.data) return;

        console.log('🔵 [SummaryView] Rendering with data:', this.data);

        const questions = REFLECTION_QUESTIONS;

        const values = Array.isArray(this.data.values) ? this.data.values : [];
        const strengths = Array.isArray(this.data.strengths) ? this.data.strengths : [];
        const reflectionAnswers = Array.isArray(this.data.reflectionAnswers) ? this.data.reflectionAnswers : [];
        const needs = Array.isArray(this.data.needs) ? this.data.needs : [];

        const content = `
            <div class="summary-header">
                <h3>Your Purpose Journey Summary</h3>
                <p>Here's what we've learned about you</p>
            </div>

            <div class="summary-container">
                <div class="summary-section">
                    <h3>Core Values</h3>
                    <p class="summary-text">${values.join(', ') || 'No values selected'}</p>
                </div>

                <div class="summary-section">
                    <h3>Key Strengths</h3>
                    <p class="summary-text">${strengths.join(', ') || 'No strengths selected'}</p>
                </div>

                <div class="summary-section">
                    <h3>Personal Reflections</h3>
                    ${questions
                        .map(
                            (question, index) => `
                        <div class="reflection-item">
                            <h4>${question}</h4>
                            <p class="summary-text">${reflectionAnswers[index] || 'No answer provided'}</p>
                        </div>
                    `
                        )
                        .join('')}
                </div>

                <div class="summary-section">
                    <h3>Human Needs You Can Address</h3>
                    <p class="summary-text">${needs.join(', ') || 'No needs selected'}</p>
                </div>
            </div>

            <div class="summary-footer">
                <button id="summary-continue" class="primary-button">
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            if (target.id === 'summary-continue' && !target.disabled) {
                const newData = {
                    ...this.data!,
                    readyToGeneratePurpose: true,
                    currentSection: 'purpose',
                    isNavigating: true,
                };
                this.updateCallback!(newData);
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

export default new SummaryView();
