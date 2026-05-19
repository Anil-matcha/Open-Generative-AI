export class OutputHandoff {
  static HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    director: 'higgsfield.pendingDirectorOutput',
    timeline: 'higgsfield.pendingTimelineOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput',
    'video-agent': 'higgsfield.pendingVideoAgentOutput'
  };

  static saveGeneratedAsset(asset) {
    const metadata = {
      id: asset.id || 'asset_' + Date.now(),
      app_id: asset.app_id || 'unknown',
      app_name: asset.app_name || 'Unknown App',
      source_project_id: asset.source_project_id || null,
      type: asset.type || 'image',
      title: asset.title || 'Generated Asset',
      prompt: asset.prompt || '',
      model: asset.model || 'unknown',
      provider: asset.provider || 'muapi',
      source_url: asset.source_url || '',
      output_url: asset.output_url || asset.url || '',
      thumbnail_url: asset.thumbnail_url || asset.url || '',
      created_at: asset.created_at || new Date().toISOString(),
      settings: asset.settings || {},
      handoff_targets: asset.handoff_targets || ['library']
    };
    
    localStorage.setItem('higgsfield.generatedAsset', JSON.stringify(metadata));
    return metadata;
  }

  static sendToLibrary(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('library', asset);
  }

  static sendToRender(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('render', asset);
  }

  static sendToDirector(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('director', asset);
  }

  static sendToTimeline(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('timeline', asset);
  }

  static sendToEditStudio(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('edit-studio', asset);
  }

  static sendToVideoAgent(asset) {
    this.saveGeneratedAsset(asset);
    this.sendToTarget('video-agent', asset);
  }

  static sendToTarget(target, asset) {
    const key = this.HANDOFF_KEYS[target];
    if (!key) throw new Error(`Unknown target: ${target}`);
    
    sessionStorage.setItem(key, JSON.stringify({
      content: asset,
      timestamp: new Date().toISOString()
    }));
  }

  static getPendingOutput(target) {
    const key = this.HANDOFF_KEYS[target];
    if (!key) return null;
    
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    
    sessionStorage.removeItem(key);
    return JSON.parse(data);
  }
}

export const saveGeneratedAsset = OutputHandoff.saveGeneratedAsset.bind(OutputHandoff);
export const sendToLibrary = OutputHandoff.sendToLibrary.bind(OutputHandoff);
export const sendToRender = OutputHandoff.sendToRender.bind(OutputHandoff);
export const sendToDirector = OutputHandoff.sendToDirector.bind(OutputHandoff);
export const sendToTimeline = OutputHandoff.sendToTimeline.bind(OutputHandoff);
export const sendToEditStudio = OutputHandoff.sendToEditStudio.bind(OutputHandoff);
export const sendToVideoAgent = OutputHandoff.sendToVideoAgent.bind(OutputHandoff);