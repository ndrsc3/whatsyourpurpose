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

    initialize(updateCallback, getComponent) {
        this.updateCallback = updateCallback;
        this.getComponent = getComponent ?? null;
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
                this.handleNavItemClick(navItem.dataset.section);
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

    checkForUnsavedChanges() {
        const currentSection = this.data?.currentSection;
        if (!currentSection) return false;
        return this.getComponent?.(currentSection)?.hasUnsavedChanges() ?? false;
    }

    handleNavItemClick(section) {
        if (!section || !this.data) return;

        console.log('🔵 [NavigationPanel] Nav item clicked:', section);

        if (this.checkForUnsavedChanges()) {
            const currentComponent = this.getComponent?.(this.data.currentSection);
            const selectedCount = currentComponent?.getSelected?.().size ?? 0;

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
                                const continueButton = document.querySelector(`#${this.data.currentSection}-continue`);
                                if (continueButton) {
                                    continueButton.click();
                                    this.closePanel();
                                }
                            }
                        },
                        {
                            text: 'Discard Changes',
                            onClick: () => {
                                this.updateCallback({ ...this.data, currentSection: section, isNavigating: true });
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
                            onClick: () => this.closePanel()
                        }
                    ]
                });
            }
            return;
        }

        this.updateCallback({ ...this.data, currentSection: section, isNavigating: true });
        this.closePanel();
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