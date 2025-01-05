import StrengthsSelection from './StrengthsSelection.js';
import UserDataStore from '../../utils/userDataStore.js';

export class ValuesSelection {
    constructor() {
        this.container = document.getElementById('values-selection');
        this.data = null;
        this.updateCallback = null;
        this.maxSelections = 10;
        
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
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getSelectedValues() {
        if (!this.container) return new Set();
        const selectedButtons = this.container.querySelectorAll('.value-item.selected');
        return new Set([...selectedButtons].map(button => button.dataset.value));
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [ValuesSelection] Rendering with data:', this.data);

        const content = `
            <div class="values-header">
                <h2>Select Your Core Values</h2>
                <p>Choose ${this.maxSelections} values that resonate most with you</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            <div class="values-grid">
                ${this.values.map(value => `
                    <button class="value-item ${this.data.values?.includes(value) ? 'selected' : ''}" 
                            data-value="${value}">
                        ${value}
                    </button>
                `).join('')}
            </div>
            <div class="values-footer">
                <button id="values-continue" class="primary-button" 
                        ${(this.data.values?.length || 0) !== this.maxSelections ? 'disabled' : ''}>
                    Save
                </button>
            </div>
        `;

        this.container.innerHTML = content;
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const continueButton = this.container.querySelector('#values-continue');
        const selectedCount = this.getSelectedValues().size;
        
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedCount;
        }
        if (continueButton) {
            continueButton.disabled = selectedCount !== this.maxSelections;
        }
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            // Handle value selection
            if (e.target.classList.contains('value-item')) {
                const selectedValues = this.getSelectedValues();
                
                if (e.target.classList.contains('selected')) {
                    e.target.classList.remove('selected');
                    selectedValues.delete(e.target.dataset.value);
                } else if (selectedValues.size < this.maxSelections) {
                    e.target.classList.add('selected');
                    selectedValues.add(e.target.dataset.value);
                }

                this.updateSelectionCount();
            }
            
            // Handle continue button
            if (e.target.id === 'values-continue' && !e.target.disabled) {
                const selectedValues = this.getSelectedValues();
                const newData = {
                    ...this.data,
                    values: [...selectedValues],
                    currentSection: 'strengths',
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

export default new ValuesSelection(); 