import { SelectionComponent } from './SelectionComponent.js';

type NeedsCategories = {
    'Sustainable Development Goals': string[];
    'Worldly Needs': Record<string, string[]>;
};

class NeedsSelection extends SelectionComponent {
    private needsCategories: NeedsCategories;

    constructor() {
        super({
            containerId: 'needs-selection',
            itemClass: 'need-item',
            dataKey: 'need',
            nextSection: 'summary',
            title: 'Select Human Needs You Can Address',
            subtitle: 'Based on your strengths & values, what are human needs that you think you can address well?',
            items: [], // not used — renderItems() is overridden
        });

        this.needsCategories = {
            'Sustainable Development Goals': [
                'No poverty',
                'Zero Hunger',
                'Good Health & Well being',
                'Quality education',
                'Gender Equality',
                'Clean water and sanitation',
                'Affordable and clean energy',
                'Decent Work & Economic growth',
                'Industry innovation & infrastructure',
                'Reduced inequalities',
                'Sustainable Cities & Communities',
                'Responsible Consumption and production',
                'Climate action',
                'Life below Water',
                'Life on Land',
                'Peace, Justice and Strong Institutions',
                'Partnerships for the Goals',
            ],
            'Worldly Needs': {
                Autonomy: ['Freedom', 'Independence', 'Space', 'Spontaneity'],
                Connection: [
                    'Acceptance',
                    'Affection',
                    'Appreciation',
                    'Belonging',
                    'Cooperation',
                    'Communication',
                    'Closeness',
                    'Community',
                    'Companionship',
                    'Compassion',
                    'Consideration',
                    'Consistency',
                    'Empathy',
                    'Inclusion',
                    'Intimacy',
                    'Love',
                    'Nurturing',
                    'Respect / self-respect',
                    'Safety',
                    'Security',
                    'Stability',
                    'Support',
                    'Trust',
                    'Warmth',
                ],
                Honesty: ['Authenticity', 'Integrity', 'Presence'],
                Play: ['Joy', 'Humor'],
                Meaning: [
                    'Awareness',
                    'Challenge',
                    'Clarity',
                    'Competence',
                    'Consciousness',
                    'Contribution',
                    'Creativity',
                    'Discovery',
                    'Effectiveness',
                    'Growth',
                    'Hope',
                    'Learning',
                    'Mourning',
                    'Participation',
                    'Self-expression',
                    'Stimulation',
                    'Understanding',
                ],
                Peace: ['Beauty', 'Communion', 'Ease', 'Equality', 'Harmony', 'Inspiration', 'Order'],
                'Physical Wellbeing': [
                    'Air',
                    'Food',
                    'Movement/exercise',
                    'Rest/Sleep',
                    'Sexual Expression',
                    'Safety',
                    'Shelter',
                    'Touch',
                    'Water',
                ],
            },
        };
    }

    renderItems(): string {
        if (!this.data) return '';

        const sdgItems = this.needsCategories['Sustainable Development Goals'];
        const worldlyNeeds = this.needsCategories['Worldly Needs'];
        const currentNeeds = this.data.needs ?? [];

        return `
            <div class="needs-container">
                <div class="category-section">
                    <h3>Sustainable Development Goals</h3>
                    <div class="needs-grid">
                        ${sdgItems
                            .map(
                                (need) => `
                            <button class="need-item ${currentNeeds.includes(need) ? 'selected' : ''}"
                                    data-need="${need}">
                                ${need}
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <div class="category-section">
                    <h3>Worldly Needs</h3>
                    ${Object.entries(worldlyNeeds)
                        .map(
                            ([subcategory, needs]) => `
                        <div class="subcategory-section">
                            <h4>${subcategory}</h4>
                            <div class="needs-grid">
                                ${needs
                                    .map(
                                        (need) => `
                                    <button class="need-item ${currentNeeds.includes(need) ? 'selected' : ''}"
                                            data-need="${need}">
                                        ${need}
                                    </button>
                                `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }
}

export default new NeedsSelection();
