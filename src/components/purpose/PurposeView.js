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
                <h2>Your Life Purpose</h2>
                <p>Based on your values, strengths, and aspirations</p>
            </div>
            
            <div class="purpose-container">
                ${this.data.purposeStatement ? `
                    <div class="purpose-statement">
                        <p>${this.data.purposeStatement}</p>
                    </div>
                    <div class="purpose-actions">
                        <button id="regenerate-purpose" class="secondary-button">
                            Generate Another
                        </button>
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