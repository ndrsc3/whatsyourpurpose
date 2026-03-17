export class SelectionComponent {
    constructor({ containerId, itemClass, dataKey, nextSection, title, subtitle, items, maxSelections = 10 }) {
        this.container = document.getElementById(containerId);
        this.itemClass = itemClass;
        this.dataKey = dataKey;
        this.dataField = dataKey + 's'; // e.g. 'value' -> 'values'
        this.nextSection = nextSection;
        this.title = title;
        this.subtitle = subtitle;
        this.items = items;
        this.maxSelections = maxSelections;
        this.data = null;
        this.updateCallback = null;
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    getSelected() {
        if (!this.container) return new Set();
        const selected = this.container.querySelectorAll(`.${this.itemClass}.selected`);
        return new Set([...selected].map(btn => btn.dataset[this.dataKey]));
    }

    hasUnsavedChanges() {
        const selected = this.getSelected();
        const saved = this.data?.[this.dataField] || [];
        if (selected.size !== saved.length) return true;
        return ![...selected].every(v => saved.includes(v));
    }

    updateSelectionCount() {
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const continueButton = this.container.querySelector(`#${this.dataField}-continue`);
        const selectedCount = this.getSelected().size;

        if (selectedCountSpan) selectedCountSpan.textContent = selectedCount;
        if (continueButton) continueButton.disabled = selectedCount !== this.maxSelections;
    }

    renderItems() {
        return `
            <div class="${this.dataField}-grid">
                ${this.items.map(item => `
                    <button class="${this.itemClass} ${this.data[this.dataField]?.includes(item) ? 'selected' : ''}"
                            data-${this.dataKey}="${item}">
                        ${item}
                    </button>
                `).join('')}
            </div>
        `;
    }

    render() {
        if (!this.container || !this.data) return;

        console.log(`🔵 [${this.constructor.name}] Rendering with data:`, this.data);

        this.container.innerHTML = `
            <div class="${this.dataField}-header">
                <h2>${this.title}</h2>
                <p>${this.subtitle}</p>
                <p class="selection-count">Selected: <span id="selected-count">0</span>/${this.maxSelections}</p>
            </div>
            ${this.renderItems()}
            <div class="${this.dataField}-footer">
                <button id="${this.dataField}-continue" class="primary-button"
                        ${(this.data[this.dataField]?.length || 0) !== this.maxSelections ? 'disabled' : ''}>
                    Save
                </button>
            </div>
        `;

        this.updateSelectionCount();
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains(this.itemClass)) {
                const selectedCount = this.getSelected().size;

                if (e.target.classList.contains('selected')) {
                    e.target.classList.remove('selected');
                } else if (selectedCount < this.maxSelections) {
                    e.target.classList.add('selected');
                }

                this.updateSelectionCount();
            }

            if (e.target.id === `${this.dataField}-continue` && !e.target.disabled) {
                const newData = {
                    ...this.data,
                    [this.dataField]: [...this.getSelected()],
                    currentSection: this.nextSection,
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
