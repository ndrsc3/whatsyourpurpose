import ThemeToggle from './components/common/ThemeToggle.js';
import UserSetup from './components/auth/UserSetup.js';
import AccountRecovery from './components/auth/AccountRecovery.js';
import Footer from './components/common/Footer.js';
import ValuesSelection from './components/purpose/ValuesSelection.js';
import StrengthsSelection from './components/purpose/StrengthsSelection.js';
import QuestionsForm from './components/purpose/QuestionsForm.js';
import NeedsSelection from './components/purpose/NeedsSelection.js';
import SummaryView from './components/purpose/SummaryView.js';
import PurposeView from './components/purpose/PurposeView.js';
import UserDataStore from './utils/userDataStore.js';

class App {
    constructor() {
        this.userData = null;
        this.currentStep = 'unknown';
        this.components = {
            valuesSelection: ValuesSelection,
            strengthsSelection: StrengthsSelection,
            questionsForm: QuestionsForm,
            needsSelection: NeedsSelection,
            summaryView: SummaryView,
            purposeView: PurposeView
        };

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.updateData = this.updateData.bind(this);
        this.determineStep = this.determineStep.bind(this);
        this.showComponent = this.showComponent.bind(this);
    }

    logAppState() {
        console.group('🔵 [App] Current State');
        console.log('App Data:', this.userData);
        console.log('Current Step:', this.currentStep);
        console.log('Values completed:', this.hasCompletedValues());
        console.log('Strengths completed:', this.hasCompletedStrengths());
        console.log('Reflections completed:', this.hasCompletedReflections());
        console.log('Needs completed:', this.hasCompletedNeeds());
        console.log('Has purpose statement:', this.hasPurposeStatement());
        console.groupEnd();
    }

    transition(fromStep, toStep) {
        console.log(`🔵 [App] Transitioning from ${fromStep} to ${toStep}`);
        
        // Hide current component
        const fromComponent = this.components[`${fromStep}View`] || this.components[fromStep];
        if (fromComponent) {
            fromComponent.hide();
        }

        // Show next component
        const toComponent = this.components[`${toStep}View`] || this.components[toStep];
        if (toComponent) {
            toComponent.setData?.(this.userData);
            toComponent.show();
        }

        this.currentStep = toStep;
    }

    hasCompletedValues() {
        return Array.isArray(this.userData?.values) && this.userData.values.length === 10;
    }

    hasCompletedStrengths() {
        return Array.isArray(this.userData?.strengths) && this.userData.strengths.length === 10;
    }

    hasCompletedReflections() {
        return Array.isArray(this.userData?.reflectionAnswers) && this.userData.reflectionAnswers.length === 4;
    }

    hasCompletedNeeds() {
        return Array.isArray(this.userData?.needs) && this.userData.needs.length === 10;
    }

    hasPurposeStatement() {
        return !!this.userData?.purposeStatement;
    }

    updateData(newData) {
        this.userData = newData;
        UserDataStore.saveData(newData);
        this.determineStep();
        this.logAppState();
    }

    determineStep() {
        let nextStep;

        // Determine which component to show
        if (!this.hasCompletedValues()) {
            nextStep = 'valuesSelection';
        } else if (!this.hasCompletedStrengths()) {
            nextStep = 'strengthsSelection';
        } else if (!this.hasCompletedReflections()) {
            nextStep = 'questionsForm';
        } else if (!this.hasCompletedNeeds()) {
            nextStep = 'needsSelection';
        } else if (this.userData?.readyToGeneratePurpose || this.hasPurposeStatement()) {
            nextStep = 'purpose';
        } else {
            nextStep = 'summary';
        }

        if (nextStep !== this.currentStep) {
            this.transition(this.currentStep, nextStep);
        }

        console.log('🔵 [App] Current step:', this.currentStep);
    }

    showComponent(componentName) {
        const component = this.components[componentName];
        if (component) {
            component.setData?.(this.userData);
            component.show();
        }
    }

    initialize() {
        // Check if user is authenticated
        const authData = JSON.parse(localStorage.getItem('dev_authTokens'));
        if (authData?.accessToken) {
            // Load initial data
            this.userData = UserDataStore.getData();
            
            // Show main app
            document.getElementById('main-app').classList.remove('hidden');
            
            // Initialize components with data and determine current step
            Object.values(this.components).forEach(component => {
                component.initialize?.(this.updateData);
            });
            
            this.determineStep();
            this.logAppState();
        } else {
            console.log('🔵 [App] User not authenticated');
            // Hide main app and show user setup
            document.getElementById('main-app').classList.add('hidden');
            document.getElementById('user-setup').classList.remove('hidden');
            document.getElementById('account-recovery').classList.add('hidden');
            document.getElementById('recovery-code-display').classList.add('hidden');
        }
    }
}

// Initialize app when DOM is ready
const app = new App();
document.addEventListener('DOMContentLoaded', app.initialize); 