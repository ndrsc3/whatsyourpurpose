import { SelectionComponent } from './SelectionComponent.js';

class ValuesSelection extends SelectionComponent {
    constructor() {
        super({
            containerId: 'values-selection',
            itemClass: 'value-item',
            dataKey: 'value',
            nextSection: 'strengths',
            title: 'Select Your Core Values',
            subtitle: 'Choose 10 values that resonate most with you',
            items: [
                'Acceptance', 'Altruism', 'Ambition', 'Amusement', 'Beauty', 'Bravery',
                'Brilliance', 'Challenge', 'Charity', 'Cleanliness', 'Competence', 'Comfort',
                'Control', 'Cooperation', 'Fairness', 'Dedication', 'Dependability', 'Empathy',
                'Family', 'Freedom', 'Fun', 'Generosity', 'Growth', 'Honesty', 'Humility',
                'Integrity', 'Kindness', 'Love', 'Loyalty', 'Justice', 'Patience', 'Passion',
                'Peace', 'Performance', 'Power', 'Professionalism', 'Quality', 'Responsibility',
                'Risk', 'Stability', 'Status', 'Strength', 'Structure', 'Success', 'Support',
                'Teamwork', 'Thoughtfulness', 'Transparency', 'Sustainability', 'Trust',
                'Uniqueness', 'Unity', 'Victory'
            ]
        });
    }
}

export default new ValuesSelection();
