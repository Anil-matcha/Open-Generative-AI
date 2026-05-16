export const ASSET_EVENTS = {
  CREATED: 'asset:created',
  UPDATED: 'asset:updated',
  DELETED: 'asset:deleted',
  OPENED: 'asset:opened',
  RENDERED: 'asset:rendered',
  SENT_TO_DIRECTOR: 'asset:sent-to-director',
  SENT_TO_TIMELINE: 'asset:sent-to-timeline',
  SENT_TO_EDITOR: 'asset:sent-to-editor',
  SENT_TO_RENDER: 'asset:sent-to-render'
};

export function createAssetEvent(type, detail) {
  return new CustomEvent(type, { detail });
}

export function listenForAssets(callback) {
  const handleEvent = (event) => callback(event.type, event.detail);
  
  Object.values(ASSET_EVENTS).forEach(eventType => {
    window.addEventListener(eventType, handleEvent);
  });
  
  return () => {
    Object.values(ASSET_EVENTS).forEach(eventType => {
      window.removeEventListener(eventType, handleEvent);
    });
  };
}

export function emitAssetEvent(eventType, detail) {
  window.dispatchEvent(createAssetEvent(eventType, detail));
}