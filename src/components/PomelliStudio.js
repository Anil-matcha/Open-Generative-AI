import { supabase } from '../lib/supabase.js';

const CAMPAIGN_GOALS = [
  { id: 'product_launch', name: 'Product Launch' },
  { id: 'lead_generation', name: 'Lead Generation' },
  { id: 'awareness', name: 'Brand Awareness' },
  { id: 'engagement', name: 'Engagement' },
  { id: 'thought_leadership', name: 'Thought Leadership' },
  { id: 'sales', name: 'Sales' },
  { id: 'webinar_promotion', name: 'Webinar Promotion' },
  { id: 'local_business', name: 'Local Business' },
  { id: 'agency_client', name: 'Agency Client' },
  { id: 'software_promotion', name: 'Software Promotion' }
];

const PLATFORMS = [
  { id: 'instagram_feed', name: 'Instagram Feed', aspect: '4:5' },
  { id: 'instagram_story', name: 'Instagram Story', aspect: '9:16' },
  { id: 'facebook_ad', name: 'Facebook Ad', aspect: '1.91:1' },
  { id: 'linkedin_post', name: 'LinkedIn Post', aspect: '1.91:1' },
  { id: 'twitter_post', name: 'X/Twitter Post', aspect: '1:1' },
  { id: 'youtube_thumbnail', name: 'YouTube Thumbnail', aspect: '16:9' },
  { id: 'web_banner', name: 'Web Banner', aspect: '16:9' },
  { id: 'email_header', name: 'Email Header', aspect: '4:1' },
  { id: 'short_form_video', name: 'Short-Form Video', aspect: '9:16' },
  { id: 'product_photo', name: 'Product Photo', aspect: '1:1' }
];

export function PomelliStudio() {
  const element = document.createElement('div');
  element.className = 'w-full h-full flex flex-col bg-app-bg';
  element.style.overflow = 'hidden';

  let state = {
    step: 1,
    websiteUrl: '',
    campaignDirection: '',
    brandProfile: null,
    campaign: null,
    selectedConcept: null,
    selectedPlatform: 'instagram_feed',
    generatedAssets: [],
    isLoading: false,
    error: null
  };

  const API_BASE = '/api';

  const renderHeader = () => `
    <div class="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-white">Pomelli Studio</h1>
        <p class="text-secondary text-sm mt-1">Turn any website into Brand DNA, campaigns, and creative assets</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.location.reload()" class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-secondary hover:text-white transition-colors">
          New Project
        </button>
      </div>
    </div>
  `;

  const renderStep1 = () => {
    const container = document.createElement('div');
    container.className = 'flex-1 flex items-center justify-center p-4';
    
    container.innerHTML = `
      <div class="max-w-2xl w-full">
        <h2 class="text-xl font-bold text-white mb-2">Analyze a Website</h2>
        <p class="text-secondary text-sm mb-6">Enter any business website URL to extract brand DNA including colors, fonts, tone, and visual style.</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-2">Website URL</label>
            <input type="url" id="website-url" placeholder="https://example.com" 
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-secondary mb-2">Campaign Direction (Optional)</label>
            <textarea id="campaign-direction" placeholder="e.g., Focus on premium positioning for tech startups..." 
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none" rows="3"></textarea>
          </div>
          
          <button id="analyze-btn" class="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <span>Analyze Website</span>
          </button>
        </div>
      </div>
    `;

    container.querySelector('#analyze-btn').onclick = async () => {
      const url = container.querySelector('#website-url').value.trim();
      const direction = container.querySelector('#campaign-direction').value.trim();
      
      if (!url) {
        container.querySelector('#website-url').focus();
        return;
      }

      state.websiteUrl = url;
      state.campaignDirection = direction;
      state.isLoading = true;
      state.error = null;
      
      render();
      
      try {
        const response = await fetch(`${API_BASE}/pomelli-analyze-site`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!response.ok) throw new Error('Analysis failed');
        
        const data = await response.json();
        state.brandProfile = data.brand_profile;
        state.step = 2;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
        render();
      }
    };

    return container;
  };

  const renderStep2 = () => {
    const container = document.createElement('div');
    container.className = 'flex-1 flex flex-col';
    
    container.innerHTML = `
      <div class="p-4 md:p-6 border-b border-white/10">
        <button id="back-btn" class="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
          Back
        </button>
        
        <h2 class="text-xl font-bold text-white mb-2">Brand DNA</h2>
        <p class="text-secondary text-sm mb-4">Review and edit the extracted brand profile</p>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-muted mb-1">Brand Name</label>
              <input type="text" value="${state.brandProfile?.brand_name || ''}" 
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
            </div>
            
            <div>
              <label class="block text-xs font-medium text-muted mb-1">Value Proposition</label>
              <textarea class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none" rows="2">${state.brandProfile?.value_proposition || ''}</textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-muted mb-1">Target Audience</label>
                <input type="text" value="${state.brandProfile?.target_audience || ''}" 
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
              </div>
              <div>
                <label class="block text-xs font-medium text-muted mb-1">Tone</label>
                <input type="text" value="${state.brandProfile?.tone?.join(', ') || ''}" 
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-muted mb-1">Primary Colors</label>
              <div class="flex gap-2">
                ${(state.brandProfile?.primary_colors || []).map(c => `<div class="w-8 h-8 rounded-full border-2 border-white/20" style="background: ${c}"></div>`).join('')}
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-muted mb-1">Visual Style</label>
              <input type="text" value="${state.brandProfile?.visual_style || ''}" 
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 md:p-6">
        <div class="flex gap-2">
          <button id="save-brand" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Save Brand DNA</button>
          <button id="regenerate-brand" class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-secondary text-sm hover:text-white transition-colors">Regenerate</button>
        </div>
      </div>
    `;

    container.querySelector('#back-btn').onclick = () => {
      state.step = 1;
      render();
    };

    container.querySelector('#save-brand').onclick = async () => {
      const { error } = await supabase
        .from('pomelli_brand_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', state.brandProfile.id);
    };

    return container;
  };

  const renderStep3 = () => {
    const container = document.createElement('div');
    container.className = 'flex-1 flex flex-col';
    
    container.innerHTML = `
      <div class="p-4 md:p-6 border-b border-white/10">
        <button id="back-btn" class="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
          Back
        </button>
        
        <h2 class="text-xl font-bold text-white mb-2">Create Campaign</h2>
        <p class="text-secondary text-sm mb-4">Select a campaign goal and generate 4 on-brand concepts</p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-2">Campaign Goal</label>
            <select id="campaign-goal" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 transition-colors">
              ${CAMPAIGN_GOALS.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-secondary mb-2">Campaign Direction (Optional)</label>
            <textarea id="campaign-direction" placeholder="Additional guidance for campaign concepts..." 
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none" rows="3">${state.campaignDirection || ''}</textarea>
          </div>
          
          <button id="generate-concepts" class="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
            Generate Campaign Concepts
          </button>
        </div>
      </div>
    `;

    container.querySelector('#back-btn').onclick = () => {
      state.step = 2;
      render();
    };

    container.querySelector('#generate-concepts').onclick = async () => {
      const goal = container.querySelector('#campaign-goal').value;
      const direction = container.querySelector('#campaign-direction').value;
      
      state.isLoading = true;
      render();
      
      try {
        const response = await fetch(`${API_BASE}/pomelli-generate-campaign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brand_profile_id: state.brandProfile.id,
            campaign_goal: goal,
            campaign_direction: direction
          })
        });

        if (!response.ok) throw new Error('Campaign generation failed');
        
        const data = await response.json();
        state.campaign = data.campaign;
        state.step = 4;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
        render();
      }
    };

    return container;
  };

  const renderStep4 = () => {
    const container = document.createElement('div');
    container.className = 'flex-1 flex flex-col';
    
    const concepts = state.campaign?.concepts || [];
    
    container.innerHTML = `
      <div class="p-4 md:p-6 border-b border-white/10">
        <button id="back-btn" class="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
          Back
        </button>
        
        <h2 class="text-xl font-bold text-white mb-2">Campaign Concepts</h2>
        <p class="text-secondary text-sm mb-4">Select a concept to generate platform-specific assets</p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 md:p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${concepts.map((c, i) => `
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors" onclick="window.pomelli.selectConcept(${i})">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">${i + 1}</div>
                <div class="flex-1">
                  <h3 class="font-bold text-white mb-1">${c.name}</h3>
                  <p class="text-sm text-secondary mb-2">${c.big_idea}</p>
                  <div class="space-y-1 text-xs">
                    <div><span class="text-muted">Hook:</span> ${c.hook}</div>
                    <div><span class="text-muted">CTA:</span> ${c.cta}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#back-btn').onclick = () => {
      state.step = 3;
      render();
    };

    window.pomelli = window.pomelli || {};
    window.pomelli.selectConcept = (index) => {
      state.selectedConcept = state.campaign.concepts[index];
      state.step = 5;
      render();
    };

    return container;
  };

  const renderStep5 = () => {
    const container = document.createElement('div');
    container.className = 'flex-1 flex flex-col';
    
    container.innerHTML = `
      <div class="p-4 md:p-6 border-b border-white/10">
        <button id="back-btn" class="flex items-center gap-2 text-secondary hover:text-white transition-colors mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
          Back
        </button>
        
        <h2 class="text-xl font-bold text-white mb-2">Generate Assets</h2>
        <p class="text-secondary text-sm mb-4">Create platform-specific creatives from your selected concept</p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 md:p-6">
        <div class="max-w-2xl space-y-6">
          <div>
            <label class="block text-sm font-medium text-secondary mb-3">Select Platform</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              ${PLATFORMS.map(p => `
                <button class="platform-btn border-2 ${state.selectedPlatform === p.id ? 'border-primary bg-primary/20' : 'border-white/10'} rounded-lg p-3 text-left hover:bg-white/5 transition-colors" data-platform="${p.id}">
                  <div class="text-sm font-medium text-white">${p.name}</div>
                  <div class="text-xs text-muted mt-1">Aspect: ${p.aspect}</div>
                </button>
              `).join('')}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-secondary mb-2">Custom Instructions (Optional)</label>
            <textarea id="custom-instructions" placeholder="Additional styling or content guidance..." 
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none" rows="3"></textarea>
          </div>
          
          <button id="generate-btn" class="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <span>Generate Asset</span>
          </button>
        </div>
      </div>
    `;

    container.querySelector('#back-btn').onclick = () => {
      state.step = 4;
      render();
    };

    container.querySelectorAll('.platform-btn').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.platform-btn').forEach(b => {
          b.classList.remove('border-primary', 'bg-primary/20');
          b.classList.add('border-white/10');
        });
        btn.classList.add('border-primary', 'bg-primary/20');
        state.selectedPlatform = btn.dataset.platform;
      };
    });

    container.querySelector('.platform-btn[data-platform="' + state.selectedPlatform + '"]').classList.add('border-primary', 'bg-primary/20');

    container.querySelector('#generate-btn').onclick = async () => {
      const instructions = container.querySelector('#custom-instructions').value;
      
      state.isLoading = true;
      render();
      
      try {
        const response = await fetch(`${API_BASE}/pomelli-generate-asset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_profile_id: state.brandProfile.id,
            campaign_id: state.campaign.id,
            platform: state.selectedPlatform,
            asset_type: 'image',
            concept: state.selectedConcept,
            custom_instructions: instructions
          })
        });

        if (!response.ok) throw new Error('Asset generation failed');
        
        const data = await response.json();
        state.generatedAssets.push(data.asset);
        state.error = null;
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false;
        render();
      }
    };

    return container;
  };

  function render() {
    element.innerHTML = '';
    
    const header = document.createElement('div');
    header.innerHTML = renderHeader();
    element.appendChild(header);
    
    const progress = document.createElement('div');
    progress.className = 'flex items-center gap-2 px-4 md:px-6 py-2 border-b border-white/10';
    progress.innerHTML = `
      <div class="${state.step >= 1 ? 'bg-primary' : 'bg-white/20'} rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
      <div class="${state.step >= 2 ? 'bg-primary' : 'bg-white/20'} rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
      <div class="${state.step >= 3 ? 'bg-primary' : 'bg-white/20'} rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
      <div class="${state.step >= 4 ? 'bg-primary' : 'bg-white/20'} rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
      <div class="${state.step >= 5 ? 'bg-primary' : 'bg-white/20'} rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</div>
    `;
    element.appendChild(progress);
    
    let stepContent;
    switch (state.step) {
      case 1: stepContent = renderStep1(); break;
      case 2: stepContent = renderStep2(); break;
      case 3: stepContent = renderStep3(); break;
      case 4: stepContent = renderStep4(); break;
      case 5: stepContent = renderStep5(); break;
    }
    element.appendChild(stepContent);
    
    if (state.isLoading) {
      const loader = document.createElement('div');
      loader.className = 'absolute inset-0 bg-black/50 flex items-center justify-center z-50';
      loader.innerHTML = `
        <div class="text-center">
          <div class="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-secondary">Processing...</p>
        </div>
      `;
      element.appendChild(loader);
    }
    
    if (state.error) {
      const errorEl = document.createElement('div');
      errorEl.className = 'p-4 md:p-6';
      errorEl.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div class="text-red-400 text-sm">${state.error}</div>
        </div>
      `;
      element.appendChild(errorEl);
    }
  }

  render();
  return element;
}