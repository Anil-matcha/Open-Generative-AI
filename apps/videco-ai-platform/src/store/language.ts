import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { axiosInstance } from "src/services/api";
import { i18n } from "@i18n";
import { ILanguageState, ILanguage } from "./types";

export const LANGUAGES: ILanguage[] = [
    {
        label: "English",
        labelSm: "EN",
        value: "en",
    },
    {
        label: "Netherlands",
        labelSm: "NL",
        value: "nl",
    },
];

const initialLanguageState = {
    languages: LANGUAGES,
    language: LANGUAGES[0],
};

/**
 * Usage
 *
 * const { language, languages, setLanguage } = useLanguageStore();
 */
export const useLanguageStore = create(
    devtools(
        persist<ILanguageState>(
            (set) => ({
                ...initialLanguageState,
                setLanguage: (language: ILanguage) => {
                    i18n.changeLanguage(language?.value);
                    axiosInstance.defaults.headers["Accept-Language"] = String(
                        language?.value,
                    );
                    set(() => ({
                        language,
                    }));
                },
                clearLanguage: () => {
                    set(() => initialLanguageState);
                },
            }),
            {
                name: "language-storage",
                storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            },
        ),
    ),
);
