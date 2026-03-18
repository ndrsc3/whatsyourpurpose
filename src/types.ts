export interface UserData {
    values: string[];
    strengths: string[];
    reflectionAnswers: string[];
    needs: string[];
    purposeStatement: string | null;
    readyToGeneratePurpose: boolean;
    lastUpdated: string | null;
    needsNewPurpose: boolean;
    lastUsedPromptIndex: number;
    theme: 'dark' | 'light';
}

export interface AuthData {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
}

export interface ModalButton {
    text: string;
    type?: string;
    onClick: () => void;
}

export interface ModalOptions {
    title: string;
    message: string;
    buttons: ModalButton[];
}

export interface SelectionComponentConfig {
    containerId: string;
    itemClass: string;
    dataKey: string;
    nextSection: string;
    title: string;
    subtitle: string;
    items?: string[];
    maxSelections?: number;
}

export interface GeneratePurposeResponse {
    purposeStatement: string;
    promptIndex: number;
}
