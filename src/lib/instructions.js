const STUDIO_INSTRUCTIONS = {
  image: {
    title: 'Image Studio',
    steps: [
      { number: 1, heading: 'Choose a model', description: 'Select from 20+ AI models in the sidebar. Each model has different strengths for portraits, landscapes, or abstract art.' },
      { number: 2, heading: 'Write your prompt', description: 'Describe what you want to create. Be specific about style, lighting, composition, and mood for better results.' },
      { number: 3, heading: 'Set parameters', description: 'Adjust aspect ratio, resolution, and other settings. Use negative prompts to exclude unwanted elements.' },
      { number: 4, heading: 'Generate and refine', description: 'Click Generate to create your image. Use the result as a starting point and iterate on your prompt for improvements.' },
    ],
    quickTips: [
      'Add "4K, detailed, professional" to improve quality',
      'Specify camera angles like "shot from below" or "bird\'s eye view"',
      'Reference art styles: "in the style of watercolor painting"',
    ],
  },
  video: {
    title: 'Video Studio',
    steps: [
      { number: 1, heading: 'Select generation mode', description: 'Choose between text-to-video or image-to-video. Image-to-video uses your photo as the first frame.' },
      { number: 2, heading: 'Upload or describe', description: 'For image-to-video, upload a clear photo. For text-to-video, write a detailed description of the scene and motion.' },
      { number: 3, heading: 'Configure output', description: 'Set resolution (480p to 1080p), duration (3-10 seconds), and aspect ratio for your video.' },
      { number: 4, heading: 'Generate video', description: 'Video generation takes 1-3 minutes. The result will appear in your library when ready.' },
    ],
    quickTips: [
      'Start with image-to-video for more predictable results',
      'Keep prompts focused on a single action or movement',
      'Use 720p for a good balance of quality and speed',
    ],
  },
  cinema: {
    title: 'Cinema Studio',
    steps: [
      { number: 1, heading: 'Upload your scene', description: 'Start with a still image that will serve as the base for your cinematic shot.' },
      { number: 2, heading: 'Select camera movement', description: 'Choose from dolly, crane, orbit, FPV drone, and other professional camera movements.' },
      { number: 3, heading: 'Choose lens and look', description: 'Pick a camera lens profile (anamorphic, 70mm, macro) and film look to set the cinematic mood.' },
      { number: 4, heading: 'Render the shot', description: 'Generate your cinematic video. Each camera + lens combination produces a unique look.' },
    ],
    quickTips: [
      'Anamorphic lenses create the classic widescreen movie look',
      'Dolly zoom creates the famous Hitchcock vertigo effect',
      'Combine FPV drone with wide-angle for immersive shots',
    ],
  },
  storyboard: {
    title: 'Storyboard Studio',
    steps: [
      { number: 1, heading: 'Define your sequence', description: 'Describe the story you want to tell across multiple frames. Each frame represents a key moment.' },
      { number: 2, heading: 'Set frame count', description: 'Choose how many frames you need (3-12). More frames create a more detailed narrative.' },
      { number: 3, heading: 'Generate frames', description: 'The AI creates each frame with visual consistency, maintaining characters and settings across the sequence.' },
    ],
    quickTips: [
      'Start with 4-6 frames for a simple scene',
      'Describe camera angles for each shot for variety',
      'Use consistent character descriptions across frames',
    ],
  },
  effects: {
    title: 'Effects Studio',
    steps: [
      { number: 1, heading: 'Upload your photo', description: 'Start with a clear, well-lit photo. Face-forward portraits work best for most effects.' },
      { number: 2, heading: 'Browse effects', description: 'Explore 350+ effects organized by category: transformations, styles, VFX, overlays, and more.' },
      { number: 3, heading: 'Apply and preview', description: 'Select an effect to see the transformation. Most effects process in under 30 seconds.' },
    ],
    quickTips: [
      'Higher resolution input photos produce better results',
      'Try multiple effects on the same photo to compare',
      'Portrait effects work best with clear face visibility',
    ],
  },
  edit: {
    title: 'Edit Studio',
    steps: [
      { number: 1, heading: 'Upload your media', description: 'Upload the image or video you want to edit. Supports JPG, PNG, WebP for images and MP4, WebM for videos.' },
      { number: 2, heading: 'Select an edit tool', description: 'Choose from: remove objects, remove background, reframe, expand canvas, inpaint, or relight.' },
      { number: 3, heading: 'Mark the edit area', description: 'For removal tools, paint over the area you want to change. For reframe, select the new crop.' },
      { number: 4, heading: 'Apply changes', description: 'The AI processes your edit and shows the result. You can undo and retry with different settings.' },
    ],
    quickTips: [
      'Use a larger brush for object removal to include surrounding context',
      'Background removal works best with clear subject-background separation',
      'Relight can dramatically change the mood of a portrait',
    ],
  },
  upscale: {
    title: 'Upscale Suite',
    steps: [
      { number: 1, heading: 'Upload your media', description: 'Upload a low-resolution or blurry image or video that you want to enhance.' },
      { number: 2, heading: 'Choose upscale method', description: 'Select from standard upscale (2x-4x), creative upscale (adds detail), or face enhancement.' },
      { number: 3, heading: 'Process and download', description: 'The AI enhances your image while preserving the original content. Download the high-res result.' },
    ],
    quickTips: [
      'Creative upscale adds AI-generated detail, best for artistic images',
      'Face enhancement specifically improves facial features and skin texture',
      'Standard upscale is most faithful to the original image',
    ],
  },
  character: {
    title: 'Character Studio',
    steps: [
      { number: 1, heading: 'Upload reference media', description: 'Upload 1-3 clear photos or video clips of the person or character you want to generate consistently.' },
      { number: 2, heading: 'Train the face model', description: 'The AI learns the facial features. This takes about a minute to process.' },
      { number: 3, heading: 'Generate new images', description: 'Write prompts to place your character in new scenes, outfits, and settings while maintaining face consistency.' },
    ],
    quickTips: [
      'Use clear, front-facing photos for the best face learning',
      'Multiple reference angles improve consistency',
      'Describe the scene but let the AI handle the face details',
    ],
  },
  commercial: {
    title: 'Commercial Studio',
    steps: [
      { number: 1, heading: 'Upload your product', description: 'Take a clean photo or video of your product against a simple background. Remove distractions.' },
      { number: 2, heading: 'Choose a scene', description: 'Select a commercial setting: studio, lifestyle, outdoor, or describe a custom scene.' },
      { number: 3, heading: 'Set the mood', description: 'Describe the lighting, angle, and atmosphere. Reference professional product photography styles.' },
      { number: 4, heading: 'Generate variations', description: 'Create multiple shots of your product in different settings for A/B testing or catalogs.' },
    ],
    quickTips: [
      'Clean product cutouts on white backgrounds work best',
      'Specify lighting: "soft studio light", "golden hour", "dramatic rim light"',
      'Generate multiple angles for a complete product showcase',
    ],
  },
  templates: {
    title: 'Templates Hub',
    steps: [
      { number: 1, heading: 'Pick a template', description: 'Browse 60+ ready-made templates by category or search by name. Each template is pre-configured for a specific creative task.' },
      { number: 2, heading: 'Fill in the details', description: 'Upload a photo or write a prompt depending on the template. Some templates combine both for the best results.' },
      { number: 3, heading: 'Choose options', description: 'Select from preset effects, styles, or camera motions. Each template offers curated options tailored to its output.' },
      { number: 4, heading: 'Generate and download', description: 'Hit Generate to create your image or video. Download the result or click Generate Again to try different inputs.' },
    ],
    quickTips: [
      'Use high-quality, well-lit photos or videos for media-based templates',
      'Video templates take 1-3 minutes to process',
      'Try the same photo across multiple templates to compare styles',
      'Filter by category to quickly find the right template for your project',
    ],
  },
  training: {
    title: 'Training Studio',
    steps: [
      { number: 1, heading: 'Upload training images', description: 'Upload 10-20 clear, high-quality images of the subject you want to train on. Use diverse angles, lighting, and backgrounds.' },
      { number: 2, heading: 'Configure training settings', description: 'Set the number of epochs (training rounds). More epochs create better results but take longer. Start with 10-15 for testing.' },
      { number: 3, heading: 'Start training', description: 'Click Train to begin the LoRA training process. This typically takes 5-15 minutes depending on image count and settings.' },
      { number: 4, heading: 'Use your trained model', description: 'Once trained, use the LoRA with text-to-image or image-to-image to generate content featuring your custom model.' },
    ],
    quickTips: [
      'Use images with consistent subject (same person, object, or style)',
      'Include a variety of angles and expressions for best results',
      'Avoid images with multiple subjects or heavy watermarks',
      'Start with lower epochs to test, then increase for final training',
    ],
  },
  'video-tools': {
    title: 'Video Tools',
    steps: [
      { number: 1, heading: 'Upload your video', description: 'Select a video file (MP4, WebM) to process. Videos should be under 30 seconds for best results.' },
      { number: 2, heading: 'Choose a tool', description: 'Select from upscaling, interpolation, stabilization, color correction, or other enhancement tools.' },
      { number: 3, heading: 'Configure options', description: 'Set output quality, resolution, and other parameters specific to your chosen tool.' },
      { number: 4, heading: 'Process and download', description: 'The AI processes your video with the selected enhancements. Download when complete.' },
    ],
    quickTips: [
      'Upscale from 480p to 720p for significant quality improvement',
      'Video stabilization works best with shaky handheld footage',
      'Frame interpolation smooths choppy footage to higher fps',
      'Higher output resolutions take longer to process',
    ],
  },
  audio: {
    title: 'Audio Studio',
    steps: [
      { number: 1, heading: 'Choose audio type', description: 'Select from text-to-speech, music generation, voice cloning, or lip sync based on your needs.' },
      { number: 2, heading: 'Input your content', description: 'For TTS: type your text with natural language. For music: describe style, mood, and instruments. For voice cloning: upload 30+ seconds of clear audio. For lip sync: provide video and audio.' },
      { number: 3, heading: 'Configure settings', description: 'Choose voice, language, speed, and style options. Set duration, quality, and voice parameters for best results.' },
      { number: 4, heading: 'Generate and download', description: 'Process takes 10-180 seconds depending on type. Download your AI-generated audio when complete.' },
    ],
    quickTips: [
      'For natural speech, use conversational language with proper punctuation and breathing pauses',
      'Music generation works best with specific genres, instruments, and mood descriptions like "upbeat pop with synth leads"',
      'Voice cloning requires clean, noise-free audio samples of 30+ seconds for best quality',
      'Higher quality settings improve results but take 2-3x longer to generate',
      'Lip sync works best with clear mouth visibility and matching audio/video lengths',
    ],
  },
  avatar: {
    title: 'Avatar Studio',
    steps: [
      { number: 1, heading: 'Upload reference media', description: 'Upload a clear photo or video clip of the person. Face-forward, well-lit photos work best for animation.' },
      { number: 2, heading: 'Choose animation type', description: 'Select lip sync (with audio), facial expressions, head movements, or full body animation options.' },
      { number: 3, heading: 'Add audio (for lip sync)', description: 'Upload or record clear audio. The AI will automatically sync lip movements to match speech patterns.' },
      { number: 4, heading: 'Generate avatar video', description: 'Process takes 1-3 minutes. Download your animated avatar video with synchronized movements.' },
    ],
    quickTips: [
      'Use high-quality, well-lit photos with neutral expressions for best animation results',
      'Lip sync works best with clear audio and unobstructed mouth visibility in the reference',
      'Multiple reference photos from different angles improve consistency and natural movement',
      'Keep audio under 30 seconds for optimal processing speed and quality',
      'For best results, match the audio language to the reference person\'s native language patterns',
    ],
  },
  chat: {
    title: 'Chat Studio',
    steps: [
      { number: 1, heading: 'Choose an LLM model', description: 'Select from available language models in the sidebar. Different models have varying capabilities and response styles.' },
      { number: 2, heading: 'Start a conversation', description: 'Type your message or prompt in the input field. Be specific about what you want to achieve with clear instructions.' },
      { number: 3, heading: 'Iterate and refine', description: 'Continue the conversation to refine outputs. Use follow-up prompts to guide the AI toward your desired result.' },
      { number: 4, heading: 'Save your work', description: 'Export conversations or copy specific responses for use in other projects.' },
    ],
    quickTips: [
      'Be specific with instructions for better results',
      'Use system prompts to set the AI\'s persona or tone',
      'Break complex tasks into multiple messages',
      'Context helps the AI understand your needs better',
    ],
  },
};

let cachedInstructions = null;

export async function getInstructions(studioId) {
  if (cachedInstructions && cachedInstructions[studioId]) {
    return cachedInstructions[studioId];
  }

  try {
    const { supabase } = await import('./supabase.js');
    const { data, error } = await supabase
      .from('instructions')
      .select('*')
      .eq('studio_id', studioId)
      .maybeSingle();

    if (!error && data) {
      if (!cachedInstructions) cachedInstructions = {};
      cachedInstructions[studioId] = {
        title: data.title,
        steps: data.steps,
        quickTips: data.quick_tips,
      };
      return cachedInstructions[studioId];
    }
  } catch (e) {
    // fall through to hardcoded
  }

  return STUDIO_INSTRUCTIONS[studioId] || null;
}

export function getInstructionsSync(studioId) {
  return STUDIO_INSTRUCTIONS[studioId] || null;
}
