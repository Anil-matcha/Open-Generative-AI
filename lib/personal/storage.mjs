const STORES = ['characters', 'scenes', 'jobs', 'assets', 'preferences'];
let opening;
function openDatabase() {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open('personal-cloud-studio', 1);
    request.onupgradeneeded = () => STORES.forEach(name => {
      if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
    });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); opening = null; }; resolve(request.result); };
    request.onerror = () => { opening = null; reject(new Error('Tarayıcı depolaması açılamadı. Gizli mod veya depolama izinlerini kontrol edin.')); };
    request.onblocked = () => { opening = null; reject(new Error('Diğer stüdyo sekmesini kapatıp yeniden deneyin.')); };
  });
  return opening;
}
export async function storage(store, operation, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, ['get', 'getAll'].includes(operation) ? 'readonly' : 'readwrite');
    const request = transaction.objectStore(store)[operation](value);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(new Error('Kayıt yapılamadı. Tarayıcı depolama alanını ve izinlerini kontrol edin.'));
    transaction.onabort = transaction.onerror;
  });
}
export async function saveAsset(blob) {
  const asset = { id: crypto.randomUUID(), name: blob.name || 'video.mp4', type: blob.type, size: blob.size, blob };
  await storage('assets', 'put', asset);
  return asset.id;
}
export function sceneManifest(scenes, characters, assets = []) {
  return {
    schemaVersion: 1, exportedAt: new Date().toISOString(),
    scenes: scenes.map(scene => ({ ...scene,
      character: characters.find(character => character.id === scene.characterId) || null,
      references: assets.filter(asset => [scene.referenceId, scene.audioId].includes(asset.id)).map(({ blob: _blob, ...metadata }) => metadata),
    })),
    note: 'Dosyalar bu JSON içine gömülmez. Görsel, ses ve videoları ayrıca yedekleyin. Diyalog otomatik olarak seslendirilmez; ses eklemek dudak senkronizasyonu yapmaz.',
  };
}
export async function clearStudio() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES, 'readwrite');
    STORES.forEach(store => transaction.objectStore(store).clear());
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(new Error('Veriler silinemedi.'));
  });
}
