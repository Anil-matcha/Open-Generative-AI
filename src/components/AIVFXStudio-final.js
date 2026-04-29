import { muapi } from '../lib/muapi.js';
import { showToast } from '../lib/loading.js';

export function AIVFXStudio() {
  // Cache bust version: 2026-04-28-07:50
  // State management
  let activeFilter = 'AI Effects';
  let showInputBar = true;
  let showChatButton = false;
  let selectedEffect = null;
  let selectedResolution = "";
  let selectedQuality = "";
  let uploadedFile = null;
  let previewUrl = null;
  let imageUrl = "";
  let dragActive = false;
  let inputText = "";
  let selectedAspect = "";
  let selectedDuration = "";
  let fileInputRef = null;
  let aiEffectsRef = null;
  let motionControlsRef = null;
  let vfxControlsRef = null;

  // Video generation state
  let status = 'idle';
  let requestId = null;
  let videoUrl = '';
  let error = '';
  let log = [];
  let showApiKeyModal = false;
  let apiKeyInput = '';
  let showVideoModal = false;
  let showImageUrlModal = false;
  let imageUrlInput = "";
  let isMountedRef = { current: true };
  let pollTimeoutRef = { current: null };
  const MAX_POLL_ATTEMPTS = 180;

  // Container setup
  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto bg-app-bg text-white';



  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  // Helper functions
  const addLog = (message) => {
    if (isMountedRef.current) {
      log = [...log, message];
    }
  };

  const isValidFile = (file) => {
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    return validTypes.includes(file.type);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && isValidFile(file)) {
      uploadedFile = file;
      previewUrl = URL.createObjectURL(file);
      updatePreview();
    } else {
      uploadedFile = null;
      previewUrl = null;
      if (file) showToast('Please upload a valid image or video file.', 'error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = true;
    updateDragState();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    updateDragState();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    updateDragState();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        uploadedFile = file;
        previewUrl = URL.createObjectURL(file);
        updatePreview();
      } else {
        uploadedFile = null;
        previewUrl = null;
        showToast('Please upload a valid image or video file.', 'error');
      }
    }
  };

  const updatePreview = () => {
    // Update preview in input bar
    const previewContainer = container.querySelector('.preview-container');
    if (previewContainer && previewUrl) {
      previewContainer.innerHTML = `
        <button class="clear-preview" style="position: absolute; top: -8px; right: -8px; background: #232b39; color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; z-index: 2; box-shadow: 0 1px 4px 0 rgba(0,0,0,0.10);">
          ×
        </button>
        <img src="${previewUrl}" alt="Preview" style="max-width: 160px; max-height: 90px; border-radius: 8px; border: 1px solid #23232b; background: #18181b;" />
      `;

      const clearBtn = previewContainer.querySelector('.clear-preview');
      clearBtn.onclick = () => {
        uploadedFile = null;
        previewUrl = null;
        imageUrl = "";
        updatePreview();
      };
    } else if (previewContainer) {
      previewContainer.innerHTML = '';
    }
  };

  const updateDragState = () => {
    const uploadArea = container.querySelector('.upload-area');
    if (uploadArea) {
      if (dragActive) {
        uploadArea.classList.add('drag-active');
      } else {
        uploadArea.classList.remove('drag-active');
      }
    }
  };

  // Effects data
  const pixverseEffects = [
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss_Me_AI.webp', name: 'Kiss Me AI' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss.webp', name: 'Kiss' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Venom.webp', name: 'Venom' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Hulk_.webp', name: 'Hulk' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Muscle_Surge.webp', name: 'Muscle Surge' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/The_Tiger_Touch.webp', name: 'The Tiger Touch' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Anything_Robot.webp', name: 'Anything, Robot' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Warmth_of_Jesus.webp', name: 'Warmth of Jesus' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Holy_Wings.webp', name: 'Holy Wings' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Microwave.webp', name: 'Microwave' },
  ];

  const motionControls = [
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/360+Orbit.webp', name: '360 Orbit', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/aaa3e820-5d94-4612-9488-0c9a1b2f5843/adapter_model.safetensors", trigger_word: "0rb4it 360 degree orbit", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Action+Run.webp', name: 'Hero Run', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/36b9edf7-31d7-47d3-ad3b-e166fb3a9842/adapter_model.safetensors", trigger_word: "4ct3ion Action Run", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Arc.webp', name: 'Arc Shot', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/a5949ee3-61ea-4a18-bd4d-54c855f5401c/adapter_model.safetensors", trigger_word: "34Ar2c arc the camera moves in a smooth curve around", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Bullet+Time.webp', name: 'Matrix Shot', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/219ad5ad-8f23-48dc-b098-b8e6d9fbe6c0/adapter_model.safetensors", trigger_word: "b4ll3t t1m3 bullet time shot", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Chasing.webp', name: 'Car Chase', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/8b36b7fe-0a0b-4849-b0ed-d9a51ff0cc85/adapter_model.safetensors", trigger_word: "c4r ch4s3 car chase", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Down.webp', name: 'Crane Down', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/f26db0b7-1c26-4587-b2b5-1cfd0c51c5b3/adapter_model.safetensors", trigger_word: "cr4n3 crane down camera motion", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Over+The+Head.webp', name: 'Crane Overhead', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/9393f8f4-abe6-4aa7-ba01-0b62e1507feb/adapter_model.safetensors", trigger_word: "cr4n3 crane over the head movement", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Up.webp', name: 'Crane Up', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/07c5e22b-7028-437c-9479-6eb9a50cf993/adapter_model.safetensors", trigger_word: "cr4n3 crane up effect", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+In.webp', name: 'Crash Zoom In', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/34a80641-4702-4c1c-91bf-c436a59c79cb/adapter_model.safetensors", trigger_word: "cr34sh crash zoom in effect", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+Out.webp', name: 'Crash Zoom Out', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/44c05ca1-422d-4cd4-8508-acadb6d0248c/adapter_model.safetensors", trigger_word: "cr34sh crash zoom out effect", input_type: "i2v" },
  ];

  const vfxControls = [
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Levitation.webp', name: 'Levitate', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/29068e70-dc05-4cfa-9b68-305d45645b00/adapter_model.safetensors", trigger_word: "lev1tate2_it0 levitate effect", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Disintegration.webp', name: 'Disintegration', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/971ea00a-f708-44ce-83cf-e54006ea1f76/adapter_model.safetensors", trigger_word: "d1s1nt34gration disintegration effect", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Flying.webp', name: 'Flying', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/5dc604ed-1e2f-44d5-9437-7f56aa6205ac/adapter_model.safetensors", trigger_word: "f1y1ng smooth gliding flight", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Explosion.webp', name: 'Car Explosion', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/efea3aa4-32e8-4523-af44-7e59d731d453/adapter_model.safetensors", trigger_word: "c3r exp356l0sion the car explodes bursting into flames and debris", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tornado.webp', name: 'Tornado', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/1907141a-c058-47d4-837e-078983a6f710/adapter_model.safetensors", trigger_word: "t0r54d0 realistic tornado", input_type: "t2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Electricity.webp', name: 'Electricity', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/9aad6061-a858-43df-8202-b44f036e04c2/adapter_model.safetensors", trigger_word: "e13c7r1c electricity effect", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Huge+Explosion.webp', name: 'Huge Explosion', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/dcdb7020-02b4-42cb-b623-16902db65e90/adapter_model.safetensors", trigger_word: "3xp105ion huge explosion", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Decay+Time-Lapse.webp', name: 'Decay Time-Lapse', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/6b6f64dc-ac14-44b2-b91c-a510cb7f7f32/adapter_model.safetensors", trigger_word: "d3c4y decay time-lapse begins", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tsunami.webp', name: 'Tsunami', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/64e58850-45cb-43e0-864b-3a3bc259afa7/adapter_model.safetensors", trigger_word: "t5un@m1 realistic tsunami", input_type: "t2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Fire.webp', name: 'Fire', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/c45274ad-bc5d-41f2-acac-64b8cb8c3bf1/adapter_model.safetensors", trigger_word: "[r3al_f1re]", input_type: "t2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Robotic+Face+Reveal.webp', name: 'Robotic Face Reveal', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/5e4b881d-6a1e-4cc7-b827-20b382248d41/adapter_model.safetensors", trigger_word: "r8b8t1c robotic face reveal", input_type: "i2v" },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Building+Explosion.webp', name: 'Building Explosion', path: "https://d3adwkbyhxyrtq.cloudfront.net/loratensors/77a2daa2-c255-4ea8-9581-594853a6d96e/adapter_model.safetensors", trigger_word: "b32ldi4ng exp39lsion the building explodes in a massive blast", input_type: "i2v" },
  ];

  // Additional effects from utility.js - AI Effects
  const additionalAIEffects = [
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/ai_animal.webp', name: 'AI Baby Animals' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/ai_hug.webp', name: 'AI Hug' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/catwalk-effect.webp', name: 'AI Baby Catwalk' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/cooking-effect.webp', name: 'AI Cooking Animal' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/dancing-illusion-effect.webp', name: 'AI Dancing Illusion' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/giant-sea-animal-effect.webp', name: 'AI Giant Sea Animal' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/miniature-fantasy-scene.webp', name: 'Miniature Scenes' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/POV-Niche.webp', name: 'POV-Niche' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/pov-history.webp', name: 'POV-History' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/country-animal.webp', name: 'Country Animal' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/country-human-with-beast.webp', name: 'Country Human Beast' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/country-towering.webp', name: 'Country Towering Giant' },
  ];

  // Pika Effects (additional VFX)
  const pikaEffects = [
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Explode.webp', name: 'Explode' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Eye-pop.webp', name: 'Eye-pop' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Melt.webp', name: 'Melt' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Dissolve.webp', name: 'Dissolve' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Poke.webp', name: 'Poke' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Ta-da.webp', name: 'Ta-da' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Crumble.webp', name: 'Crumble' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Peel.webp', name: 'Peel' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Tear.webp', name: 'Tear' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Decapitate.webp', name: 'Decapitate' },
  ];

  // April Fools Prank Effects
  const prankEffects = [
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Animal+Head.png', name: 'Animal Head' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Big+Ears.png', name: 'Big Ears' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Big+Nose.png', name: 'Big Nose' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Black+Hole+Face.png', name: 'Black Hole Face' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Bobblehead.png', name: 'Bobblehead' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Clown+Nose.png', name: 'Clown Nose' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Clown+Outfit.png', name: 'Clown Outfit' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Crazy+Hair.png', name: 'Crazy Hair' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Creepy+Photobomb.png', name: 'Creepy Photobomb' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Crossed+Eyes.png', name: 'Crossed Eyes' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Deal+With+It.png', name: 'Deal With It' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Dirty+Teeth.png', name: 'Dirty Teeth' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Energy+Drink.png', name: 'Energy Drink' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Extra+Head.png', name: 'Extra Head' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Fake+News.png', name: 'Fake News' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Frizzy+Hair.png', name: 'Frizzy Hair' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Fruit+Head.png', name: 'Fruit Head' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Giant+Baby.png', name: 'Giant Baby' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Glitch+Face.png', name: 'Glitch Face' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Green+Skin.png', name: 'Green Skin' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Invisible+Food.png', name: 'Invisible Food' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Jell-O+Body.png', name: 'Jell-O Body' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Meme+Face.png', name: 'Meme Face' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Messy+Hair.png', name: 'Messy Hair' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Mirror+Glitch.png', name: 'Mirror Glitch' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Mixed-Up+Face.png', name: 'Mixed-Up Face' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Noodle+Hair.png', name: 'Noodle Hair' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Old+Cyborg.png', name: 'Old Cyborg' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Oversized+Bowtie.png', name: 'Oversized Bowtie' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Shocked+Face.png', name: 'Shocked Face' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Sleep+Deprived.png', name: 'Sleep Deprived' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Space+Suit.png', name: 'Space Suit' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Steam+Ears.png', name: 'Steam Ears' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Superhero+Cape.png', name: 'Superhero Cape' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Thick+Glasses.png', name: 'Thick Glasses' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Third+Eye.png', name: 'Third Eye' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Tiny+Mustache.png', name: 'Tiny Mustache' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Trapped+in+TV.png', name: 'Trapped in Tv' },
    { image: 'https://d3adwkbyhxyrtq.cloudfront.net/prankeffects/Ugly+Sweater.png', name: 'Ugly Sweater' },
  ];

  // Video generation functions
  const pollForResult = async (reqId, userApiKey) => {
    const pollHeaders = { 'x-api-key': userApiKey };
    const pollUrl = `${muapi.proxyUrl}?id=${reqId}`;
    const start = Date.now();
    let tries = 0;
    const poll = async () => {
      if (!isMountedRef.current) return;
      tries++;
      addLog(`Polling attempt #${tries}...`);
      try {
        const res = await fetch(pollUrl, { headers: pollHeaders });
        if (!res.ok) {
          throw new Error(`Poll error: ${res.status}`);
        }
        const data = await res.json();
        if (!data.status) {
          throw new Error('Invalid response: missing status');
        }
        const taskStatus = data.status;
        if (taskStatus === 'completed') {
          addLog('Completed response: ' + JSON.stringify(data));
          let videoUrlResult = data.video?.url;
          if (!videoUrlResult && data.output && typeof data.output === 'string') {
            videoUrlResult = data.output;
          }
          if (videoUrlResult) {
            if (isMountedRef.current) {
              status = 'completed';
              videoUrl = videoUrlResult;
              addLog(`Task completed in ${((Date.now()-start)/1000).toFixed(1)}s. Video URL: ${videoUrlResult}`);
              updateVideoModal();
            }
            return;
          } else {
            addLog('Completed but video URL missing.');
            status = 'failed';
            error = 'Video generation failed: No video URL received. Would you like to retry?';
            updateVideoModal();
            return;
          }
        } else if (taskStatus === 'failed') {
          if (isMountedRef.current) {
            status = 'failed';
            const errorMsg = data.error || 'Task failed';
            error = errorMsg;
            addLog(`Task failed: ${errorMsg}`);
            updateVideoModal();
          }
          return;
        } else {
          addLog(`Status: ${taskStatus}`);
        }
        if (tries < MAX_POLL_ATTEMPTS && isMountedRef.current) {
          pollTimeoutRef.current = setTimeout(poll, 1000);
        } else if (tries >= MAX_POLL_ATTEMPTS && isMountedRef.current) {
          status = 'timeout';
          error = 'Polling timeout: Maximum attempts reached';
          addLog('Polling timeout: Maximum attempts reached');
          updateVideoModal();
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (isMountedRef.current) {
          error = err.message;
          status = 'error';
          addLog(`Polling error: ${err.message}`);
          updateVideoModal();
        }
      }
    };
    poll();
  };

  const startGenerationWithKey = async (userApiKey) => {
    function getMuApiSize(aspect, resolution) {
      if (typeof aspect === 'string') {
        aspect = aspect.trim();
      } else {
        aspect = '16:9';
      }
      if (aspect === '16:9') return '832*480';
      if (aspect === '9:16') return '480*832';
      return '832*480';
    }

    let size = getMuApiSize(selectedAspect, selectedResolution);
    if (size !== '832*480' && size !== '480*832') {
      size = '832*480';
    }

    const videoPayload = {
      prompt: inputText,
      name: selectedEffect?.name,
      aspect_ratio: selectedAspect,
      size,
      quality: selectedQuality,
      duration: parseInt(selectedDuration),
    };

    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
      error = 'Please provide a valid image URL using the image button.';
      updateVideoModal();
      return;
    }
    videoPayload.image_url = imageUrl;

    if (!userApiKey.trim()) {
      error = 'API key is required';
      updateVideoModal();
      return;
    }

    status = 'submitting';
    log = [`Submitting task to MuApi...`];
    error = '';
    videoUrl = '';
    requestId = null;
    updateVideoModal();

    try {
      addLog('Payload being sent: ' + JSON.stringify(videoPayload, null, 2));

      // Use the main app's muapi client instead of direct fetch
      const result = await muapi.generateVideoEffect(videoPayload);
      addLog('API response: ' + JSON.stringify(result));

      if (result.url) {
        status = 'completed';
        videoUrl = result.url;
        addLog(`Task completed. Video URL: ${result.url}`);
        updateVideoModal();
      } else {
        throw new Error('No video URL in response');
      }
    } catch (err) {
      console.error('Generation error:', err);
      error = err.message;
      status = 'error';
      addLog(`Error: ${err.message}`);
      updateVideoModal();
    }
  };

  const updateVideoModal = () => {
    const modal = container.querySelector('.video-modal');
    if (!modal) return;

    if (status === 'idle') {
      modal.style.display = 'none';
      return;
    }

    modal.style.display = 'flex';

    const modalContent = modal.querySelector('.modal-content');
    if ((status === 'submitting' || status === 'polling') && modalContent) {
      modalContent.innerHTML = `
        <button class="close-modal" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
        <div style="font-weight: 600; font-size: 18px; margin-bottom: 8px; text-align: center;">
          ⏳ Generating your video...
        </div>
        <div style="width: 320px; max-width: 90vw; height: 8px; background: #18181b; border-radius: 8px; margin: 0 auto; overflow: hidden;">
          <div class="loading-bar" style="width: 100%; height: 100%; background: linear-gradient(90deg,#60a5fa 0%,#3b82f6 100%); animation: loadingBarAnim 1.2s linear infinite;"></div>
        </div>
        <style>@keyframes loadingBarAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }</style>
      `;

      const closeBtn = modalContent.querySelector('.close-modal');
      closeBtn.onclick = () => {
        status = 'idle';
        error = '';
        log = [];
        videoUrl = '';
        requestId = null;
        updateVideoModal();
      };
    } else if (status === 'completed' && videoUrl && modalContent) {
      modalContent.innerHTML = `
        <button class="close-modal" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
        <div style="font-weight: 600; font-size: 18px; margin-bottom: 8px; text-align: center;">
          🎉 Your video is ready!
        </div>
        <video src="${videoUrl}" controls style="max-width: 400px; max-height: 300px; border-radius: 10px; margin-bottom: 12px; background: #000;"></video>
        <div style="display: flex; gap: 16px; margin-top: 8px;">
          <a href="${videoUrl}" download target="_blank" rel="noopener noreferrer" style="padding: 8px 18px; border-radius: 8px; background: #3b82f6; color: #fff; border: none; font-weight: 600; font-size: 15px; text-decoration: none; cursor: pointer;">Download</a>
          <button class="close-btn" style="padding: 8px 18px; border-radius: 8px; background: #232b39; color: #fff; border: 1px solid #444; font-weight: 500; font-size: 15px; cursor: pointer;">Close</button>
        </div>
      `;

      const closeBtn = modalContent.querySelector('.close-modal');
      const closeBtn2 = modalContent.querySelector('.close-btn');
      const closeHandler = () => {
        status = 'idle';
        error = '';
        log = [];
        videoUrl = '';
        requestId = null;
        inputText = '';
        imageUrl = '';
        uploadedFile = null;
        previewUrl = null;
        selectedEffect = null;
        updateVideoModal();
        updatePreview();
      };
      closeBtn.onclick = closeHandler;
      closeBtn2.onclick = closeHandler;
    } else if ((status === 'error' || status === 'failed') && error && modalContent) {
      modalContent.innerHTML = `
        <button class="close-modal" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
        <div style="color: #f87171; margin-top: 12px; text-align: center;">
          <b>Error:</b> ${error}
        </div>
        ${error.includes('retry') ? `
          <div style="margin: 16px 0;">
            <button class="retry-btn" style="padding: 10px 28px; border-radius: 8px; background: #f87171; color: #fff; border: none; font-weight: 600; font-size: 16px; cursor: pointer;">
              Retry Generation
            </button>
          </div>
        ` : ''}
        ${requestId ? `<div style="margin: 10px 0;"><b>Request ID:</b> ${requestId}</div>` : ''}
      `;

      const closeBtn = modalContent.querySelector('.close-modal');
      closeBtn.onclick = () => {
        status = 'idle';
        error = '';
        log = [];
        videoUrl = '';
        requestId = null;
        updateVideoModal();
      };

      const retryBtn = modalContent.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.onclick = () => {
          error = '';
          status = 'idle';
          log = [];
          videoUrl = '';
          requestId = null;
          showApiKeyModal = true;
          updateApiKeyModal();
          updateVideoModal();
        };
      }
    }
  };

  const updateApiKeyModal = () => {
    const modal = container.querySelector('.api-key-modal');
    if (!modal) return;

    if (showApiKeyModal) {
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  };

  // Build the UI
  const heroSection = document.createElement('div');
  heroSection.className = 'mb-10 animate-fade-in-up';
  heroSection.innerHTML = `
    <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">AI-VFX Studio</h1>
    <p class="text-secondary text-sm md:text-base max-w-xl">Apply AI-powered visual effects and transformations to your videos and images with 85+ cinematic effects.</p>
  `;
  inner.appendChild(heroSection);

  // Filter Tabs
  const filters = [
    { name: "AI Effects", icon: "⭐" },
    { name: "Motion Controls", icon: "🎬" },
    { name: "VFX", icon: "⭐" },
    { name: "Pika Effects", icon: "⚡" },
    { name: "April Fools", icon: "🎭" }
  ];

  const filterContainer = document.createElement('div');
  filterContainer.className = 'flex items-center gap-2 px-4 md:px-8 pb-4 border-b border-white/5 overflow-x-auto';
  filters.forEach(filter => {
    const button = document.createElement('button');
    button.className = `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      activeFilter === filter.name
        ? 'bg-primary text-white border border-primary'
        : 'bg-white/5 text-secondary hover:bg-white/10 border border-white/10'
    }`;
    button.innerHTML = `
      <span>${filter.icon}</span>
      <span>${filter.name}</span>
    `;
    button.onclick = () => {
      activeFilter = filter.name;
      // Scroll to section
      if (activeFilter === 'AI Effects' && aiEffectsRef) {
        aiEffectsRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeFilter === 'Motion Controls' && motionControlsRef) {
        motionControlsRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeFilter === 'VFX' && vfxControlsRef) {
        vfxControlsRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeFilter === 'Pika Effects' && pikaEffectsSection) {
        pikaEffectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeFilter === 'April Fools' && prankEffectsSection) {
        prankEffectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Update button styles
      filterContainer.querySelectorAll('button').forEach(btn => {
        btn.className = btn.className.replace('bg-primary text-white border-primary', 'bg-white/5 text-secondary hover:bg-white/10 border-white/10');
      });
      button.className = button.className.replace('bg-white/5 text-secondary hover:bg-white/10 border-white/10', 'bg-primary text-white border-primary');
    };
    filterContainer.appendChild(button);
  });
  inner.appendChild(filterContainer);

  // AI Effects Grid
  const aiEffectsSection = document.createElement('div');
  aiEffectsSection.className = 'px-4 md:px-8 py-6';
  aiEffectsRef = aiEffectsSection;
  aiEffectsSection.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <span class="text-lg">⭐</span>
      <h2 class="text-xl font-bold text-white">AI Effects</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl">
      ${pixverseEffects.map(effect => `
        <div class="effect-card cursor-pointer bg-panel-bg rounded-xl overflow-hidden border transition-all hover:border-primary/50 ${
          selectedEffect && selectedEffect.name === effect.name ? 'border-primary bg-primary/10' : 'border-white/5'
        }" data-effect='${JSON.stringify(effect).replace(/'/g, "&apos;")}'>
          <div class="aspect-square bg-panel-bg relative overflow-hidden">
            <img src="${effect.effect}" alt="${effect.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
            </div>
          </div>
          <p class="text-sm text-white text-center py-3 px-2 font-medium">${effect.name}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers for AI effects
  aiEffectsSection.querySelectorAll('.effect-card').forEach(card => {
    card.onclick = () => {
      const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
      selectedEffect = effectData;
      // Update selection styling
      aiEffectsSection.querySelectorAll('.effect-card').forEach(c => {
        c.className = c.className.replace('border-primary bg-primary/10', 'border-white/5');
      });
      card.className = card.className.replace('border-white/5', 'border-primary bg-primary/10');
      updateSelectedEffect();
    };
  });
  inner.appendChild(aiEffectsSection);

  // Motion Controls Grid
  const motionControlsSection = document.createElement('div');
  motionControlsSection.className = 'px-4 md:px-8 py-6';
  motionControlsRef = motionControlsSection;
  motionControlsSection.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <span class="text-lg">🎬</span>
      <h2 class="text-xl font-bold text-white">Motion Controls</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl">
      ${motionControls.map(control => `
        <div class="effect-card cursor-pointer bg-panel-bg rounded-xl overflow-hidden border transition-all hover:border-primary/50 ${
          selectedEffect && selectedEffect.name === control.name ? 'border-primary bg-primary/10' : 'border-white/5'
        }" data-effect='${JSON.stringify(control).replace(/'/g, "&apos;")}'>
          <div class="aspect-square bg-panel-bg relative overflow-hidden">
            <img src="${control.url}" alt="${control.name}" class="w-full h-full object-cover" />
          </div>
          <p class="text-sm text-white text-center py-3 px-2 font-medium">${control.name}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers for motion controls
  motionControlsSection.querySelectorAll('.effect-card').forEach(card => {
    card.onclick = () => {
      const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
      selectedEffect = effectData;
      // Update selection styling
      motionControlsSection.querySelectorAll('.effect-card').forEach(c => {
        c.className = c.className.replace('border-primary bg-primary/10', 'border-white/5');
      });
      card.className = card.className.replace('border-white/5', 'border-primary bg-primary/10');
      updateSelectedEffect();
    };
  });
  inner.appendChild(motionControlsSection);

  // VFX Controls Grid
  const vfxControlsSection = document.createElement('div');
  vfxControlsSection.className = 'px-4 md:px-8 py-6';
  vfxControlsRef = vfxControlsSection;
  vfxControlsSection.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <span class="text-lg">⭐</span>
      <h2 class="text-xl font-bold text-white">VFX Controls</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl">
      ${vfxControls.map(vfx => `
        <div class="effect-card cursor-pointer bg-panel-bg rounded-xl overflow-hidden border transition-all hover:border-primary/50 ${
          selectedEffect && selectedEffect.name === vfx.name ? 'border-primary bg-primary/10' : 'border-white/5'
        }" data-effect='${JSON.stringify(vfx).replace(/'/g, "&apos;")}'>
          <div class="aspect-square bg-panel-bg relative overflow-hidden">
            <img src="${vfx.url}" alt="${vfx.name}" class="w-full h-full object-cover" />
          </div>
          <p class="text-sm text-white text-center py-3 px-2 font-medium">${vfx.name}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers for VFX controls
  vfxControlsSection.querySelectorAll('.effect-card').forEach(card => {
    card.onclick = () => {
      const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
      selectedEffect = effectData;
      // Update selection styling
      vfxControlsSection.querySelectorAll('.effect-card').forEach(c => {
        c.className = c.className.replace('border-primary bg-primary/10', 'border-white/5');
      });
      card.className = card.className.replace('border-white/5', 'border-primary bg-primary/10');
      updateSelectedEffect();
    };
  });
  inner.appendChild(vfxControlsSection);

  // Pika Effects Grid
  const pikaEffectsSection = document.createElement('div');
  pikaEffectsSection.className = 'px-4 md:px-8 py-6';
  pikaEffectsSection.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <span class="text-lg">⚡</span>
      <h2 class="text-xl font-bold text-white">Pika Effects</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl">
      ${pikaEffects.map(effect => `
        <div class="effect-card cursor-pointer bg-panel-bg rounded-xl overflow-hidden border transition-all hover:border-primary/50 ${
          selectedEffect && selectedEffect.name === effect.name ? 'border-primary bg-primary/10' : 'border-white/5'
        }" data-effect='${JSON.stringify(effect).replace(/'/g, "&apos;")}'>
          <div class="aspect-square bg-panel-bg relative overflow-hidden">
            <img src="${effect.effect}" alt="${effect.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
            </div>
          </div>
          <p class="text-sm text-white text-center py-3 px-2 font-medium">${effect.name}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers for Pika effects
  pikaEffectsSection.querySelectorAll('.effect-card').forEach(card => {
    card.onclick = () => {
      const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
      selectedEffect = effectData;
      // Update selection styling
      pikaEffectsSection.querySelectorAll('.effect-card').forEach(c => {
        c.className = c.className.replace('border-primary bg-primary/10', 'border-white/5');
      });
      card.className = card.className.replace('border-white/5', 'border-primary bg-primary/10');
      updateSelectedEffect();
    };
  });
  inner.appendChild(pikaEffectsSection);

  // April Fools Prank Effects Grid
  const prankEffectsSection = document.createElement('div');
  prankEffectsSection.className = 'px-4 md:px-8 py-6';
  prankEffectsSection.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <span class="text-lg">🎭</span>
      <h2 class="text-xl font-bold text-white">April Fools Pranks</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl">
      ${prankEffects.map(effect => `
        <div class="effect-card cursor-pointer bg-panel-bg rounded-xl overflow-hidden border transition-all hover:border-primary/50 ${
          selectedEffect && selectedEffect.name === effect.name ? 'border-primary bg-primary/10' : 'border-white/5'
        }" data-effect='${JSON.stringify(effect).replace(/'/g, "&apos;")}'>
          <div class="aspect-square bg-panel-bg relative overflow-hidden">
            <img src="${effect.image}" alt="${effect.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
            </div>
          </div>
          <p class="text-sm text-white text-center py-3 px-2 font-medium">${effect.name}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers for Prank effects
  prankEffectsSection.querySelectorAll('.effect-card').forEach(card => {
    card.onclick = () => {
      const effectData = JSON.parse(card.dataset.effect.replace(/&apos;/g, "'"));
      selectedEffect = effectData;
      // Update selection styling
      prankEffectsSection.querySelectorAll('.effect-card').forEach(c => {
        c.className = c.className.replace('border-primary bg-primary/10', 'border-white/5');
      });
      card.className = card.className.replace('border-white/5', 'border-primary bg-primary/10');
      updateSelectedEffect();
    };
  });
  inner.appendChild(prankEffectsSection);

  // Bottom Input Bar
  const inputBar = document.createElement('div');
  inputBar.className = 'fixed bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl z-20';
  inputBar.style.display = showInputBar ? 'block' : 'none';
  inputBar.innerHTML = `
    <div class="bg-panel-bg/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 mx-4">
      <!-- Close button -->
      <button class="close-input-bar absolute top-4 right-4 text-secondary hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
        ×
      </button>

      <!-- Image URL button -->
      <div class="flex items-center gap-3 mb-4">
        <button class="image-url-btn flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Image URL
        </button>
      </div>

      <!-- Input field -->
      <div class="flex items-center bg-panel-bg/50 rounded-xl p-4 mb-4 border border-white/5">
        <input type="text" placeholder="Enter your prompt here" class="flex-1 bg-transparent text-white placeholder-secondary outline-none text-sm" value="${inputText}" />
        <button class="generate-btn bg-primary hover:bg-primary/80 text-white rounded-full p-3 ml-3 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="transform rotate-90">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>

      <!-- Settings row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="setting-group">
          <label class="text-xs text-secondary mb-1 block">Aspect Ratio</label>
          <select class="aspect-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary">
            <option value="16:9" ${selectedAspect === '16:9' ? 'selected' : ''}>16:9</option>
            <option value="9:16" ${selectedAspect === '9:16' ? 'selected' : ''}>9:16</option>
            <option value="1:1" ${selectedAspect === '1:1' ? 'selected' : ''}>1:1</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="text-xs text-secondary mb-1 block">Duration</label>
          <select class="duration-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary">
            <option value="5s" ${selectedDuration === '5s' ? 'selected' : ''}>5s</option>
            <option value="10s" ${selectedDuration === '10s' ? 'selected' : ''}>10s</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="text-xs text-secondary mb-1 block">Resolution</label>
          <select class="resolution-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary">
            <option value="480p" ${selectedResolution === '480p' ? 'selected' : ''}>480p</option>
            <option value="720p" ${selectedResolution === '720p' ? 'selected' : ''}>720p</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="text-xs text-secondary mb-1 block">Quality</label>
          <select class="quality-select w-full bg-panel-bg border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary">
            <option value="medium" ${selectedQuality === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${selectedQuality === 'high' ? 'selected' : ''}>High</option>
          </select>
        </div>
      </div>

      <!-- Selected effect display -->
      <div class="selected-effect-display"></div>

      <!-- Preview container -->
      <div class="preview-container mt-4"></div>
    </div>
  `;

  // Input bar event handlers
  const closeBtn = inputBar.querySelector('.close-input-bar');
  closeBtn.onclick = () => {
    showInputBar = false;
    inputBar.style.display = 'none';
  };

  const imageUrlBtn = inputBar.querySelector('.image-url-btn');
  imageUrlBtn.onclick = () => {
    const url = prompt('Enter image URL:');
    if (url && /^https?:\/\//.test(url)) {
      imageUrl = url;
      updatePreview();
    } else if (url) {
      showToast('Please enter a valid image URL (http/https)', 'error');
    }
  };

  const inputField = inputBar.querySelector('input[type="text"]');
  inputField.oninput = (e) => {
    inputText = e.target.value;
  };

  const generateBtn = inputBar.querySelector('.generate-btn');
  generateBtn.onclick = () => {
    if (!selectedEffect) {
      showToast('Please select an effect first', 'error');
      return;
    }
    if (!imageUrl && !inputText.trim()) {
      showToast('Please provide an image URL or prompt', 'error');
      return;
    }
    showApiKeyModal = true;
    updateApiKeyModal();
  };

  // Settings selects
  const aspectSelect = inputBar.querySelector('.aspect-select');
  aspectSelect.onchange = (e) => { selectedAspect = e.target.value; };

  const durationSelect = inputBar.querySelector('.duration-select');
  durationSelect.onchange = (e) => { selectedDuration = e.target.value; };

  const resolutionSelect = inputBar.querySelector('.resolution-select');
  resolutionSelect.onchange = (e) => { selectedResolution = e.target.value; };

  const qualitySelect = inputBar.querySelector('.quality-select');
  qualitySelect.onchange = (e) => { selectedQuality = e.target.value; };

  // Set initial values
  if (!selectedAspect) selectedAspect = '9:16';
  if (!selectedDuration) selectedDuration = '5s';
  if (!selectedResolution) selectedResolution = '480p';
  if (!selectedQuality) selectedQuality = 'medium';

  aspectSelect.value = selectedAspect;
  durationSelect.value = selectedDuration;
  resolutionSelect.value = selectedResolution;
  qualitySelect.value = selectedQuality;

  const updateSelectedEffect = () => {
    const display = inputBar.querySelector('.selected-effect-display');
    if (selectedEffect) {
      display.innerHTML = `
        <div class="flex items-center gap-3 bg-primary/10 rounded-lg p-3 mt-4">
          <img src="${selectedEffect.effect || selectedEffect.url}" alt="${selectedEffect.name}" class="w-10 h-10 rounded-lg object-cover border border-white/10" />
          <div class="flex-1">
            <p class="text-white font-medium text-sm">${selectedEffect.name}</p>
          </div>
          <button class="clear-effect text-secondary hover:text-white text-lg w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">
            ×
          </button>
        </div>
      `;
      const clearBtn = display.querySelector('.clear-effect');
      clearBtn.onclick = () => {
        selectedEffect = null;
        display.innerHTML = '';
        // Clear selection styling
        [aiEffectsSection, motionControlsSection, vfxControlsSection, pikaEffectsSection, prankEffectsSection].forEach(section => {
          section.querySelectorAll('.effect-card').forEach(card => {
            card.className = card.className.replace('border-primary bg-primary/10', 'border-white/5');
          });
        });
      };
    } else {
      display.innerHTML = '';
    }
  };

  inner.appendChild(inputBar);

  // Floating chat button
  const chatButton = document.createElement('button');
  chatButton.className = 'fixed bottom-20 right-6 z-30 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all';
  chatButton.style.display = showInputBar ? 'none' : 'flex';
  chatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `;
  chatButton.onclick = () => {
    showInputBar = true;
    inputBar.style.display = 'block';
    chatButton.style.display = 'none';
  };
  inner.appendChild(chatButton);

  // Video generation modal
  const videoModal = document.createElement('div');
  videoModal.className = 'video-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  videoModal.style.display = 'none';
  videoModal.innerHTML = `
    <div class="modal-content bg-panel-bg rounded-xl p-6 max-w-md w-full mx-4"></div>
  `;
  inner.appendChild(videoModal);

  // API Key modal
  const apiKeyModal = document.createElement('div');
  apiKeyModal.className = 'api-key-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  apiKeyModal.style.display = 'none';
  apiKeyModal.innerHTML = `
    <div class="bg-panel-bg rounded-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold text-white mb-4">Enter your MuApi API Key</h3>
      <p class="text-secondary text-sm mb-4">
        Don't have an API key? <a href="https://muapi.ai/" target="_blank" class="text-primary hover:underline">Get it from muapi.ai</a>
      </p>
      <input type="password" class="api-key-input w-full bg-panel-bg/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-secondary outline-none focus:border-primary mb-4" placeholder="API Key" />
      <div class="flex gap-3">
        <button class="cancel-api-key flex-1 bg-panel-bg/50 hover:bg-white/10 text-secondary py-2 px-4 rounded-lg transition-colors">Cancel</button>
        <button class="continue-api-key flex-1 bg-primary hover:bg-primary/80 text-white py-2 px-4 rounded-lg transition-colors">Continue</button>
      </div>
    </div>
  `;

  const apiKeyInputField = apiKeyModal.querySelector('.api-key-input');
  const cancelApiKeyBtn = apiKeyModal.querySelector('.cancel-api-key');
  const continueApiKeyBtn = apiKeyModal.querySelector('.continue-api-key');

  cancelApiKeyBtn.onclick = () => {
    showApiKeyModal = false;
    apiKeyInput = '';
    updateApiKeyModal();
  };

  continueApiKeyBtn.onclick = () => {
    apiKeyInput = apiKeyInputField.value.trim();
    if (apiKeyInput) {
      showApiKeyModal = false;
      startGenerationWithKey(apiKeyInput);
      updateApiKeyModal();
    }
  };

  inner.appendChild(apiKeyModal);

  container.appendChild(inner);

  // Initialize
  updatePreview();
  updateSelectedEffect();

  // Cleanup on unmount
  const cleanup = () => {
    isMountedRef.current = false;
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
  };

  // Return container with cleanup method
  container.cleanup = cleanup;
  return container;
}