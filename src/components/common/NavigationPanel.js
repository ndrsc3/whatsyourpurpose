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

    handleNavItemClick(e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem && this.data) {
            const section = navItem.dataset.section;
            console.log('🔵 [NavigationPanel] Nav item clicked:', section);
            
            if (section) {
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

    bindEvents() {
        
        // Remove any existing event listeners
        const toggleButton = document.getElementById('nav-toggle');
        if (toggleButton) {
            toggleButton.removeEventListener('click', this.handleToggleClick);
            toggleButton.addEventListener('click', this.handleToggleClick);
        }

        this.container.removeEventListener('click', this.handleNavItemClick);
        this.container.addEventListener('click', this.handleNavItemClick);
    }

    getSectionSummary(section) {
        if (!this.data) return '';

        switch (section) {
            case 'values':
                return this.data.values ? 
                    `Selected: ${this.data.values.slice(0, 2).join(', ')}${this.data.values.length > 2 ? '...' : ''}` : 
                    'Not completed';
            case 'strengths':
                return this.data.strengths ? 
                    `Selected: ${this.data.strengths.slice(0, 2).join(', ')}${this.data.strengths.length > 2 ? '...' : ''}` : 
                    'Not completed';
            case 'reflections':
                return this.data.reflectionAnswers ? 
                    'Reflections completed' : 
                    'Not completed';
            case 'needs':
                return this.data.needs ? 
                    `Selected: ${this.data.needs.slice(0, 2).join(', ')}${this.data.needs.length > 2 ? '...' : ''}` : 
                    'Not completed';
            case 'summary':
                return this.data.readyToGeneratePurpose ? 
                    'Ready for purpose generation' : 
                    'Review your selections';
            case 'purpose':
                return this.data.purposeStatement ? 
                    'Purpose statement generated' : 
                    'Generate your purpose';
            default:
                return '';
        }
    }

    getCompletionStatus(section) {
        if (!this.data) return false;

        switch (section) {
            case 'values':
                return Array.isArray(this.data.values) && this.data.values.length > 0;
            case 'strengths':
                return Array.isArray(this.data.strengths) && this.data.strengths.length > 0;
            case 'reflections':
                return Array.isArray(this.data.reflectionAnswers) && this.data.reflectionAnswers.length === 4;
            case 'needs':
                return Array.isArray(this.data.needs) && this.data.needs.length > 0;
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
                <button class="nav-close-button" onclick="this.closest('#navigation-panel').querySelector('.nav-close-button').click()">×</button>
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

        // Add event listener to close button
        const closeButton = this.container.querySelector('.nav-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', this.closePanel);
        }
    }
}

export default new NavigationPanel(); 