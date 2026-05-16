/**
 * Visual Generation Service
 * Bridges personalized prompts to actual image/video generation
 * Integrates with generationService.js (MuAPI/LTX) and the personalization system
 */

import { muapi } from '../muapi.js';
import { supabase } from '../supabase-client';
import { buildPersonalizedImagePrompt, buildPersonalizedVideoPromptPack } from '../promptEngine.js';
import { assetReplacementEngine } from '../personalizer/assetReplacementEngine';

const DEFAULT_IMAGE_MODEL = 'flux-1.1-pro';
const DEFAULT_VIDEO_MODEL = 'ltx-2-fast';

const ASPECT_RATIO_MAP = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1440, height: 1080 }
};

export class VisualGenerationService {
  constructor() {
    this.activeGenerations = new Map();
  }

  /**
   * Generate a personalized image
   * @param {Object} params
   * @param {string} params.projectId - Personalization project ID
   * @param {Object} params.scanData - Public profile scan results
   * @param {Object} params.inputs - User inputs (visualStyle, aspectRatio, etc.)
   * @param {string} params.appId - Target app ID
   * @param {Function} params.onProgress - Progress callback
   * @returns {Promise<Object>} - { assetId, url, metadata }
   */
  async generatePersonalizedImage({ projectId, scanData, inputs, onProgress }) {
    const generationId = `img-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      onProgress?.({ status: 'building_prompt', progress: 10 });

      // Build the personalized visual prompt
      const visualPrompt = buildPersonalizedImagePrompt(scanData, {
        targetName: inputs.targetName,
        visualStyle: inputs.visualStyle || 'cinematic',
        aspectRatio: inputs.aspectRatio || '16:9',
        extraInstructions: inputs.manualNotes
      });

      onProgress?.({ status: 'generating', progress: 30 });

      // Submit to MuAPI for image generation
      const result = await muapi.generateImage({
        model: inputs.model || DEFAULT_IMAGE_MODEL,
        prompt: visualPrompt,
        aspect_ratio: inputs.aspectRatio || '16:9',
        width: ASPECT_RATIO_MAP[inputs.aspectRatio]?.width || 1920,
        height: ASPECT_RATIO_MAP[inputs.aspectRatio]?.height || 1080,
        seed: inputs.seed || Math.floor(Math.random() * 2147483647),
      });

      onProgress?.({ status: 'processing', progress: 70 });

      // Apply asset replacement layers if configured
      let finalUrl = result.url;
      if (inputs.applyPersonalization !== false && scanData) {
        const replacementResult = await assetReplacementEngine.personalizeAsset({
          baseUrl: finalUrl,
          type: 'image',
          scanData,
          tokens: assetReplacementEngine.extractTokensFromScan(scanData),
          options: {
            textOverlays: inputs.textOverlays || [],
            colorGrade: true
          }
        });
        if (replacementResult.success) {
          finalUrl = replacementResult.url;
        }
      }

      onProgress?.({ status: 'saving', progress: 90 });

      // Store in personalized_assets table
      const { data: asset, error } = await supabase
        .from('personalized_assets')
        .insert({
          project_id: projectId,
          asset_type: 'image',
          generation_prompt: visualPrompt,
          generated_url: finalUrl,
          metadata: {
            model: inputs.model || DEFAULT_IMAGE_MODEL,
            scanData: scanData?.summary,
            visualStyle: inputs.visualStyle,
            aspectRatio: inputs.aspectRatio,
            generationId
          },
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      onProgress?.({ status: 'completed', progress: 100 });

      return {
        assetId: asset.id,
        url: finalUrl,
        prompt: visualPrompt,
        metadata: asset.metadata
      };
    } catch (error) {
      console.error(`[VisualGenerationService] Image generation ${generationId} failed:`, error);

      // Store failed attempt
      await supabase.from('personalized_assets').insert({
        project_id: projectId,
        asset_type: 'image',
        generation_prompt: '',
        status: 'failed',
        error: error.message
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Generate a personalized video
   * @param {Object} params
   * @param {string} params.projectId - Personalization project ID
   * @param {Object} params.scanData - Public profile scan results
   * @param {Object} params.inputs - User inputs (visualStyle, aspectRatio, storyType, duration, etc.)
   * @param {string} params.appId - Target app ID
   * @param {Function} params.onProgress - Progress callback
   * @returns {Promise<Object>} - { assetId, url, metadata, scenes }
   */
  async generatePersonalizedVideo({ projectId, scanData, inputs, onProgress }) {
    const generationId = `vid-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      onProgress?.({ status: 'building_prompt', progress: 5 });

      // Build the personalized video prompt pack
      const promptPack = buildPersonalizedVideoPromptPack(scanData, {
        targetName: inputs.targetName,
        visualStyle: inputs.visualStyle || 'cinematic',
        aspectRatio: inputs.aspectRatio || '16:9',
        storyType: inputs.storyType || 'founder-story',
        durationSeconds: inputs.durationSeconds || 30,
        tone: inputs.tone || 'professional',
        offer: inputs.offer,
        cta: inputs.cta,
        manualNotes: inputs.manualNotes
      });

      onProgress?.({ status: 'generating', progress: 20 });

      // Generate video using text-to-video model
      const duration = inputs.durationSeconds || 30;
      const modelKey = inputs.model || DEFAULT_VIDEO_MODEL;

      const result = await muapi.generateVideo({
        model: modelKey,
        prompt: promptPack.masterPrompt,
        aspect_ratio: inputs.aspectRatio || '16:9',
        duration: Math.min(duration, 20), // Cap at 20s for initial generation
        negative_prompt: promptPack.negativePrompt,
      });

      onProgress?.({ status: 'processing', progress: 60 });

      // Apply asset replacement layers
      let finalUrl = result.url;
      if (inputs.applyPersonalization !== false && scanData) {
        const replacementResult = await assetReplacementEngine.personalizeAsset({
          baseUrl: finalUrl,
          type: 'video',
          scanData,
          tokens: assetReplacementEngine.extractTokensFromScan(scanData),
          options: {
            textOverlays: inputs.textOverlays || [],
            background: inputs.background || 'auto',
            colorGrade: true
          }
        });
        if (replacementResult.success) {
          finalUrl = replacementResult.url;
        }
      }

      onProgress?.({ status: 'saving', progress: 90 });

      // Store in personalized_assets table
      const { data: asset, error } = await supabase
        .from('personalized_assets')
        .insert({
          project_id: projectId,
          asset_type: 'video',
          generation_prompt: promptPack.masterPrompt,
          generated_url: finalUrl,
          metadata: {
            model: modelKey,
            scanData: scanData?.summary,
            visualStyle: inputs.visualStyle,
            aspectRatio: inputs.aspectRatio,
            storyType: inputs.storyType,
            duration,
            scenes: promptPack.scenePrompts,
            voiceoverDirection: promptPack.voiceoverDirection,
            generationId
          },
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      onProgress?.({ status: 'completed', progress: 100 });

      return {
        assetId: asset.id,
        url: finalUrl,
        prompt: promptPack.masterPrompt,
        scenes: promptPack.scenePrompts,
        voiceoverDirection: promptPack.voiceoverDirection,
        metadata: asset.metadata
      };
    } catch (error) {
      console.error(`[VisualGenerationService] Video generation ${generationId} failed:`, error);

      await supabase.from('personalized_assets').insert({
        project_id: projectId,
        asset_type: 'video',
        generation_prompt: '',
        status: 'failed',
        error: error.message
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Generate a personalized thumbnail
   */
  async generatePersonalizedThumbnail({ projectId, scanData, inputs, onProgress }) {
    const result = await this.generatePersonalizedImage({
      projectId,
      scanData,
      inputs: { ...inputs, aspectRatio: '16:9', visualStyle: 'thumbnail' },
      onProgress
    });

    // Update asset type to thumbnail
    await supabase.from('personalized_assets')
      .update({ asset_type: 'thumbnail' })
      .eq('id', result.assetId);

    return result;
  }

  /**
   * Get all assets for a project
   */
  async getProjectAssets(projectId) {
    const { data, error } = await supabase
      .from('personalized_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete a personalized asset
   */
  async deleteAsset(assetId) {
    const { error } = await supabase
      .from('personalized_assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;
    return true;
  }
}

// Export singleton
export const visualGenerationService = new VisualGenerationService();

export default VisualGenerationService;
