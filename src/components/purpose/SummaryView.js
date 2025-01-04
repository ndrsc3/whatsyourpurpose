import PurposeView from './PurposeView.js';

export class SummaryView {
    constructor() {
        this.container = document.getElementById('summary-view');
        this.data = null;
        this.updateCallback = null;
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [SummaryView] Rendering with data:', this.data);

        const questions = [
            'What has been your proudest moment in your life so far? Why?',
            'What activities in your life created a glow in your eyes?',
            'What are three keywords or phrases you wish to be known for?',
            'What would the world be missing if you didn\'t exist?'
        ];

        // Ensure we have arrays for all data, even if empty
        const values = Array.isArray(this.data.values) ? this.data.values : [];
        const strengths = Array.isArray(this.data.strengths) ? this.data.strengths : [];
        const reflectionAnswers = Array.isArray(this.data.reflectionAnswers) ? this.data.reflectionAnswers : [];
        const needs = Array.isArray(this.data.needs) ? this.data.needs : [];

        const content = `
            <div class="summary-header">
                <h2>Your Purpose Journey Summary</h2>
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
                    ${questions.map((question, index) => `
                        <div class="reflection-item">
                            <h4>${question}</h4>
                            <p class="summary-text">${reflectionAnswers[index] || 'No answer provided'}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="summary-section">
                    <h3>Human Needs You Can Address</h3>
                    <p class="summary-text">${needs.join(', ') || 'No needs selected'}</p>
                </div>
            </div>

            <div class="summary-footer">
                <button id="summary-continue" class="primary-button">
                    Generate Your Purpose
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'summary-continue') {
                // Set the flag to indicate we're ready to generate purpose
                const newData = { ...this.data, readyToGeneratePurpose: true };
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

export default new SummaryView(); 