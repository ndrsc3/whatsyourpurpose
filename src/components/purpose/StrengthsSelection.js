import QuestionsForm from './QuestionsForm.js';
import UserDataStore from '../../utils/userDataStore.js';

export class StrengthsSelection {
    constructor() {
        this.container = document.getElementById('strengths-selection');
        this.selectedStrengths = new Set();
        this.maxSelections = 10;
        
        // Load any previously selected strengths
        const data = UserDataStore.getData();
        if (data.strengths) {
            this.selectedStrengths = new Set(data.strengths);
        }
        
        this.strengths = [
            'Ambitious', 'Motivated', 'Decisive', 'Devoted', 'Determined', 'Enthusiastic', 
            'Experienced', 'Flexible', 'Focused', 'Hard-working', 'Mature', 'Open-minded', 
            'Practical', 'Punctual', 'Realistic', 'Reliable', 'Respectful', 'Analytical', 
            'Good at Learning', 'Good at Consulting', 'Good at Building', 'Independent', 
            'Systematic', 'Articulate', 'Calm', 'Charismatic', 'Clear-headed', 'Considerate', 
            'Creative', 'Curious', 'Efficient', 'Empathetic', 'Helpful', 'Innovative', 
            'Methodical', 'Organized', 'Passionate', 'Patient', 'Structured', 'Artistic', 
            'Good at leading', 'Good at Writing', 'Persuasive', 'Prudent', 'Resourceful', 
            'Sociable', 'Competitive', 'Outspoken', 'Communicative', 'Energetic', 'Polite', 
            'Proactive', 'Sensible', 'Sincere', 'Thoughtful', 'Versatile', 'Objective', 
            'Self-confident', 'Problem-Solving', 'Good at teaching', 'Good at designing'
        ];

        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;

        const content = `
            <div class="strengths-header">
                <h2>Select Your Key Strengths</h2>
                <p>Choose ${this.maxSelections} strengths that best describe you</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            <div class="strengths-grid">
                ${this.strengths.map(strength => `
                    <button class="strength-item" data-strength="${strength}">
                        ${strength}
                    </button>
                `).join('')}
            </div>
            <div class="strengths-footer">
                <button id="strengths-continue" class="primary-button" disabled>
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents() {
        if (!this.container) return;

        const strengthButtons = this.container.querySelectorAll('.strength-item');
        const continueButton = this.container.querySelector('#strengths-continue');
        const selectedCountSpan = this.container.querySelector('#selected-count');

        // Mark previously selected strengths
        strengthButtons.forEach(button => {
            if (this.selectedStrengths.has(button.dataset.strength)) {
                button.classList.add('selected');
            }
        });

        // Update initial count
        selectedCountSpan.textContent = this.selectedStrengths.size;
        continueButton.disabled = this.selectedStrengths.size !== this.maxSelections;

        strengthButtons.forEach(button => {
            button.addEventListener('click', () => {
                const strength = button.dataset.strength;
                
                if (button.classList.contains('selected')) {
                    this.selectedStrengths.delete(strength);
                    button.classList.remove('selected');
                } else if (this.selectedStrengths.size < this.maxSelections) {
                    this.selectedStrengths.add(strength);
                    button.classList.add('selected');
                }

                // Update the count and continue button state
                selectedCountSpan.textContent = this.selectedStrengths.size;
                continueButton.disabled = this.selectedStrengths.size !== this.maxSelections;
            });
        });

        continueButton.addEventListener('click', () => {
            // Save the selected strengths using the data store
            UserDataStore.updateStrengths([...this.selectedStrengths]);
            
            // Hide strengths selection and show questions form
            this.hide();
            QuestionsForm.show();
        });
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new StrengthsSelection(); 