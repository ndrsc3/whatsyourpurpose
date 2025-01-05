export class PurposeView {
    constructor() {
        this.container = document.getElementById('purpose-view');
        this.data = null;
        this.updateCallback = null;
        this.isGenerating = false;
    }

    initialize(updateCallback) {
        this.updateCallback = updateCallback;
        this.bindEvents();
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    async generatePurpose() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.updateGeneratingState();

        try {
            const authData = JSON.parse(localStorage.getItem('dev_authTokens'));
            
            const response = await fetch('/api/generate-purpose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.accessToken}`
                },
                body: JSON.stringify(this.data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Ensure the purpose statement is a string
            if (typeof result.purposeStatement !== 'string') {
                throw new Error('Invalid purpose statement format received');
            }

            // Update data with the new purpose statement
            const newData = {
                ...this.data,
                purposeStatement: result.purposeStatement,
                generatedAt: new Date().toISOString()
            };

            // Call the update callback with the properly structured data
            this.updateCallback(newData);
            
        } catch (error) {
            console.error('Error generating purpose:', {
                error: error.message,
                stack: error.stack
            });
            this.showError('Failed to generate purpose statement. Please try again.');
        } finally {
            this.isGenerating = false;
            this.updateGeneratingState();
        }
    }

    updateGeneratingState() {
        if (!this.container) return;

        const generateButton = this.container.querySelector('#generate-purpose');
        if (generateButton) {
            generateButton.disabled = this.isGenerating;
            generateButton.textContent = this.isGenerating ? 'Generating...' : 'Generate Purpose';
        }
    }

    showError(message) {
        const errorElement = this.container.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    render() {
        if (!this.container || !this.data) return;

        console.log('🔵 [PurposeView] Rendering with data:', this.data);

        const content = `
            <div class="purpose-header">
                <h3>Your Life Purpose</h3>
                <p>Based on your values, strengths, and aspirations</p>
            </div>
            
            <div class="purpose-container">
                ${this.data.purposeStatement ? `
                    <div class="purpose-statement">
                        <button id="regenerate-purpose" class="icon-button" title="Generate Another Purpose Statement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                            </svg>
                        </button>
                        <p>${this.data.purposeStatement}</p>
                    </div>
                    <div class="purpose-actions">
                        <button id="share-purpose" class="primary-button">
                            Share Purpose
                        </button>
                    </div>
                ` : `
                    <div class="purpose-intro">
                        <p>Ready to discover your purpose? Click below to generate your personalized purpose statement.</p>
                        <button id="generate-purpose" class="primary-button">
                            Generate Purpose
                        </button>
                    </div>
                `}
                <p class="error-message hidden"></p>
            </div>
        `;

        this.container.innerHTML = content;
        this.updateGeneratingState();
    }

    bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', async (e) => {
            if (e.target.id === 'generate-purpose' || e.target.id === 'regenerate-purpose') {
                await this.generatePurpose();
            } else if (e.target.id === 'share-purpose') {
                // TODO: Implement sharing functionality
                alert('Sharing functionality coming soon!');
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

export default new PurposeView(); 