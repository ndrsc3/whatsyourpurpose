import { REFLECTION_QUESTIONS } from '../../constants.js';
import type { UserData } from '../../types.js';

export class QuestionsForm {
    private container: HTMLElement | null;
    private data: UserData | null;
    private updateCallback: ((data: UserData & { currentSection: string; isNavigating: boolean }) => void) | null;
    private questions: readonly string[];

    constructor() {
        this.container = document.getElementById('questions-form');
        this.data = null;
        this.updateCallback = null;
        this.questions = REFLECTION_QUESTIONS;
    }

    initialize(updateCallback: (data: UserData & { currentSection: string; isNavigating: boolean }) => void): void {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data: UserData): void {
        this.data = data;
        this.render();
    }

    getAnswers(): string[] {
        if (!this.container) return [];
        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.question-input');
        return [...textareas].map((textarea) => textarea.value.trim());
    }

    validateAnswers(): boolean {
        if (!this.container) return false;
        let isValid = true;
        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.question-input');

        textareas.forEach((textarea, index) => {
            const error = this.container!.querySelector(`#error-${index}`);
            if (!textarea.value.trim()) {
                error?.classList.remove('hidden');
                textarea.classList.add('error');
                isValid = false;
            } else {
                error?.classList.add('hidden');
                textarea.classList.remove('error');
            }
        });

        return isValid;
    }

    render(): void {
        if (!this.container || !this.data) return;

        console.log('🔵 [QuestionsForm] Rendering with data:', this.data);

        const content = `
            <div class="questions-header">
                <h3>Reflect on Your Journey</h3>
                <p>Take your time to thoughtfully answer these questions</p>
            </div>
            <div class="questions-container">
                ${this.questions
                    .map(
                        (question, index) => `
                    <div class="question-group">
                        <label for="question-${index}">${question}</label>
                        <textarea
                            id="question-${index}"
                            class="question-input"
                            placeholder="Your answer..."
                            rows="4"
                        >${this.data!.reflectionAnswers?.[index] || ''}</textarea>
                        <p class="error-message hidden" id="error-${index}">Please provide an answer</p>
                    </div>
                `
                    )
                    .join('')}
            </div>
            <div class="questions-footer">
                <button id="questions-continue" class="primary-button">
                    Save
                </button>
            </div>
        `;

        this.container.innerHTML = content;
        this.initializeTextareas();
    }

    initializeTextareas(): void {
        if (!this.container) return;
        const textareas = this.container.querySelectorAll<HTMLTextAreaElement>('.question-input');
        textareas.forEach((textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }

    bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            if (target.classList.contains('question-input')) {
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';

                target.classList.remove('error');
                const index = target.id.split('-')[1];
                this.container!.querySelector(`#error-${index}`)?.classList.add('hidden');
            }
        });

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            if (target.id === 'questions-continue' && !target.disabled) {
                if (!this.validateAnswers()) return;
                const answers = this.getAnswers();
                const newData = {
                    ...this.data!,
                    reflectionAnswers: answers,
                    currentSection: 'needs',
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

export default new QuestionsForm();
