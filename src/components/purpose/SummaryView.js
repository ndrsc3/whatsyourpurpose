import UserDataStore from '../../utils/userDataStore.js';

export class SummaryView {
    constructor() {
        this.container = document.getElementById('summary-view');
        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;

        const userData = UserDataStore.getData();
        console.log('Rendering summary with data:', userData);

        const questions = [
            'What has been your proudest moment in your life so far? Why?',
            'What activities in your life created a glow in your eyes?',
            'What are three keywords or phrases you wish to be known for?',
            'What would the world be missing if you didn\'t exist?'
        ];

        // Ensure we have arrays for all data, even if empty
        const values = Array.isArray(userData.values) ? userData.values : [];
        const strengths = Array.isArray(userData.strengths) ? userData.strengths : [];
        const reflectionAnswers = Array.isArray(userData.reflectionAnswers) ? userData.reflectionAnswers : [];
        const needs = Array.isArray(userData.needs) ? userData.needs : [];

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
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents() {
        if (!this.container) return;

        const continueButton = this.container.querySelector('#summary-continue');
        
        continueButton.addEventListener('click', () => {
            this.hide();
            // Next component will be shown here
        });
    }

    show() {
        this.container.classList.remove('hidden');
        // Re-render when showing to ensure we have the latest data
        this.render();
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new SummaryView(); 