export class UserDataStore {
    static STORAGE_KEY = 'purposeJourneyData';

    static getDefaultData() {
        return {
            values: [],
            strengths: [],
            reflectionAnswers: [],
            needs: [],
            purposeStatement: null,
            readyToGeneratePurpose: false,
            lastUpdated: null
        };
    }

    static getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const parsedData = data ? JSON.parse(data) : this.getDefaultData();
        console.log('🔵 [UserDataStore] Fetching data from localStorage:', parsedData);
        return parsedData;
    }

    static saveData(data) {
        data.lastUpdated = new Date().toISOString();
        console.log('Saving data to storage:', data);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    static updateValues(values) {
        console.log('Updating values:', values);
        const data = this.getData();
        data.values = values;
        this.saveData(data);
    }

    static updateStrengths(strengths) {
        console.log('Updating strengths:', strengths);
        const data = this.getData();
        data.strengths = strengths;
        this.saveData(data);
    }

    static updateReflectionAnswers(answers) {
        console.log('Updating reflection answers:', answers);
        const data = this.getData();
        data.reflectionAnswers = answers;
        this.saveData(data);
    }

    static updateNeeds(needs) {
        console.log('Updating needs:', needs);
        const data = this.getData();
        data.needs = needs;
        this.saveData(data);
    }

    static updatePurposeStatement(purposeStatement) {
        console.log('Updating purpose statement:', purposeStatement);
        const data = this.getData();
        data.purposeStatement = purposeStatement;
        this.saveData(data);
    }

    static clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static hasCompletedValues() {
        const data = this.getData();
        return Array.isArray(data.values) && data.values.length === 10;
    }

    static hasCompletedStrengths() {
        const data = this.getData();
        return Array.isArray(data.strengths) && data.strengths.length === 10;
    }

    static hasCompletedReflections() {
        const data = this.getData();
        return Array.isArray(data.reflectionAnswers) && data.reflectionAnswers.length === 4;
    }

    static hasCompletedNeeds() {
        const data = this.getData();
        return Array.isArray(data.needs) && data.needs.length === 10;
    }

    static hasPurposeStatement() {
        const data = this.getData();
        return !!data.purposeStatement;
    }
}

export default UserDataStore; 