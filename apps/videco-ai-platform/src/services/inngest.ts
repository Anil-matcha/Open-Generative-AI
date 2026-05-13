import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { Inngest } from "inngest";
import { v2 as cloudinary } from "cloudinary";
import { makeAIVoice, makeTextToVoice } from "./api/aiVoice";

export const JOB_DETAILS = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
};

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const supabase = createClientComponentClient();

export const processAIVideos = inngest.createFunction(
    { id: "ai-process" },
    { event: "ai/process" },
    async ({ event, step, logger }) => {
        await supabase
            .from("ai_videos")
            .update({
                status: "pending",
            })
            .eq("id", event.data.ai_video_id);
        let voiceCloningResult;
        if (event.data.voiceCloningEnabled) {
            const voice = await makeTextToVoice(
                event.data.text,
                event.data.greeting,
                event.data.voice_id,
                event.data.language,
            );
            const dataUri = `data:audio/mp3;base64,${voice.data.audio_data}`;

            voiceCloningResult = (await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_large(
                    dataUri,
                    { resource_type: "video", chunk_size: 6000000 },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    },
                );
            })) as any;
        }
        let videoBG;
        if (event.data.background === "website") {
            try {
                const getBackground = await axios({
                    method: "GET",
                    url: `https://api.screenshotone.com/animate?access_key=lRKhSQXN13D2IA&url=${event.data.website}&format=mp4&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=0&timeout=60&scenario=scroll&duration=5&scroll_delay=500&scroll_duration=1500&scroll_by=1000&scroll_start_immediately=true&scroll_back=true&scroll_complete=true&scroll_easing=ease_in_out_quint`,
                    responseType: "stream",
                });

                const videoUploadResult: any = await new Promise(
                    (resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { resource_type: "video" }, // Specify resource type
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            },
                        );

                        // Pipe the Axios response (stream) to Cloudinary upload stream
                        getBackground.data.pipe(uploadStream);
                    },
                );
                videoBG = videoUploadResult.public_id;
            } catch (e) {
                try {
                    const getBackground = await axios({
                        method: "GET",
                        url: `https://api.screenshotone.com/animate?access_key=lRKhSQXN13D2IA&url=${event.data.website}&format=mp4&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=0&timeout=60&scenario=scroll&duration=5&scroll_delay=500&scroll_duration=1500&scroll_by=1000&scroll_start_immediately=true&scroll_back=true&scroll_complete=true&scroll_easing=ease_in_out_quint&ignore_host_errors=true`,
                        responseType: "stream",
                    });

                    const videoUploadResult: any = await new Promise(
                        (resolve, reject) => {
                            const uploadStream =
                                cloudinary.uploader.upload_stream(
                                    { resource_type: "video" }, // Specify resource type
                                    (error, result) => {
                                        if (error) reject(error);
                                        else resolve(result);
                                    },
                                );

                            // Pipe the Axios response (stream) to Cloudinary upload stream
                            getBackground.data.pipe(uploadStream);
                        },
                    );
                    logger.info("coming here", getBackground);

                    videoBG = videoUploadResult.public_id;
                } catch (e) {
                    logger.info("coming here", "22");
                    logger.info("coming here", e);
                    await supabase
                        .from("ai_videos")
                        .update({
                            status: "error",
                        })
                        .eq("id", event.data.ai_video_id);
                    return {
                        event: "error",
                        body: "error",
                    };
                }
            }
        }
        let videoUrl = "";
        if (event.data.background === "website") {
            videoUrl = cloudinary.url(event.data.og_video_public_id, {
                resource_type: "video",
                transformation: [
                    { audio_codec: "none" },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        start_offset: voiceCloningResult ? "2" : "0",
                    },
                    {
                        overlay: `video:${videoBG}`,
                        effect: "loop:4",
                    },
                    { flags: "layer_apply" },
                    {
                        overlay: voiceCloningResult
                            ? `audio:${voiceCloningResult.public_id}`
                            : "",
                    },
                    { flags: voiceCloningResult ? "layer_apply" : "" },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        start_offset: voiceCloningResult ? "2" : "0",
                        height: 250,
                        width: 200,
                        crop: "fill",
                        audio_codec: "none",
                    },
                    { radius: 40 },
                    {
                        flags: "layer_apply",
                        gravity: "south_west",
                        y: 70,
                        x: 20,
                    },
                    { flags: "layer_apply" },
                    { if: "du_lte_4" },
                    { effect: "fade:1000" },
                    { effect: "fade:-1000" },
                    { if: "else" },
                    { effect: "fade:2000" },
                    { effect: "fade:-2000" },
                    { if: "end" },
                ],
            });
        } else {
            videoUrl = cloudinary.url(event.data.og_video_public_id, {
                resource_type: "video",
                transformation: [
                    { audio_codec: "none" },
                    { effect: "blur:100" },
                    { effect: "fade:1000" },
                    {
                        overlay: voiceCloningResult
                            ? `audio:${voiceCloningResult.public_id}`
                            : "",
                    },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        flags: "splice",
                    }, // Layer video
                    { flags: "layer_apply" },
                    ...(voiceCloningResult
                        ? [
                              {
                                  color: "white",
                                  background: "black",
                                  overlay: {
                                      font_family: "Arial",
                                      font_size: 150,
                                      text: `${event.data.greeting} ${event.data.text}`,
                                  },
                                  flags: "text_no_trim",
                                  duration: "2",
                                  start_offset: "0",
                                  effect: "fade:500",
                              },
                              {
                                  border: "6px_solid_rgb:05405A",
                                  duration: "2",
                                  start_offset: "0",
                              },
                              { flags: "layer_apply", duration: "2" },
                          ]
                        : []),
                ],
            });
        }
        const ai_video_update = await supabase
            .from("ai_videos")
            .update({
                url: videoUrl,
                status: "completed",
            })
            .eq("id", event.data.ai_video_id);

        const { data, error } = await supabase
            .from("jobs")
            .update([
                {
                    job_details: event,
                    status: JOB_DETAILS.completed,
                },
            ])
            .eq("id", event.data.job_id)
            .single();

        if (error) {
            return {
                event: ai_video_update.error,
                body: ai_video_update.error,
            };
        }

        if (ai_video_update.error) {
            return {
                event: ai_video_update.error,
                body: ai_video_update.error,
            };
        }

        return {
            event: ai_video_update,
            body: voiceCloningResult,
        };
    },
);

export const processOnboardingVideo = inngest.createFunction(
    { id: "ai-onboarding" },
    { event: "ai/onboarding" },
    async ({ event, step }) => {
        await supabase
            .from("ai_videos")
            .update({
                status: "pending",
            })
            .eq("id", event.data.user_id);
        let voiceCloningResult;
        if (event.data.voiceCloningEnabled) {
            const voice = await makeTextToVoice(
                event.data.text,
                event.data.greeting,
                event.data.voice_id,
                event.data.language,
            );
            const dataUri = `data:audio/mp3;base64,${voice.data.audio_data}`;

            voiceCloningResult = (await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_large(
                    dataUri,
                    { resource_type: "video", chunk_size: 6000000 },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    },
                );
            })) as any;
        }
        let videoBG;
        if (event.data.background === "website") {
            const getBackground = await axios({
                method: "GET",
                url: `https://api.screenshotone.com/animate?access_key=lRKhSQXN13D2IA&url=${event.data.website}&format=mp4&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=0&timeout=60&scenario=scroll&duration=5&scroll_delay=500&scroll_duration=1500&scroll_by=1000&scroll_start_immediately=true&scroll_back=true&scroll_complete=true&scroll_easing=ease_in_out_quint`,
                responseType: "stream",
            });

            const videoUploadResult: any = await new Promise(
                (resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { resource_type: "video" }, // Specify resource type
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        },
                    );

                    // Pipe the Axios response (stream) to Cloudinary upload stream
                    getBackground.data.pipe(uploadStream);
                },
            );

            videoBG = videoUploadResult.public_id;
        }
        let videoUrl = "";
        if (event.data.background === "website") {
            videoUrl = cloudinary.url(event.data.og_video_public_id, {
                resource_type: "video",
                transformation: [
                    { audio_codec: "none" },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        start_offset: voiceCloningResult ? "2" : "0",
                    },
                    {
                        overlay: `video:${videoBG}`,
                        effect: "loop:4",
                    },
                    { flags: "layer_apply" },
                    {
                        overlay: voiceCloningResult
                            ? `audio:${voiceCloningResult.public_id}`
                            : "",
                    },
                    { flags: voiceCloningResult ? "layer_apply" : "" },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        start_offset: voiceCloningResult ? "2" : "0",
                        height: 250,
                        width: 200,
                        crop: "fill",
                        audio_codec: "none",
                    },
                    { radius: 40 },
                    {
                        flags: "layer_apply",
                        gravity: "south_west",
                        y: 70,
                        x: 20,
                    },
                    { flags: "layer_apply" },
                    { if: "du_lte_4" },
                    { effect: "fade:1000" },
                    { effect: "fade:-1000" },
                    { if: "else" },
                    { effect: "fade:2000" },
                    { effect: "fade:-2000" },
                    { if: "end" },
                ],
            });
        } else {
            videoUrl = cloudinary.url(event.data.og_video_public_id, {
                resource_type: "video",
                transformation: [
                    { audio_codec: "none" },
                    { effect: "blur:100" },
                    { effect: "fade:1000" },
                    {
                        overlay: voiceCloningResult
                            ? `audio:${voiceCloningResult.public_id}`
                            : "",
                    },
                    {
                        overlay: `video:${event.data.og_video_public_id}`,
                        flags: "splice",
                    }, // Layer video
                    { flags: "layer_apply" },
                    ...(voiceCloningResult
                        ? [
                              {
                                  color: "white",
                                  background: "black",
                                  overlay: {
                                      font_family: "Arial",
                                      font_size: 150,
                                      text: `${event.data.greeting} ${event.data.text}`,
                                  },
                                  flags: "text_no_trim",
                                  duration: "1",
                                  start_offset: "0",
                                  effect: "fade:500",
                              },
                              {
                                  border: "6px_solid_rgb:05405A",
                                  duration: "1",
                                  start_offset: "0",
                              },
                              { flags: "layer_apply", duration: "1" },
                          ]
                        : []),
                ],
            });
        }
        const ai_video_update = await supabase
            .from("profiles")
            .update({
                onboarding_video: videoUrl,
            })
            .eq("id", event.data.user_id);

        const { data, error } = await supabase
            .from("jobs")
            .update([
                {
                    job_details: event,
                    status: JOB_DETAILS.completed,
                },
            ])
            .eq("id", event.data.job_id)
            .single();

        if (error) {
            return {
                event: ai_video_update.error,
                body: ai_video_update.error,
            };
        }

        if (ai_video_update.error) {
            return {
                event: ai_video_update.error,
                body: ai_video_update.error,
            };
        }

        return {
            event: ai_video_update,
            body: voiceCloningResult,
        };
    },
);

export const createAIIntro = inngest.createFunction(
    { id: "ai-intro" },
    { event: "ai/intro" },
    async ({ event, step }) => {
        const voice = await makeAIVoice(
            event.data.audio,
            event.data.text,
            event.data.greeting,
            event.data.userId,
            event.data.userName,
            event.data.email,
        );

        const result = (await new Promise((resolve, reject) => {
            const dataUri = `data:audio/mp3;base64,${voice.previewData.data.audio_data}`;

            cloudinary.uploader.upload_large(
                dataUri,
                { resource_type: "video", chunk_size: 6000000 },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                },
            );
        })) as any;
        const ai_video_update = await supabase
            .from("videos")
            .update({
                ai_preview: `https://res.cloudinary.com/dhd6m0fh3/video/upload/${result.public_id}.mp3`,
                training_audio: event.data.audio,
                language: event.data.language,
            })
            .eq("id", event.data.video_id);

        const ai_profile_update = await supabase
            .from("profiles")
            .update({
                ai_voice_id: voice.voiceData.data.id,
            })
            .eq("id", event.data.userId);

        const { data, error } = await supabase
            .from("jobs")
            .update([
                {
                    job_details: event,
                    status: JOB_DETAILS.completed,
                },
            ])
            .eq("id", event.data.job_id)
            .single();
        if (error) throw error;
        if (ai_video_update.error) throw error;

        return { event: ai_video_update, body: result };
    },
);
