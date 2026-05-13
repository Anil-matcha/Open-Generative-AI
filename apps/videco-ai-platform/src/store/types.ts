/**
 * Form types
 */

// Enums

export enum ValidatorEnum {
    REQUIRED = "required",
    DATE = "date",
    EMAIL = "email",
    BOOLEAN = "boolean",
    IMAGE_FILE = "image",
    DOCUMENT_FILE = "document",
    IMAGE_OR_DOCUMENT_FILE = "image_or_document",
}

export enum FieldTypeEnum {
    TEXT = "text",
    TEXTAREA = "textarea",
    DATE = "date",
    ACCORDION = "accordion",
    TEXTBOX = "textbox",
    FILE = "file",
    SELECTOR = "selector",
    CHECKBOX = "checkbox",
}

export enum FieldSubTypeEnum {
    RADIO = "radio",
    DROPDOWN = "dropdown",
    FORM_LIST = "formlist",
}

export enum LayoutEnum {
    FULL_WIDTH = "full_width",
    TWO_COLUMN = "2_col",
}

// Form Inputs
export type IFormInput = {
    [id: string]: string | number | any[];
};

export type IForm = {
    [formId: string]: IFormInput;
};

// Form Request
export type IFormQuery = {
    id: string;
};

// Form Response
export type IFormField = {
    id: string;
    title: string;
    description?: string;
    type: string | FieldTypeEnum;
    placeholder: string;
    ordinal: number;
    columns?: number;
    validators: ValidatorEnum[];
    info?: string;
    helperText?: string;
    options?: string[];
    sub_type?: string;
};

export type IFormStep = {
    id: string;
    title: string;
    active: boolean;
    ordinal: number;
};

export type IFormNext = {
    id: string;
    title: string;
    list_title: string;
};

// Axios
export type IFormResponse = {
    id: string;
    title: string;
    description: string;
    background?: string;
    fields: IFormField[];
    steps: IFormStep[];
    next: IFormNext[];
    is_first: boolean;
    session: string;
    layout: LayoutEnum;
};

// Navigation
export type INavigation = {
    [formId: string]: FormNavigation;
};

export type INavigationBack = {
    id: string;
    title: string;
    layout: LayoutEnum;
};

export type FormNavigation = {
    back: INavigationBack;
};

export type FormResponseError = {
    id: string;
    error: string;
};

/**
 * Language types
 */

export type ILanguage = {
    label: string;
    labelSm: string;
    value: string;
};

// Zustand
export type ILanguageState = {
    languages: ILanguage[];
    language?: ILanguage;
    setLanguage: (language: ILanguage) => void;
    clearLanguage: () => void;
};
