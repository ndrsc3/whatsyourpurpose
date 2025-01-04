import SummaryView from './SummaryView.js';
import UserDataStore from '../../utils/userDataStore.js';

export class NeedsSelection {
    constructor() {
        this.container = document.getElementById('needs-selection');
        this.selectedNeeds = new Set();
        this.maxSelections = 10;
        
        // Load any previously selected needs
        const data = UserDataStore.getData();
        if (data.needs) {
            this.selectedNeeds = new Set(data.needs);
        }
        
        this.needsCategories = {
            'Sustainable Development Goals': [
                'No poverty', 'Zero Hunger', 'Good Health & Well being', 'Quality education',
                'Gender Equality', 'Clean water and sanitation', 'Affordable and clean energy',
                'Decent Work & Economic growth', 'Industry innovation & infrastructure',
                'Reduced inequalities', 'Sustainable Cities & Communities',
                'Responsible Consumption and production', 'Climate action', 'Life below Water',
                'Life on Land', 'Peace, Justice and Strong Institutions', 'Partnerships for the Goals'
            ],
            'Worldly Needs': {
                'Autonomy': ['Freedom', 'Independence', 'Space', 'Spontaneity'],
                'Connection': [
                    'Acceptance', 'Affection', 'Appreciation', 'Belonging', 'Cooperation',
                    'Communication', 'Closeness', 'Community', 'Companionship', 'Compassion',
                    'Consideration', 'Consistency', 'Empathy', 'Inclusion', 'Intimacy',
                    'Love', 'Nurturing', 'Respect / self-respect', 'Safety', 'Security',
                    'Stability', 'Support', 'Trust', 'Warmth'
                ],
                'Honesty': ['Authenticity', 'Integrity', 'Presence'],
                'Play': ['Joy', 'Humor'],
                'Meaning': [
                    'Awareness', 'Challenge', 'Clarity', 'Competence', 'Consciousness',
                    'Contribution', 'Creativity', 'Discovery', 'Effectiveness', 'Growth',
                    'Hope', 'Learning', 'Mourning', 'Participation', 'Self-expression',
                    'Stimulation', 'Understanding'
                ],
                'Peace': ['Beauty', 'Communion', 'Ease', 'Equality', 'Harmony', 'Inspiration', 'Order'],
                'Physical Wellbeing': [
                    'Air', 'Food', 'Movement/exercise', 'Rest/Sleep', 'Sexual Expression',
                    'Safety', 'Shelter', 'Touch', 'Water'
                ]
            }
        };

        this.render();
        this.bindEvents();
    }

    render() {
        if (!this.container) return;

        const content = `
            <div class="needs-header">
                <h2>Select Human Needs You Can Address</h2>
                <p>Based on your strengths & values, what are human needs that you think you can address well?</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            
            <div class="needs-container">
                <div class="category-section">
                    <h3>Sustainable Development Goals</h3>
                    <div class="needs-grid">
                        ${this.needsCategories['Sustainable Development Goals'].map(need => `
                            <button class="need-item" data-need="${need}">
                                ${need}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="category-section">
                    <h3>Worldly Needs</h3>
                    ${Object.entries(this.needsCategories['Worldly Needs']).map(([subcategory, needs]) => `
                        <div class="subcategory-section">
                            <h4>${subcategory}</h4>
                            <div class="needs-grid">
                                ${needs.map(need => `
                                    <button class="need-item" data-need="${need}">
                                        ${need}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="needs-footer">
                <button id="needs-continue" class="primary-button" disabled>
                    Continue
                </button>
            </div>
        `;

        this.container.innerHTML = content;
    }

    bindEvents() {
        if (!this.container) return;

        const needButtons = this.container.querySelectorAll('.need-item');
        const continueButton = this.container.querySelector('#needs-continue');
        const selectedCountSpan = this.container.querySelector('#selected-count');

        // Mark previously selected needs
        needButtons.forEach(button => {
            if (this.selectedNeeds.has(button.dataset.need)) {
                button.classList.add('selected');
            }
        });

        // Update initial count
        selectedCountSpan.textContent = this.selectedNeeds.size;
        continueButton.disabled = this.selectedNeeds.size !== this.maxSelections;

        needButtons.forEach(button => {
            button.addEventListener('click', () => {
                const need = button.dataset.need;
                
                if (button.classList.contains('selected')) {
                    this.selectedNeeds.delete(need);
                    button.classList.remove('selected');
                } else if (this.selectedNeeds.size < this.maxSelections) {
                    this.selectedNeeds.add(need);
                    button.classList.add('selected');
                }

                // Update the count and continue button state
                selectedCountSpan.textContent = this.selectedNeeds.size;
                continueButton.disabled = this.selectedNeeds.size !== this.maxSelections;
            });
        });

        continueButton.addEventListener('click', () => {
            // Save the selected needs using the data store
            UserDataStore.updateNeeds([...this.selectedNeeds]);
            
            // Hide needs selection and show summary view
            this.hide();
            SummaryView.show();
        });
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}

export default new NeedsSelection(); 