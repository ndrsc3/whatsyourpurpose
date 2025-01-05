import NeedsSelection from './NeedsSelection.js';
import UserDataStore from '../../utils/userDataStore.js';

export class QuestionsForm {
    constructor() {
        this.container = document.getElementById('questions-form');
        this.data = null;
        this.updateCallback = null;
        
        this.questions = [
            'What has been your proudest moment in your life so far? Why?',
            'What activities in your life created a glow in your eyes?',
            'What are three keywords or phrases you wish to be known for?',
            'What would the world be missing if you didn\'t exist?'
        ];
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getAnswers() {
        if (!this.container) return [];
        const textareas = this.container.querySelectorAll('.question-input');
        return [...textareas].map(textarea => textarea.value.trim());
    }

    validateAnswers() {
        let isValid = true;
        const textareas = this.container.querySelectorAll('.question-input');
        
        textareas.forEach((textarea, index) => {
            const error = this.container.querySelector(`#error-${index}`);
            if (!textarea.value.trim()) {
                error.classList.remove('hidden');
                textarea.classList.add('error');
                isValid = false;
            } else {
                error.classList.add('hidden');
                textarea.classList.remove('error');
            }
        });

        return isValid;
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [QuestionsForm] Rendering with data:', this.data);

        const content = `
            <div class="questions-header">
                <h3>Reflect on Your Journey</h3>
                <p>Take your time to thoughtfully answer these questions</p>
            </div>
            <div class="questions-container">
                ${this.questions.map((question, index) => `
                    <div class="question-group">
                        <label for="question-${index}">${question}</label>
                        <textarea 
                            id="question-${index}" 
                            class="question-input"
                            placeholder="Your answer..."
                            rows="4"
                        >${this.data.reflectionAnswers?.[index] || ''}</textarea>
                        <p class="error-message hidden" id="error-${index}">Please provide an answer</p>
                    </div>
                `).join('')}
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

    initializeTextareas() {
        const textareas = this.container.querySelectorAll('.question-input');
        textareas.forEach(textarea => {
            // Set initial height
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('input', (e) => {
            if (e.target.classList.contains('question-input')) {
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                
                // Clear error state on input
                e.target.classList.remove('error');
                const index = e.target.id.split('-')[1];
                this.container.querySelector(`#error-${index}`).classList.add('hidden');
            }
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'questions-continue' && !e.target.disabled) {
                const answers = this.getAnswers();
                const newData = {
                    ...this.data,
                    reflectionAnswers: answers,
                    currentSection: 'needs',
                    isNavigating: true
                };
                this.updateCallback(newData);
            }
        });
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new QuestionsForm(); 