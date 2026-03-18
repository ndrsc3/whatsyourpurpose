import type { UserData } from '../types.js';

export class UserDataStore {
    static STORAGE_KEY = 'appWMP_userData';

    static getDefaultData(): UserData {
        return {
            values: [],
            strengths: [],
            reflectionAnswers: [],
            needs: [],
            purposeStatement: null,
            readyToGeneratePurpose: false,
            lastUpdated: null,
            needsNewPurpose: false,
            lastUsedPromptIndex: -1,
            theme: 'dark',
        };
    }

    static getData(): UserData {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const parsedData: UserData = data ? JSON.parse(data) : this.getDefaultData();
        console.log('🔵 [UserDataStore] Fetching data from localStorage:', parsedData);
        return parsedData;
    }

    static saveData(data: UserData): void {
        data.lastUpdated = new Date().toISOString();
        console.log('Saving data to storage:', data);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    static updateValues(values: string[]): void {
        console.log('Updating values:', values);
        const data = this.getData();
        data.values = values;
        data.needsNewPurpose = true;
        this.saveData(data);
    }

    static updateStrengths(strengths: string[]): void {
        console.log('Updating strengths:', strengths);
        const data = this.getData();
        data.strengths = strengths;
        data.needsNewPurpose = true;
        this.saveData(data);
    }

    static updateReflectionAnswers(answers: string[]): void {
        console.log('Updating reflection answers:', answers);
        const data = this.getData();
        data.reflectionAnswers = answers;
        data.needsNewPurpose = true;
        this.saveData(data);
    }

    static updateNeeds(needs: string[]): void {
        console.log('Updating needs:', needs);
        const data = this.getData();
        data.needs = needs;
        data.needsNewPurpose = true;
        this.saveData(data);
    }

    static updatePurposeStatement(purposeStatement: string | null): void {
        console.log('Updating purpose statement:', purposeStatement);
        const data = this.getData();
        data.purposeStatement = purposeStatement;
        data.needsNewPurpose = false;
        this.saveData(data);
    }

    static updateTheme(theme: 'dark' | 'light'): void {
        console.log('Updating theme:', theme);
        const data = this.getData();
        data.theme = theme;
        this.saveData(data);
        document.documentElement.classList.toggle('light-theme', theme === 'light');
    }

    static getTheme(): 'dark' | 'light' {
        const data = this.getData();
        return data.theme || 'dark';
    }

    static clearData(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static hasCompletedValues(data?: UserData | null): boolean {
        const d = data ?? this.getData();
        return Array.isArray(d.values) && d.values.length === 10;
    }

    static hasCompletedStrengths(data?: UserData | null): boolean {
        const d = data ?? this.getData();
        return Array.isArray(d.strengths) && d.strengths.length === 10;
    }

    static hasCompletedReflections(data?: UserData | null): boolean {
        const d = data ?? this.getData();
        return Array.isArray(d.reflectionAnswers) && d.reflectionAnswers.length === 4;
    }

    static hasCompletedNeeds(data?: UserData | null): boolean {
        const d = data ?? this.getData();
        return Array.isArray(d.needs) && d.needs.length === 10;
    }

    static hasPurposeStatement(data?: UserData | null): boolean {
        const d = data ?? this.getData();
        return !!d.purposeStatement;
    }
}

export default UserDataStore;
