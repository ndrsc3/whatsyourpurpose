import type { ModalOptions } from '../../types.js';

export class Modal {
    private modalContainer: HTMLDivElement;

    constructor() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'modal-container hidden';
        this.modalContainer.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3></h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        `;
        document.body.appendChild(this.modalContainer);

        this.modalContainer.querySelector('.modal-close')!.addEventListener('click', () => this.hide());
        this.modalContainer.querySelector('.modal-overlay')!.addEventListener('click', () => this.hide());
    }

    show({ title, message, buttons }: ModalOptions): void {
        this.modalContainer.querySelector('.modal-header h3')!.textContent = title;
        this.modalContainer.querySelector('.modal-body')!.textContent = message;

        const footer = this.modalContainer.querySelector('.modal-footer')!;
        footer.innerHTML = '';

        buttons.forEach((button) => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.className = `modal-button ${button.type || 'secondary-button'}`;
            btn.addEventListener('click', () => {
                this.hide();
                button.onClick();
            });
            footer.appendChild(btn);
        });

        this.modalContainer.classList.remove('hidden');
    }

    hide(): void {
        this.modalContainer.classList.add('hidden');
    }
}

export default new Modal();
