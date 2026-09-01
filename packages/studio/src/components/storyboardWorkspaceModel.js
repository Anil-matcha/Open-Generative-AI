export const TRANSITIONS = Object.freeze([
  { id: "cut", label: "Cut" },
  { id: "dissolve", label: "Dissolve" },
  { id: "fade", label: "Fade" },
  { id: "dip-black", label: "Dip to black" },
  { id: "match", label: "Match cut" },
  { id: "whip", label: "Whip" },
]);

export const ASPECT_RATIOS = Object.freeze(["16:9", "9:16", "1:1"]);

function sceneId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `scene-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createScene(index, source = {}) {
  return {
    id: sceneId(),
    title: `Scene ${index + 1}`,
    prompt: "",
    imageUrl: "",
    videoUrl: "",
    duration: 5,
    aspectRatio: "16:9",
    transition: "cut",
    status: "draft",
    model: null,
    error: "",
    ...source,
  };
}

export function addScene(scenes, source = {}) {
  const nextScene = createScene(scenes.length, source);
  return { scenes: [...scenes, nextScene], selectedSceneId: nextScene.id };
}

export function duplicateScene(scenes, sceneIdToCopy) {
  const sourceIndex = scenes.findIndex((scene) => scene.id === sceneIdToCopy);
  if (sourceIndex < 0) return { scenes, selectedSceneId: sceneIdToCopy };

  const source = scenes[sourceIndex];
  const sourceFields = { ...source };
  delete sourceFields.id;
  const duplicate = createScene(sourceIndex + 1, {
    ...sourceFields,
    title: `${source.title} copy`,
    status: source.imageUrl || source.videoUrl ? "ready" : "draft",
    error: "",
  });
  const nextScenes = [...scenes];
  nextScenes.splice(sourceIndex + 1, 0, duplicate);
  return { scenes: nextScenes, selectedSceneId: duplicate.id };
}

export function deleteScene(scenes, sceneIdToDelete) {
  if (scenes.length <= 1) {
    return { scenes, selectedSceneId: scenes[0]?.id || null };
  }

  const sourceIndex = scenes.findIndex((scene) => scene.id === sceneIdToDelete);
  if (sourceIndex < 0) return { scenes, selectedSceneId: scenes[0]?.id || null };
  const nextScenes = scenes.filter((scene) => scene.id !== sceneIdToDelete);
  const nextIndex = Math.min(sourceIndex, nextScenes.length - 1);
  return { scenes: nextScenes, selectedSceneId: nextScenes[nextIndex].id };
}

export function continueFromPreviousScene(scenes, sceneIdToContinue) {
  const sceneIndex = scenes.findIndex((scene) => scene.id === sceneIdToContinue);
  const previousScene = sceneIndex > 0 ? scenes[sceneIndex - 1] : null;
  if (!previousScene?.imageUrl) return { scenes, continued: false };

  return {
    continued: true,
    scenes: scenes.map((scene) => (
      scene.id === sceneIdToContinue
        ? {
            ...scene,
            imageUrl: previousScene.imageUrl,
            videoUrl: "",
            status: "draft",
            model: null,
            error: "",
          }
        : scene
    )),
  };
}

export function buildProjectMediaRequest({
  kind,
  prompt,
  aspectRatio,
  duration = 5,
  firstFrameUrl = "",
}) {
  if (!['image', 'video'].includes(kind)) {
    throw new Error("Project media kind must be image or video.");
  }

  const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const normalizedRatio = ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : "16:9";
  if (kind === "image") {
    return {
      toolId: "image",
      body: { prompt: normalizedPrompt, aspectRatio: normalizedRatio },
    };
  }

  const body = {
    prompt: normalizedPrompt,
    aspectRatio: normalizedRatio,
    duration: Math.max(3, Math.min(12, Math.round(Number(duration) || 5))),
  };
  if (typeof firstFrameUrl === "string" && firstFrameUrl.trim()) {
    body.firstFrameUrl = firstFrameUrl.trim();
  }
  return { toolId: "video", body };
}
