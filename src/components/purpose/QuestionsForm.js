import NeedsSelection from './NeedsSelection.js';
import UserDataStore from '../../utils/userDataStore.js';

export class QuestionsForm {
    constructor() {
        this.container = document.getElementById('questions-form');
        this.questions = [
            'What has been your proudest moment in your life so far? Why?',
            'What activities in your life created a glow in your eyes?',
            'What are three keywords or phrases you wish to be known for?',
            'What would the world be missing if you didn\'t exist?'
        ];

        // Load any previously saved answers
        const data = UserDataStore.getData();
        this.answers = data.reflectionAnswers || new Array(this.questions.length).fill('');
        
        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;

        const content = `
            <div class="questions-header">
                <h2>Reflect on Your Journey</h2>
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
                        >${this.answers[index]}</textarea>
                        <p class="error-message hidden" id="error-${index}">Please provide an answer</p>
                    </div>
                `).join('')}
            </div>
            <div class="questions-footer">
                <button id="questions-continue" class="primary-button">
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
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

    bindEvents() {
        if (!this.container) return;

        const textareas = this.container.querySelectorAll('.question-input');
        const continueButton = this.container.querySelector('#questions-continue');

        // Auto-resize textareas as user types
        textareas.forEach((textarea, index) => {
            // Set initial value and height
            textarea.value = this.answers[index];
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';

            textarea.addEventListener('input', () => {
                // Update answers array
                this.answers[index] = textarea.value;
                
                // Auto-resize
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
                
                // Clear error state on input
                textarea.classList.remove('error');
                this.container.querySelector(`#error-${index}`).classList.add('hidden');
            });
        });

        continueButton.addEventListener('click', () => {
            if (this.validateAnswers()) {
                // Save the answers using the data store
                UserDataStore.updateReflectionAnswers(this.answers);
                
                // Hide questions form and show needs selection
                this.hide();
                NeedsSelection.show();
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