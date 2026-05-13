import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type User = {
    fullName?: string;
};

export type UserState = {
    user?: User;
    setUser: (user: User) => void;
    clearUser: () => void;
};

const initialUserState = {
    user: { fullName: "" },
};

/**
 * Usage
 *
 * const { video, setVideo } = useEditorStore();
 */
export const useUserStore = create(
    devtools(
        persist<UserState>(
            (set) => ({
                ...initialUserState,
                setUser: (user: User) => {
                    set(() => ({
                        user,
                    }));
                },
                clearUser: () => {
                    set(() => initialUserState);
                },
            }),
            {
                name: "user-storage",
                storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            },
        ),
    ),
);
