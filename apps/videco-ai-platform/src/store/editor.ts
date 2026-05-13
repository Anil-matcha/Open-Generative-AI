import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type Video = {
    duration: number;
    durationFormatted?: number | string;
    seek: number;
};
export type VideoInfo = {
    title?: string;
    platform?: string;
    embed_code?: string;
    preview?: string;
    desc?: string;
    password_protection?: string;
    primary_link: string;
    primary_text: string;
    secondary_text: string;
    secondary_link: string;
    brand?: boolean;
    player?: {
        bg?: string;
        color?: string;
    };
    endCTAlink: string;
    endCTAtext: string;
    remove_logo: boolean;
    endCTAtitle: string;
};
export type InteractiveElementType = {
    id: any;
    name: string;
    url: string;
    type: string;
    butonPosition?: string;
    form_submit_text?: string;
    answers?: any;
    answer_placeholder?: any;
    answer_type?: any;
    form_enable_name?: any;
    form_enable_email?: any;
    form_enable_message?: any;
    pos: string | number;
    time: number;
    endTime: number;
};

export type EditorState = {
    video: Video;
    meta: VideoInfo;
    interactiveElements: InteractiveElementType[];
    timeline?: string[];
    setVideo: (video: Video) => void;
    setVideoMeta: (meta: VideoInfo) => void;
    setInteractiveElements: (
        interactiveElement: InteractiveElementType[],
    ) => void;
    updateInteractiveElements: (
        interactiveElement: InteractiveElementType,
    ) => void;
    setInteractiveElementsFromDB: (
        interactiveElement: InteractiveElementType[],
    ) => void;
    deleteInteractiveElement: (
        interactiveElement: InteractiveElementType,
    ) => void;
    clearVideo: () => void;
};

const initialEditorState = {
    video: { duration: 0, seek: 0, durationFormatted: 0 },
    meta: {
        title: "no-title",
        platform: "videco",
        preview: "",
        remove_logo: false,
        primary_link: "https://videco.io",
        primary_text: "Learn More",
        secondary_text: "Watch more videos",
        secondary_link: "https://videco.io/docs",
        desc: "add your video description here",
        password_protection: "",
        endCTAlink: "",
        endCTAtext: "",
        endCTAtitle: "",
    },
    interactiveElements: [],
};

/**
 * Usage
 *
 * const { video, setVideo } = useEditorStore();
 */
export const useEditorStore = create(
    devtools(
        persist<EditorState>(
            (set) => ({
                ...initialEditorState,
                setVideo: (video: Video) => {
                    set(() => ({
                        video,
                    }));
                },
                setVideoMeta: (meta: VideoInfo) => {
                    set(() => ({
                        meta,
                    }));
                },
                setInteractiveElementsFromDB: (
                    interactiveElement: InteractiveElementType[] | null,
                ) => {
                    set(() => ({
                        interactiveElements: interactiveElement,
                    }));
                },
                setInteractiveElements: (
                    interactiveElement: InteractiveElementType[],
                ) => {
                    set((state) => ({
                        interactiveElements: interactiveElement,
                    }));
                },
                updateInteractiveElements: (
                    interactiveElement: InteractiveElementType,
                ) => {
                    set((state) => {
                        const filteredElements =
                            state.interactiveElements.filter(
                                (el) => el.id !== interactiveElement.id,
                            );
                        return {
                            interactiveElements: [
                                ...filteredElements,
                                interactiveElement,
                            ],
                        };
                    });
                },
                deleteInteractiveElement: (
                    interactiveElement: InteractiveElementType,
                ) => {
                    set((state) => {
                        const filteredElements =
                            state.interactiveElements.filter(
                                (el) => el.id !== interactiveElement.id,
                            );
                        return {
                            interactiveElements: filteredElements,
                        };
                    });
                },
                clearVideo: () => {
                    set(() => initialEditorState);
                },
            }),
            {
                name: "editor-storage",
                // storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            },
        ),
    ),
);

export const formatSeconds = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ("0" + date.getUTCSeconds()).slice(-2);
    if (hh) {
        return `${hh}:${("0" + mm).slice(-2)}:${ss}`;
    }
    return `${mm}:${ss}`;
};
