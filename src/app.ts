// Side-effect imports: these modules instantiate and self-register their DOM
// components at module load (each exports `new Foo()` as default). They are
// imported for the construction side effect only — no symbol is referenced.
import './components/common/ThemeToggle.js';
import './components/auth/UserSetup.js';
import './components/auth/AccountRecovery.js';
import './components/common/Footer.js';

import NavigationPanel from './components/common/NavigationPanel.js';
import ValuesSelection from './components/purpose/ValuesSelection.js';
import StrengthsSelection from './components/purpose/StrengthsSelection.js';
import QuestionsForm from './components/purpose/QuestionsForm.js';
import NeedsSelection from './components/purpose/NeedsSelection.js';
import SummaryView from './components/purpose/SummaryView.js';
import PurposeView from './components/purpose/PurposeView.js';
import UserDataStore from './utils/userDataStore.js';
import type { UserData, AuthData } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentLike = any;

export class App {
    static instance: App | null = null;

    private userData: UserData | null;
    private currentStep: string;
    private userId: string | null;
    private sectionToComponent: Record<string, string>;
    private components: Record<string, ComponentLike>;

    static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }

    static initializeApp(): App {
        const app = App.getInstance();
        app.initialize();
        return app;
    }

    constructor() {
        if (App.instance) {
            return App.instance;
        }
        App.instance = this;

        this.userData = null;
        this.currentStep = 'unknown';
        this.userId = null;

        this.sectionToComponent = {
            values: 'valuesSelection',
            strengths: 'strengthsSelection',
            reflections: 'questionsForm',
            needs: 'needsSelection',
            summary: 'summaryView',
            purpose: 'purposeView',
        };

        this.components = {
            valuesSelection: ValuesSelection,
            strengthsSelection: StrengthsSelection,
            questionsForm: QuestionsForm,
            needsSelection: NeedsSelection,
            summaryView: SummaryView,
            purposeView: PurposeView,
        };

        NavigationPanel.initialize(
            this.updateData.bind(this),
            (section: string) => this.components[this.sectionToComponent[section]]
        );
    }

    logAppState(): void {
        console.group('🔵 [App] Current State');
        console.log('App Data:', this.userData);
        console.log('Current Step:', this.currentStep);
        console.log('Values completed:', UserDataStore.hasCompletedValues(this.userData));
        console.log('Strengths completed:', UserDataStore.hasCompletedStrengths(this.userData));
        console.log('Reflections completed:', UserDataStore.hasCompletedReflections(this.userData));
        console.log('Needs completed:', UserDataStore.hasCompletedNeeds(this.userData));
        console.log('Has purpose statement:', UserDataStore.hasPurposeStatement(this.userData));
        console.groupEnd();
    }

    transition(fromStep: string, toStep: string): void {
        console.log(`🔵 [App] Transitioning from ${fromStep} to ${toStep}`);

        const fromComponent = this.components[this.sectionToComponent[fromStep] || fromStep];
        const toComponent = this.components[this.sectionToComponent[toStep] || toStep];

        if (fromComponent) {
            fromComponent.hide();
        }

        if (toComponent) {
            toComponent.setData?.(this.userData);
            if (toComponent === this.components.purposeView) {
                toComponent.initialize?.(this.updateData.bind(this), this.userId);
            }
            toComponent.show();
        } else {
            console.error('🔴 [App] Component not found for step:', toStep);
        }

        this.currentStep = toStep;

        NavigationPanel.setData({
            ...this.userData,
            currentSection: toStep,
        });
    }

    updateData(newData: UserData & { isNavigating?: boolean; currentSection?: string }): void {
        this.userData = newData;
        UserDataStore.saveData(newData);

        NavigationPanel.setData(newData);

        if (newData.isNavigating) {
            this.transition(this.currentStep, newData.currentSection!);
        } else {
            this.determineStep();
        }

        this.logAppState();
    }

    determineStep(): void {
        let nextStep: string;

        if (!UserDataStore.hasCompletedValues(this.userData)) {
            nextStep = 'values';
        } else if (!UserDataStore.hasCompletedStrengths(this.userData)) {
            nextStep = 'strengths';
        } else if (!UserDataStore.hasCompletedReflections(this.userData)) {
            nextStep = 'reflections';
        } else if (!UserDataStore.hasCompletedNeeds(this.userData)) {
            nextStep = 'needs';
        } else if (this.userData?.readyToGeneratePurpose || UserDataStore.hasPurposeStatement(this.userData)) {
            nextStep = 'purpose';
        } else {
            nextStep = 'summary';
        }

        if (nextStep !== this.currentStep) {
            this.transition(this.currentStep, nextStep);
        }

        console.log('🔵 [App] Current step:', this.currentStep);
    }

    showComponent(componentName: string): void {
        const component = this.components[this.sectionToComponent[componentName] || componentName];
        if (component) {
            component.setData?.(this.userData);
            component.show();
        } else {
            console.error('🔴 [App] Component not found:', componentName);
        }
    }

    initialize(): void {
        const raw = localStorage.getItem('appWMP_auth');
        const authData: AuthData | null = raw ? (JSON.parse(raw) as AuthData) : null;
        if (authData?.accessToken) {
            this.userId = authData.userId;
            this.userData = UserDataStore.getData();

            document.getElementById('main-app')?.classList.remove('hidden');

            Object.values(this.components).forEach((component: ComponentLike) => {
                component.initialize?.(this.updateData.bind(this), this.userId);
            });

            this.determineStep();
            this.logAppState();
        } else {
            console.log('🔵 [App] User not authenticated');
            document.getElementById('main-app')?.classList.add('hidden');
            document.getElementById('user-setup')?.classList.remove('hidden');
            document.getElementById('account-recovery')?.classList.add('hidden');
            document.getElementById('recovery-code-display')?.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem('appWMP_auth');
    const authData: AuthData | null = raw ? (JSON.parse(raw) as AuthData) : null;
    if (authData?.accessToken) {
        App.initializeApp();
    } else {
        document.getElementById('main-app')?.classList.add('hidden');
        document.getElementById('user-setup')?.classList.remove('hidden');
        document.getElementById('account-recovery')?.classList.add('hidden');
        document.getElementById('recovery-code-display')?.classList.add('hidden');
    }
});

export default App;
