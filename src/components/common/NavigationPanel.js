import Modal from './Modal.js';

export class NavigationPanel {
    constructor() {
        // Create navigation panel
        this.container = document.createElement('div');
        this.container.id = 'navigation-panel';
        this.container.className = 'navigation-panel collapsed';
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'nav-overlay';
        this.overlay.addEventListener('click', () => this.closePanel());
        
        this.data = null;
        this.updateCallback = null;
        
        // Add elements to DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.container);
        
        // Bind methods
        this.handleToggleClick = this.handleToggleClick.bind(this);
        this.handleNavItemClick = this.handleNavItemClick.bind(this);
        this.closePanel = this.closePanel.bind(this);
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
        this.render();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            // Handle close button click
            if (e.target.classList.contains('nav-close-button')) {
                this.closePanel();
                return;
            }

            // Handle navigation item clicks - check for closest nav-item
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                this.handleNavItemClick({ target: navItem });
            }
        });

        // Handle toggle button
        const toggleButton = document.getElementById('nav-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.handleToggleClick());
        }
    }

    handleToggleClick() {
        this.container.classList.toggle('collapsed');
        document.getElementById('nav-toggle').classList.toggle('active');
        this.overlay.classList.toggle('active');
    }

    closePanel() {
        this.container.classList.add('collapsed');
        document.getElementById('nav-toggle').classList.remove('active');
        this.overlay.classList.remove('active');
    }

    checkForUnsavedChanges(section) {
        if (!this.data) return false;

        const currentSection = this.data.currentSection;
        if (!currentSection) return false;

        // Check for unsaved changes based on section
        switch (currentSection) {
            case 'values': {
                const selectedElements = document.querySelectorAll('#values-selection .value-item.selected');
                const selectedValues = Array.from(selectedElements).map(el => el.dataset.value);
                const savedValues = this.data.values || [];
                
                // Only check for differences if we have 10 selected
                if (selectedValues.length === 10) {
                    return !selectedValues.every(value => savedValues.includes(value)) || 
                           !savedValues.every(value => selectedValues.includes(value));
                }
                return selectedValues.length !== savedValues.length;
            }
            
            case 'strengths': {
                const selectedElements = document.querySelectorAll('#strengths-selection .strength-item.selected');
                const selectedStrengths = Array.from(selectedElements).map(el => el.dataset.strength);
                const savedStrengths = this.data.strengths || [];
                
                // Only check for differences if we have 10 selected
                if (selectedStrengths.length === 10) {
                    return !selectedStrengths.every(value => savedStrengths.includes(value)) || 
                           !savedStrengths.every(value => selectedStrengths.includes(value));
                }
                return selectedStrengths.length !== savedStrengths.length;
            }
            
            case 'needs': {
                const selectedElements = document.querySelectorAll('#needs-selection .need-item.selected');
                const selectedNeeds = Array.from(selectedElements).map(el => el.dataset.need);
                const savedNeeds = this.data.needs || [];
                
                // Only check for differences if we have 10 selected
                if (selectedNeeds.length === 10) {
                    return !selectedNeeds.every(value => savedNeeds.includes(value)) || 
                           !savedNeeds.every(value => selectedNeeds.includes(value));
                }
                return selectedNeeds.length !== savedNeeds.length;
            }
            
            default:
                return false;
        }
    }

    handleNavItemClick(e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem && this.data) {
            const section = navItem.dataset.section;
            console.log('🔵 [NavigationPanel] Nav item clicked:', section);
            
            if (section) {
                if (this.checkForUnsavedChanges(section)) {
                    const selectedCount = document.querySelectorAll(`#${this.data.currentSection}-selection .${this.data.currentSection.slice(0, -1)}-item.selected`).length;
                    
                    if (selectedCount === 10) {
                        // Case A: User has selected required amount but hasn't saved
                        Modal.show({
                            title: 'Save Changes?',
                            message: 'You have made changes to your selections. Would you like to save them before continuing?',
                            buttons: [
                                {
                                    text: 'Save & Continue',
                                    type: 'primary-button',
                                    onClick: () => {
                                        // Trigger save by clicking the continue button
                                        const continueButton = document.querySelector(`#${this.data.currentSection}-continue`);
                                        if (continueButton) {
                                            continueButton.click();
                                            this.closePanel(); // Close the navigation panel after saving
                                        }
                                    }
                                },
                                {
                                    text: 'Discard Changes',
                                    onClick: () => {
                                        const newData = {
                                            ...this.data,
                                            currentSection: section,
                                            isNavigating: true
                                        };
                                        this.updateCallback(newData);
                                    }
                                }
                            ]
                        });
                    } else {
                        // Case B: User hasn't selected required amount
                        Modal.show({
                            title: 'Incomplete Selection',
                            message: `Please select ${10 - selectedCount} more items to complete this section.`,
                            buttons: [
                                {
                                    text: 'Continue Selecting',
                                    type: 'primary-button',
                                    onClick: () => {
                                        this.closePanel(); // Close the navigation panel
                                    }
                                }
                            ]
                        });
                    }
                    return;
                }

                const newData = {
                    ...this.data,
                    currentSection: section,
                    isNavigating: true
                };
                this.updateCallback(newData);
                this.closePanel(); // Close panel after navigation
            }
        }
    }

    getCompletionStatus(section) {
        if (!this.data) return false;

        switch (section) {
            case 'values':
                return Array.isArray(this.data.values) && this.data.values.length === 10;
            case 'strengths':
                return Array.isArray(this.data.strengths) && this.data.strengths.length === 10;
            case 'reflections':
                return Array.isArray(this.data.reflectionAnswers) && this.data.reflectionAnswers.length === 4;
            case 'needs':
                return Array.isArray(this.data.needs) && this.data.needs.length === 10;
            case 'summary':
                return this.data.readyToGeneratePurpose;
            case 'purpose':
                return !!this.data.purposeStatement;
            default:
                return false;
        }
    }

    render() {
        if (!this.container) return;

        const sections = [
            { id: 'values', name: 'Values' },
            { id: 'strengths', name: 'Strengths' },
            { id: 'reflections', name: 'Reflections' },
            { id: 'needs', name: 'Needs' },
            { id: 'summary', name: 'Summary' },
            { id: 'purpose', name: 'Purpose' }
        ];

        const content = `
            <div class="nav-header">
                <h3>Progress</h3>
                <button class="nav-close-button">x</button>
            </div>
            <div class="nav-sections">
                ${sections.map(section => `
                    <div class="nav-item ${this.data?.currentSection === section.id ? 'active' : ''}" 
                         data-section="${section.id}">
                        <div class="nav-item-header">
                            <span class="nav-item-name">${section.name}</span>
                            <span class="nav-item-status ${this.getCompletionStatus(section.id) ? 'completed' : ''}">
                                ${this.getCompletionStatus(section.id) ? '✓' : '○'}
                            </span>
                        </div>
                        
                    </div>
                `).join('')}
            </div>
        `;

        this.container.innerHTML = content;
    }
}

export default new NavigationPanel(); 