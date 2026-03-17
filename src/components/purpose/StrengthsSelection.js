import { SelectionComponent } from './SelectionComponent.js';

class StrengthsSelection extends SelectionComponent {
    constructor() {
        super({
            containerId: 'strengths-selection',
            itemClass: 'strength-item',
            dataKey: 'strength',
            nextSection: 'reflections',
            title: 'Select Your Key Strengths',
            subtitle: 'Choose 10 strengths that best describe you',
            items: [
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
            ]
        });
    }
}

export default new StrengthsSelection();
