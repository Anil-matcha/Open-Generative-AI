import { BrandDNAExtractor } from './BrandDNAExtractor.js';
import { BrandDNAReviewPanel } from './BrandDNAReviewPanel.js';
import { CampaignConceptGenerator } from './CampaignConceptGenerator.js';
import { CreativeGeneratorPanel } from './CreativeGeneratorPanel.js';
import { ProductPhotoStudioPanel } from './ProductPhotoStudioPanel.js';
import { MarketingVideoGeneratorPanel } from './MarketingVideoGeneratorPanel.js';
import { MarketingOutputGallery } from './MarketingOutputGallery.js';
import { MarketingStudioSettingsModal } from './MarketingStudioSettingsModal.js';
import { createMarketingStudioController } from '../lib/marketingStudioController.js';
import { MarketingStudioDiagnosticsPanel } from './MarketingStudioDiagnosticsPanel.js';

export function MarketingStudioPage() {
  const appUrl = import.meta.env.VITE_OPEN_POMELLI_APP_URL;
  const controller = createMarketingStudioController();

  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto p-6 space-y-4';
  const status = document.createElement('div'); status.className = 'text-xs text-muted';
  const dnaPanelHost = document.createElement('div');
  const galleryHost = document.createElement('div');

  const refreshUI = () => {
    dnaPanelHost.innerHTML = '';
    galleryHost.innerHTML = '';
    dnaPanelHost.appendChild(BrandDNAReviewPanel({
      brandDna: controller.state.brandDna,
      onChange: (k, v) => controller.setBrandField(k, v)
    }));
    galleryHost.appendChild(MarketingOutputGallery({ outputs: controller.state.outputs }));
  };

  container.innerHTML = `<div class="bg-white/5 border border-white/10 rounded-2xl p-6"><h1 class="text-3xl font-black text-white">AI Marketing Studio</h1><p class="text-secondary mt-2">Paste any website URL and turn it into Brand DNA, campaign concepts, product creatives, and short-form video ideas.</p>${appUrl ? `<div class="mt-3 flex gap-3"><a href="${appUrl}" target="_blank" class="inline-block text-primary">Open Full Marketing Studio</a><button id="saveLib" class="text-xs px-3 py-1 rounded bg-white/10 text-white">Save to Library (TODO)</button></div><iframe src="${appUrl}" class="w-full h-64 rounded-xl border border-white/10 mt-3" loading="lazy"></iframe>` : '<p class="text-amber-400 text-sm mt-3">Set VITE_OPEN_POMELLI_APP_URL to embed standalone Marketing Studio.</p>'}</div>`;

  const extractor = BrandDNAExtractor({ onAnalyze: async (url) => {
    try {
      if (!url) throw new Error('Enter a valid website URL.');
      status.textContent = 'Analyzing brand website…';
      await controller.analyzeUrl(url);
      status.textContent = 'Brand DNA extracted and editable below.';
      refreshUI();
    } catch (e) { status.textContent = `Analyze failed: ${e.message}`; }
  }});

  const campaignGen = CampaignConceptGenerator({ onGenerate: async (slug) => {
    try { status.textContent = `Generating ${slug} campaigns…`; await controller.runCampaigns(slug); refreshUI(); status.textContent = 'Campaign concepts generated.'; }
    catch (e) { status.textContent = `Campaign generation failed: ${e.message}`; }
  }});

  const creative = CreativeGeneratorPanel({ onGenerate: async (assetType) => {
    try { status.textContent = `Generating ${assetType} creative…`; await controller.runCreative(assetType); refreshUI(); status.textContent = `${assetType} generated.`; }
    catch (e) { status.textContent = `Creative generation failed: ${e.message}`; }
  }});

  const photo = ProductPhotoStudioPanel({ onGenerate: async (prompt) => {
    try { status.textContent = 'Generating product-photo asset…'; await controller.runPhoto(prompt); refreshUI(); status.textContent = 'Product photo prompt generated.'; }
    catch (e) { status.textContent = `Product photo failed: ${e.message}`; }
  }});

  const video = MarketingVideoGeneratorPanel({ onGenerate: async (prompt) => {
    try { status.textContent = 'Generating short-form video asset…'; await controller.runVideo(prompt); refreshUI(); status.textContent = 'Video prompt generated.'; }
    catch (e) { status.textContent = `Video generation failed: ${e.message}`; }
  }});

  refreshUI();
  container.append(extractor, dnaPanelHost, campaignGen, creative, photo, video, galleryHost, MarketingStudioSettingsModal(), MarketingStudioDiagnosticsPanel(), status);
  return container;
}
