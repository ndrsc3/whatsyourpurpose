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

export const SELECTION_FIELD_MAP = {
    value: 'values',
    strength: 'strengths',
    need: 'needs',
} as const satisfies Record<string, keyof UserData>;

export type SelectionDataKey = keyof typeof SELECTION_FIELD_MAP;
export type SelectionDataField = (typeof SELECTION_FIELD_MAP)[SelectionDataKey];

export interface SelectionComponentConfig {
    containerId: string;
    itemClass: string;
    dataKey: SelectionDataKey;
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
