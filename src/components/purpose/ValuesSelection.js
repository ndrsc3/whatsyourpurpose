import StrengthsSelection from './StrengthsSelection.js';
import UserDataStore from '../../utils/userDataStore.js';

export class ValuesSelection {
    constructor() {
        this.container = document.getElementById('values-selection');
        this.selectedValues = new Set();
        this.maxSelections = 10;
        
        // Load any previously selected values
        const data = UserDataStore.getData();
        if (data.values) {
            this.selectedValues = new Set(data.values);
        }

        this.values = [
            'Acceptance', 'Altruism', 'Ambition', 'Amusement', 'Beauty', 'Bravery', 
            'Brilliance', 'Challenge', 'Charity', 'Cleanliness', 'Competence', 'Comfort', 
            'Control', 'Cooperation', 'Fairness', 'Dedication', 'Dependability', 'Empathy', 
            'Family', 'Freedom', 'Fun', 'Generosity', 'Growth', 'Honesty', 'Humility', 
            'Integrity', 'Kindness', 'Love', 'Loyalty', 'Justice', 'Patience', 'Passion', 
            'Peace', 'Performance', 'Power', 'Professionalism', 'Quality', 'Responsibility', 
            'Risk', 'Stability', 'Status', 'Strength', 'Structure', 'Success', 'Support', 
            'Teamwork', 'Thoughtfulness', 'Transparency', 'Sustainability', 'Trust', 
            'Uniqueness', 'Unity', 'Victory'
        ];

        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;

        const content = `
            <div class="values-header">
                <h2>Select Your Core Values</h2>
                <p>Choose ${this.maxSelections} values that resonate most with you</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            <div class="values-grid">
                ${this.values.map(value => `
                    <button class="value-item" data-value="${value}">
                        ${value}
                    </button>
                `).join('')}
            </div>
            <div class="values-footer">
                <button id="values-continue" class="primary-button" disabled>
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents() {
        if (!this.container) return;

        const valueButtons = this.container.querySelectorAll('.value-item');
        const continueButton = this.container.querySelector('#values-continue');
        const selectedCountSpan = this.container.querySelector('#selected-count');

        // Mark previously selected values
        valueButtons.forEach(button => {
            if (this.selectedValues.has(button.dataset.value)) {
                button.classList.add('selected');
            }
        });

        // Update initial count
        selectedCountSpan.textContent = this.selectedValues.size;
        continueButton.disabled = this.selectedValues.size !== this.maxSelections;

        valueButtons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset.value;
                
                if (button.classList.contains('selected')) {
                    this.selectedValues.delete(value);
                    button.classList.remove('selected');
                } else if (this.selectedValues.size < this.maxSelections) {
                    this.selectedValues.add(value);
                    button.classList.add('selected');
                }

                // Update the count and continue button state
                selectedCountSpan.textContent = this.selectedValues.size;
                continueButton.disabled = this.selectedValues.size !== this.maxSelections;
            });
        });

        continueButton.addEventListener('click', () => {
            // Save the selected values using the data store
            UserDataStore.updateValues([...this.selectedValues]);
            
            // Hide values selection and show strengths selection
            this.hide();
            StrengthsSelection.show();
        });
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new ValuesSelection(); 