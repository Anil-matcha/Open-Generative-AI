import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type Workspace = {
    id: any;
    name: string;
    image?: string;
};

export type WorkspaceState = {
    workspace?: Workspace;
    setWorkspace: (workspace: Workspace) => void;
    clearWorkspace: () => void;
};

const initialWorkspaceState = {
    workspace: { name: "Default", id: 1, image: "/default_icon.png" },
};

/**
 * Usage
 *
 * const { video, setVideo } = useEditorStore();
 */
export const useWorkspaces = create(
    devtools(
        persist<WorkspaceState>(
            (set) => ({
                ...initialWorkspaceState,
                setWorkspace: (workspace: Workspace) => {
                    set(() => ({
                        workspace,
                    }));
                },
                clearWorkspace: () => {
                    set(() => initialWorkspaceState);
                },
            }),
            {
                name: "workspace-storage",
                storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            },
        ),
    ),
);
