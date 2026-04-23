import {
    SELECTION_FIELD_MAP,
    type SelectionComponentConfig,
    type SelectionDataField,
    type SelectionDataKey,
    type UserData,
} from '../../types.js';

export class SelectionComponent {
    protected container: HTMLElement | null;
    protected itemClass: string;
    protected dataKey: SelectionDataKey;
    protected dataField: SelectionDataField;
    protected nextSection: string;
    protected title: string;
    protected subtitle: string;
    protected items: string[] | undefined;
    protected maxSelections: number;
    protected data: UserData | null;
    protected updateCallback: ((data: UserData & { currentSection: string; isNavigating: boolean }) => void) | null;

    constructor({
        containerId,
        itemClass,
        dataKey,
        nextSection,
        title,
        subtitle,
        items,
        maxSelections = 10,
    }: SelectionComponentConfig) {
        this.container = document.getElementById(containerId);
        this.itemClass = itemClass;
        this.dataKey = dataKey;
        this.dataField = SELECTION_FIELD_MAP[dataKey];
        this.nextSection = nextSection;
        this.title = title;
        this.subtitle = subtitle;
        this.items = items;
        this.maxSelections = maxSelections;
        this.data = null;
        this.updateCallback = null;
    }

    initialize(updateCallback: (data: UserData & { currentSection: string; isNavigating: boolean }) => void): void {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data: UserData): void {
        this.data = data;
        this.render();
    }

    getSelected(): Set<string> {
        if (!this.container) return new Set();
        const selected = this.container.querySelectorAll(`.${this.itemClass}.selected`);
        return new Set([...selected].map((btn) => (btn as HTMLElement).dataset[this.dataKey] ?? ''));
    }

    hasUnsavedChanges(): boolean {
        const selected = this.getSelected();
        const saved: string[] = this.data?.[this.dataField] ?? [];
        if (selected.size !== saved.length) return true;
        return ![...selected].every((v) => saved.includes(v));
    }

    updateSelectionCount(): void {
        if (!this.container) return;
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const continueButton = this.container.querySelector(`#${this.dataField}-continue`) as HTMLButtonElement | null;
        const selectedCount = this.getSelected().size;

        if (selectedCountSpan) selectedCountSpan.textContent = String(selectedCount);
        if (continueButton) continueButton.disabled = selectedCount !== this.maxSelections;
    }

    renderItems(): string {
        const currentValues: string[] = this.data?.[this.dataField] ?? [];
        return `
            <div class="${this.dataField}-grid">
                ${(this.items ?? [])
                    .map(
                        (item) => `
                    <button class="${this.itemClass} ${currentValues.includes(item) ? 'selected' : ''}"
                            data-${this.dataKey}="${item}">
                        ${item}
                    </button>
                `
                    )
                    .join('')}
            </div>
        `;
    }

    render(): void {
        if (!this.container || !this.data) return;

        console.log(`🔵 [${this.constructor.name}] Rendering with data:`, this.data);

        const currentValues: string[] = this.data[this.dataField] ?? [];

        this.container.innerHTML = `
            <div class="${this.dataField}-header">
                <h2>${this.title}</h2>
                <p>${this.subtitle}</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            ${this.renderItems()}
            <div class="${this.dataField}-footer">
                <button id="${this.dataField}-continue" class="primary-button"
                        ${currentValues.length !== this.maxSelections ? 'disabled' : ''}>
                    Save
                </button>
            </div>
        `;

        this.updateSelectionCount();
    }

    bindEvents(): void {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains(this.itemClass)) {
                const selectedCount = this.getSelected().size;

                if (target.classList.contains('selected')) {
                    target.classList.remove('selected');
                } else if (selectedCount < this.maxSelections) {
                    target.classList.add('selected');
                }

                this.updateSelectionCount();
            }

            const btn = target as HTMLButtonElement;
            if (btn.id === `${this.dataField}-continue` && !btn.disabled) {
                const newData = {
                    ...this.data!,
                    [this.dataField]: [...this.getSelected()],
                    currentSection: this.nextSection,
                    isNavigating: true,
                };
                this.updateCallback!(newData);
            }
        });
    }

    show(): void {
        this.container?.classList.remove('hidden');
    }

    hide(): void {
        this.container?.classList.add('hidden');
    }
}
