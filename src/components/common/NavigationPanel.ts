import Modal from './Modal.js';
import type { UserData } from '../../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentLike = any;

export class NavigationPanel {
    private container: HTMLDivElement;
    private overlay: HTMLDivElement;
    private data: (UserData & { currentSection?: string; isNavigating?: boolean }) | null;
    private updateCallback:
        | ((data: Partial<UserData & { currentSection: string; isNavigating: boolean }>) => void)
        | null;
    private getComponent: ((section: string) => ComponentLike) | null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'navigation-panel';
        this.container.className = 'navigation-panel collapsed';

        this.overlay = document.createElement('div');
        this.overlay.className = 'nav-overlay';
        this.overlay.addEventListener('click', () => this.closePanel());

        this.data = null;
        this.updateCallback = null;
        this.getComponent = null;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.container);

        this.handleToggleClick = this.handleToggleClick.bind(this);
        this.handleNavItemClick = this.handleNavItemClick.bind(this);
        this.closePanel = this.closePanel.bind(this);
    }

    initialize(
        updateCallback: (data: Partial<UserData & { currentSection: string; isNavigating: boolean }>) => void,
        getComponent?: ((section: string) => ComponentLike) | null
    ): void {
        this.updateCallback = updateCallback;
        this.getComponent = getComponent ?? null;
        this.bindEvents();
        this.render();
    }

    setData(data: UserData & { currentSection?: string }): void {
        this.data = data;
        this.render();
    }

    bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('nav-close-button')) {
                this.closePanel();
                return;
            }

            const navItem = target.closest('.nav-item') as HTMLElement | null;
            if (navItem) {
                this.handleNavItemClick(navItem.dataset.section ?? '');
            }
        });

        const toggleButton = document.getElementById('nav-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.handleToggleClick());
        }
    }

    handleToggleClick(): void {
        this.container.classList.toggle('collapsed');
        document.getElementById('nav-toggle')?.classList.toggle('active');
        this.overlay.classList.toggle('active');
    }

    closePanel(): void {
        this.container.classList.add('collapsed');
        document.getElementById('nav-toggle')?.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    checkForUnsavedChanges(): boolean {
        const currentSection = this.data?.currentSection;
        if (!currentSection) return false;
        return this.getComponent?.(currentSection)?.hasUnsavedChanges() ?? false;
    }

    handleNavItemClick(section: string): void {
        if (!section || !this.data) return;

        console.log('🔵 [NavigationPanel] Nav item clicked:', section);

        if (this.checkForUnsavedChanges()) {
            const currentSection = this.data.currentSection ?? '';
            const currentComponent = this.getComponent?.(currentSection);
            const selectedCount: number = currentComponent?.getSelected?.().size ?? 0;

            if (selectedCount === 10) {
                Modal.show({
                    title: 'Save Changes?',
                    message: 'You have made changes to your selections. Would you like to save them before continuing?',
                    buttons: [
                        {
                            text: 'Save & Continue',
                            type: 'primary-button',
                            onClick: () => {
                                const continueButton = document.querySelector(
                                    `#${currentSection}-continue`
                                ) as HTMLElement | null;
                                if (continueButton) {
                                    continueButton.click();
                                    this.closePanel();
                                }
                            },
                        },
                        {
                            text: 'Discard Changes',
                            onClick: () => {
                                this.updateCallback!({ ...this.data!, currentSection: section, isNavigating: true });
                            },
                        },
                    ],
                });
            } else {
                Modal.show({
                    title: 'Incomplete Selection',
                    message: `Please select ${10 - selectedCount} more items to complete this section.`,
                    buttons: [
                        {
                            text: 'Continue Selecting',
                            type: 'primary-button',
                            onClick: () => this.closePanel(),
                        },
                    ],
                });
            }
            return;
        }

        this.updateCallback!({ ...this.data, currentSection: section, isNavigating: true });
        this.closePanel();
    }

    getCompletionStatus(section: string): boolean {
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

    render(): void {
        if (!this.container) return;

        const sections = [
            { id: 'values', name: 'Values' },
            { id: 'strengths', name: 'Strengths' },
            { id: 'reflections', name: 'Reflections' },
            { id: 'needs', name: 'Needs' },
            { id: 'summary', name: 'Summary' },
            { id: 'purpose', name: 'Purpose' },
        ];

        const content = `
            <div class="nav-header">
                <h3>Progress</h3>
                <button class="nav-close-button">x</button>
            </div>
            <div class="nav-sections">
                ${sections
                    .map(
                        (section) => `
                    <div class="nav-item ${this.data?.currentSection === section.id ? 'active' : ''}"
                         data-section="${section.id}">
                        <div class="nav-item-header">
                            <span class="nav-item-name">${section.name}</span>
                            <span class="nav-item-status ${this.getCompletionStatus(section.id) ? 'completed' : ''}">
                                ${this.getCompletionStatus(section.id) ? '✓' : '○'}
                            </span>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;

        this.container.innerHTML = content;
    }
}

export default new NavigationPanel();
