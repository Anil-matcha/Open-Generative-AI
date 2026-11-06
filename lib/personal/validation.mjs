export const FILE_LIMITS = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024, audio: 30 * 1024 * 1024 };

export async function validateAsset(file, kind) {
  if (!(file instanceof Blob) || !file.size) throw new Error('Geçerli bir dosya seçin.');
  if (!FILE_LIMITS[kind] || file.size > FILE_LIMITS[kind]) throw new Error(`Dosya çok büyük. Sınır: ${FILE_LIMITS[kind] / 1024 / 1024} MB.`);
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const text = new TextDecoder('latin1').decode(bytes);
  if (kind === 'image') {
    const png = [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = text.startsWith('RIFF') && text.slice(8,12) === 'WEBP';
    if (!((png && file.type === 'image/png') || (jpeg && file.type === 'image/jpeg') || (webp && file.type === 'image/webp'))) throw new Error('PNG, JPEG veya WebP görseli seçin.');
  } else if (kind === 'video') {
    if (file.type !== 'video/mp4' || text.slice(4,8) !== 'ftyp') throw new Error('Geçerli bir MP4 video seçin.');
  } else {
    const wav = text.startsWith('RIFF') && text.slice(8,12) === 'WAVE';
    const mp3 = text.startsWith('ID3') || (bytes[0] === 255 && (bytes[1] & 224) === 224);
    const m4a = text.slice(4,8) === 'ftyp';
    if (!(file.type.startsWith('audio/') && (wav || mp3 || m4a))) throw new Error('MP3, WAV veya M4A ses dosyası seçin.');
  }
  return file;
}
