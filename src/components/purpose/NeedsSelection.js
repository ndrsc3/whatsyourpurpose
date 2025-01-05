import SummaryView from './SummaryView.js';
import UserDataStore from '../../utils/userDataStore.js';

export class NeedsSelection {
    constructor() {
        this.container = document.getElementById('needs-selection');
        this.data = null;
        this.updateCallback = null;
        this.maxSelections = 10;
        
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
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getSelectedNeeds() {
        if (!this.container) return new Set();
        const selectedButtons = this.container.querySelectorAll('.need-item.selected');
        return new Set([...selectedButtons].map(button => button.dataset.need));
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [NeedsSelection] Rendering with data:', this.data);

        const content = `
            <div class="needs-header">
                <h3>Select Human Needs You Can Address</h3>
                <p>Based on your strengths & values, what are human needs that you think you can address well?</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            
            <div class="needs-container">
                <div class="category-section">
                    <h3>Sustainable Development Goals</h3>
                    <div class="needs-grid">
                        ${this.needsCategories['Sustainable Development Goals'].map(need => `
                            <button class="need-item ${this.data.needs?.includes(need) ? 'selected' : ''}" 
                                    data-need="${need}">
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
                                    <button class="need-item ${this.data.needs?.includes(need) ? 'selected' : ''}" 
                                            data-need="${need}">
                                        ${need}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="needs-footer">
                <button id="needs-continue" class="primary-button" 
                        ${(this.data.needs?.length || 0) !== this.maxSelections ? 'disabled' : ''}>
                    Save
                </button>
            </div>
        `;

        this.container.innerHTML = content;
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const continueButton = this.container.querySelector('#needs-continue');
        const selectedCount = this.getSelectedNeeds().size;
        
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
            // Handle need selection
            if (e.target.classList.contains('need-item')) {
                const selectedNeeds = this.getSelectedNeeds();
                
                if (e.target.classList.contains('selected')) {
                    e.target.classList.remove('selected');
                    selectedNeeds.delete(e.target.dataset.need);
                } else if (selectedNeeds.size < this.maxSelections) {
                    e.target.classList.add('selected');
                    selectedNeeds.add(e.target.dataset.need);
                }

                this.updateSelectionCount();
            }
            
            // Handle continue button
            if (e.target.id === 'needs-continue' && !e.target.disabled) {
                const selectedNeeds = this.getSelectedNeeds();
                const newData = {
                    ...this.data,
                    needs: [...selectedNeeds],
                    currentSection: 'summary',
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

export default new NeedsSelection(); 