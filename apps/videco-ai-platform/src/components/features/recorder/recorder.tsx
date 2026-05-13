import { useEffect } from "react";
type RecorderProps = {
    onFinish: (url: string) => void;
};
export const Recorder: React.FC<RecorderProps> = ({ onFinish }) => {
    useEffect(() => {
        const event = async function (event: MessageEvent) {
            if (event.data?.type !== "video") {
                return;
            }
            onFinish(event.data.data);
        };
        window.addEventListener("message", event);
        return () => {
            window.removeEventListener("message", event);
        };
    }, []);
    return (
        <iframe
            src="/recorder/index.html"
            allow="display-capture"
            style={{ border: "none", width: "100%", height: "70vh" }}
        ></iframe>
    );
};
