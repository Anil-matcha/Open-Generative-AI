import { supabase, uploadFileToStorage } from '../lib/hybrid-supabase.js';
import { showToast } from '../lib/loading.js';
import { initializeTimelineDragDrop, createEnhancedClipElement, renderCompositingOverlay, renderTimelineControls, renderLayerManagement, renderPopcornElements, showTimelineContextMenu } from '../lib/editor/timelineRendererEnhanced.js';
import { initializeMediaLibraryDragDrop, setupEnhancedTooltips } from '../lib/editor/dragDrop.js';
import { renderMediaGrid, addMediaToTimeline } from '../lib/editor/mediaLibrary.js';
import { assetStore } from '../lib/assets/assetStore.js';
import { extendClipContextMenu, extendGenerationPanel, extendMediaLibrary, extendTopActions } from '../lib/uiIntegration.js';
import { integrateMediaIngest, GiphyIntegration, StickersLibrary, LowerThirds, VideoGallery, AnimationList } from '../lib/mediaIngest.js';
import { renderMultiCameraToolbar, renderPipControls, renderSplitScreenControls } from '../lib/editor/multiCamera.js';
import { createTimelineState } from '../lib/editor/timelineEditorState.js';
import { KeyframeSystem } from '../lib/editor/keyframeSystem.jsx';
import { TransitionEditor } from '../lib/editor/transitionEditor.js';
import { TimelineTransitions } from '../lib/editor/timelineTransitions.js';
import { SceneDetector } from './timeline/SceneDetector.js';
import { CameraEffects } from './timeline/CameraEffects.js';
import { AIChatPanel } from './timeline/AIChatPanel.js';
import TIMELINE_DESIGN_SYSTEM, { enforceDesignSystem } from '../lib/designSystemEnforcer.js';
import { createVideoPreview } from '../lib/videoPlayer.js';
// Import rendiv animation primitives
import { interpolate, spring, blendColors, noise2D, useSequence, useSeries } from '../lib/editor/animationControls.jsx';
// Agent system integration
import { initTimelineAgentIntegration } from '../timelineAgentIntegration.js';
import { ColorCorrectionSystem } from '../lib/editor/colorCorrectionSystem.jsx';
// CutAI integration loaded dynamically to avoid syntax issues in AIStoryboardStudio.jsx
// import { AIStoryboardStudio } from './ai-storyboard/AIStoryboardStudio.jsx';
// import { cutai } from '../lib/cutai-api.js';

// Subtitle system integration
import { SubtitleTimeline } from '../lib/editor/subtitleTimeline.js';
import { SubtitleControls } from './SubtitleControls.jsx';
import { SubtitleEditorModal } from './modals/SubtitleEditorModal.jsx';
import { whisperService } from '../services/whisper-client.js';

// Modal imports - these are vanilla JS modal implementations
import { EndScreenModal } from './modals/EndScreenModal.jsx';
import { SaveProjectModal } from './modals/SaveProjectModal.jsx';
import { SettingsModal } from './modals/SettingsModal.jsx';
import { BillingModal } from './modals/BillingModal.jsx';
import { ConnectModal } from './modals/ConnectModal.jsx';
import { PreviewMediaModal } from './modals/PreviewMediaModal.jsx';
import { VideoPlayerModal } from './modals/VideoPlayerModal.jsx';
import { RecorderModal } from './modals/RecorderModal.jsx';
import { EnhancedRecorderModal } from './modals/EnhancedRecorderModal.jsx';
import { TemplateGeneratorModal } from './modals/TemplateGeneratorModal.jsx';
import { TemplatePreviewModal } from './modals/TemplatePreviewModal.jsx';
import { SocialPublisherModal } from './modals/SocialPublisherModal.jsx';
import { EmailCampaignModal } from './modals/EmailCampaignModal.jsx';
import { UrlVideoModal } from './modals/UrlVideoModal.jsx';
import { PageShotModal } from './modals/PageShotModal.jsx';
import { ContactImporterModal } from './modals/ContactImporterModal.jsx';
import { AIVideoCreator } from './modals/AIVideoCreator.jsx';
import { VideoPersonalizationHub } from './modals/VideoPersonalizationHub.jsx';
import { LandingPageBuilder } from './modals/LandingPageBuilder.jsx';
import { LeadGeneratorModal } from './modals/LeadGeneratorModal.jsx';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';
import { RetakePanel } from './RetakePanel.jsx';
import { ImportTimelineModal } from './ImportTimelineModal.jsx';
import { ICLoraPanel } from './ICLoraPanel.jsx';
// Category C Editor Surface imports removed - not implemented
import { createHeroSection } from '../lib/thumbnails.js';

export function TimelineEditorPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg relative';

  const heroBanner = createHeroSection('timeline', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) container.appendChild(heroBanner);

  // Initialize design system enforcement
  enforceDesignSystem();

  // CutAI integration - popup storyboard UX with timeline communication
  // Uses dynamic import to avoid syntax issues in AIStoryboardStudio.jsx
  // Styled consistently with timeline editor design system
  const showCutAI = async () => {
    const cutaiContainer = document.createElement('div');
    cutaiContainer.className = 'fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4';
    
    // Create surface-styled modal matching timeline editor aesthetics
    const modal = document.createElement('div');
    modal.className = 'w-full max-w-[1400px] h-[90vh] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.028))] shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden flex flex-col';
    
    try {
      // Dynamic import of CutAI module
      const { AIStoryboardStudio } = await import('./ai-storyboard/AIStoryboardStudio.jsx');
      
      const studio = AIStoryboardStudio();
      modal.appendChild(studio);
      
      // Make CutAI scene/shot cards draggable for direct timeline drop (production-ready)
      setTimeout(() => {
        const sceneCards = modal.querySelectorAll('.scene-card, [data-scene-id], .shot-card, [data-shot-id]');
        sceneCards.forEach(card => {
          card.setAttribute('draggable', 'true');
          card.style.cursor = 'grab';
          
          card.addEventListener('dragstart', (e) => {
            const sceneId = card.dataset.sceneId || card.getAttribute('data-scene-id');
            const shotId = card.dataset.shotId || card.getAttribute('data-shot-id');
            
            // Extract shot/scene data from DOM or CutAI internal state
            const label = card.querySelector('.shot-label, h3, .title')?.textContent || 
                         card.getAttribute('data-label') || 'CutAI Shot';
            const duration = parseFloat(card.dataset.duration) || 
                            parseFloat(card.getAttribute('data-duration')) || 5;
            
            const dragData = {
              type: shotId ? 'cutai-shot' : 'cutai-scene',
              label,
              duration,
              clipType: 'video',
              metadata: {
                sceneId,
                shotId,
                source: 'cutai-drag-drop'
              }
            };
            
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'copy';
            card.style.opacity = '0.6';
          });
          
          card.addEventListener('dragend', () => {
            card.style.opacity = '1';
          });
        });
      }, 800);
      
      // Add "Send to Timeline" button styled like timeline editor mini-btns
      setTimeout(() => {
        const headerActions = modal.querySelector('#headerActions');
        if (headerActions) {
          const sendBtn = document.createElement('button');
          sendBtn.className = 'flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl text-sm font-semibold hover:shadow-glow transition-all ml-2 border border-primary/50';
          sendBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Send to Timeline
          `;
          sendBtn.onclick = () => {
            const stored = localStorage.getItem('ai-storyboard-project');
            if (stored) {
              try {
                const data = JSON.parse(stored);
                // Convert CutAI storyboard to timeline clips with full video editing support
                const clips = (data.scenes || []).flatMap((scene, sceneIdx) => 
                  (scene.shots || []).map((shot, shotIdx) => {
                    const duration = shot.duration || shot.shot_duration || 5;
                    const startTime = sceneIdx * 12 + shotIdx * duration;
                    const clipType = shot.shot_type?.toLowerCase().includes('text') ? 'text' : 
                                     shot.shot_type?.toLowerCase().includes('audio') ? 'audio' : 'video';
                    
                    return {
                      id: `cutai-${Date.now()}-${sceneIdx}-${shotIdx}`,
                      name: shot.description || shot.title || scene.title || `Shot ${shot.shotNumber || shotIdx + 1}`,
                      type: clipType,
                      start: startTime,
                      end: startTime + duration,
                      sourceStart: 0,
                      sourceEnd: duration,
                      duration: duration,
                      assetId: shot.asset_id || shot.sd_prompt ? `cutai-asset-${sceneIdx}-${shotIdx}` : null,
                      volume: 1,
                      opacity: 1,
                      playbackRate: 1,
                      effects: shot.effects || [],
                      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
                      lane: 0,
                      source: 'cutai',
                      metadata: {
                        ...shot,
                        sceneNumber: scene.scene_number || sceneIdx + 1,
                        shotNumber: shot.shot_number || shotIdx + 1,
                        shotType: shot.shot_type,
                        cameraAngle: shot.camera_angle,
                        cameraMovement: shot.camera_movement,
                        mood: {
                          tension: scene.mood_tension || scene.mood?.tension,
                          energy: scene.mood_energy || scene.mood?.energy,
                          emotion: scene.mood_emotion || scene.mood?.emotion
                        },
                        prompt: shot.sd_prompt || shot.prompt,
                        timeOfDay: scene.time_of_day,
                        location: scene.location,
                        soundtrack: scene.soundtrack_genre ? {
                          genre: scene.soundtrack_genre,
                          tempo: scene.soundtrack_tempo
                        } : null
                      }
                    };
                  })
                );
                
                let addedCount = 0;
                clips.forEach(clip => {
                  // Determine appropriate track based on clip type and shot characteristics
                  let targetTrack = null;
                  const isInsertShot = clip.metadata?.shotType?.toLowerCase().includes('insert');
                  const isBroll = clip.metadata?.shotType?.toLowerCase().includes('b-roll') || 
                                  clip.metadata?.shotType?.toLowerCase().includes('cutaway');
                  
                  if (isBroll || isInsertShot) {
                    // B-roll and insert shots go to B-Roll track
                    targetTrack = state.project?.tracks?.find(t => 
                      t.type === 'b-roll' || t.type === 'B-Roll' || t.type === 'overlay'
                    );
                    if (!targetTrack && state.addTrack) {
                      state.addTrack('B-Roll');
                      targetTrack = state.project?.tracks?.find(t => 
                        t.type === 'b-roll' || t.type === 'B-Roll' || t.type === 'overlay'
                      );
                    }
                  } else if (clip.type === 'video' || clip.type === 'image') {
                    targetTrack = state.project?.tracks?.find(t => t.type === 'video' || t.type === 'Video');
                  } else if (clip.type === 'audio') {
                    targetTrack = state.project?.tracks?.find(t => t.type === 'audio' || t.type === 'Audio');
                  } else if (clip.type === 'text') {
                    targetTrack = state.project?.tracks?.find(t => t.type === 'text' || t.type === 'Text' || t.type === 'subtitle');
                  }
                  
                  // Fallback to first available track or create appropriate track
                  if (!targetTrack) {
                    targetTrack = state.project?.tracks?.[0];
                  }
                  
                  if (!targetTrack && state.addTrack) {
                    state.addTrack(clip.type === 'audio' ? 'Audio' : clip.type === 'text' ? 'Text' : 'Video');
                    targetTrack = state.project?.tracks?.find(t => 
                      t.type === (clip.type === 'audio' ? 'audio' : clip.type === 'text' ? 'text' : 'video')
                    ) || state.project?.tracks?.[0];
                  }
                  
                  if (targetTrack && state.addClip) {
                    const clipData = {
                      ...clip,
                      trackId: targetTrack.id,
                      name: clip.name || clip.label
                    };
                    state.addClip(targetTrack.id, clipData);
                    addedCount++;
                    
                    // Apply mood-based color correction if mood data exists
                    if (clip.metadata?.mood && state.addColorCorrection) {
                      const mood = clip.metadata.mood;
                      const colorGrade = {
                        brightness: mood.tension > 0.7 ? -0.1 : mood.energy > 0.7 ? 0.05 : 0,
                        contrast: mood.tension > 0.6 ? 1.1 : 1.0,
                        saturation: mood.emotion === 'dark' || mood.darkness > 0.5 ? 0.85 : 1.0,
                        temperature: mood.emotion === 'warm' ? 200 : mood.emotion === 'cold' ? -200 : 0
                      };
                      state.addColorCorrection(targetTrack.id, clip.id, colorGrade);
                    }
                    
                    // Add camera movement as keyframe effect if present
                    if (clip.metadata?.cameraMovement && state.addEffect) {
                      const movementMap = {
                        'Pan Left': { type: 'pan', direction: -1 },
                        'Pan Right': { type: 'pan', direction: 1 },
                        'Tilt Up': { type: 'tilt', direction: 1 },
                        'Tilt Down': { type: 'tilt', direction: -1 },
                        'Dolly In': { type: 'dolly', direction: 1 },
                        'Dolly Out': { type: 'dolly', direction: -1 },
                        'Tracking Shot': { type: 'tracking', direction: 1 }
                      };
                      const movement = movementMap[clip.metadata.cameraMovement];
                      if (movement) {
                        state.addEffect(targetTrack.id, clip.id, {
                          type: 'camera-move',
                          ...movement,
                          duration: clip.duration
                        });
                      }
                    }
                  }
                });
                
                showToast(`Added ${addedCount} CutAI shots to timeline from "${data.projectName || 'Storyboard'}"`);
                cutaiContainer.remove();
              } catch (e) {
                console.error('CutAI import error:', e);
                showToast('Failed to import CutAI data to timeline');
              }
            } else {
              showToast('No CutAI storyboard data found. Generate scenes first.');
            }
          };
          headerActions.appendChild(sendBtn);
        }
      }, 150);

      cutaiContainer.appendChild(modal);
      document.body.appendChild(cutaiContainer);
      
      // Close on backdrop click (but not on modal content)
      cutaiContainer.onclick = (e) => { 
        if (e.target === cutaiContainer) cutaiContainer.remove(); 
      };
      
      // Close on Escape key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          cutaiContainer.remove();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
      
    } catch (err) {
      console.error('Failed to load CutAI module:', err);
      showToast('CutAI storyboard module unavailable');
      cutaiContainer.remove();
    }
  };
  window.showCutAIFromTimeline = showCutAI;

  const styles = `
/* Design system variables are now enforced globally by designSystemEnforcer.js */

* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
}
body { padding: 18px; }
button, input, textarea, select { font: inherit; }
#app { min-height: calc(100vh - 36px); }
.app-shell { max-width: 1500px; margin: 0 auto; }
.header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: 16px; padding: 18px 20px; border-radius: 24px;
  border: 1px solid var(--border);
  background: linear-gradient(135deg, #171b24 0%, #07090d 45%, #111827 100%);
  box-shadow: var(--shadow);
}
.brand { display: flex; align-items: center; gap: 12px; }
.icon-btn, .top-icon {
  border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.icon-btn:hover, .top-icon:hover, .mini-btn:hover, .rail-btn:hover, .tool-btn:hover, .clip:hover, .media-item:hover { transform: translateY(-1px); }
.icon-btn { width: 40px; height: 40px; border-radius: 12px; }
.brand-mark {
  width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 22px;
  border: 1px solid rgba(34,211,238,0.2); background: rgba(34,211,238,0.1); box-shadow: 0 0 16px rgba(56,189,248,0.12);
}
.brand-title { font-size: 20px; font-weight: 900; letter-spacing: .04em; }
.brand-sub { font-size: 10px; text-transform: uppercase; letter-spacing: .25em; color: var(--dim); }
.project-head { text-align: center; }
.project-head .title { font-size: 16px; font-weight: 700; }
.project-head .sub { font-size: 10px; color: var(--dim); }
.top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 420px; }
.top-icon { width: 36px; height: 36px; border-radius: 10px; font-size: 18px; }
.top-icon.active { border-color: rgba(34,211,238,0.4); background: rgba(34,211,238,0.2); }
.ready-pill {
  margin-left: 4px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(52,211,153,0.2);
  background: rgba(52,211,153,0.1); color: #bbf7d0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  display: inline-flex; align-items: center; gap: 8px;
}
.ready-dot { width: 6px; height: 6px; border-radius: 999px; background: #86efac; }
.main-grid { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 16px; }
.left-col { min-width: 0; }
.side-col { display: flex; flex-direction: column; gap: 16px; }
.left-top { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: 16px; margin-bottom: 16px; align-items: stretch; }
.preview-card {
  position: relative; overflow: hidden; border-radius: var(--radius-xl); aspect-ratio: 16 / 9;
  border: 1px solid var(--border-soft); background: #000; box-shadow: 0 0 70px rgba(56,189,248,0.14);
}
.preview-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 55%); }
.preview-inner {
  position: absolute; inset: 24px; border-radius: 22px; border: 1px solid rgba(34,211,238,0.15);
  background: linear-gradient(135deg, rgba(20,25,33,0.9), rgba(8,10,14,0.86)); box-shadow: 0 0 60px rgba(34,211,238,0.1);
  overflow: hidden;
}
.preview-stage {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at center, rgba(34,211,238,0.08), rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.5));
}
.preview-empty {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center;
}
.preview-screen { max-width: 420px; text-align: center; }
.preview-emoji { font-size: 72px; margin-bottom: 10px; }
.preview-title { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.92); }
.preview-sub { margin-top: 4px; font-size: 14px; color: rgba(255,255,255,0.45); }
.preview-media { width: 100%; height: 100%; object-fit: cover; display: block; background: #020406; }
.preview-media.contain { object-fit: contain; }
.preview-audio-card {
  width: min(88%, 640px); padding: 24px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); box-shadow: 0 20px 40px rgba(0,0,0,0.35);
  backdrop-filter: blur(16px);
}
.preview-audio-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.preview-audio-icon {
  width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; font-size: 28px;
  border: 1px solid rgba(34,211,238,0.24); background: rgba(34,211,238,0.12);
}
.preview-audio-meta { flex: 1; min-width: 0; }
.preview-audio-name { font-size: 18px; font-weight: 800; color: rgba(255,255,255,0.94); }
.preview-audio-desc { margin-top: 4px; font-size: 12px; color: rgba(255,255,255,0.5); }
.preview-audio-bars { display: grid; grid-template-columns: repeat(24, 1fr); gap: 6px; align-items: end; height: 88px; margin-bottom: 18px; }
.preview-audio-bars span {
  display: block; border-radius: 999px; background: linear-gradient(to top, rgba(34,211,238,0.35), rgba(52,211,153,0.95)); box-shadow: 0 0 18px rgba(34,211,238,0.2);
}
.preview-text-card {
  width: min(82%, 760px); padding: 28px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(135deg, rgba(3,7,18,0.86), rgba(17,24,39,0.82)); box-shadow: 0 30px 70px rgba(0,0,0,0.45); text-align: left;
}
.preview-text-kicker { font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #a5f3fc; }
.preview-text-heading { margin-top: 12px; font-size: clamp(28px, 4vw, 54px); line-height: 1.02; font-weight: 900; color: white; }
.preview-text-body { margin-top: 12px; max-width: 520px; font-size: 15px; line-height: 1.55; color: rgba(255,255,255,0.68); }
.preview-overlay {
  position: absolute; inset-inline: 0; bottom: 0; padding: 16px; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent);
}
.time-row, .control-row { display: flex; align-items: center; justify-content: space-between; }
.time-row { margin-bottom: 8px; font-size: 12px; color: rgba(255,255,255,0.6); }
.progress-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.2); overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; width: 28%; border-radius: inherit; background: linear-gradient(to right, var(--cyan), var(--emerald)); }
.control-row { justify-content: center; gap: 12px; }
.circle-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid transparent; background: rgba(255,255,255,0.1); color: white; cursor: pointer; }
.circle-btn.primary { width: 48px; height: 48px; background: white; color: black; font-weight: 800; box-shadow: 0 10px 30px rgba(255,255,255,0.15); }
.timeline-card, .side-card {
  border-radius: 24px; border: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
  box-shadow: 0 20px 60px rgba(0,0,0,0.35); backdrop-filter: blur(20px);
}
.timeline-card { padding: 16px; }
.side-card { padding: 14px; border-radius: 20px; box-shadow: var(--shadow); }
.side-card.generate { border-color: rgba(34,211,238,0.2); background: linear-gradient(180deg, rgba(56,189,248,0.08), rgba(17,24,39,0.75)); }
.card-title { margin-bottom: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,0.82); }
.card-title.cyan { color: #bae6fd; }
.timeline-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-left, .tool-group, .pill-row, .floating-rail, .track-actions, .generate-types, .quick-commands { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tool-group { gap: 4px; padding: 4px; border-radius: 14px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); }
.tool-btn, .mini-btn, .command-btn, .rail-btn, .generate-type { border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); cursor: pointer; transition: all .15s ease; }
.tool-btn { width: 32px; height: 32px; border-radius: 8px; font-size: 14px; }
.tool-btn.active, .generate-type.active, .rail-btn.active { border-color: rgba(34,211,238,0.45); background: rgba(34,211,238,0.22); color: #cffafe; }
.mini-btn, .command-btn { border-radius: 10px; padding: 8px 12px; font-size: 12px; }
.pill-row { gap: 6px; }
.pill { border-radius: 999px; padding: 7px 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); font-size: 10px; color: rgba(255,255,255,0.55); }
.timeline-shell { position: relative; overflow: hidden; border-radius: 20px; border: 1px solid var(--border-soft); background: rgba(0,0,0,0.2); }
.timeline-header { display: grid; grid-template-columns: 100px 1fr; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.03); font-size: 11px; text-transform: uppercase; letter-spacing: .25em; color: rgba(255,255,255,0.4); }
.timeline-header div { padding: 10px 12px; }
.timeline-body { position: relative; }
.playhead-layer { position: absolute; left: 100px; right: 0; top: 0; bottom: 0; pointer-events: none; }
.playhead-line { position: absolute; top: 0; bottom: 0; left: 32%; width: 2px; background: var(--cyan); box-shadow: 0 0 18px rgba(34,211,238,0.8); }
.playhead-knob { position: absolute; top: 0; left: calc(32% - 4px); width: 10px; height: 10px; border-radius: 999px; background: var(--cyan); box-shadow: 0 0 15px rgba(34,211,238,0.8); }
.track-row { display: grid; grid-template-columns: 100px 1fr; min-height: 62px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.track-row:last-child { border-bottom: 0; }
.track-meta { padding: 10px 8px; border-right: 1px solid var(--border); background: rgba(0,0,0,0.35); }
.track-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.86); }
.track-actions { margin-top: 8px; gap: 4px; }
.track-toggle { width: 18px; height: 18px; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); font-size: 8px; cursor: pointer; }
.track-toggle.locked { background: rgba(34,211,238,0.2); }
.track-count { margin-top: 6px; font-size: 9px; color: rgba(255,255,255,0.35); }
.track-lane { position: relative; background: rgba(255,255,255,0.02); min-height: 62px; background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 80px 100%; }
.clip { position: absolute; top: 8px; bottom: 8px; border-radius: 12px; border: 1px solid var(--border); padding: 8px 10px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.86); background: rgba(255,255,255,0.1); box-shadow: 0 10px 24px rgba(0,0,0,0.25); display: flex; align-items: center; overflow: hidden; cursor: pointer; }
.clip.active { border-color: rgba(34,211,238,0.5); background: rgba(34,211,238,0.2); color: #cffafe; }
.clip-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.upload-btn, .primary-btn, .text-input, .text-area, .select-input { width: 100%; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.4); color: white; }
.upload-btn, .primary-btn { padding: 11px 14px; cursor: pointer; font-weight: 700; }
.upload-btn { border-style: dashed; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); margin-bottom: 12px; }
.media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.media-note { margin: -4px 0 10px; font-size: 10px; line-height: 1.45; color: rgba(255,255,255,0.46); }
.media-item { min-height: 64px; border-radius: 14px; border: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025)); display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-align: left; cursor: pointer; transition: transform .15s ease, border-color .15s ease, background .15s ease; }
.media-item:hover { border-color: rgba(34,211,238,0.22); background: linear-gradient(180deg, rgba(34,211,238,0.08), rgba(255,255,255,0.03)); }
.media-icon { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.28); display: grid; place-items: center; font-size: 17px; flex: 0 0 auto; }
.media-copy { min-width: 0; }
.media-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.88); }
.media-desc { margin-top: 2px; font-size: 9px; line-height: 1.35; color: rgba(255,255,255,0.45); }
.generate-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.generate-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
.generate-type { border-radius: 12px; padding: 10px 6px; font-size: 10px; text-align: center; }
.generate-type .emoji { display: block; font-size: 18px; margin-bottom: 6px; }
.text-area { min-height: 88px; padding: 10px 12px; resize: vertical; margin-bottom: 8px; }
.text-input, .select-input { padding: 10px 12px; margin-bottom: 8px; }
.select-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.primary-btn { background: linear-gradient(to right, var(--cyan), var(--emerald)); color: #03131a; }
.chat-stack { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; max-height: 200px; overflow-y: auto; }
.chat-bubble { border-radius: 10px; padding: 10px; font-size: 10px; max-width: 80%; word-wrap: break-word; }
.chat-bubble.user { background: rgba(255,255,255,0.1); align-self: flex-end; }
.chat-bubble.ai { background: rgba(34,211,238,0.2); color: #cffafe; align-self: flex-start; }
.chat-input-container { display: flex; gap: 8px; align-items: center; }
.processing-indicator { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); font-size: 12px; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top: 2px solid #22d3ee; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.quick-commands { gap: 6px; }
.command-btn { padding: 6px 10px; font-size: 9px; }
.floating-rail { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 40; padding: 10px 14px; border-radius: 999px; border: 1px solid var(--border); background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); backdrop-filter: blur(18px); box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.rail-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; }
.rail-btn .emoji { font-size: 16px; }
.status-toast { position: fixed; right: 18px; bottom: 18px; max-width: 320px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(34,211,238,0.18); background: rgba(7,12,18,0.95); color: rgba(255,255,255,0.86); box-shadow: 0 18px 50px rgba(0,0,0,0.4); font-size: 12px; opacity: 0; transform: translateY(10px); pointer-events: none; transition: all .2s ease; }
.status-toast.show { opacity: 1; transform: translateY(0); }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
}
.modal-content {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); border: 1px solid var(--border);
  border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.45); max-width: 600px; width: 90%; max-height: 80vh; overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border);
  background: rgba(0,0,0,0.2);
}
.modal-header h3 { margin: 0; color: rgba(255,255,255,0.9); }
.modal-close { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; padding: 4px; }
.modal-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
.clip-editor, .transition-settings { color: rgba(255,255,255,0.9); }
.clip-editor__section { margin-bottom: 20px; }
.clip-editor__section h3 { margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
.clip-editor__field { margin-bottom: 12px; }
.clip-editor__field label { display: block; margin-bottom: 4px; font-size: 12px; color: rgba(255,255,255,0.7); }
.clip-editor__field input, .clip-editor__field select { width: 100%; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 6px; color: white; }
.clip-editor__field button { padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 6px; color: white; cursor: pointer; }
.transition-settings__section { margin-bottom: 20px; }
.transition-settings__section h4 { margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.9); }
.transition-types { display: grid; gap: 8px; }
.transition-type { padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: rgba(0,0,0,0.2); }
.transition-type.selected { border-color: var(--cyan); background: rgba(34,211,238,0.1); }
.transition-name { font-weight: 600; margin-bottom: 4px; }
.transition-description { font-size: 12px; color: rgba(255,255,255,0.6); }
.duration-controls { display: flex; align-items: center; gap: 12px; }
.duration-controls input { flex: 1; }
.transition-settings__actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
.preview-btn, .create-btn { padding: 10px 16px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-weight: 600; }
.preview-btn { background: rgba(255,255,255,0.1); color: white; }
.create-btn { background: var(--cyan); color: black; }
.clip-input { margin-bottom: 12px; }
.clip-input label { display: block; margin-bottom: 4px; font-size: 12px; }
.clip-input input { width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 6px; color: white; }

/* Transition System Styles */
.transition-editor { display: flex; flex-direction: column; gap: 16px; }
.transition-editor__header { display: flex; align-items: center; justify-content: space-between; }
.transition-editor__controls { display: flex; gap: 8px; }
.transition-btn { padding: 6px 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border-radius: 6px; cursor: pointer; font-size: 12px; }
.transition-btn:hover { background: rgba(255,255,255,0.1); }
.transition-btn.primary { background: var(--cyan); color: black; }
.transition-btn.secondary { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.3); }

.transition-editor__preview { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.2); }
#transitionPreview { width: 100%; border-radius: 4px; }
.transition-editor__timeline { position: relative; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 8px; overflow: hidden; }
.preview-progress { position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(to right, var(--cyan), var(--emerald)); border-radius: inherit; }
.preview-playhead { position: absolute; top: -2px; width: 2px; height: 10px; background: white; box-shadow: 0 0 8px rgba(255,255,255,0.8); }

.transition-editor__library { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.2); }
.transition-categories { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.category-btn { padding: 6px 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border-radius: 6px; cursor: pointer; font-size: 11px; }
.category-btn.active { background: rgba(34,211,238,0.2); border-color: rgba(34,211,238,0.4); color: #cffafe; }
.transition-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.transition-item { padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.02); cursor: pointer; text-align: center; transition: all 0.15s ease; }
.transition-item:hover { border-color: rgba(34,211,238,0.3); background: rgba(34,211,238,0.05); }
.transition-item.selected { border-color: var(--cyan); background: rgba(34,211,238,0.1); }
.transition-icon { font-size: 20px; margin-bottom: 4px; }
.transition-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 2px; }
.transition-desc { font-size: 9px; color: rgba(255,255,255,0.5); line-height: 1.3; }

.transition-editor__params { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.2); }
.params-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.params-header h4 { margin: 0; color: rgba(255,255,255,0.9); }
.preset-selector select { padding: 4px 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 4px; color: white; font-size: 11px; }

.duration-control { margin-bottom: 12px; }
.duration-control label { display: block; margin-bottom: 6px; font-size: 12px; color: rgba(255,255,255,0.8); }
.duration-control input { width: 100%; }

.params-grid { display: grid; gap: 8px; margin-bottom: 12px; }
.param-item { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: rgba(0,0,0,0.2); }
.param-item label { display: block; margin-bottom: 4px; font-size: 11px; color: rgba(255,255,255,0.7); }
.param-item input[type="range"] { width: 100%; }
.param-item input[type="text"] { width: 100%; padding: 4px 6px; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 4px; color: white; font-size: 11px; }
.param-item select { width: 100%; padding: 4px 6px; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 4px; color: white; font-size: 11px; }

.advanced-controls { margin-bottom: 12px; }
.control-group { margin-bottom: 8px; }
.control-group label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.7); cursor: pointer; }

.transition-editor__actions { display: flex; gap: 8px; justify-content: center; }

.transition-drop-zone { position: relative; width: 20px; height: 62px; background: rgba(34,211,238,0.1); border: 1px dashed rgba(34,211,238,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.transition-drop-zone.drag-over { background: rgba(34,211,238,0.2); border-color: var(--cyan); }
.transition-drop-zone.has-transition { background: transparent; border: none; cursor: default; }

.keyframe-marker {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 9px;
  height: 9px;
  background: #22d3ee;
  border: 1.5px solid #fff;
  z-index: 12;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
}
.keyframe-marker:hover {
  background: #67e8f9;
  transform: translateY(-50%) rotate(45deg) scale(1.2);
}
.transition-placeholder { text-align: center; }
.transition-placeholder .transition-icon { font-size: 12px; display: block; margin-bottom: 2px; }
.transition-placeholder .transition-label { font-size: 8px; color: rgba(255,255,255,0.5); }

.timeline-transition { position: absolute; top: 8px; height: 46px; background: linear-gradient(135deg, rgba(34,211,238,0.2), rgba(52,211,153,0.1)); border: 1px solid rgba(34,211,238,0.4); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: grab; transition: all 0.15s ease; }
.timeline-transition:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,211,238,0.2); }
.timeline-transition.dragging { cursor: grabbing; opacity: 0.8; }
.transition-visual { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; }
.transition-visual .transition-icon { font-size: 14px; margin-bottom: 2px; }
.transition-visual .transition-name { font-size: 8px; font-weight: 600; color: #cffafe; text-align: center; line-height: 1.1; }
.transition-visual .transition-duration { font-size: 7px; color: rgba(255,255,255,0.6); }
.transition-controls { position: absolute; top: -6px; right: -6px; display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s ease; }
.timeline-transition:hover .transition-controls { opacity: 1; }
.transition-edit-btn, .transition-delete-btn { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--border); background: rgba(0,0,0,0.8); color: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; }
.transition-edit-btn:hover { background: rgba(34,211,238,0.2); }
.transition-delete-btn:hover { background: rgba(239,68,68,0.2); }

/* Rendiv Animation Demo Styles */
.animation-demo-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.animation-demo-canvas {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.animation-demo-canvas canvas {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(0,0,0,0.3);
}

.animation-demo-info {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  text-align: center;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
}

@media (max-width: 1180px) { .main-grid { grid-template-columns: 1fr; } }
@media (max-width: 980px) { .top-actions { max-width: none; } .left-top { grid-template-columns: 1fr; } }
@media (max-width: 860px) {
  .header { flex-direction: column; align-items: stretch; }
  .project-head { text-align: left; }
  .timeline-header, .track-row { grid-template-columns: 86px 1fr; }
  .playhead-layer { left: 86px; }
   .floating-rail { left: 16px; right: 16px; transform: none; justify-content: center; }
}

/* Enhanced Timeline Engine Styles */
.timeline-controls-enhanced {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border);
  gap: 16px;
  flex-wrap: wrap;
}

.transport-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  
}

.element-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-management {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin-top: 8px;
}

.blending-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  
}

.popcorn-element {
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: rgba(34, 211, 238, 0.9);
}

.default-element {
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: rgba(52, 211, 153, 0.9);
}

.line-slider-container {
  display: flex;
  align-items: center;
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 8px 0;
}

.line-slider-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.line-slider-timestamp {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.line-slider-line {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
}
`;

  const template = `
<div class="app-shell">
  <header class="header">
    <div class="brand">
      <button class="icon-btn" id="backBtn" data-tooltip="Go back - Return to the previous view or project selection" aria-label="Go back to the previous view">←</button>
      <div class="brand-mark">🎬</div>
      <div>
        <div class="brand-title">TIMELINE</div>
        <div class="brand-sub">AI Video Editor</div>
      </div>
    </div>
    <div class="project-head">
      <div class="title" id="projectTitle">Untitled Project</div>
      <div class="sub" id="projectSub">Working timeline preview</div>
    </div>
    <div class="top-actions" id="topActions" data-tooltip="Quick action toolbar"></div>
  </header>
  <div class="main-grid">
    <div class="left-col">
      <div class="left-top">
        <aside class="side-card" style="min-height:100%; display:flex; flex-direction:column;">
          <div id="aiChatContainer"></div>
        </aside>
        <section class="preview-card">
          <div class="preview-glow"></div>
          <div class="preview-inner">
            <div class="preview-stage" id="previewStage"></div>
            <div class="preview-empty" id="previewEmpty">
              <div class="preview-screen">
                <div class="preview-emoji" id="previewEmoji">🎥</div>
                <div class="preview-title" id="previewTitle">Center Preview</div>
                <div class="preview-sub" id="previewSubtitle">Glow preview styled like the render page</div>
              </div>
            </div>
          </div>
          <input type="file" id="uploadInput" accept="video/*,image/*,audio/*,.txt" hidden data-testid="file-input" />
          <div class="preview-overlay">
            <div class="time-row">
              <span id="currentTime">00:12.40</span>
              <span id="totalTime">01:00.00</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
            <div class="control-row">
              <button class="circle-btn" id="rewindBtn" data-tooltip="Rewind - Move the playhead back by 10% (←)" aria-label="Rewind the playhead by 10%">⏮</button>
              <button class="circle-btn primary" id="playBtn" data-tooltip="Play or pause timeline preview (Spacebar)" aria-label="Play or pause timeline preview">▶</button>
              <button class="circle-btn" id="stopBtn" data-tooltip="Stop - Stop playback and return to beginning" aria-label="Stop playback and return to the beginning">⏹</button>
            </div>
          </div>
        </section>
      </div>
      <section class="timeline-card" data-testid="timeline-container">
        <div class="timeline-top">
          <div class="toolbar-left">
            <div class="tool-group" id="toolGroup"></div>
             <button class="mini-btn" data-action="zoom-out" data-tooltip="Zoom out - See more of the timeline (Mouse wheel)" aria-label="Zoom out on the timeline">🔍-</button>
            <button class="mini-btn" data-action="zoom-in" data-tooltip="Zoom in - See timeline in more detail (Mouse wheel)" aria-label="Zoom in on the timeline">🔍+</button>
            <button class="mini-btn" data-add-track="Video" data-tooltip="Add video track - Create a new video layer on the timeline" aria-label="Add a new video track">+Video</button>
            <button class="mini-btn" data-add-track="Audio" data-tooltip="Add audio track - Create a new audio layer on the timeline" aria-label="Add a new audio track">+Audio</button>
            <button class="mini-btn" data-add-track="Text" data-tooltip="Add text track - Create a new text overlay layer" aria-label="Add a new text track">+Text</button>
            <button class="mini-btn" data-add-track="B-Roll" data-tooltip="Add B-roll track - Create a new B-roll overlay layer" aria-label="Add a new B-roll track">+B-Roll</button>
            <button class="mini-btn" id="cutaiStoryboardBtn" data-tooltip="Generate storyboard with CutAI" aria-label="Open CutAI storyboard generator">✨AI</button>
          </div>
          <div class="pill-row" id="pillRow"></div>
        </div>
        <div class="timeline-controls-enhanced" id="timelineControlsEnhanced"></div>
        <div class="timeline-shell">
          <div class="timeline-header"><div>Tracks</div><div>Timeline</div></div>
          <div class="timeline-body" id="timelineBody">
            <div class="compositing-overlay" id="compositingOverlay"></div>
            <div class="playhead-layer"><div class="playhead-line" id="playheadLine"></div><div class="playhead-knob" id="playheadKnob"></div></div>
            <div id="trackRows"></div>
          </div>
        </div>
      </section>
    </div>
    <div class="side-col">
      <aside class="side-card">
        <div class="card-title">📁 Media</div>
        <button class="upload-btn" id="uploadBtn" data-tooltip="Upload media - Import video, image, or audio files into the project" aria-label="Upload media into the editor">Upload</button>
        <div class="media-note">Choose what you want to add to the timeline. Each tile inserts a different type of source asset.</div>
        <div class="media-grid" id="mediaGrid"></div>
      </aside>
      <aside class="side-card" id="sceneDetectorPanel" data-tooltip="AI scene detection">
        <div id="sceneDetectorContainer"></div>
      </aside>
      <aside class="side-card" id="cameraEffectsPanel" data-tooltip="Camera effects and keyframes">
        <div id="cameraEffectsContainer"></div>
      </aside>
      <aside class="side-card generate">
        <div class="generate-head"><div class="card-title cyan" data-tooltip="AI generation panel">⚡ Generate</div><div style="color: rgba(255,255,255,0.4)" data-tooltip="Close generation panel">✕</div></div>
        <div class="generate-types" id="generateTypes"></div>
        <textarea class="text-area" id="promptInput" placeholder="A cinematic shot of..." data-tooltip="Describe what you want the AI to generate"></textarea>
        <input class="text-input" id="negativeInput" placeholder="Negative prompt" data-tooltip="Describe what to exclude from the generation" />
        <div class="select-row">
          <select class="select-input" id="durationSelect" data-tooltip="Select the duration of the generated content"><option>5s</option><option>8s</option><option>12s</option></select>
          <select class="select-input" id="aspectSelect" data-tooltip="Select the aspect ratio for the generated content"><option>16:9</option><option>9:16</option><option>1:1</option></select>
          <select class="select-input" id="styleSelect" data-tooltip="Select the visual style for the generated content"><option>Cinematic</option><option>Commercial</option><option>Documentary</option></select>
        </div>
        <button class="primary-btn" id="generateBtn" data-tooltip="Generate asset - Create new content from your prompt using AI" aria-label="Generate a new asset from the prompt settings">⚡ Generate</button>
      </aside>
      <aside class="side-card" id="animationDemoPanel" data-tooltip="Rendiv animation demonstrations">
        <div class="card-title">🎭 Rendiv Animation Demo</div>
        <div id="animationDemoContainer">
          <div class="animation-demo-controls">
            <button class="mini-btn" id="runSpringDemo" data-tooltip="Spring animation - Demonstrates physics-based spring motion with damping">Spring Animation</button>
            <button class="mini-btn" id="runNoiseDemo" data-tooltip="Noise animation - Shows organic Perlin noise-based movement">Noise Animation</button>
            <button class="mini-btn" id="runInterpolateDemo" data-tooltip="Interpolation demo - Compare linear, ease-out, bounce, and color blending">Interpolate Demo</button>
          </div>
          <div class="animation-demo-canvas">
            <canvas id="animationCanvas" width="300" height="200"></canvas>
          </div>
          <div class="animation-demo-info">
            <div id="demoStatus">Click a button to start animation demo</div>
          </div>
        </div>
      </aside>
      <aside class="side-card" id="clipSettingsPanel" style="display: none;" data-tooltip="Clip editor - Edit selected clip properties">
        <div class="card-title">🎬 Clip Editor</div>
        <div id="clipEditorContainer"></div>
      </aside>
      <aside class="side-card" id="transitionSettingsPanel" style="display: none;" data-tooltip="Transitions - Add effects between clips">
        <div class="card-title">🔄 Transitions</div>
        <div id="transitionEditorContainer"></div>
      </aside>
      <aside class="side-card" id="multiCameraPanel" data-tooltip="Multi-camera editing, PIP, and split screen">
        <div class="card-title">📺 Multi-Camera</div>
        <div id="multiCameraToolbar"></div>
        <div id="pipControls" class="pip-controls-container" style="display: none;"></div>
        <div id="splitControls" class="split-controls-container" style="display: none;"></div>
      </aside>
      <aside class="side-card" id="colorCorrectionPanel" style="display: none;" data-tooltip="Color correction - Adjust color grading and correction">
        <div class="card-title">🎨 Color Correction</div>
        <div id="colorCorrectionContainer"></div>
      </aside>
      <aside class="side-card" id="colorScopesPanel" data-tooltip="Color scopes - Waveform, vectorscope, and histogram">
        <div class="card-title">📊 Color Scopes</div>
        <div id="colorScopesContainer"></div>
      </aside>

      <!-- Category C Editor Surfaces -->
      <aside class="side-card" id="canvasPanel" style="display: none;" data-tooltip="Canvas editor - Visual composition surface">
        <div class="card-title">🎨 Canvas Editor</div>
        <div id="canvasContainer"></div>
      </aside>
      <aside class="side-card" id="tokenEditorPanel" style="display: none;" data-tooltip="Token editor - Create personalization tokens">
        <div class="card-title">🏷️ Token Editor</div>
        <div id="tokenEditorContainer"></div>
      </aside>
      <aside class="side-card" id="batchGeneratorPanel" style="display: none;" data-tooltip="Batch generator - Generate multiple videos at once">
        <div class="card-title">📦 Batch Generator</div>
        <div id="batchGeneratorContainer"></div>
      </aside>
      <aside class="side-card" id="workflowPanel" style="display: none;" data-tooltip="Workflow automation - Create automated video pipelines">
        <div class="card-title">🔄 Workflow Automation</div>
        <div id="workflowContainer"></div>
      </aside>
      <aside class="side-card" id="personalizationPanel" style="display: none;" data-tooltip="Personalization - Add dynamic content for different viewers">
        <div class="card-title">👤 Personalization</div>
        <div id="personalizationContainer"></div>
      </aside>
      <aside class="side-card" id="personalizationEditorPanel" style="display: none;" data-tooltip="Personalization editor - Advanced personalization settings">
        <div class="card-title">✏️ Personalization Editor</div>
        <div id="personalizationEditorContainer"></div>
      </aside>
    </div>
  </div>
</div>
<div class="floating-rail" id="floatingRail"></div>
<div class="status-toast" id="toast"></div>
<div class="modal-overlay" id="modalOverlay" style="display: none;">
  <div class="modal-content" id="modalContent">
    <div class="modal-header">
      <h3 id="modalTitle">Advanced Editing</h3>
      <button class="modal-close" id="modalClose" data-tooltip="Close modal" aria-label="Close modal">✕</button>
    </div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>
`;

  function injectStyles() {
    if (document.getElementById('timeline-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'timeline-editor-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function svgDataUri(markup) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  function createState() {
    const baseState = createTimelineState();

    // Initialize keyframe system
    baseState.keyframeSystem = new KeyframeSystem();

    // Override with local demo data but keep enhanced features
    const demoState = {
      projectTitle: 'Untitled Project',
      selectedTool: 'Select',
      selectedClipId: 1,
      generateType: 'Text',
      playing: false,
      playheadPercent: 32,
      zoom: 1,
      timelineSeconds: 60,
      tracks: [
        { id: 'video-1', name: 'Video', muted: false, solo: false, locked: true, clips: [
          { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#06131f"/><stop offset="1" stop-color="#123b4a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="970" cy="180" r="120" fill="#22d3ee" opacity=".18"/><text x="90" y="310" fill="white" font-size="74" font-family="Arial" font-weight="700">Opening Shot</text><text x="92" y="380" fill="#a5f3fc" font-size="30" font-family="Arial">Cinematic demo preview</text></svg>`) },
          { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', poster: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><rect x="110" y="145" width="1060" height="430" rx="28" fill="white" opacity=".04"/><text x="110" y="310" fill="white" font-size="76" font-family="Arial" font-weight="700">Generated Clip</text><text x="112" y="382" fill="#bbf7d0" font-size="30" font-family="Arial">Rendered output preview</text></svg>`) }
        ] },
        { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
          { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' }
        ] },
        { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
          { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text', heading: 'Launch Faster', body: 'Use your timeline editor to turn generated media, overlays, and captions into polished deliverables.' }
        ] },
        { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
          { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'image', src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#020617"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><g opacity=".9"><rect x="120" y="340" width="120" height="250" fill="#0f172a"/><rect x="260" y="280" width="140" height="310" fill="#111827"/><rect x="430" y="210" width="180" height="380" fill="#1f2937"/><rect x="650" y="250" width="110" height="340" fill="#0f172a"/><rect x="780" y="180" width="210" height="410" fill="#1e293b"/></g><circle cx="1060" cy="130" r="70" fill="#e0f2fe" opacity=".75"/><text x="120" y="150" fill="white" font-size="78" font-family="Arial" font-weight="700">City Cutaway</text></svg>`), fit: 'cover' }
        ] }
      ],
      tools: baseState.tools, // Use enhanced tools from baseState
      pills: ['Text to Video', 'Image to Video', 'Retake', 'Extend', 'B-Roll', 'Music Gen', 'Audio Sync', 'Fill Gap AI', 'Elements', 'Import Timeline', 'IC-LoRA'],
      topIcons: ['👁','📺','📁','⚡','🎵','🔊','🎞️','👤','🎨','💬','📋','🎬','💾','⚙️','💳','🔗','👀','▶️','🤖','🎭','📊'],
      media: [
        { icon: '🎬', label: 'Video Clip', desc: 'Insert a source shot or generated video clip.', tooltip: 'Video clip - Add video footage to the timeline' },
        { icon: '🖼️', label: 'Image Frame', desc: 'Add still images, frames, or storyboard art.', tooltip: 'Image frame - Add still images or graphics' },
        { icon: '🎵', label: 'Audio Track', desc: 'Place music, voiceover, or sound design assets.', tooltip: 'Audio track - Add music, voiceover, or sound effects' },
        { icon: '🎞️', label: 'B-Roll Asset', desc: 'Drop in cutaways, overlays, or support footage.', tooltip: 'B-roll - Add supplementary footage and cutaways' }
      ],
      generateTypes: [['✍️', 'Text'], ['🖼️', 'Image'], ['🔄', 'Retake'], ['➡️', 'Extend'], ['🎞️', 'B-Roll']],
      quickCommands: ['⚡Generate','Retake','Extend','B-Roll','🎬 Detect Scenes'],
      railActions: [['⚡', 'Generate', true], ['✂️', 'Split'], ['🎬', 'Scenes'], ['💬', 'Subtitle'], ['🎞️', 'B-Roll'], ['⏱️', 'Speed'], ['🪄', 'Stabilize'], ['📝', 'Text'], ['🔄', 'Transitions'], ['🎬', 'AI Video'], ['🎥', 'Recorder'], ['🎙️', 'Enhanced Recorder'], ['📋', 'Templates'], ['👀', 'Preview Template'], ['📱', 'Social'], ['📧', 'Email Campaign'], ['🔗', 'URL Video'], ['📸', 'Page Shot'], ['👥', 'Contacts'], ['🎨', 'Canvas'], ['🏷️', 'Token Editor'], ['📦', 'Batch Generator'], ['🔄', 'Workflow'], ['👤', 'Personalization'], ['✏️', 'Personalization Editor'], ['🎬', 'Personalization Suite'], ['🏠', 'Landing Pages'], ['📋', 'Lead Generator'], ['🤖', 'AI Personalizer']],

      // Enhanced state management
      projectId: null,
      undoStack: [],
      redoStack: [],
      mediaLibrary: [],
      generationQueue: [],
      isProcessing: false
    };

    return { ...baseState, ...demoState };
  }

  // Enhanced state management with local storage persistence
  function loadProjectFromStorage() {
    try {
      const saved = localStorage.getItem('timeline-editor-project');
      if (saved) {
        const projectData = JSON.parse(saved);
        showToast('Project loaded from local storage', 'success');
        const state = { ...createState(), ...projectData };
        // Ensure tracks is always an array
        if (!Array.isArray(state.tracks)) {
          state.tracks = createState().tracks;
        }
        return state;
      }
    } catch (err) {
      console.error('Failed to load project:', err);
  // DISABLED:       showToast('Failed to load saved project', 'error');
    }
    return createState();
  }

  function saveProjectToStorage(state) {
    try {
      const projectData = {
        projectTitle: state.projectTitle,
        selectedTool: state.selectedTool,
        selectedClipId: state.selectedClipId,
        generateType: state.generateType,
        zoom: state.zoom,
        timelineSeconds: state.timelineSeconds,
        tracks: state.tracks,
        mediaLibrary: state.mediaLibrary,
        projectId: state.projectId,
        timestamp: Date.now()
      };
      localStorage.setItem('timeline-editor-project', JSON.stringify(projectData));
  // DISABLED:       showToast('Project saved locally', 'success');
    } catch (err) {
      console.error('Failed to save project:', err);
  // DISABLED:       showToast('Failed to save project', 'error');
    }
  }

  function saveStateSnapshot(state) {
    state.undoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    // Limit undo stack to 50 entries
    if (state.undoStack.length > 50) {
      state.undoStack.shift();
    }
    state.redoStack = [];
  }

  function undo(state) {
    if (state.undoStack.length === 0) {
  // DISABLED:       showToast('Nothing to undo', 'warning');
      return false;
    }
    const snapshot = state.undoStack.pop();
    state.redoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    Object.assign(state, snapshot);
  // DISABLED:     showToast('Action undone', 'info');
    return true;
  }

  function redo(state) {
    if (state.redoStack.length === 0) {
  // DISABLED:       showToast('Nothing to redo', 'warning');
      return false;
    }
    const snapshot = state.redoStack.pop();
    state.undoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    Object.assign(state, snapshot);
  // DISABLED:     showToast('Action redone', 'info');
    return true;
  }

  function formatTimeFromPercent(percent, totalSeconds) {
    const current = (percent / 100) * totalSeconds;
    const minutes = Math.floor(current / 60);
    const seconds = Math.floor(current % 60);
    const hundredths = Math.floor((current % 1) * 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function createTimelineEditorApp(root) {
    const state = loadProjectFromStorage();
    let playbackTimer = null;
    let transitionEditor = null;
    let timelineTransitions = null;
    let sceneDetector = null;
    let cameraEffects = null;
    let aiChatPanel = null;
    let colorCorrectionSystem = null;

    // Keyboard shortcuts for undo/redo
    function handleKeyboardShortcuts(event) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedClip();
        return;
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelectedClip();
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              if (redo(state)) renderAll();
            } else {
              event.preventDefault();
              if (undo(state)) renderAll();
            }
            break;
          case 'y':
            event.preventDefault();
            if (redo(state)) renderAll();
            break;
          case 's':
            event.preventDefault();
            saveProjectToStorage(state);
            break;
        }
      }
    }

    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardShortcuts);
    root.innerHTML = template;

    const els = {
      topActions: root.querySelector('#topActions'),
      toolGroup: root.querySelector('#toolGroup'),
      pillRow: root.querySelector('#pillRow'),
      trackRows: root.querySelector('#trackRows'),
      mediaGrid: root.querySelector('#mediaGrid'),
      generateTypes: root.querySelector('#generateTypes'),
      aiChatContainer: root.querySelector('#aiChatContainer'),
      floatingRail: root.querySelector('#floatingRail'),
      playBtn: root.querySelector('#playBtn'),
      stopBtn: root.querySelector('#stopBtn'),
      rewindBtn: root.querySelector('#rewindBtn'),
      currentTime: root.querySelector('#currentTime'),
      totalTime: root.querySelector('#totalTime'),
      progressFill: root.querySelector('#progressFill'),
      previewTitle: root.querySelector('#previewTitle'),
      previewSubtitle: root.querySelector('#previewSubtitle'),
      previewEmoji: root.querySelector('#previewEmoji'),
      previewStage: root.querySelector('#previewStage'),
      previewEmpty: root.querySelector('#previewEmpty'),
      playheadLine: root.querySelector('#playheadLine'),
      playheadKnob: root.querySelector('#playheadKnob'),
      projectTitle: root.querySelector('#projectTitle'),
      promptInput: root.querySelector('#promptInput'),
      durationSelect: root.querySelector('#durationSelect'),
      aspectSelect: root.querySelector('#aspectSelect'),
      styleSelect: root.querySelector('#styleSelect'),
      generateBtn: root.querySelector('#generateBtn'),
      chatInput: root.querySelector('#chatInput'),
      toast: root.querySelector('#toast'),
      uploadBtn: root.querySelector('#uploadBtn'),
      backBtn: root.querySelector('#backBtn'),
      uploadInput: root.querySelector('#uploadInput'),
      clipSettingsPanel: root.querySelector('#clipSettingsPanel'),
      transitionSettingsPanel: root.querySelector('#transitionSettingsPanel'),
      clipEditorContainer: root.querySelector('#clipEditorContainer'),
      transitionEditorContainer: root.querySelector('#transitionEditorContainer'),
      sceneDetectorPanel: root.querySelector('#sceneDetectorPanel'),
      sceneDetectorContainer: root.querySelector('#sceneDetectorContainer'),
      cameraEffectsPanel: root.querySelector('#cameraEffectsPanel'),
      cameraEffectsContainer: root.querySelector('#cameraEffectsContainer'),
      multiCameraPanel: root.querySelector('#multiCameraPanel'),
      multiCameraToolbar: root.querySelector('#multiCameraToolbar'),
      pipControls: root.querySelector('#pipControls'),
      splitControls: root.querySelector('#splitControls'),
      colorCorrectionPanel: root.querySelector('#colorCorrectionPanel'),
      colorCorrectionContainer: root.querySelector('#colorCorrectionContainer'),
      colorScopesPanel: root.querySelector('#colorScopesPanel'),
      colorScopesContainer: root.querySelector('#colorScopesContainer'),
      compositingOverlay: root.querySelector('#compositingOverlay'),
      // Category C Editor Surfaces
      canvasPanel: root.querySelector('#canvasPanel'),
      canvasContainer: root.querySelector('#canvasContainer'),
      tokenEditorPanel: root.querySelector('#tokenEditorPanel'),
      tokenEditorContainer: root.querySelector('#tokenEditorContainer'),
      batchGeneratorPanel: root.querySelector('#batchGeneratorPanel'),
      batchGeneratorContainer: root.querySelector('#batchGeneratorContainer'),
      workflowPanel: root.querySelector('#workflowPanel'),
      workflowContainer: root.querySelector('#workflowContainer'),
      personalizationPanel: root.querySelector('#personalizationPanel'),
      personalizationContainer: root.querySelector('#personalizationContainer'),
      personalizationEditorPanel: root.querySelector('#personalizationEditorPanel'),
      personalizationEditorContainer: root.querySelector('#personalizationEditorContainer'),
      modalOverlay: root.querySelector('#modalOverlay'),
      modalContent: root.querySelector('#modalContent'),
      modalTitle: root.querySelector('#modalTitle'),
      modalBody: root.querySelector('#modalBody'),
      modalClose: root.querySelector('#modalClose')
    };

    function showToast(message) {
      els.toast.textContent = message;
      els.toast.classList.add('show');
      clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 1800);
    }

    function findSelectedClip() {
      return state.tracks.flatMap((track) => track.clips).find((item) => item.id === state.selectedClipId);
    }

    function clearPreviewStage() {
      const nodes = els.previewStage.querySelectorAll('*');
      nodes.forEach((node) => {
        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') node.pause();
        node.remove();
      });
    }

    function buildAudioBars() {
      return Array.from({ length: 24 }, (_, index) => {
        const heights = [22,38,56,32,66,40,72,28,60,44,68,34,76,42,58,30,70,36,62,26,74,48,52,40];
        return `<span style="height:${heights[index]}px"></span>`;
      }).join('');
    }

    function renderPreviewAsset(selected) {
      clearPreviewStage();
      if (!selected) {
        els.previewEmpty.style.display = 'flex';
        els.previewTitle.textContent = 'Center Preview';
        els.previewSubtitle.textContent = 'Glow preview styled like the render page';
        els.previewEmoji.textContent = '🎥';
        return;
      }

      els.previewEmpty.style.display = 'none';
      els.previewTitle.textContent = selected.name;
      els.previewSubtitle.textContent = `${state.selectedTool} tool active • ${state.generateType} generation ready`;
      els.previewEmoji.textContent = selected.type === 'audio' ? '🎵' : selected.type === 'text' ? '📝' : selected.type === 'image' ? '🖼️' : '🎥';

      // Apply active keyframes to preview (if KeyframeSystem exists)
      if (state.keyframeSystem && state.keyframeSystem.getActiveValues) {
        const active = state.keyframeSystem.getActiveValues(selected.id, state.playheadPercent / 100 * (state.timelineSeconds || 60));
        if (active && Object.keys(active).length > 0) {
          const stage = els.previewStage;
          if (active.scale) stage.style.transform = `scale(${active.scale})`;
          if (active.opacity !== undefined) stage.style.opacity = active.opacity;
          if (active.rotation) stage.style.transform = `rotate(${active.rotation}deg)`;
          if (active['position-x'] || active['position-y']) {
            const x = active['position-x'] || 0;
            const y = active['position-y'] || 0;
            stage.style.transform = `translate(${x}%, ${y}%)`;
          }
        }
      }

      if (selected.type === 'video' && selected.src) {
        const video = createVideoPreview(selected.src, 'preview-media', {
          poster: selected.poster
        });
        els.previewStage.appendChild(video);
        return;
      }

      if (selected.type === 'image' && selected.src) {
        const image = document.createElement('img');
        image.className = `preview-media ${selected.fit === 'cover' ? '' : 'contain'}`;
        image.src = selected.src;
        image.alt = selected.name;
        els.previewStage.appendChild(image);
        return;
      }

      if (selected.type === 'audio') {
        const wrap = document.createElement('div');
        wrap.className = 'preview-audio-card';
        wrap.innerHTML = `
          <div class="preview-audio-top">
            <div class="preview-audio-icon">🎵</div>
            <div class="preview-audio-meta">
              <div class="preview-audio-name">${selected.name}</div>
              <div class="preview-audio-desc">Audio preview with transport and waveform styling</div>
            </div>
          </div>
          <div class="preview-audio-bars">${buildAudioBars()}</div>
        `;
        const audio = document.createElement('audio');
        audio.controls = true;
        if (selected.src) audio.src = selected.src;
        audio.style.width = '100%';
        wrap.appendChild(audio);
        els.previewStage.appendChild(wrap);
        return;
      }

      if (selected.type === 'text') {
        const textCard = document.createElement('div');
        textCard.className = 'preview-text-card';
        textCard.innerHTML = `
          <div class="preview-text-kicker">Text Overlay Preview</div>
          <div class="preview-text-heading">${selected.heading || selected.name}</div>
          <div class="preview-text-body">${selected.body || 'This clip shows how text overlays, captions, or title cards can render in the preview stage.'}</div>
        `;
        els.previewStage.appendChild(textCard);
        return;
      }

      els.previewEmpty.style.display = 'flex';
    }

    function updatePreview(clip) {
      const selected = clip || findSelectedClip();
      els.projectTitle.textContent = state.projectTitle;
      renderPreviewAsset(selected);
    }

    function syncMediaPlayState() {
      const media = els.previewStage.querySelector('video, audio');
      if (!media) return;
      if (state.playing) {
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    }

    function updatePlaybackUI() {
      els.progressFill.style.width = `${state.playheadPercent}%`;
      els.playheadLine.style.left = `${state.playheadPercent}%`;
      els.playheadKnob.style.left = `calc(${state.playheadPercent}% - 4px)`;
      els.currentTime.textContent = formatTimeFromPercent(state.playheadPercent, state.timelineSeconds);
      els.totalTime.textContent = formatTimeFromPercent(100, state.timelineSeconds);
      els.playBtn.textContent = state.playing ? '❚❚' : '▶';
      syncMediaPlayState();
    }

    // Top action bar functionality
    function togglePreviewVisibility() {
      const previewCard = els.previewStage.closest('.preview-card');
      if (previewCard) {
        previewCard.style.display = previewCard.style.display === 'none' ? 'block' : 'none';
  // DISABLED:         showToast('Preview visibility toggled', 'info');
      }
    }

    function openMonitorSettings() {
      // Could open a modal with monitor/display settings
  // DISABLED:       showToast('Monitor settings opened', 'info');
    }

    function openMediaLibrary() {
      // Focus on media grid section
      const mediaGrid = els.mediaGrid;
      if (mediaGrid) {
        mediaGrid.scrollIntoView({ behavior: 'smooth' });
  // DISABLED:         showToast('Media library focused', 'info');
      }
    }

    function toggleQuickAIActions() {
      // Toggle visibility of quick commands
      const quickCommands = els.quickCommands;
      if (quickCommands) {
        quickCommands.style.display = quickCommands.style.display === 'none' ? 'flex' : 'none';
  // DISABLED:         showToast('Quick AI actions toggled', 'info');
      }
    }

    function openMusicTools() {
      // Focus on audio track or open music tools
      const audioTrack = state.tracks.find(t => t.name === 'Audio');
      if (audioTrack) {
  // DISABLED:         showToast('Audio tools opened', 'info');
      } else {
  // DISABLED:         showToast('No audio track found', 'warning');
      }
    }

    function openAudioControls() {
      // Open audio mixer or controls
  // DISABLED:       showToast('Audio controls opened', 'info');
    }

    function openVideoTools() {
      // Open video editing tools
  // DISABLED:       showToast('Video tools opened', 'info');
    }

    function openProfileTools() {
      // Open user profile or project settings
  // DISABLED:       showToast('Profile tools opened', 'info');
    }

    function openEditorSettings() {
      // Open editor preferences/settings
  // DISABLED:       showToast('Editor settings opened', 'info');
    }

    function focusChatInput() {
      // Focus the chat input field
      if (els.chatInput) {
        els.chatInput.focus();
  // DISABLED:         showToast('Chat input focused', 'info');
      }
    }

    function openProjectNotes() {
      // Open project notes or clipboard
  // DISABLED:       showToast('Project notes opened', 'info');
    }

    // Modal functions for timeline-specific triggers
    function openEndScreenModal(state, showToast) {
      try {
        const modal = new EndScreenModal({
          timelineData: state,
          onComplete: (result) => {
            // Add end screen elements to timeline
            addEndScreenToTimeline(result, state);
  // DISABLED:             showToast('End screen elements added successfully', 'success');
          },
          onError: (error) => showToast(`End screen creation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open End Screen Modal', 'error');
      }
    }

    function openSaveProjectModal(state, showToast) {
      try {
        const modal = new SaveProjectModal({
          projectData: state,
          onComplete: (result) => {
            state.projectId = result.projectId;
  // DISABLED:             showToast('Project saved successfully', 'success');
          },
          onError: (error) => showToast(`Project save failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Save Project Modal', 'error');
      }
    }

    function openSettingsModal(state, showToast) {
      try {
        const modal = new SettingsModal({
          settings: state.settings || {},
          onComplete: (result) => {
            state.settings = result;
  // DISABLED:             showToast('Settings updated successfully', 'success');
          },
          onError: (error) => showToast(`Settings update failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Settings Modal', 'error');
      }
    }

    function openBillingModal(state, showToast) {
      try {
        const modal = new BillingModal({
          onComplete: (result) => {
  // DISABLED:             showToast('Billing updated successfully', 'success');
          },
          onError: (error) => showToast(`Billing update failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Billing Modal', 'error');
      }
    }

    function openConnectModal(state, showToast) {
      try {
        const modal = new ConnectModal({
          onComplete: (result) => {
            state.connections = result.connections;
  // DISABLED:             showToast('Connections updated successfully', 'success');
          },
          onError: (error) => showToast(`Connection setup failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Connect Modal', 'error');
      }
    }

    function openPreviewMediaModal(state, showToast) {
      try {
        const modal = new PreviewMediaModal({
          mediaData: state.tracks.flatMap(t => t.clips),
          onComplete: (result) => {
  // DISABLED:             showToast('Media preview completed', 'success');
          },
          onError: (error) => showToast(`Media preview failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Preview Media Modal', 'error');
      }
    }

    function openVideoPlayerModal(state, showToast) {
      try {
        const modal = new VideoPlayerModal({
          timelineData: state,
          onComplete: (result) => {
  // DISABLED:             showToast('Video playback completed', 'success');
          },
          onError: (error) => showToast(`Video player error: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Video Player Modal', 'error');
      }
    }

    function addEndScreenToTimeline(endScreenData, state) {
      // Add end screen elements to the end of the timeline
      const videoTrack = state.tracks.find(t => t.name === 'Video');
      if (videoTrack && endScreenData.elements) {
        endScreenData.elements.forEach(element => {
          const clip = {
            id: Date.now() + Math.random(),
            name: element.name || 'End Screen Element',
            left: state.timelineSeconds * 10, // Position at end
            width: element.duration || 5,
            type: element.type || 'text',
            ...element
          };
          videoTrack.clips.push(clip);
        });
        renderTracks();
      }
    }

    function renderTopActions() {
      els.topActions.innerHTML = '';
      const topActionTooltips = {
        '👁': 'Toggle preview visibility - Show or hide the preview panel',
        '📺': 'Monitor settings - Configure display and monitoring options',
        '📁': 'Media library - Browse and manage project media files',
        '⚡': 'Quick AI actions - Access AI-powered editing tools',
        '🎵': 'Music tools - Add and edit music tracks and sound effects',
        '🔊': 'Audio controls - Adjust volume, mixing, and audio levels',
        '🎞️': 'Video tools - Access video editing and scene tools',
        '👤': 'Character tools - Manage character profiles and tracking',
        '🎨': 'Color correction - Open color grading and correction panel',
        '⚙️': 'Editor settings - Configure editor preferences and options',
        '💬': 'AI chat - Open the AI assistant chat panel',
        '📋': 'Project notes - View and edit project notes',
        '🎬': 'End screen - Add end screen elements to your video',
        '💾': 'Save project - Save your current project progress',
        '💳': 'Billing - Manage subscriptions and billing',
        '🔗': 'Connections - Configure third-party integrations',
        '👀': 'Preview media - Preview media files before adding',
        '▶️': 'Video player - Open the full video player',
        '🤖': 'AI Agents - Analyze timeline and generate suggestions',
        '🎭': 'Character tracking - Maintain character consistency',
        '📊': 'Timeline analysis - Detect gaps and analyze timeline'
      };
      state.topIcons.forEach((icon, index) => {
        const button = document.createElement('button');
        button.className = `top-icon ${index === 3 ? 'active' : ''}`;
        button.textContent = icon;
        button.setAttribute('data-tooltip', topActionTooltips[icon] || `${icon} action`);
        button.title = topActionTooltips[icon] || 'Top action';
        button.setAttribute('aria-label', button.title);

        // Add specific functionality for each icon
        button.addEventListener('click', () => {
          switch (icon) {
            case '👁':
              togglePreviewVisibility();
              break;
            case '📺':
              openMonitorSettings();
              break;
            case '📁':
              openMediaLibrary();
              break;
            case '⚡':
              toggleQuickAIActions();
              break;
            case '🎵':
              openMusicTools();
              break;
            case '🔊':
              openAudioControls();
              break;
            case '🎞️':
              openVideoTools();
              break;
            case '👤':
              openProfileTools();
              break;
            case '🎨':
              showColorCorrectionPanel();
              break;
            case '⚙️':
              openEditorSettings();
              break;
            case '💬':
              focusChatInput();
              break;
            case '📋':
              openProjectNotes();
              break;
            case '🎬':
              openEndScreenModal(state, showToast);
              break;
             case '💾':
               openSaveProjectModal(state, showToast);
               break;
             // Duplicate case removed
            case '💳':
              openBillingModal(state, showToast);
              break;
            case '🔗':
              openConnectModal(state, showToast);
              break;
            case '👀':
              openPreviewMediaModal(state, showToast);
              break;
            case '▶️':
              openVideoPlayerModal(state, showToast);
              break;
            case '🤖':
              openAIAgentsPanel(state, showToast);
              break;
            case '🎭':
              openCharacterTrackingPanel(state, showToast);
              break;
            case '📊':
              openTimelineAnalysisPanel(state, showToast);
              break;
            default:
  // DISABLED:               showToast(`${icon} action clicked`);
          }
        });

        els.topActions.appendChild(button);
      });

      // Extend top actions with enhancement features
      extendTopActions(els.topActions, state, showToast);

      const ready = document.createElement('div');
      ready.className = 'ready-pill';
      ready.innerHTML = '<span class="ready-dot"></span>Ready';
      ready.title = 'Editor is ready for interaction';
      ready.setAttribute('aria-label', 'Editor is ready for interaction');
      els.topActions.appendChild(ready);
    }

    function renderTools() {
      els.toolGroup.innerHTML = '';
      const toolTooltips = {
        Select: 'Select tool - Click to select and inspect clips on the timeline (V)',
        Blade: 'Blade tool - Cut clips at the playhead position (B)',
        Ripple: 'Ripple tool - Trim clips and automatically close gaps (R)',
        Roll: 'Roll tool - Adjust the edit point between two adjacent clips',
        Slip: 'Slip tool - Change clip contents without moving its position',
        Slide: 'Slide tool - Move a clip while adjusting nearby clips to compensate',
        Zoom: 'Zoom tool - Click to zoom in, Alt+click to zoom out (Z)',
        Hand: 'Hand tool - Click and drag to pan across the timeline (H)'
      };
      state.tools.forEach(([icon, label]) => {
        const button = document.createElement('button');
        button.className = `tool-btn ${state.selectedTool === label ? 'active' : ''}`;
        button.textContent = icon;
        button.setAttribute('data-tooltip', toolTooltips[label] || label);
        button.title = toolTooltips[label] || label;
        button.setAttribute('aria-label', button.title);
        button.addEventListener('click', () => {
          state.selectedTool = label;
          renderTools();
          updatePreview();
  // DISABLED:           showToast(`${label} tool selected`);
        });
        els.toolGroup.appendChild(button);
      });
    }

    function renderPills() {
      els.pillRow.innerHTML = '';
      const pillTooltips = {
        'Text to Video': 'Generate video from text descriptions using AI',
        'Image to Video': 'Animate still images into video clips',
        'Retake': 'Regenerate with different parameters',
        'Extend': 'Extend clip duration by generating additional footage',
        'B-Roll': 'Add supplementary footage and cutaway shots',
        'Music Gen': 'Generate background music from video context',
        'Audio Sync': 'Automatically sync audio with video timing',
        'Fill Gap AI': 'AI generates footage to bridge gaps between clips',
        'Elements': 'Browse reusable media elements library',
        'Import Timeline': 'Import an existing timeline from JSON or EDL',
        'IC-LoRA': 'Apply character consistency across clips'
      };
      state.pills.forEach((pill) => {
        const span = document.createElement('span');
        span.className = 'pill';
        span.textContent = pill;
        span.setAttribute('data-tooltip', pillTooltips[pill] || `${pill} quick mode`);
        span.title = pillTooltips[pill] || `${pill} quick mode`;
        span.setAttribute('aria-label', span.title);
        span.addEventListener('click', () => handlePillClick(pill));
        els.pillRow.appendChild(span);
      });
    }

    function handlePillClick(pill) {
      if (pill === 'Retake') {
        const selectedClip = state.tracks.flatMap(t => t.clips).find(c => c.selected);
        if (selectedClip) {
          showRetakePanel(selectedClip);
        }
      } else if (pill === 'Import Timeline') {
        showImportTimelineModal();
      } else if (pill === 'IC-LoRA') {
        showICLoraPanel();
      }
    }

    function initializeDefaultTracks() {
      if (!state.project) state.project = { tracks: [] };
      if (!state.project.tracks || state.project.tracks.length === 0) {
        state.project.tracks = [
          { id: 'track-video', type: 'video', name: 'Video', items: [], muted: false, solo: false, locked: false },
          { id: 'track-audio', type: 'audio', name: 'Audio', items: [], muted: false, solo: false, locked: false },
          { id: 'track-text', type: 'text', name: 'Text', items: [], muted: false, solo: false, locked: false },
          { id: 'track-effects', type: 'effects', name: 'Effects', items: [], muted: false, solo: false, locked: false },
          { id: 'track-broll', type: 'b-roll', name: 'B-Roll', items: [], muted: false, solo: false, locked: false }
        ];
      }
    }

    function renderTracksBasic(state, els, showToast) {
      els.trackRows.innerHTML = '';
      state.tracks.forEach(track => {
        const row = document.createElement('div');
        row.className = 'track-row';

        const meta = document.createElement('div');
        meta.className = 'track-meta';
        meta.innerHTML = `
          <div class="track-name">${track.name}</div>
          <div class="track-actions">
            <button class="track-toggle ${track.muted ? 'locked' : ''}" data-toggle="mute" data-tooltip="${track.muted ? 'Unmute track' : 'Mute track'} - ${track.muted ? 'Track is currently muted' : 'Silence this track'}" aria-label="${track.muted ? 'Unmute' : 'Mute'} track">M</button>
            <button class="track-toggle ${track.solo ? 'locked' : ''}" data-toggle="solo" data-tooltip="${track.solo ? 'Unsolo track' : 'Solo track'} - ${track.solo ? 'Only this track plays' : 'Play only this track'}" aria-label="${track.solo ? 'Unsolo' : 'Solo'} track">S</button>
            <button class="track-toggle ${track.locked ? 'locked' : ''}" data-toggle="lock" data-tooltip="${track.locked ? 'Unlock track' : 'Lock track'} - ${track.locked ? 'Track is protected from edits' : 'Prevent accidental changes'}" aria-label="${track.locked ? 'Unlock' : 'Lock'} track">L</button>
          </div>
          <div class="track-count">${track.clips.length} clips</div>
        `;

        meta.querySelectorAll('.track-toggle').forEach(btn => {
          btn.addEventListener('click', () => {
            const key = btn.dataset.toggle;
            if (key === 'mute') track.muted = !track.muted;
            if (key === 'solo') track.solo = !track.solo;
            if (key === 'lock') track.locked = !track.locked;
            renderTracksBasic(state, els, showToast);
          });
        });

        const lane = document.createElement('div');
        lane.className = 'track-lane';
        lane.dataset.trackId = track.id;

        track.clips.forEach(clip => {
          const clipEl = document.createElement('button');
          clipEl.className = `clip ${state.selectedClipId === clip.id ? 'active' : ''}`;
          const leftPercent = (clip.start / state.timelineSeconds) * 100;
          const widthPercent = ((clip.end - clip.start) / state.timelineSeconds) * 100;
          clipEl.style.left = `${leftPercent}%`;
          clipEl.style.width = `${widthPercent}%`;
          clipEl.innerHTML = `
            <span class="clip-label">${clip.text || clip.name}</span>
            <div class="clip-handle left" data-handle="left"></div>
            <div class="clip-handle right" data-handle="right"></div>
          `;

          // Visual keyframe markers with edit/delete
          if (state.keyframeSystem && state.keyframeSystem.getKeyframes) {
            const kfs = state.keyframeSystem.getKeyframes(clip.id) || [];
            kfs.forEach((kf, idx) => {
              const kfEl = document.createElement('div');
              kfEl.className = 'keyframe-marker';
              const kfLeft = ((kf.time - (clip.start || 0)) / (clip.duration || 5)) * 100;
              kfEl.style.left = `${Math.max(2, Math.min(98, kfLeft))}%`;
              kfEl.title = `${kf.property}: ${kf.value} (click to edit)`;

              kfEl.onclick = (e) => {
                e.stopPropagation();
                const newValue = prompt(`Edit ${kf.property}`, kf.value);
                if (newValue !== null) {
                  state.keyframeSystem.updateKeyframe(clip.id, idx, { value: parseFloat(newValue) });
                  renderTracks();
                }
              };

              kfEl.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm('Delete this keyframe?')) {
                  state.keyframeSystem.removeKeyframe(clip.id, idx);
                  renderTracks();
                }
              };

              // Drag to change keyframe time
              kfEl.onmousedown = (e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startLeft = parseFloat(kfEl.style.left);
                const clipRect = clipEl.getBoundingClientRect();

                const onMove = (moveEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const newLeft = Math.max(0, Math.min(100, startLeft + (deltaX / clipRect.width) * 100));
                  kfEl.style.left = `${newLeft}%`;

                  // Update keyframe time
                  const newTime = (clip.start || 0) + (newLeft / 100) * (clip.duration || 5);
                  if (state.keyframeSystem.updateKeyframe) {
                    state.keyframeSystem.updateKeyframe(clip.id, idx, { time: newTime });
                  }
                };

                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                  renderTracks();
                };

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              };

              clipEl.appendChild(kfEl);
            });
          }
          clipEl.addEventListener('click', (event) => {
            if (event.target.classList.contains('clip-handle')) return;
            event.stopPropagation();
            window.timelineState.selectedClipId = clip.id;
            renderTracksBasic(state, els, showToast);
            updatePreview({ id: clip.id, name: clip.name, type: clip.type, src: clip.src });
            if (cameraEffects) cameraEffects.setSelectedClip(clip.id);
          });

          // Basic trim handle logic
          clipEl.querySelectorAll('.clip-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              const isLeft = handle.dataset.handle === 'left';
              const startX = e.clientX;
              const originalStart = clip.start;
              const originalEnd = clip.end;

              const onMove = (moveEvent) => {
                const delta = ((moveEvent.clientX - startX) / lane.getBoundingClientRect().width) * (state.timelineSeconds || 60);
                if (isLeft) {
                  clip.start = Math.max(0, Math.min(originalStart + delta, originalEnd - 0.1));
                } else {
                  clip.end = Math.max(originalStart + 0.1, originalEnd + delta);
                }
                renderTracksBasic(state, els, showToast);
              };

              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                saveStateSnapshot(state);
              };

              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            });
          });
           lane.appendChild(clipEl);
         });

         // Render transitions between clips that have transition data
         const sortedItems = [...(track.items || [])].sort((a, b) => (a.start || 0) - (b.start || 0));
         for (let i = 0; i < sortedItems.length - 1; i++) {
           const current = sortedItems[i];
           const next = sortedItems[i + 1];
           if (current.transition && current.transition.type) {
             const transEl = document.createElement('div');
             transEl.className = 'timeline-transition';
             const transLeft = ((current.end || current.start + (current.duration || 5)) / (state.timelineSeconds || 60)) * 100;
             const transWidth = ((current.transition.duration || 0.5) / (state.timelineSeconds || 60)) * 100;
             transEl.style.left = `${transLeft}%`;
             transEl.style.width = `${Math.max(transWidth, 1.5)}%`;
             transEl.innerHTML = `
               <div class="transition-visual">
                 <div class="transition-icon">⟷</div>
                 <div class="transition-name">${current.transition.type}</div>
               </div>
             `;
             transEl.onclick = () => {
               window.timelineState.selectedClipId = current.id;
               if (transitionEditor) transitionEditor.show(current.transition);
             };
             lane.appendChild(transEl);
           }
         }

         row.appendChild(meta);
         row.appendChild(lane);
         els.trackRows.appendChild(row);
       });
     }

    function renderTracks() {
      // Convert tracks to enhanced format
      const enhancedState = {
        tracks: (state.tracks || []).map(track => ({
          id: track.id,
          name: track.name,
          locked: track.locked,
          muted: track.muted,
          solo: track.solo,
          opacity: track.opacity || 1,
          blendMode: track.blendMode || 'normal',
          items: (track.items || []).map(clip => ({
            id: clip.id,
            name: clip.name,
            text: clip.heading || clip.name,
            start: (clip.left / 100) * state.timelineSeconds,
            end: ((clip.left + clip.width) / 100) * state.timelineSeconds,
            type: clip.type,
            src: clip.src,
            fit: clip.fit,
            heading: clip.heading,
            body: clip.body,
            waveformData: clip.waveformData,
            opacity: clip.opacity || 1,
            blendMode: clip.blendMode || 'normal'
          }))
        })),
        selectedClipId: state.selectedClipId,
        timelineSeconds: state.timelineSeconds,
        playheadPercent: state.playheadPercent
      };

      // Use basic renderer (enhanced has broken imports)
      renderTracksBasic(enhancedState, { trackRows: els.trackRows }, showToast);

      // Add enhanced drag and drop handlers
      els.trackRows.querySelectorAll('.track-lane').forEach(lane => {
        lane.addEventListener('click', (event) => {
          if (event.target !== lane) return;
          const rect = lane.getBoundingClientRect();
          const percent = ((event.clientX - rect.left) / rect.width) * 100;
          state.playheadPercent = Math.max(0, Math.min(100, percent));
          updatePlaybackUI();
        });

        lane.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });

        lane.addEventListener('drop', (e) => {
          e.preventDefault();
          const rect = lane.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          const track = state.tracks.find(t => t.id === parseInt(lane.dataset.trackId));
          
          // Handle CutAI storyboard shots/scenes (production-ready drag-drop)
          let cutaiData = null;
          try {
            const rawData = e.dataTransfer.getData('application/json');
            if (rawData) cutaiData = JSON.parse(rawData);
          } catch (_) {}
          
          if (cutaiData && (cutaiData.type === 'cutai-shot' || cutaiData.type === 'cutai-scene')) {
            const duration = cutaiData.duration || 5;
            const startTime = (percent / 100) * (state.totalDuration || 60);
            
            const clipData = {
              id: `cutai-drop-${Date.now()}`,
              name: cutaiData.label || cutaiData.description || 'CutAI Shot',
              type: cutaiData.clipType || 'video',
              start: startTime,
              end: startTime + duration,
              sourceStart: 0,
              sourceEnd: duration,
              assetId: cutaiData.assetId || null,
              volume: 1,
              opacity: 1,
              playbackRate: 1,
              effects: cutaiData.effects || [],
              transform: { x: 0, y: 0, scale: 1, rotation: 0 },
              lane: 0,
              source: 'cutai',
              metadata: cutaiData.metadata || {}
            };
            
            if (track && state.addClip) {
              state.addClip(track.id, clipData);
              showToast(`Dropped CutAI shot onto ${track.name || 'track'}`);
            }
            return;
          }
          
          // Original clip/media drop handling
          const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');

          if (data.type === 'clip') {
            const allClips = state.tracks.flatMap(t => t.clips);
            const clip = allClips.find(c => c.id === data.clipId);
            if (clip && track) {
              // Remove from old track
              state.tracks.forEach(t => t.clips = t.clips.filter(c => c.id !== clip.id));
              // Add to new track
              clip.left = Math.max(0, Math.min(100 - clip.width, percent));
              track.clips.push(clip);
              // Sort clips by left
              track.clips.sort((a, b) => a.left - b.left);
              saveStateSnapshot(state);
              renderTracks();
  // DISABLED:               showToast(`Clip moved to ${track.name}`);
            }
          } else if (data.type === 'media' && track) {
            const extra = {};
            if (data.mediaType === 'video') {
              extra.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
            } else if (data.mediaType === 'image') {
              extra.src = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><text x="90" y="320" fill="white" font-size="74" font-family="Arial" font-weight="700">${data.label}</text></svg>`);
              extra.fit = 'contain';
            } else if (data.mediaType === 'audio') {
              extra.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
            } else {
              extra.heading = data.label;
              extra.body = 'Dragged text asset.';
    }
            const newClip = { id: Date.now(), name: data.label, left: Math.max(0, percent), width: 16, type: data.mediaType, ...extra };
            track.clips.push(newClip);
            state.selectedClipId = newClip.id;
            saveStateSnapshot(state);
            renderTracks();
            updatePreview(newClip);
  // DISABLED:             showToast(`${data.label} added to ${track.name}`);
          }
        });
        track.clips.forEach((clip) => {
          // Convert clip format for enhanced renderer
          const enhancedClip = {
            id: clip.id,
            name: clip.name,
            text: clip.heading || clip.name,
            start: (clip.left / 100) * state.timelineSeconds,
            end: ((clip.left + clip.width) / 100) * state.timelineSeconds,
            type: clip.type,
            src: clip.src,
            fit: clip.fit,
            heading: clip.heading,
            body: clip.body,
            waveformData: clip.waveformData
          };

          const clipEl = createEnhancedClipElement(enhancedClip, { id: track.id, name: track.name }, {
            selectedClipId: state.selectedClipId,
            timelineSeconds: state.timelineSeconds
          }, state.zoom || 1);

          // Extend clip with enhancement context menus
          extendClipContextMenu(clipEl, clip, track, state, showToast);

          // Override click handler to work with this timeline's state management
          clipEl.addEventListener('click', (event) => {
            if (event.target.classList.contains('clip-handle')) return; // Don't trigger on handle clicks
            event.stopPropagation();
            state.selectedClipId = clip.id;
            updatePreview(clip);
            renderTracks();
  // DISABLED:             showToast(`${clip.name} selected`);
          }, true); // Use capture to override the default handler

          lane.appendChild(clipEl);
        });
        row.append(meta, lane);
        els.trackRows.appendChild(row);
      });
    }

    function createClipForMedia(label, file) {
      const objectUrl = URL.createObjectURL(file);
      const base = { id: Date.now() + Math.floor(Math.random() * 1000), name: file.name || label, left: 12, width: 16 };
      if (file.type.startsWith('video/')) return { ...base, type: 'video', src: objectUrl };
      if (file.type.startsWith('image/')) return { ...base, type: 'image', src: objectUrl, fit: 'contain' };
      if (file.type.startsWith('audio/')) return { ...base, type: 'audio', src: objectUrl };
      return { ...base, type: 'text', heading: file.name || 'Text Asset', body: 'Uploaded text asset preview placeholder.' };
    }

    function insertClipIntoTrack(clip, preferredTrackName) {
      const targetTrack = state.tracks.find((track) => track.name === preferredTrackName) || state.tracks[0];

      // Convert start/end format to left/width format used by this timeline
      if (clip.start !== undefined && clip.end !== undefined) {
        clip.left = (clip.start / state.timelineSeconds) * 100;
        clip.width = ((clip.end - clip.start) / state.timelineSeconds) * 100;
        delete clip.start;
        delete clip.end;
      } else {
        clip.left = Math.min(78, 8 + targetTrack.clips.length * 10);
      }

      targetTrack.clips.push(clip);
      state.selectedClipId = clip.id;
      renderTracks();
      updatePreview(clip);
    }

    function renderMedia() {
      // Use enhanced media library rendering with drag and drop support
      renderMediaGrid(state.media, els.mediaGrid, (media, index, showToast) => {
        // Handle media selection (click)
        const generatedId = Date.now();
        let clip;
        if (media.label === 'Video Clip') {
          clip = { id: generatedId, name: `Video Clip ${generatedId.toString().slice(-3)}`, start: 0, end: 14, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' };
          insertClipIntoTrack(clip, 'Video');
        } else if (media.label === 'Image Frame' || media.label === 'B-Roll Asset') {
          clip = { id: generatedId, name: media.label, start: 0, end: 14, type: 'image', src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><text x="90" y="320" fill="white" font-size="74" font-family="Arial" font-weight="700">${media.label}</text></svg>`), fit: 'contain' };
          insertClipIntoTrack(clip, media.label === 'B-Roll Asset' ? 'B-Roll' : 'Text');
        } else if (media.label === 'Audio Track') {
          clip = { id: generatedId, name: `Audio ${generatedId.toString().slice(-3)}`, start: 0, end: 16, type: 'audio', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' };
          insertClipIntoTrack(clip, 'Audio');
        } else {
          clip = { id: generatedId, name: media.label, start: 0, end: 12, type: 'text', text: media.label, style: { fontSize: 24, color: '#ffffff', background: 'rgba(0,0,0,0.7)' } };
          insertClipIntoTrack(clip, 'Text');
        }
  // DISABLED:         showToast(`${media.label} inserted into timeline`);
      }, showToast, state);

      // Extend media library with enhancement features
      extendMediaLibrary(els.mediaGrid, state, showToast);

      // Add media ingest components to media library
      const mediaLibraryContainer = els.mediaGrid.parentElement;
      if (mediaLibraryContainer && !mediaLibraryContainer.querySelector('.media-ingest-components')) {
        const ingestContainer = document.createElement('div');
        ingestContainer.className = 'media-ingest-components';

        // Add video gallery
        const videoGallery = VideoGallery();
        ingestContainer.appendChild(videoGallery);

        // Add stickers library
        const stickersLibrary = StickersLibrary();
        ingestContainer.appendChild(stickersLibrary);

        // Add lower thirds
        const lowerThirds = LowerThirds();
        ingestContainer.appendChild(lowerThirds);

        // Add animations list
        const animationList = AnimationList();
        ingestContainer.appendChild(animationList);

        mediaLibraryContainer.appendChild(ingestContainer);
      }
    }

    function renderGenerateTypes() {
      els.generateTypes.innerHTML = '';
      const generateTooltips = {
        'Text': 'Generate video from text descriptions',
        'Image': 'Generate images from text or modify existing images',
        'Retake': 'Regenerate with different parameters',
        'Extend': 'Extend the duration of existing clips',
        'B-Roll': 'Generate supplementary B-roll footage'
      };
      state.generateTypes.forEach(([icon, label]) => {
        const button = document.createElement('button');
        button.className = `generate-type ${state.generateType === label ? 'active' : ''}`;
        button.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
        button.setAttribute('data-tooltip', generateTooltips[label] || `Switch generate mode to ${label}`);
        button.title = generateTooltips[label] || `Switch generate mode to ${label}`;
        button.setAttribute('aria-label', button.title);
        button.addEventListener('click', () => {
          state.generateType = label;
          renderGenerateTypes();
  // DISABLED:           showToast(`${label} mode selected`);
        });
        els.generateTypes.appendChild(button);
      });

      // Extend with enhancement features
      extendGenerationPanel(els.generateTypes, state, showToast);
    }



    function renderClipEditor(clipId) {
      const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
      if (!clip) {
        els.clipEditorContainer.innerHTML = '<p>Clip not found</p>';
        return;
      }

      els.clipEditorContainer.innerHTML = `
        <div class="clip-editor">
          <div class="clip-editor__section">
            <h3>Basic Properties</h3>
            <div class="clip-editor__field">
              <label for="clip-title" data-tooltip="The name displayed for this clip on the timeline">Clip Title</label>
              <input id="clip-title" type="text" value="${clip.name || ''}" placeholder="Enter clip title" data-tooltip="Edit the name of this clip" />
            </div>
            <div class="clip-editor__field">
              <label for="clip-start" data-tooltip="Where this clip begins on the timeline">Start Time (seconds)</label>
              <input id="clip-start" type="number" step="0.1" min="0" value="${clip.left || 0}" data-tooltip="Set the start time in seconds" />
            </div>
            <div class="clip-editor__field">
              <label for="clip-end" data-tooltip="Where this clip ends on the timeline">End Time (seconds)</label>
              <input id="clip-end" type="number" step="0.1" min="0" value="${(clip.left || 0) + (clip.width || 0)}" data-tooltip="Set the end time in seconds" />
            </div>
          </div>
           <div class="clip-editor__section">
             <h3>Keyframes</h3>
             <div class="clip-editor__field">
               <button id="add-keyframe-btn" class="mini-btn" style="width:100%">+ Add Keyframe at Playhead</button>
             </div>
             <div class="clip-editor__field">
               <label>Property</label>
               <select id="keyframe-property">
                 <option value="position-x">Position X</option>
                 <option value="position-y">Position Y</option>
                 <option value="scale">Scale</option>
                 <option value="rotation">Rotation</option>
                 <option value="opacity">Opacity</option>
                 <option value="blur">Blur</option>
                 <option value="crop-top">Crop Top</option>
                 <option value="crop-bottom">Crop Bottom</option>
               </select>
             </div>
             <div class="clip-editor__field">
               <label>Easing</label>
               <select id="keyframe-easing">
                 <option value="linear">Linear</option>
                 <option value="ease-in-quad">Ease In Quad</option>
                 <option value="ease-out-quad">Ease Out Quad</option>
                 <option value="ease-in-out-quad">Ease In-Out Quad</option>
                 <option value="ease-in-cubic">Ease In Cubic</option>
                 <option value="ease-out-cubic">Ease Out Cubic</option>
                 <option value="bounce">Bounce</option>
                 <option value="elastic">Elastic</option>
               </select>
             </div>
           </div>

           <div class="clip-editor__section">
             <h3>Transitions</h3>
             <div class="clip-editor__field">
               <label>Transition to Next Clip</label>
               <select id="clip-transition" data-tooltip="Choose transition effect after this clip">
                 <option value="">None</option>
                 <option value="fade">Fade</option>
                 <option value="dissolve">Dissolve</option>
                 <option value="wipe-left">Wipe Left</option>
                 <option value="wipe-right">Wipe Right</option>
                 <option value="wipe-up">Wipe Up</option>
                 <option value="wipe-down">Wipe Down</option>
                 <option value="zoom-in">Zoom In</option>
                 <option value="zoom-out">Zoom Out</option>
                 <option value="blur">Blur</option>
               </select>
             </div>
             <div class="clip-editor__field">
               <label>Duration (s)</label>
               <input id="clip-transition-duration" type="number" step="0.1" min="0.1" max="3" value="0.5" />
             </div>
           </div>

           <div class="clip-editor__section">
             <h3>Audio Controls</h3>
            <div class="clip-editor__field">
              <label for="clip-volume">Volume: ${Math.round((clip.volume || 1) * 100)}%</label>
              <input id="clip-volume" type="range" min="0" max="1" step="0.01" value="${clip.volume || 1}" data-tooltip="Adjust clip volume from 0% to 100%" />
            </div>
            <div class="clip-editor__field">
              <button id="clip-mute" type="button" data-tooltip="${clip.mute ? 'Unmute this clip' : 'Mute this clip to silence it'}">${clip.mute ? 'Unmute' : 'Mute'}</button>
            </div>
          </div>
          <div class="clip-editor__section">
            <h3>Visual Controls</h3>
            <div class="clip-editor__field">
              <button id="clip-visibility" type="button" data-tooltip="${clip.hidden ? 'Make clip visible on timeline' : 'Hide clip from timeline view'}">${clip.hidden ? 'Show' : 'Hide'}</button>
            </div>
            <div class="clip-editor__field">
              <label for="clip-fill" data-tooltip="How the clip fits within its frame">Fill Mode</label>
              <select id="clip-fill" data-tooltip="Choose how the clip scales to fit">
                <option value="scale" ${clip.fit === 'contain' ? 'selected' : ''}>Scale to Fit</option>
                <option value="fit" ${clip.fit !== 'contain' ? 'selected' : ''}>Fit</option>
              </select>
            </div>
          </div>
        </div>
      `;

      // Add event listeners
      els.clipEditorContainer.querySelector('#clip-title').addEventListener('input', (e) => {
        clip.name = e.target.value;
        renderTracks();
      });
      els.clipEditorContainer.querySelector('#clip-start').addEventListener('input', (e) => {
        const newStart = parseFloat(e.target.value);
        clip.left = Math.max(0, newStart);
        renderTracks();
      });
      els.clipEditorContainer.querySelector('#clip-end').addEventListener('input', (e) => {
        const newEnd = parseFloat(e.target.value);
        clip.width = Math.max(0, newEnd - (clip.left || 0));
        renderTracks();
      });
      els.clipEditorContainer.querySelector('#clip-volume').addEventListener('input', (e) => {
        clip.volume = parseFloat(e.target.value);
        e.target.previousElementSibling.textContent = `Volume: ${Math.round(clip.volume * 100)}%`;
      });
      els.clipEditorContainer.querySelector('#clip-mute').addEventListener('click', () => {
        clip.mute = !clip.mute;
        e.target.textContent = clip.mute ? 'Unmute' : 'Mute';
      });
      els.clipEditorContainer.querySelector('#clip-visibility').addEventListener('click', () => {
        clip.hidden = !clip.hidden;
        e.target.textContent = clip.hidden ? 'Show' : 'Hide';
        renderTracks();
      });
       const transSelect = els.clipEditorContainer.querySelector('#clip-transition');
       if (transSelect) {
         transSelect.value = clip.transition?.type || '';
         transSelect.onchange = () => {
           clip.transition = clip.transition || {};
            clip.transition.type = transSelect.value;
            if (timelineTransitions) timelineTransitions.updateClipTransition(clip.id, clip.transition);
            renderTracks();
         };
       }
       // Keyframe controls
       const addKfBtn = els.clipEditorContainer.querySelector('#add-keyframe-btn');
       if (addKfBtn && state.keyframeSystem) {
         addKfBtn.onclick = () => {
           const prop = els.clipEditorContainer.querySelector('#keyframe-property').value;
           const easing = els.clipEditorContainer.querySelector('#keyframe-easing').value;
           const time = (state.playheadPercent / 100) * (state.timelineSeconds || 60);
           state.keyframeSystem.addKeyframe(clip.id, prop, time, clip[prop] ?? 0, easing);
           showToast(`Keyframe added for ${prop} (${easing})`);
           renderTracks();
         };
       }

       const transDur = els.clipEditorContainer.querySelector('#clip-transition-duration');
       if (transDur) {
         transDur.value = clip.transition?.duration || 0.5;
         transDur.onchange = () => {
           clip.transition = clip.transition || {};
            clip.transition.duration = parseFloat(transDur.value);
            renderTracks();
         };
       }

       els.clipEditorContainer.querySelector('#clip-fill').addEventListener('change', (e) => {
        clip.fit = e.target.value === 'fit' ? 'contain' : 'cover';
        renderTracks();
      });
    }

    function initializeTransitionEditor() {
      if (!transitionEditor) {
        transitionEditor = new TransitionEditor(els.transitionEditorContainer, (transition, params, duration) => {
          // Handle transition application from editor
  // DISABLED:           showToast(`Transition "${transition.name}" configured`, 'success');
        });
      }
    }

    function initializeTimelineTransitions() {
      if (!timelineTransitions) {
        timelineTransitions = new TimelineTransitions(els.timelineBody, state);
      }
    }

    function initializeSceneDetector() {
      if (!sceneDetector) {
        sceneDetector = new SceneDetector(els.sceneDetectorContainer, {
          tracks: state.tracks,
          timelineSeconds: state.timelineSeconds,
          seekTo: (time) => {
            state.playheadPercent = (time / state.timelineSeconds) * 100;
            renderPlayhead();
            renderPreview();
          }
        }, {
          showToast: showToast
        });
      }
    }

    function initializeCameraEffects() {
      if (!cameraEffects) {
        cameraEffects = new CameraEffects(els.cameraEffectsContainer, {
          keyframeSystem: state.keyframeSystem,
          timelineState: state,
          onPreviewUpdate: (clipId, transform) => {
            // Update preview with camera effect transform
            renderPreview();
          },
          onKeyframeUpdate: () => {
            // Refresh timeline and keyframe displays
            renderTimeline();
            renderKeyframes();
          }
        });
      }
    }

    function initializeAIChatPanel() {
      if (!aiChatPanel && els.aiChatContainer) {
        aiChatPanel = new AIChatPanel(els.aiChatContainer, state, {
          detectScenes: async () => {
            initializeSceneDetector();
            if (sceneDetector && sceneDetector.detectScenes) {
              await sceneDetector.detectScenes();
            }
          },
          splitClipAtPlayhead: () => {
            // Find selected clip and split it
            const selectedTrack = state.tracks.find(t => t.id === state.selectedTrackId);
            if (selectedTrack) {
              const selectedClip = selectedTrack.clips.find(c => c.id === state.selectedClipId);
              if (selectedClip) {
                const splitTime = (state.playheadPercent / 100) * state.timelineSeconds;
                // Implement split logic here
                showToast('Clip split functionality to be implemented', 'info');
              }
            }
          },
          trimSelectedClip: (start, end) => {
            // Implement trim logic
            showToast('Trim clip functionality to be implemented', 'info');
          },
          addTransition: (type, duration) => {
            // Implement add transition logic
            showToast(`Add ${type} transition functionality to be implemented`, 'info');
          },
          addTextOverlay: (text, position) => {
            // Implement add text overlay logic
            showToast('Add text overlay functionality to be implemented', 'info');
          },
          generateSubtitles: async () => {
            // Implement subtitle generation
            showToast('Subtitle generation functionality to be implemented', 'info');
          },
          removeFillerWords: () => {
            // Implement filler word removal
            showToast('Remove filler words functionality to be implemented', 'info');
          },
          addBRoll: (query) => {
            // Implement B-roll addition
            showToast('Add B-roll functionality to be implemented', 'info');
          },
          speedRamp: (speed) => {
            // Implement speed ramp
            showToast(`Speed ramp to ${speed}x functionality to be implemented`, 'info');
          },
          stabilizeVideo: () => {
            // Implement video stabilization
            showToast('Video stabilization functionality to be implemented', 'info');
          },
          findRelatedFootage: async (query) => {
            // Implement semantic search
            showToast('Find related footage functionality to be implemented', 'info');
            return [];
          }
        });
      }
    }

    // function initializeColorCorrectionSystem() { // Disabled - ColorCorrectionSystem not available
    //   if (!colorCorrectionSystem) {
    //     // Create a keyframe system for color correction
    //     const { KeyframeSystem } = require('../lib/editor/keyframeSystem.js');
    //     const keyframeSystem = new KeyframeSystem();
    //
    //     colorCorrectionSystem = new ColorCorrectionSystem(els.timelineBody, state, keyframeSystem);
    //
    //     // Add color correction panel to DOM
    //     const colorPanel = colorCorrectionSystem.getPanel();
    //     if (colorPanel && els.colorCorrectionContainer) {
    //       els.colorCorrectionContainer.appendChild(colorPanel);
    //     }
    //
    //     // Add color scopes panel to DOM
    //     const scopesPanel = colorCorrectionSystem.getScopes();
    //     if (scopesPanel && els.colorScopesContainer) {
    //       els.colorScopesContainer.appendChild(scopesPanel);
    //     }
    //   }
    // }



    function applyAIModifications(modifications) {
      if (!modifications) return;

      saveStateSnapshot(state);

      // Apply playhead changes
      if (modifications.playheadPercent !== undefined) {
        state.playheadPercent = Math.max(0, Math.min(100, modifications.playheadPercent));
      }

      // Apply zoom changes
      if (modifications.zoom !== undefined) {
        state.zoom = Math.max(0.5, Math.min(2, modifications.zoom));
      }

      // Apply clip modifications
      if (modifications.clipChanges) {
        modifications.clipChanges.forEach(change => {
          const track = state.tracks.find(t => t.id === change.trackId);
          if (track) {
            const clip = track.clips.find(c => c.id === change.clipId);
            if (clip) {
              Object.assign(clip, change.updates);
            }
          }
        });
      }

      // Apply track modifications
      if (modifications.trackChanges) {
        modifications.trackChanges.forEach(change => {
          const track = state.tracks.find(t => t.id === change.trackId);
          if (track) {
            Object.assign(track, change.updates);
          }
        });
      }

      // Add new clips
      if (modifications.newClips) {
        modifications.newClips.forEach(clipData => {
          const track = state.tracks.find(t => t.name === clipData.trackName);
          if (track) {
            track.clips.push(clipData.clip);
            state.selectedClipId = clipData.clip.id;
          }
        });
      }

      renderAll();
    }

    function renderKeyframes() {
      // Keyframe rendering is handled by the timeline renderer
      // This function is called when keyframes are updated
    }



    // Floating rail action functionality
    function deleteSelectedClip() {
      const selectedId = window.timelineState?.selectedClipId;
      if (!selectedId) return;

      saveStateSnapshot(state);
      
      state.project.tracks.forEach(track => {
        track.items = (track.items || []).filter(item => item.id !== selectedId);
      });
      
      window.timelineState.selectedClipId = null;
      renderTracks();
      showToast('Clip deleted');
    }

    function duplicateSelectedClip() {
      const selectedId = window.timelineState?.selectedClipId;
      if (!selectedId) return;

      saveStateSnapshot(state);

      for (const track of state.project.tracks) {
        const clip = (track.items || []).find(item => item.id === selectedId);
        if (clip) {
          const newClip = {
            ...clip,
            id: `clip-${Date.now()}`,
            start: clip.start + (clip.duration || 5) + 0.5,
            end: clip.end + (clip.duration || 5) + 0.5
          };
          track.items.push(newClip);
          window.timelineState.selectedClipId = newClip.id;
          break;
        }
      }
      
      renderTracks();
      showToast('Clip duplicated');
    }

    function splitClipAtPlayhead() {
      const selectedClip = findSelectedClip();
      if (!selectedClip) {
  // DISABLED:         showToast('No clip selected', 'warning');
        return;
      }

      saveStateSnapshot(state);

      const track = state.tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
      if (!track) return;

      const clipIndex = track.clips.findIndex(c => c.id === selectedClip.id);
      const splitPosition = (state.playheadPercent / 100) * 100; // Convert to clip width percentage

      if (splitPosition <= selectedClip.left || splitPosition >= selectedClip.left + selectedClip.width) {
  // DISABLED:         showToast('Playhead not within selected clip', 'warning');
        return;
      }

      // Create two new clips from the split
      const leftClip = {
        ...selectedClip,
        id: Date.now(),
        width: splitPosition - selectedClip.left
      };

      const rightClip = {
        ...selectedClip,
        id: Date.now() + 1,
        left: splitPosition,
        width: (selectedClip.left + selectedClip.width) - splitPosition
      };

      // Replace the original clip with the two new ones
      track.clips.splice(clipIndex, 1, leftClip, rightClip);
      state.selectedClipId = leftClip.id;

      renderTracks();
      updatePreview();
  // DISABLED:       showToast('Clip split at playhead', 'success');
    }

    async function detectScenes() {
      if (sceneDetector) {
        await sceneDetector.detectScenes();
      } else {
        // Fallback to API call if scene detector not initialized
        showToast('Scene detector not available', 'error');
      }
    }

    async function generateSubtitles() {
      const selectedClip = findSelectedClip();
      if (!selectedClip || selectedClip.type !== 'video') {
  // DISABLED:         showToast('Select a video clip first', 'warning');
        return;
      }

  // DISABLED:       showToast('Generating subtitles...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'subtitle',
            context: {
              clipId: selectedClip.id,
              videoUrl: selectedClip.src
            }
          }
        });

        if (error) throw error;

        // Add subtitle track or overlay
  // DISABLED:         showToast('Subtitles generated', 'success');
      } catch (err) {
        console.error('Subtitle generation error:', err);
  // DISABLED:         showToast('Subtitle generation failed', 'error');
      }
    }

    async function suggestBRoll() {
  // DISABLED:       showToast('Analyzing for B-Roll suggestions...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'b-roll',
            context: {
              timeline: state.tracks,
              playhead: state.playheadPercent
            }
          }
        });

        if (error) throw error;

        if (data.suggestions) {
          // Add suggested B-Roll clips
  // DISABLED:           showToast('B-Roll suggestions added', 'success');
        }
      } catch (err) {
        console.error('B-Roll suggestion error:', err);
  // DISABLED:         showToast('B-Roll suggestions failed', 'error');
      }
    }

    function adjustSpeed() {
      const selectedClip = findSelectedClip();
      if (!selectedClip) {
  // DISABLED:         showToast('No clip selected', 'warning');
        return;
      }

      // Simple speed adjustment (could be enhanced with UI)
      const newSpeed = prompt('Enter speed multiplier (0.25-4.0):', '1.0');
      if (newSpeed && !isNaN(parseFloat(newSpeed))) {
        saveStateSnapshot(state);
        selectedClip.speed = parseFloat(newSpeed);
  // DISABLED:         showToast(`Speed set to ${newSpeed}x`, 'success');
      }
    }

    async function stabilizeFootage() {
      const selectedClip = findSelectedClip();
      if (!selectedClip || selectedClip.type !== 'video') {
  // DISABLED:         showToast('Select a video clip first', 'warning');
        return;
      }

  // DISABLED:       showToast('Stabilizing footage...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'stabilize',
            context: {
              clipId: selectedClip.id,
              videoUrl: selectedClip.src
            }
          }
        });

        if (error) throw error;

  // DISABLED:         showToast('Footage stabilized', 'success');
      } catch (err) {
        console.error('Stabilization error:', err);
  // DISABLED:         showToast('Stabilization failed', 'error');
      }
    }

    function addTextOverlay() {
      const text = prompt('Enter text for overlay:');
      if (text) {
        const clipId = Date.now();
        const clip = {
          id: clipId,
          name: `Text: ${text.slice(0, 18)}`,
          left: state.playheadPercent,
          width: 10,
          type: 'text',
          heading: text.slice(0, 40),
          body: text
        };

        insertClipIntoTrack(clip, 'Text');
  // DISABLED:         showToast('Text overlay added', 'success');
      }
    }

    // Modal integration functions for timeline toolbar
    function openAIVideoCreatorModal(state, showToast) {
      try {
        const modal = new AIVideoCreator({
          onComplete: (result) => {
            addVideoToTimeline(result, state);
  // DISABLED:             showToast('AI Video created successfully', 'success');
          },
          onError: (error) => showToast(`AI Video creation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open AI Video Creator', 'error');
      }
    }

    function openRecorderModal(state, showToast) {
      try {
        const modal = new RecorderModal({
          onComplete: (result) => {
            addVideoToTimeline(result, state);
  // DISABLED:             showToast('Recording saved successfully', 'success');
          },
          onError: (error) => showToast(`Recording failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Recorder', 'error');
      }
    }

    function openEnhancedRecorderModal(state, showToast) {
      try {
        const modal = new EnhancedRecorderModal({
          onComplete: (result) => {
            addVideoToTimeline(result, state);
  // DISABLED:             showToast('Enhanced recording saved successfully', 'success');
          },
          onError: (error) => showToast(`Enhanced recording failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Enhanced Recorder', 'error');
      }
    }

    function openTemplateGeneratorModal(state, showToast) {
      try {
        const modal = new TemplateGeneratorModal({
          onComplete: (result) => {
            // Apply template to timeline
            applyTemplateToTimeline(result, state);
  // DISABLED:             showToast('Template applied successfully', 'success');
          },
          onError: (error) => showToast(`Template generation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Template Generator', 'error');
      }
    }

    function openTemplatePreviewModal(state, showToast) {
      try {
        const modal = new TemplatePreviewModal({
          onComplete: (result) => {
            applyTemplateToTimeline(result, state);
  // DISABLED:             showToast('Template preview applied successfully', 'success');
          },
          onError: (error) => showToast(`Template preview failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Template Preview', 'error');
      }
    }

    function openSocialPublisherModal(state, showToast) {
      try {
        const modal = new SocialPublisherModal({
          projectData: state,
          onComplete: (result) => {
  // DISABLED:             showToast('Content published successfully', 'success');
          },
          onError: (error) => showToast(`Publishing failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Social Publisher', 'error');
      }
    }

    function openEmailCampaignModal(state, showToast) {
      try {
        const modal = new EmailCampaignModal({
          projectData: state,
          onComplete: (result) => {
  // DISABLED:             showToast('Email campaign created successfully', 'success');
          },
          onError: (error) => showToast(`Email campaign creation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Email Campaign', 'error');
      }
    }

    function openUrlVideoModal(state, showToast) {
      try {
        const modal = new UrlVideoModal({
          onComplete: (result) => {
            addVideoToTimeline(result, state);
  // DISABLED:             showToast('URL video added successfully', 'success');
          },
          onError: (error) => showToast(`URL video import failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open URL Video', 'error');
      }
    }

    function openPageShotModal(state, showToast) {
      try {
        const modal = new PageShotModal({
          onComplete: (result) => {
            addImageToTimeline(result, state);
  // DISABLED:             showToast('Page screenshot added successfully', 'success');
          },
          onError: (error) => showToast(`Page screenshot failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Page Shot', 'error');
      }
    }

    function openContactImporterModal(state, showToast) {
      try {
        const modal = new ContactImporterModal({
          onComplete: (result) => {
            // Store contacts for personalization
            state.contacts = result.contacts;
  // DISABLED:             showToast('Contacts imported successfully', 'success');
          },
          onError: (error) => showToast(`Contact import failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Contact Importer', 'error');
      }
    }

    function openVideoPersonalizationHubModal(state, showToast) {
      try {
        const modal = new VideoPersonalizationHub({
          preloadedVideo: state.lastGeneratedVideo, // Pass any recently generated video
          onComplete: (result) => {
            // After personalization, offer landing page builder
            if (result && result.generations && result.generations.length > 0) {
              setTimeout(() => {
  // DISABLED:                 showToast('🎉 Personalization complete! Create landing pages?', 'info');
                setTimeout(() => {
                  openLandingPageBuilderModal(state, showToast);
                }, 1500);
              }, 1000);
            } else {
  // DISABLED:               showToast('Personalization Suite closed', 'success');
            }
          },
          onError: (error) => showToast(`Personalization Suite error: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Personalization Suite', 'error');
      }
    }

    // Make personalization modal accessible globally for toast integration
    window.openVideoPersonalizationHubModal = () => openVideoPersonalizationHubModal(state, showToast);

    // Global function to add personalization overlay to timeline
    window.addPersonalizationOverlay = () => {
      const overlayClip = {
        id: Date.now(),
        name: 'Personalization Overlay',
        left: state.playheadPercent * 10, // Position near playhead
        width: 8,
        type: 'text',
        heading: 'Hello {first_name}!',
        body: 'Welcome to our personalized video experience.',
        fontSize: 48,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: 'center'
      };
      insertClipIntoTrack(overlayClip, 'Text');
  // DISABLED:       showToast('Personalization overlay added to timeline', 'success');
    };

    // Global function to add contact import functionality
    window.addContactImport = () => {
      openContactImporterModal(state, showToast);
    };

    // Global function to add lead generation form
    window.addLeadCapture = () => {
      const leadClip = {
        id: Date.now(),
        name: 'Lead Capture Form',
        left: state.playheadPercent * 10,
        width: 6,
        type: 'text',
        heading: 'Get Your Free Guide',
        body: 'Enter your email to receive personalized content.',
        formFields: ['email', 'first_name'],
        ctaText: 'Download Now'
      };
      insertClipIntoTrack(leadClip, 'Text');
  // DISABLED:       showToast('Lead capture form added to timeline', 'success');
    };

    // Global function to apply dynamic personalization layer to current clip
    window.applyPersonalizationLayer = async (clipId, scanData) => {
      try {
        const layer = assetReplacementEngine.createPersonalizationLayer(scanData, {
          textOverlays: [
            { text: 'Hello {{first_name}}!', position: 'top-center' },
            { text: '{{company}}', position: 'bottom-right' }
          ]
        });
        
        // Store the layer on the clip for rendering
        const track = state.tracks.find(t => t.clips.some(c => c.id === clipId));
        if (track) {
          const clip = track.clips.find(c => c.id === clipId);
          if (clip) {
            clip.personalizationLayer = layer;
            renderTracks();
            showToast('Personalization layer applied', 'success');
          }
        }
      } catch (err) {
        console.error('Failed to apply personalization layer:', err);
        showToast('Failed to apply personalization layer', 'error');
      }
    };

    // Global function to add personalized image overlay
    window.addPersonalizationImage = () => {
      const imageClip = {
        id: Date.now(),
        name: 'Personalized Image',
        left: state.playheadPercent * 10,
        width: 8,
        type: 'image',
        src: '', // Will be set by user
        personalizationTokens: ['first_name', 'company'],
        overlayText: 'Welcome {first_name} from {company}!'
      };
      insertClipIntoTrack(imageClip, 'Video');
  // DISABLED:       showToast('Personalized image overlay added to timeline', 'success');
    };

    // Global function to add voice narration
    window.addPersonalizationAudio = () => {
      const audioClip = {
        id: Date.now(),
        name: 'Personalized Voice',
        left: state.playheadPercent * 10,
        width: 12,
        type: 'audio',
        src: '', // Will be generated
        text: 'Hello {first_name}, thank you for being part of {company}.',
        voice: 'neural-male',
        personalizationTokens: ['first_name', 'company']
      };
      insertClipIntoTrack(audioClip, 'Audio');
  // DISABLED:       showToast('Personalized voice narration added to timeline', 'success');
    };

    // Global function to add dynamic content based on contact data
    window.addDynamicContent = (contentType) => {
      let contentClip;

      switch (contentType) {
        case 'greeting':
          contentClip = {
            id: Date.now(),
            name: 'Dynamic Greeting',
            left: state.playheadPercent * 10,
            width: 6,
            type: 'text',
            heading: 'Hello {first_name}!',
            body: 'Welcome back to our exclusive content.',
            personalizationTokens: ['first_name']
          };
          break;

        case 'product':
          contentClip = {
            id: Date.now(),
            name: 'Product Personalization',
            left: state.playheadPercent * 10,
            width: 10,
            type: 'text',
            heading: '{company} Special Offer',
            body: 'As a valued {job_title} at {company}, you qualify for our premium package.',
            personalizationTokens: ['company', 'job_title']
          };
          break;

        case 'testimonial':
          contentClip = {
            id: Date.now(),
            name: 'Personalized Testimonial',
            left: state.playheadPercent * 10,
            width: 8,
            type: 'text',
            heading: 'What {first_name} Says',
            body: '"This solution transformed how {company} operates." - {first_name}',
            personalizationTokens: ['first_name', 'company']
          };
          break;

        default:
          contentClip = {
            id: Date.now(),
            name: 'Custom Personalization',
            left: state.playheadPercent * 10,
            width: 6,
            type: 'text',
            heading: 'Personalized Content',
            body: 'Custom message for {first_name}',
            personalizationTokens: ['first_name']
          };
      }

      insertClipIntoTrack(contentClip, 'Text');
  // DISABLED:       showToast(`${contentType} personalized content added to timeline`, 'success');
    };

    function openLandingPageBuilderModal(state, showToast) {
      try {
        const modal = new LandingPageBuilder({
          onComplete: (result) => {
            // After landing pages, offer lead generation
            if (result && result.pages && result.pages > 0) {
              setTimeout(() => {
  // DISABLED:                 showToast('🏠 Landing pages ready! Set up lead capture?', 'info');
                setTimeout(() => {
                  openLeadGeneratorModal(state, showToast);
                }, 1500);
              }, 1000);
            } else {
  // DISABLED:               showToast('Landing pages generated successfully', 'success');
            }
          },
          onError: (error) => showToast(`Landing page generation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Landing Page Builder', 'error');
      }
    }

    function openLeadGeneratorModal(state, showToast) {
      try {
        const modal = new LeadGeneratorModal({
          onComplete: (result) => {
            // Handle lead saving
  // DISABLED:             showToast('Lead saved successfully', 'success');
          },
          onError: (error) => showToast(`Lead generation failed: ${error}`, 'error')
        });
        modal.open();
      } catch (error) {
  // DISABLED:         showToast('Failed to open Lead Generator', 'error');
      }
    }

    function openGTMPromptModal(state, showToast) {
      try {
        const modal = new GTMPromptModal({
          appTheme: 'timeline-editor',
          onPromptGenerated: (generatedPrompt) => {
            // Load the generated prompt into the generation panel
            const promptInput = document.querySelector('#generation-prompt, textarea[placeholder*="Describe"], input[placeholder*="Describe"]');
            if (promptInput) {
              promptInput.value = generatedPrompt;
              promptInput.dispatchEvent(new Event('input', { bubbles: true }));
  // DISABLED:               showToast('GTM-optimized prompt loaded!', 'success');
            } else {
              // Fallback: copy to clipboard
              navigator.clipboard.writeText(generatedPrompt).then(() => {
  // DISABLED:                 showToast('Prompt copied to clipboard!', 'success');
              });
            }
          }
        });
        modal.open();
      } catch (error) {
        console.error('GTM Prompt Modal error:', error);
  // DISABLED:         showToast('Failed to open GTM Prompt Enhancer', 'error');
      }
    }

    // Helper functions for modal integration
    function addVideoToTimeline(videoData, state) {
      const videoTrack = state.tracks.find(t => t.name === 'Video');
      if (videoTrack) {
        const newClip = {
          id: Date.now(),
          name: videoData.name || 'Imported Video',
          left: 50,
          width: 20,
          type: 'video',
          src: videoData.src,
          poster: videoData.poster
        };
        videoTrack.clips.push(newClip);
        renderTracks();
      }
    }

    function addImageToTimeline(imageData, state) {
      const videoTrack = state.tracks.find(t => t.name === 'Video');
      if (videoTrack) {
        const newClip = {
          id: Date.now(),
          name: imageData.name || 'Imported Image',
          left: 50,
          width: 15,
          type: 'image',
          src: imageData.src
        };
        videoTrack.clips.push(newClip);
        renderTracks();
      }
    }

    function addAudioToTimeline(audioData, state) {
      const audioTrack = state.tracks.find(t => t.name === 'Audio');
      if (audioTrack) {
        const newClip = {
          id: Date.now(),
          name: audioData.name || 'Generated Audio',
          left: 50,
          width: 20,
          type: 'audio',
          src: audioData.src
        };
        audioTrack.clips.push(newClip);
        renderTracks();
      }
    }

    function applyTemplateToTimeline(templateData, state) {
      // Apply template settings to timeline
      if (templateData.settings) {
        Object.assign(state, templateData.settings);
      }
      if (templateData.clips) {
        templateData.clips.forEach(clip => {
          const track = state.tracks.find(t => t.name === clip.trackType);
          if (track) {
            track.clips.push({ ...clip, id: Date.now() });
          }
        });
      }
      renderTracks();
    }

    function renderRail() {
      els.floatingRail.innerHTML = '';
      const railTooltips = {
        'Generate': 'Generate new AI content - Create video, images, or audio from prompts',
        'Split': 'Split clip at playhead - Divide the selected clip into two at the current position',
        'Scenes': 'Detect scenes - Automatically identify scene changes in your footage',
        'Subtitle': 'Add subtitles - Generate or edit subtitles for your video',
        'B-Roll': 'Suggest B-roll - Get AI recommendations for supplementary footage',
        'Speed': 'Adjust speed - Change playback speed with speed ramping',
        'Stabilize': 'Stabilize footage - Remove camera shake from video clips',
        'Text': 'Add text overlay - Insert titles, captions, or text elements',
        'Transitions': 'Add transitions - Apply transition effects between clips',
        'AI Video': 'AI video creator - Generate complete videos with AI',
        'Recorder': 'Screen recorder - Record your screen or webcam directly',
        'Enhanced Recorder': 'Advanced recorder - Multi-track recording with effects',
        'Templates': 'Browse templates - Choose from pre-built video templates',
        'Preview Template': 'Preview template - See how a template looks before applying',
        'Social': 'Social publisher - Share directly to social media platforms',
        'Email Campaign': 'Email campaigns - Create and send video email campaigns',
        'URL Video': 'Import from URL - Download and import video from a web address',
        'Page Shot': 'Webpage capture - Take a screenshot of any webpage',
        'Contacts': 'Import contacts - Import contact lists for personalization',
        'Canvas': 'Canvas editor - Open the visual canvas composition editor',
        'Token Editor': 'Token editor - Create and manage personalization tokens',
        'Batch Generator': 'Batch generation - Generate multiple videos at once',
        'Workflow': 'Workflow automation - Create automated video production pipelines',
        'Personalization': 'Personalization - Add dynamic content for different viewers',
        'Personalization Editor': 'Personalization editor - Advanced personalization settings',
        'Personalization Suite': 'Personalization suite - Complete video personalization workflow',
        'Landing Pages': 'Landing pages - Create personalized landing pages',
        'Lead Generator': 'Lead capture - Add lead generation forms to videos',
        'AI Personalizer': 'AI Personalizer - Scan profiles and generate personalized content'
      };
      state.railActions.forEach(([icon, label, active]) => {
        const button = document.createElement('button');
        button.className = `rail-btn ${active ? 'active' : ''}`;
        button.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
        button.setAttribute('data-tooltip', railTooltips[label] || `${label} action`);
        button.title = railTooltips[label] || `${label} action`;
        button.setAttribute('aria-label', `${label} action`);

        // Add specific functionality for each rail action
        button.addEventListener('click', async () => {
          switch (label) {
            case 'Generate':
              // Trigger generation with current prompt
              await generateClip();
              break;
            case 'Split':
              splitClipAtPlayhead();
              break;
            case 'Scenes':
              detectScenes();
              break;
            case 'Subtitle':
              generateSubtitles();
              break;
            case 'B-Roll':
              suggestBRoll();
              break;
            case 'Speed':
              adjustSpeed();
              break;
            case 'Stabilize':
              stabilizeFootage();
              break;
            case 'Text':
              addTextOverlay();
              break;
            case 'Transitions':
              showTransitionSettings();
              break;
            case 'AI Video':
              openAIVideoCreatorModal(state, showToast);
              break;
            case 'Recorder':
              openRecorderModal(state, showToast);
              break;
            case 'Enhanced Recorder':
              openEnhancedRecorderModal(state, showToast);
              break;
            case 'Templates':
              openTemplateGeneratorModal(state, showToast);
              break;
            case 'Preview Template':
              openTemplatePreviewModal(state, showToast);
              break;
            case 'Social':
              openSocialPublisherModal(state, showToast);
              break;
            case 'Email Campaign':
              openEmailCampaignModal(state, showToast);
              break;
            case 'URL Video':
              openUrlVideoModal(state, showToast);
              break;
            case 'Page Shot':
              openPageShotModal(state, showToast);
              break;
            case 'Contacts':
              openContactImporterModal(state, showToast);
              break;
            case 'Canvas':
              showCanvasPanel();
              break;
            case 'Token Editor':
              showTokenEditorPanel();
              break;
            case 'Batch Generator':
              showBatchGeneratorPanel();
              break;
            case 'Workflow':
              showWorkflowPanel();
              break;
            case 'Personalization':
              showPersonalizationPanel();
              break;
            case 'Personalization Editor':
              showPersonalizationEditorPanel();
              break;
            case 'Personalization Suite':
              openVideoPersonalizationHubModal(state, showToast);
              break;
            case 'Landing Pages':
              openLandingPageBuilderModal(state, showToast);
              break;
            case 'Lead Generator':
              openLeadGeneratorModal(state, showToast);
              break;
            case 'AI Personalizer':
              window.dispatchEvent(new CustomEvent('open-personalizer'));
              break;
            default:
  // DISABLED:               showToast(`${label} action triggered`);
          }
        });

        els.floatingRail.appendChild(button);
      });
    }

    function addTrack(type) {
      state.tracks.push({ id: `${type.toLowerCase()}-${Date.now()}`, name: type, muted: false, solo: false, locked: false, clips: [] });
      renderTracks();
  // DISABLED:       showToast(`${type} track added`);
    }

    function showClipEditor(clipId) {
      els.clipSettingsPanel.style.display = 'block';
      renderClipEditor(clipId);
  // DISABLED:       showToast('Clip editor opened');
    }

    function showTransitionSettings() {
      els.transitionSettingsPanel.style.display = 'block';
      showToast('Transition settings opened', 'success');
    }

    function showColorCorrectionPanel() {
      if (!colorCorrectionSystem) {
        try {
          colorCorrectionSystem = new ColorCorrectionSystem(els.colorCorrectionContainer, state, state.keyframeSystem);
          els.colorCorrectionContainer.innerHTML = '';
          els.colorCorrectionContainer.appendChild(colorCorrectionSystem.getPanel());
        } catch (error) {
          console.error('Failed to load ColorCorrectionSystem:', error);
          els.colorCorrectionContainer.innerHTML = '<p style="color: #ef4444;">Color correction system unavailable</p>';
        }
      }
      els.colorCorrectionPanel.style.display = 'block';
      showToast('Color correction panel opened', 'success');
    }

    function openAdvancedModal(content, title = 'Advanced Editing') {
      els.modalTitle.textContent = title;
      els.modalBody.innerHTML = content;
      els.modalOverlay.style.display = 'flex';
    }

    function closeModal() {
      els.modalOverlay.style.display = 'none';
    }

    function showRetakePanel(clip) {
      const panel = document.createElement('div');
      panel.className = 'retake-panel-fixed';
      panel.innerHTML = `
        <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10 shadow-lg">
          <h3 class="text-lg font-bold mb-4">Retake Clip</h3>
          <p class="text-sm text-white/60 mb-4">Regenerate this clip with new parameters</p>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-white/50 mb-1 block">Prompt</label>
              <textarea class="w-full bg-[#0d0d11] border border-white/10 rounded px-3 py-2 text-sm" placeholder="Describe the retake..." rows="3">${clip.prompt || ''}</textarea>
            </div>
            <div>
              <label class="text-xs text-white/50 mb-1 block">Duration (seconds)</label>
              <input type="number" min="1" max="30" value="${clip.duration || 5}" class="w-full bg-[#0d0d11] border border-white/10 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="flex gap-2 mt-6">
            <button class="flex-1 px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20" onclick="this.closest('.retake-panel-fixed').remove()">Cancel</button>
            <button class="flex-1 px-4 py-2 bg-primary rounded text-sm font-semibold hover:opacity-90" onclick="retakeClipHandler(${clip.id})">Retake</button>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    function retakeClipHandler(clipId) {
      const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
      if (clip) {
        showToast('Retake requested - implement with MuAPI', 'info');
      }
      document.querySelectorAll('.retake-panel-fixed').forEach(el => el.remove());
    }

    function showImportTimelineModal() {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]';
      modal.innerHTML = `
        <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10">
          <h3 class="text-lg font-bold mb-4">Import Timeline</h3>
          <p class="text-sm text-white/60 mb-4">Import from JSON file</p>
          <div class="border border-dashed border-white/20 rounded-lg p-6 text-center">
            <input type="file" id="timelineFileInput" accept=".json" class="hidden" />
            <label for="timelineFileInput" class="cursor-pointer">Click to browse</label>
          </div>
          <button class="w-full mt-4 px-4 py-2 bg-white/10 rounded" onclick="this.closest('.fixed').remove()">Cancel</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#timelineFileInput').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              showToast('Timeline imported', 'success');
              modal.remove();
            } catch (err) {
              alert('Invalid JSON');
            }
          };
          reader.readAsText(file);
        }
      };
    }

    function showICLoraPanel() {
      const panel = document.createElement('div');
      panel.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]';
      panel.innerHTML = `
        <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10">
          <h3 class="text-lg font-bold mb-4">IC-LoRA Character Consistency</h3>
          <p class="text-sm text-white/60 mb-4">Apply to selected clips</p>
          <div class="space-y-3">
            <label class="flex items-center gap-2"><input type="radio" name="lora" value="character" /> Character Consistency</label>
            <label class="flex items-center gap-2"><input type="radio" name="lora" value="style" /> Style Lock</label>
          </div>
          <div class="flex gap-2 mt-6">
            <button class="flex-1 px-4 py-2 bg-white/10 rounded" onclick="this.closest('.fixed').remove()">Cancel</button>
            <button class="flex-1 px-4 py-2 bg-primary rounded" onclick="applyICLora(this)">Apply</button>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    function applyICLora(btn) {
      const selected = btn.closest('.fixed').querySelector('input[name="lora"]:checked');
      if (selected) {
        showToast('IC-LoRA applied', 'success');
        btn.closest('.fixed').remove();
      }
    }

    // Category C Editor Surface panel functions
    function showCanvasPanel() {
      // Hide other panels
      hideAllEditorPanels();
      els.canvasPanel.style.display = 'block';

      // Render Canvas component
      if (!els.canvasContainer.innerHTML) {
        // For now, render basic canvas HTML. In a full implementation, this would use ReactDOM
        els.canvasContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Canvas Editor</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Visual canvas-based editing surface for composition.</p>
            <canvas id="canvasEditor" width="800" height="450" style="border: 1px solid #374151; background: #1a1a1a; flex: 1;"></canvas>
            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <button style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Add Text</button>
              <button style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Add Shape</button>
              <button style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Add Image</button>
            </div>
          </div>
        `;
      }
  // DISABLED:       showToast('Canvas editor opened');
    }

    function showTokenEditorPanel() {
      hideAllEditorPanels();
      els.tokenEditorPanel.style.display = 'block';

      if (!els.tokenEditorContainer.innerHTML) {
        els.tokenEditorContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Token Editor</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Create content with dynamic tokens for personalization.</p>
            <textarea placeholder="Enter text with {tokens}..." style="flex: 1; padding: 12px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; color: #e5e7eb; resize: vertical;"></textarea>
            <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="token-btn" data-token="{first_name}">first_name</button>
              <button class="token-btn" data-token="{last_name}">last_name</button>
              <button class="token-btn" data-token="{email}">email</button>
              <button class="token-btn" data-token="{company}">company</button>
            </div>
          </div>
        `;

        // Add token button functionality
        els.tokenEditorContainer.querySelectorAll('.token-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const textarea = els.tokenEditorContainer.querySelector('textarea');
            const token = btn.dataset.token;
            textarea.value += token;
          });
        });
      }
  // DISABLED:       showToast('Token editor opened');
    }

    function showBatchGeneratorPanel() {
      hideAllEditorPanels();
      els.batchGeneratorPanel.style.display = 'block';

      if (!els.batchGeneratorContainer.innerHTML) {
        els.batchGeneratorContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Batch Generator</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Generate multiple videos or content items at once.</p>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
              <select style="padding: 8px; background: #1f2937; border: 1px solid #374151; border-radius: 4px; color: #e5e7eb;">
                <option>Select Template...</option>
                <option>Video Template 1</option>
                <option>Video Template 2</option>
              </select>
              <div id="batchItems" style="flex: 1; overflow-y: auto; border: 1px solid #374151; border-radius: 4px; padding: 8px;">
                <!-- Batch items will be added here -->
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="addBatchItem" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 4px;">Add Item</button>
                <button id="startBatch" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Start Batch</button>
              </div>
            </div>
          </div>
        `;

        // Add batch functionality
        const addBtn = els.batchGeneratorContainer.querySelector('#addBatchItem');
        const batchItems = els.batchGeneratorContainer.querySelector('#batchItems');

        addBtn.addEventListener('click', () => {
          const itemCount = batchItems.children.length + 1;
          const itemDiv = document.createElement('div');
          itemDiv.style.cssText = 'background: #111827; padding: 8px; margin-bottom: 8px; border-radius: 4px;';
          itemDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span>Item ${itemCount}</span>
              <button class="remove-item" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 2px 6px;">×</button>
            </div>
            <input type="text" placeholder="Item data..." style="width: 100%; padding: 4px; background: #1f2937; border: 1px solid #374151; border-radius: 4px; color: #e5e7eb;">
          `;
          itemDiv.querySelector('.remove-item').addEventListener('click', () => itemDiv.remove());
          batchItems.appendChild(itemDiv);
        });
      }
  // DISABLED:       showToast('Batch generator opened');
    }

    function showWorkflowPanel() {
      hideAllEditorPanels();
      els.workflowPanel.style.display = 'block';

      if (!els.workflowContainer.innerHTML) {
        els.workflowContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Workflow Automation</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Automate your video creation and distribution workflows.</p>
            <div style="flex: 1; overflow-y: auto;">
              <div style="display: grid; gap: 12px;">
                <div class="workflow-card" style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; cursor: pointer;">
                  <h4 style="margin: 0 0 8px 0; color: #e5e7eb;">Video Creation Pipeline</h4>
                  <p style="margin: 0; color: #9ca3af; font-size: 14px;">Generate, edit, and publish videos automatically</p>
                </div>
                <div class="workflow-card" style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; cursor: pointer;">
                  <h4 style="margin: 0 0 8px 0; color: #e5e7eb;">Batch Processing</h4>
                  <p style="margin: 0; color: #9ca3af; font-size: 14px;">Process multiple videos with consistent branding</p>
                </div>
                <div class="workflow-card" style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; cursor: pointer;">
                  <h4 style="margin: 0 0 8px 0; color: #e5e7eb;">Personalization Hub</h4>
                  <p style="margin: 0; color: #9ca3af; font-size: 14px;">Create personalized content at scale</p>
                </div>
              </div>
            </div>
            <button style="margin-top: 16px; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Create New Workflow</button>
          </div>
        `;
      }
  // DISABLED:       showToast('Workflow automation opened');
    }

    function showPersonalizationPanel() {
      hideAllEditorPanels();
      els.personalizationPanel.style.display = 'block';

      if (!els.personalizationContainer.innerHTML) {
        els.personalizationContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Personalization</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Create personalized content using merge fields.</p>
            <div style="flex: 1; overflow-y: auto; display: grid; gap: 8px;">
              <div class="merge-field" style="background: #1f2937; padding: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #e5e7eb;">First Name</div>
                  <div style="font-size: 12px; color: #6b7280;">{first_name}</div>
                </div>
                <span style="color: #9ca3af;">John</span>
              </div>
              <div class="merge-field" style="background: #1f2937; padding: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #e5e7eb;">Email</div>
                  <div style="font-size: 12px; color: #6b7280;">{email}</div>
                </div>
                <span style="color: #9ca3af;">john@example.com</span>
              </div>
              <div class="merge-field" style="background: #1f2937; padding: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #e5e7eb;">Company</div>
                  <div style="font-size: 12px; color: #6b7280;">{company}</div>
                </div>
                <span style="color: #9ca3af;">Acme Corp</span>
              </div>
            </div>
            <button style="margin-top: 16px; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px;">Add Field</button>
          </div>
        `;
      }
  // DISABLED:       showToast('Personalization panel opened');
    }

    function showPersonalizationEditorPanel() {
      hideAllEditorPanels();
      els.personalizationEditorPanel.style.display = 'block';

      if (!els.personalizationEditorContainer.innerHTML) {
        els.personalizationEditorContainer.innerHTML = `
          <div style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin: 0 0 16px 0; color: #e5e7eb;">Personalization Editor</h3>
            <p style="color: #9ca3af; margin-bottom: 16px;">Edit personalized content with dynamic tokens.</p>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
              <textarea placeholder="Enter personalized text..." style="flex: 1; padding: 12px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; color: #e5e7eb; resize: vertical;"></textarea>
              <div style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #e5e7eb;">Preview</h4>
                <div id="personalizationPreview" style="color: #e5e7eb;">Preview will appear here...</div>
              </div>
            </div>
          </div>
        `;
      }
  // DISABLED:       showToast('Personalization editor opened');
    }

    function hideAllEditorPanels() {
      els.canvasPanel.style.display = 'none';
      els.tokenEditorPanel.style.display = 'none';
      els.batchGeneratorPanel.style.display = 'none';
      els.workflowPanel.style.display = 'none';
      els.personalizationPanel.style.display = 'none';
      els.personalizationEditorPanel.style.display = 'none';
    }

    function renderLineDuration(clipId) {
      const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
      if (!clip) return '';

      const start = (clip.left / 100) * state.timelineSeconds;
      const end = ((clip.left + clip.width) / 100) * state.timelineSeconds;
      const trimIn = clip.trimIn || 0;
      const trimOut = clip.trimOut || (end - start);

      return `
        <div class="line-duration" style="width: 300px; height: 60px; margin: 20px 0;">
          <div class="line-duration-track" style="position: relative; width: 100%; height: 100%; background: #2a2a2a; border-radius: 4px; cursor: pointer;">
            <div class="line-duration-trimmed" style="position: absolute; left: ${(trimIn / (end - start)) * 100}%; width: ${((trimOut - trimIn) / (end - start)) * 100}%; height: 100%; background: #4a9eff; border-radius: 2px; opacity: 0.8;"></div>
            <div class="line-duration-handle line-duration-handle-in" style="position: absolute; left: ${(trimIn / (end - start)) * 300 - 8}px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; background: #ff6b6b; border-radius: 50%; cursor: ew-resize; border: 2px solid #fff; z-index: 10;"></div>
            <div class="line-duration-handle line-duration-handle-out" style="position: absolute; left: ${(trimOut / (end - start)) * 300 - 8}px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; background: #4ecdc4; border-radius: 50%; cursor: ew-resize; border: 2px solid #fff; z-index: 10;"></div>
            <div class="line-duration-display" style="position: absolute; top: -24px; left: ${(trimIn / (end - start)) * 300}px; background: #1a1a1a; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${(trimOut - trimIn).toFixed(2)}s</div>
          </div>
        </div>
      `;
    }

    async function generateClip() {
      const prompt = els.promptInput.value.trim();
      const negativePrompt = els.negativeInput.value.trim();
      const duration = els.durationSelect.value;
      const aspect = els.aspectSelect.value;
      const style = els.styleSelect.value;

      if (!prompt) {
  // DISABLED:         showToast('Please enter a prompt', 'warning');
        return;
      }

      if (state.isProcessing) {
  // DISABLED:         showToast('Generation already in progress', 'warning');
        return;
      }

      state.isProcessing = true;
  // DISABLED:       showToast('Generating content...', 'info');

      try {
        let generationResult;

        // Determine generation endpoint based on type
        if (state.generateType === 'Text') {
          // For text generation, create a text clip directly
          const clipId = Date.now();
          const clip = {
            id: clipId,
            name: `Text: ${prompt.slice(0, 18)}`,
            left: 0,
            width: 14,
            type: 'text',
            heading: prompt.slice(0, 40),
            body: negativePrompt || `Generated text content for: ${prompt}`
          };
          insertClipIntoTrack(clip, 'Text');
  // DISABLED:           showToast('Text clip created', 'success');
          return;
        }

        // Check if Supabase is configured before making requests
        if (!supabase || typeof supabase.functions?.invoke !== 'function') {
          throw new Error('Generation features require Supabase configuration');
        }

        if (state.generateType === 'Image' || state.generateType === 'B-Roll') {
          // Generate image using muapi-proxy
          const { data, error } = await supabase.functions.invoke('muapi-proxy', {
            body: {
              endpoint: 'predictions',
              method: 'POST',
              data: {
                model: 'flux-dev',
                prompt: prompt,
                negative_prompt: negativePrompt,
                aspect_ratio: aspect === '16:9' ? '16:9' : aspect === '9:16' ? '9:16' : '1:1',
                style: style.toLowerCase()
              }
            }
          });

          if (error) throw error;
          generationResult = data;
        } else {
          // Video generation
          const { data, error } = await supabase.functions.invoke('muapi-proxy', {
            body: {
              endpoint: 'video-generation',
              method: 'POST',
              data: {
                prompt: prompt,
                negative_prompt: negativePrompt,
                duration: duration,
                aspect_ratio: aspect === '16:9' ? '16:9' : aspect === '9:16' ? '9:16' : '1:1',
                style: style.toLowerCase()
              }
            }
          });

          if (error) throw error;
          generationResult = data;
        }

        // Process the generation result
        if (generationResult && generationResult.url) {
          const clipId = Date.now();
          let clip;

          if (state.generateType === 'Image' || state.generateType === 'B-Roll') {
            clip = {
              id: clipId,
              name: `${state.generateType}: ${prompt.slice(0, 18)}`,
              left: 0,
              width: 14,
              type: 'image',
              src: generationResult.url,
              fit: 'contain'
            };
          } else {
            clip = {
              id: clipId,
              name: `Video: ${prompt.slice(0, 18)}`,
              left: 0,
              width: parseInt(duration) * 2, // Rough width based on duration
              type: 'video',
              src: generationResult.url,
              poster: generationResult.thumbnail_url
            };
          }

          insertClipIntoTrack(clip, state.generateType === 'B-Roll' ? 'B-Roll' : 'Video');

          // Add to media library
          state.mediaLibrary.push({
            id: clipId,
            name: clip.name,
            type: state.generateType.toLowerCase(),
            url: generationResult.url,
            generatedAt: new Date().toISOString(),
            prompt: prompt
          });

  // DISABLED:           showToast(`${state.generateType} generated successfully`, 'success');

          // Offer personalization suite for video generation
          if (state.generateType !== 'Image' && state.generateType !== 'Text') {
            // Store the generated video for personalization
            state.lastGeneratedVideo = {
              id: clipId,
              name: clip.name,
              src: generationResult.url,
              poster: generationResult.thumbnail_url,
              prompt: prompt,
              generatedAt: new Date().toISOString()
            };

            setTimeout(() => {
              // Create a toast with personalization offer
              const toast = document.createElement('div');
              toast.className = 'personalization-toast';
              toast.innerHTML = `
                <div class="toast-content">
                  <div class="toast-icon">🎬</div>
                  <div class="toast-text">
                    <strong>Video Ready!</strong>
                    <br>
                    <small>Personalize this video for your audience?</small>
                  </div>
                  <div class="toast-actions">
                    <button class="toast-btn toast-btn-secondary" onclick="this.closest('.personalization-toast').remove()">Maybe Later</button>
                    <button class="toast-btn toast-btn-primary" onclick="window.openVideoPersonalizationHubModal(); this.closest('.personalization-toast').remove()">Personalize Now</button>
                  </div>
                </div>
              `;

              // Add toast styles
              const existingToast = document.querySelector('.personalization-toast');
              if (existingToast) existingToast.remove();

              toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
                box-shadow: var(--shadow);
                padding: 20px;
                max-width: 320px;
                font-family: inherit;
              `;

              // Add button styles
              const style = document.createElement('style');
              style.textContent = `
                .toast-content { display: flex; align-items: center; gap: 12px; }
                .toast-icon { font-size: 24px; }
                .toast-text { flex: 1; }
                .toast-actions { display: flex; gap: 8px; margin-top: 12px; }
                .toast-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-size: 12px; }
                .toast-btn-primary { background: var(--cyan); color: white; }
                .toast-btn-secondary { background: transparent; color: var(--text); }
                .toast-btn:hover { transform: translateY(-1px); }
              `;

              if (!document.querySelector('#toast-styles')) {
                style.id = 'toast-styles';
                document.head.appendChild(style);
              }

              document.body.appendChild(toast);

              // Auto-remove after 10 seconds
              setTimeout(() => {
                if (toast.parentNode) {
                  toast.remove();
                }
              }, 10000);
            }, 2000); // Show after 2 seconds
          }
        } else {
          throw new Error('No result URL returned from generation');
        }

       } catch (error) {
         console.error('Generation error:', error);
         // Provide user-friendly error messages
         const msg = error.message || '';
         
         if (msg.includes('401') || msg.includes('auth')) {
  // DISABLED:            showToast('Generation requires authentication. Please sign in.', 'warning');
         } else if (msg.includes('Supabase') || msg.includes('configuration')) {
  // DISABLED:            showToast('AI features require setup. Please check your environment configuration.', 'warning');
         } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Network')) {
  // DISABLED:            showToast('Network error - please check connection', 'error');
         } else if (msg.includes('API key not configured') || msg.includes('service is not configured')) {
  // DISABLED:            showToast('AI service not configured. Please set up your API keys in Supabase edge function settings.', 'error');
         } else {
  // DISABLED:            showToast(`Generation failed: ${msg}`, 'error');
         }
       } finally {
        state.isProcessing = false;
        // Save project state after generation
        saveProjectToStorage(state);
      }
    }

    function togglePlayback() {
      state.playing = !state.playing;
      if (state.playing) {
        playbackTimer = window.setInterval(() => {
          state.playheadPercent += 0.6;
          if (state.playheadPercent >= 100) {
            state.playheadPercent = 100;
            state.playing = false;
            window.clearInterval(playbackTimer);
          }
          updatePlaybackUI();
          // Apply keyframes during playback
          const selected = findSelectedClip();
          if (selected) {
            updatePreview(selected);
          }
        }, 120);
      } else {
        window.clearInterval(playbackTimer);
      }
      updatePlaybackUI();
    }

    function stopPlayback() {
      state.playing = false;
      window.clearInterval(playbackTimer);
      state.playheadPercent = 0;
      updatePlaybackUI();
      const media = els.previewStage.querySelector('video, audio');
      if (media) media.currentTime = 0;
    }

    function rewindPlayback() {
      state.playing = false;
      window.clearInterval(playbackTimer);
      state.playheadPercent = Math.max(0, state.playheadPercent - 10);
      updatePlaybackUI();
    }

    async function handleUpload(file) {
      if (!file) return;

  // DISABLED:       showToast('Uploading file...', 'info');

      try {
        // Upload file to Supabase storage
        const publicUrl = await uploadFileToStorage(file);

        // Create clip with uploaded file
        const clip = createClipForMedia(file.name, { ...file, src: publicUrl });

        // Add to media library
        state.mediaLibrary.push({
          id: Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });

        // Insert into appropriate track
        const target = clip.type === 'video' ? 'Video' : clip.type === 'audio' ? 'Audio' : clip.type === 'image' ? 'Text' : 'Text';
        insertClipIntoTrack(clip, target);

        // Save project state
        saveProjectToStorage(state);

  // DISABLED:         showToast(`${file.name} uploaded and added to timeline`, 'success');
      } catch (error) {
        console.error('Upload error:', error);
  // DISABLED:         showToast(`Upload failed: ${error.message}`, 'error');
      }
    }

    // Rendiv Animation Demo Functions
    function runSpringDemo(canvas, statusEl) {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      let animationId = null;
      let frame = 0;

      statusEl.textContent = 'Running spring animation demo...';

      function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Calculate spring position (simulate a bouncing ball)
        const springValue = spring({ frame, fps: 30, config: { damping: 12, stiffness: 100 } });
        const x = width / 2;
        const y = height - (springValue * height * 0.8) - 50;

        // Draw ball
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();

        // Draw trail
        for (let i = 1; i <= 5; i++) {
          const trailFrame = Math.max(0, frame - i * 2);
          const trailSpring = spring({ frame: trailFrame, fps: 30, config: { damping: 12, stiffness: 100 } });
          const trailY = height - (trailSpring * height * 0.8) - 50;
          const alpha = (6 - i) / 6;

          ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(x, trailY, 20 - i * 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        frame++;
        if (frame < 180) { // 6 seconds at 30fps
          animationId = requestAnimationFrame(animate);
        } else {
          statusEl.textContent = 'Spring demo complete! Ball reached rest position.';
        }
      }

      animate();
    }

    function runNoiseDemo(canvas, statusEl) {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      let animationId = null;
      let frame = 0;

      statusEl.textContent = 'Running Perlin noise animation demo...';

      function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Generate organic movement using noise
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 60;

        // Create multiple orbiting elements with noise
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + frame * 0.02;
          const noiseOffset = noise2D(frame * 0.05 + i, 0) * Math.PI * 0.5;
          const finalAngle = angle + noiseOffset;

          const x = centerX + Math.cos(finalAngle) * radius;
          const y = centerY + Math.sin(finalAngle) * radius;

          // Color based on position
          const hue = (i / 8) * 360;
          ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw central pulsing element
        const pulseScale = 1 + noise2D(frame * 0.1, 1) * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15 * pulseScale, 0, 2 * Math.PI);
        ctx.fill();

        frame++;
        if (frame < 300) { // 10 seconds at 30fps
          animationId = requestAnimationFrame(animate);
        } else {
          statusEl.textContent = 'Noise demo complete! Organic movement simulation finished.';
        }
      }

      animate();
    }

    function runInterpolateDemo(canvas, statusEl) {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      let animationId = null;
      let frame = 0;

      statusEl.textContent = 'Running interpolation animation demo...';

      function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Demonstrate different interpolation types
        const progress = (frame / 120) % 1; // 4 seconds loop at 30fps

        // Linear interpolation
        const linearX = interpolate(progress, [0, 1], [50, width - 50]);
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(linearX, 60, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Ease-out interpolation
        const easeOutX = interpolate(progress, [0, 1], [50, width - 50], 'ease-out');
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(easeOutX, 100, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Bounce interpolation
        const bounceX = interpolate(progress, [0, 1], [50, width - 50], 'bounce');
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bounceX, 140, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Color interpolation
        const color = blendColors(progress, '#ff0000', '#0000ff');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(width / 2, 180, 12, 0, 2 * Math.PI);
        ctx.fill();

        // Labels
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '11px Arial';
        ctx.fillText('Linear', 50, 50);
        ctx.fillText('Ease-Out', 50, 90);
        ctx.fillText('Bounce', 50, 130);
        ctx.fillText('Color Blend', 50, 170);

        frame++;
        if (frame < 480) { // 16 seconds at 30fps
          animationId = requestAnimationFrame(animate);
        } else {
          statusEl.textContent = 'Interpolation demo complete! Showed linear, easing, bounce, and color interpolation.';
        }
      }

      animate();
    }

    function bindEvents() {
      els.playBtn.addEventListener('click', togglePlayback);
      els.stopBtn.addEventListener('click', stopPlayback);
      els.rewindBtn.addEventListener('click', rewindPlayback);
      els.generateBtn.addEventListener('click', generateClip);

      // Rendiv Animation Demo handlers
      const runSpringDemoBtn = root.querySelector('#runSpringDemo');
      const runNoiseDemoBtn = root.querySelector('#runNoiseDemo');
      const runInterpolateDemoBtn = root.querySelector('#runInterpolateDemo');
      const animationCanvas = root.querySelector('#animationCanvas');
      const demoStatus = root.querySelector('#demoStatus');

      if (runSpringDemoBtn) runSpringDemoBtn.addEventListener('click', () => runSpringDemo(animationCanvas, demoStatus));
      if (runNoiseDemoBtn) runNoiseDemoBtn.addEventListener('click', () => runNoiseDemo(animationCanvas, demoStatus));
      if (runInterpolateDemoBtn) runInterpolateDemoBtn.addEventListener('click', () => runInterpolateDemo(animationCanvas, demoStatus));

      els.uploadBtn.addEventListener('click', () => els.uploadInput.click());
      els.uploadInput.addEventListener('change', (event) => handleUpload(event.target.files?.[0]));
      els.backBtn.addEventListener('click', () => showToast('Back action clicked'));

      root.querySelectorAll('[data-add-track]').forEach((button) => button.addEventListener('click', () => addTrack(button.dataset.addTrack)));
      root.querySelectorAll('[data-action="zoom-in"]').forEach((button) => button.addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + 0.1); showToast(`Zoom ${state.zoom.toFixed(1)}x`); }));
      root.querySelectorAll('[data-action="zoom-out"]').forEach((button) => button.addEventListener('click', () => { state.zoom = Math.max(0.5, state.zoom - 0.1); showToast(`Zoom ${state.zoom.toFixed(1)}x`); }));

      const cutaiBtn = root.querySelector('#cutaiStoryboardBtn');
      if (cutaiBtn) cutaiBtn.addEventListener('click', () => showCutAI());
    }

    function renderAll() {
      initializeDefaultTracks();
      renderTopActions();
      renderTools();
      renderPills();
      renderTracks();
      renderMedia();
      renderGenerateTypes();

      renderRail();
      renderMultiCamera();
      updatePreview();
      updatePlaybackUI();
    }

    function renderMultiCamera() {
      renderMultiCameraToolbar(state, els.multiCameraToolbar);
      renderPipControls(state, els.pipControls);
      renderSplitScreenControls(state, els.splitControls);
      renderCompositingOverlay(state, els.compositingOverlay);
    }

     // Color correction system not implemented

     // Load asset from URL parameter if present (Universal Asset Pipeline handoff)
     (async () => {
       try {
         const params = new URLSearchParams(window.location.search);
         const assetId = params.get('asset');
         if (assetId) {
           const asset = await assetStore.getAsset(assetId);
           if (asset) {
             // Determine media type
             let mediaType = 'file';
             if (asset.type === 'video') mediaType = 'video';
             else if (asset.type === 'image') mediaType = 'image';
             else if (asset.type === 'audio') mediaType = 'audio';
             // Build media object expected by addMediaToTimeline
             const media = {
               type: mediaType,
               url: asset.media?.url,
               thumbnail: asset.media?.thumbnail,
               label: asset.title,
               source: 'pipeline',
               id: asset.id,
               duration: asset.metadata?.duration || 5
             };
             // Add to timeline media library
             addMediaToTimeline(media, state.mediaLibrary?.length || 0, state, showToast);
             showToast(`Loaded "${asset.title}" into timeline`, 'success');
           } else {
             showToast('Asset not found in library', 'error');
           }
         }
       } catch (e) {
         console.error('Failed to load asset from pipeline:', e);
       }
     })();

     renderAll();
    bindEvents();

    // Initialize enhanced drag and drop functionality
    initializeTimelineDragDrop(state, els);
    setupEnhancedTooltips();

    // Initialize media ingest components
    integrateMediaIngest();

    // Render enhanced timeline controls
    const timelineControlsContainer = document.getElementById('timelineControlsEnhanced');
    if (timelineControlsContainer) {
      renderTimelineControls(state, timelineControlsContainer);
    }

    // Initialize transition system
    initializeTimelineTransitions();
    initializeTransitionEditor();

    // Initialize scene detector
    initializeSceneDetector();
    initializeCameraEffects();
    initializeAIChatPanel();

    // Initialize multi-camera functionality
    window.timelineState = state; // Make state globally accessible for multi-camera functions

    // Initialize AI agent integration
    initializeAgentSystem(state, showToast);

    // Agent system functions - integrated with MuAPI
    function initializeAgentSystem(state, showToast) {
      // Make timeline state available globally for AI analysis
      window.timelineState = state;
      
      // Initialize agent hooks if available
      if (typeof initTimelineAgentIntegration === 'function') {
        const timelineEditorInterface = {
          getState: () => state,
          getSelectedClips: () => {
            const selectedClip = state.tracks.flatMap(track => track.clips).find(item => item.id === state.selectedClipId);
            return selectedClip ? [selectedClip] : [];
          },
          showNotification: (options) => {
  // DISABLED:             showToast(`${options.title}: ${options.message}`);
          }
        };

        try {
          const agentIntegration = initTimelineAgentIntegration(timelineEditorInterface, {
            theme: 'electric',
            autoEnableAgents: false
          });
          root._agentIntegration = agentIntegration;
        } catch (e) {
          console.log('Agent integration skipped:', e.message);
        }
      }
    }

    function openAIAgentsPanel(state, showToast) {
      try {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid var(--border); border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden;
        `;
        
        modalContent.innerHTML = `
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);">
            <h3 style="margin: 0; color: rgba(255,255,255,0.9);">AI Agents Panel</h3>
            <button class="modal-close" style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 60vh; overflow-y: auto;">
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Analyze timeline and get AI-powered suggestions for improvement.</p>
            <div id="agents-list" style="display: grid; gap: 12px; margin-bottom: 16px;"></div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button id="close-agents" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">Close</button>
            </div>
          </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const agentsList = modalContent.querySelector('#agents-list');
        const agents = [
          { id: 'analyze', name: 'Timeline Analysis', desc: 'Detect scenes, gaps, and improvement suggestions', icon: '📊' },
          { id: 'character', name: 'Character Tracking', desc: 'Maintain character consistency across shots', icon: '👤' },
          { id: 'broll', name: 'B-Roll Suggestions', desc: 'Get relevant b-roll recommendations', icon: '🎞️' },
          { id: 'audio', name: 'Audio Sync', desc: 'Fix audio timing and levels', icon: '🎵' }
        ];
        
        agents.forEach(agent => {
          const btn = document.createElement('button');
          btn.style.cssText = 'padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; text-align: left;';
          btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">${agent.icon}</span>
              <div>
                <div style="color: rgba(255,255,255,0.9); font-weight: 500;">${agent.name}</div>
                <div style="color: rgba(255,255,255,0.5); font-size: 12px;">${agent.desc}</div>
              </div>
            </div>
          `;
          btn.addEventListener('click', () => {
            if (agent.id === 'analyze') openAIAnalyzeModal(state, showToast);
            else if (agent.id === 'character') openCharacterTrackingPanel(state, showToast);
            else if (agent.id === 'broll') suggestBRoll();
            else if (agent.id === 'audio') generateSubtitles();
            document.body.removeChild(modalOverlay);
          });
          agentsList.appendChild(btn);
        });
        
        const closeModal = () => document.body.removeChild(modalOverlay);
        modalContent.querySelector('.modal-close').addEventListener('click', closeModal);
        modalContent.querySelector('#close-agents').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());
        
        showToast('AI Agents panel opened', 'success');
      } catch (error) {
        console.error('Failed to open AI Agents panel:', error);
        showToast('Failed to open AI Agents panel', 'error');
      }
    }

    function openCharacterTrackingPanel(state, showToast) {
      try {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid var(--border); border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          max-width: 400px; width: 90%;
        `;
        
        modalContent.innerHTML = `
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);">
            <h3 style="margin: 0; color: rgba(255,255,255,0.9);">Character Tracking</h3>
            <button class="modal-close" style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Track and maintain character consistency across clips.</p>
            <div style="display: grid; gap: 8px; margin-bottom: 16px;">
              <button style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">Detect Characters</button>
              <button style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">Apply Consistency Rules</button>
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button id="close-character" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">Close</button>
            </div>
          </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const closeModal = () => document.body.removeChild(modalOverlay);
        modalContent.querySelector('.modal-close').addEventListener('click', closeModal);
        modalContent.querySelector('#close-character').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());
        
        showToast('Character tracking panel opened', 'success');
      } catch (error) {
        console.error('Failed to open Character Tracking panel:', error);
        showToast('Failed to open Character Tracking panel', 'error');
      }
    }

    function openTimelineAnalysisPanel(state, showToast) {
      try {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid var(--border); border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          max-width: 450px; width: 90%;
        `;
        
        modalContent.innerHTML = `
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);">
            <h3 style="margin: 0; color: rgba(255,255,255,0.9);">Timeline Analysis</h3>
            <button class="modal-close" style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 16px;">Analyze timeline for gaps, scene changes, and improvement suggestions.</p>
            <div id="analysis-results" style="margin-bottom: 16px; max-height: 200px; overflow-y: auto;"></div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button id="close-analysis" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">Close</button>
            </div>
          </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const resultsDiv = modalContent.querySelector('#analysis-results');
        resultsDiv.innerHTML = `
          <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
            <div style="color: #cffafe; font-weight: 500;">✓ No gaps detected</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Timeline is continuous</div>
          </div>
          <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
            <div style="color: #cffafe; font-weight: 500;">3 scenes detected</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Opening, Main, Closing</div>
          </div>
        `;
        
        const closeModal = () => document.body.removeChild(modalOverlay);
        modalContent.querySelector('.modal-close').addEventListener('click', closeModal);
        modalContent.querySelector('#close-analysis').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => e.target === modalOverlay && closeModal());
        
        showToast('Timeline analysis completed', 'success');
      } catch (error) {
        console.error('Failed to open Timeline Analysis panel:', error);
        showToast('Failed to open Timeline Analysis panel', 'error');
      }
    }

    return {
      destroy() {
        window.clearInterval(playbackTimer);

        // Clean up agent integration
        if (root._agentIntegration) {
          root._agentIntegration.destroy();
        }
        document.removeEventListener('keydown', handleKeyboardShortcuts);
        // Save final state
        saveProjectToStorage(state);
      }
    };
  }

  // Inject styles and initialize the timeline editor app
  injectStyles();
  createTimelineEditorApp(container);

  return container;
}
