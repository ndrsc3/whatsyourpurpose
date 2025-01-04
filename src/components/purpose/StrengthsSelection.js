import QuestionsForm from './QuestionsForm.js';
import UserDataStore from '../../utils/userDataStore.js';

export class StrengthsSelection {
    constructor() {
        this.container = document.getElementById('strengths-selection');
        this.data = null;
        this.updateCallback = null;
        this.maxSelections = 10;
        
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
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getSelectedStrengths() {
        if (!this.container) return new Set();
        const selectedButtons = this.container.querySelectorAll('.strength-item.selected');
        return new Set([...selectedButtons].map(button => button.dataset.strength));
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [StrengthsSelection] Rendering with data:', this.data);

        const content = `
            <div class="strengths-header">
                <h2>Select Your Key Strengths</h2>
                <p>Choose ${this.maxSelections} strengths that best describe you</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            <div class="strengths-grid">
                ${this.strengths.map(strength => `
                    <button class="strength-item ${this.data.strengths?.includes(strength) ? 'selected' : ''}" 
                            data-strength="${strength}">
                        ${strength}
                    </button>
                `).join('')}
            </div>
            <div class="strengths-footer">
                <button id="strengths-continue" class="primary-button" 
                        ${(this.data.strengths?.length || 0) !== this.maxSelections ? 'disabled' : ''}>
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const continueButton = this.container.querySelector('#strengths-continue');
        const selectedCount = this.getSelectedStrengths().size;
        
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
            // Handle strength selection
            if (e.target.classList.contains('strength-item')) {
                const selectedStrengths = this.getSelectedStrengths();
                
                if (e.target.classList.contains('selected')) {
                    e.target.classList.remove('selected');
                    selectedStrengths.delete(e.target.dataset.strength);
                } else if (selectedStrengths.size < this.maxSelections) {
                    e.target.classList.add('selected');
                    selectedStrengths.add(e.target.dataset.strength);
                }

                this.updateSelectionCount();
            }
            
            // Handle continue button
            if (e.target.id === 'strengths-continue' && !e.target.disabled) {
                const selectedStrengths = this.getSelectedStrengths();
                const newData = { ...this.data, strengths: [...selectedStrengths] };
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

export default new StrengthsSelection(); 