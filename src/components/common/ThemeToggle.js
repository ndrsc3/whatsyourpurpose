export class ThemeToggle {
    constructor() {

        this.savedTheme = localStorage.getItem('theme') || 'dark';

        document.documentElement.classList.toggle('light-theme', this.savedTheme === 'light');
        
        this.bindEvents();
    }

    bindEvents() {
        this.btnToggleTheme = document.getElementById('theme-toggle');
        if (this.btnToggleTheme) {
            this.btnToggleTheme.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const root = document.documentElement;
        const isLightTheme = root.classList.toggle('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    }
}

export default new ThemeToggle(); 