/**
 * Video Processing Helpers
 *
 * Functions for extracting frames and audio from videos using ffmpeg.
 * These run server-side in the edge function environment.
 *
 * Note: Deno edge functions don't have ffmpeg built-in. In production,
 * you would either:
 * 1. Use a separate processing service with ffmpeg installed
 * 2. Use a cloud video processing API
 * 3. Process frames client-side in the browser
 *
 * For now, these functions provide the interface and fallback behavior.
 */

export interface VideoFrame {
  frameNumber: number;
  timestamp: number; // seconds
  base64: string;
}

export interface ExtractionResult {
  frames: VideoFrame[];
  audioBuffer: Uint8Array | null;
  audioFormat: string;
  duration: number;
  width: number;
  height: number;
}

/**
 * Download a video from a URL and return it as a Uint8Array.
 */
export async function downloadVideo(videoUrl: string): Promise<Uint8Array> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Extract metadata from a video URL using a HEAD request and basic parsing.
 * Returns duration, width, height if available.
 */
export async function getVideoMetadata(videoUrl: string): Promise<{
  duration: number;
  width: number;
  height: number;
  contentType: string;
  size: number;
}> {
  try {
    const response = await fetch(videoUrl, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "video/mp4";
    const size = parseInt(response.headers.get("content-length") || "0");
    return {
      duration: 0, // Would need ffprobe for actual duration
      width: 0,
      height: 0,
      contentType,
      size,
    };
  } catch {
    return {
      duration: 0,
      width: 0,
      height: 0,
      contentType: "video/mp4",
      size: 0,
    };
  }
}

/**
 * Extract frames from a video at a given FPS.
 *
 * In a real implementation, this would use ffmpeg.wasm (WebAssembly)
 * running in the edge function, or call an external processing service.
 *
 * For browser-based processing, frames can be extracted using the
 * HTML5 Video element and Canvas API.
 *
 * This function provides the interface; actual frame extraction
 * should be done client-side or via a dedicated processing service.
 */
export async function extractFramesFromVideo(
  videoData: Uint8Array,
  fps: number = 1,
  maxFrames: number = 100,
): Promise<VideoFrame[]> {
  // In a production environment, you would:
  // 1. Use ffmpeg.wasm to extract frames from the video data
  // 2. Or call an external video processing API
  // 3. Or process client-side in the browser
  //
  // For now, return empty array as a placeholder.
  // The actual implementation depends on your infrastructure.
  console.warn(
    "Frame extraction requires ffmpeg.wasm or external processing service. " +
    "Consider processing frames client-side using HTML5 Video + Canvas.",
  );
  return [];
}

/**
 * Extract audio from a video.
 *
 * In a real implementation, this would use ffmpeg to extract the audio track.
 */
export async function extractAudioFromVideo(
  videoData: Uint8Array,
  format: string = "mp3",
): Promise<Uint8Array> {
  // In a production environment, use ffmpeg to extract audio
  console.warn(
    "Audio extraction requires ffmpeg. " +
    "Consider using a dedicated video processing service.",
  );
  return new Uint8Array(0);
}

/**
 * Client-side frame extraction helper (for documentation).
 *
 * This shows how frames should be extracted in the browser
 * before sending to the edge function.
 */
export const clientSideFrameExtractionExample = `
// Browser-side frame extraction using HTML5 Video + Canvas
async function extractFramesFromVideo(videoUrl, fps = 1, maxFrames = 100) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    
    const frames = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const interval = 1 / fps;
      let currentTime = 0;
      
      video.addEventListener('seeked', () => {
        if (frames.length >= maxFrames || currentTime >= duration) {
          resolve(frames);
          return;
        }
        
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        frames.push({
          frameNumber: frames.length,
          timestamp: Math.round(currentTime * 100) / 100,
          base64
        });
        
        currentTime += interval;
        video.currentTime = currentTime;
      });
      
      video.currentTime = 0;
    });
    
    video.addEventListener('error', reject);
    video.load();
  });
}
`;

/**
 * Client-side audio extraction helper (for documentation).
 */
export const clientSideAudioExtractionExample = `
// Browser-side audio extraction using Web Audio API
async function extractAudioFromVideo(videoUrl) {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = videoUrl;
  video.muted = false;
  
  return new Promise((resolve, reject) => {
    video.addEventListener('loadedmetadata', async () => {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);
      
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm'
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      };
      
      mediaRecorder.start();
      video.play();
      
      video.addEventListener('ended', () => {
        mediaRecorder.stop();
      });
    });
    
    video.addEventListener('error', reject);
    video.load();
  });
}
`;
