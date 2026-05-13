export const dynamic = "force-dynamic";
import { Inngest } from "inngest";
import { serve } from "inngest/next";
import { createAIClone } from "src/services/aiClone";
import {
    processAIVideos,
    createAIIntro,
    processOnboardingVideo,
} from "src/services/inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });
// Create an API that serves zero functions
export default serve({
    client: inngest,
    functions: [
        processAIVideos,
        createAIIntro,
        createAIClone,
        processOnboardingVideo,
    ],
    streaming: "allow",
    // streaming: "force", //TODO: uncomment this before release
});
