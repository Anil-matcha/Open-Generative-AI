'use client';
import { cloneElement, useEffect, useId, useState } from 'react';
import { storage, saveAsset } from '@/lib/personal/storage.mjs';
import { validateAsset } from '@/lib/personal/validation.mjs';
import { STATUS_TR } from '@/lib/personal/catalog.mjs';

export function useAssetUrl(id, fallback = '') {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true, objectUrl;
    setUrl('');
    if (id) storage('assets', 'get', id).then(asset => {
      if (asset?.blob && alive) { objectUrl = URL.createObjectURL(asset.blob); setUrl(objectUrl); }
    }).catch(() => {});
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return url || fallback;
}
export function AssetImage({ id, alt = '', className = '' }) {
  const url = useAssetUrl(id);
  return url ? <img src={url} alt={alt} className={className} /> : <div className={`ps-image-empty ${className}`}>Görsel yok</div>;
}
export function MediaPreview({ job }) {
  const url = useAssetUrl(job?.assetId, job?.url);
  return url ? <video key={url} src={url} controls playsInline preload="metadata" className="ps-video" /> : <div className="ps-preview-empty"><span>▷</span><h3>Hikâyeniz burada hareket kazanacak.</h3><p>Bir başlangıç karesi seçin ve ilk çekiminizi hazırlayın.</p></div>;
}
export function AudioPreview({ id }) {
  const url = useAssetUrl(id);
  return url ? <audio src={url} controls preload="metadata" className="w-full" /> : null;
}
export function Field({ label, children, hint }) {
  const id = useId();
  return <div className="ps-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })}{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function Status({ status }) { return <span className={`ps-status ps-status-${status}`}>{STATUS_TR[status] || 'Bilinmiyor'}</span>; }
export function Empty({ children }) { return <div className="ps-empty">{children}</div>; }
export function FileInput({ kind = 'image', onSaved, multiple = false, label = 'Görsel yükle', disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const accept = { image: 'image/png,image/jpeg,image/webp', audio: 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a', video: 'video/mp4' }[kind];
  return <div className="ps-file"><label className="ps-file-label">{busy ? 'Kaydediliyor…' : label}
    <input type="file" aria-label={label} accept={accept} multiple={multiple} disabled={disabled || busy} onChange={async event => {
      const files = Array.from(event.target.files || []); if (!files.length) return;
      setError(''); setBusy(true);
      try {
        if (files.length > 8) throw new Error('Bir seferde en fazla 8 dosya seçin.');
        for (const file of files) await validateAsset(file, kind);
        const ids = []; for (const file of files) ids.push(await saveAsset(file));
        await onSaved(multiple ? ids : ids[0]);
      } catch (failure) { setError(failure.message); }
      finally { setBusy(false); event.target.value = ''; }
    }} />
  </label>{error && <p role="alert" className="ps-error">{error}</p>}</div>;
}
export function downloadJson(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadAsset(id, fallback, name) {
  let url, revoke = false;
  if (id) {
    const asset = await storage('assets', 'get', id);
    if (!asset) throw new Error('Video dosyası bulunamadı.');
    url = URL.createObjectURL(asset.blob); revoke = true;
  } else url = fallback;
  if (!url) throw new Error('Video henüz hazır değil.');
  const link = document.createElement('a'); link.href = url; link.download = name; link.rel = 'noreferrer';
  if (!revoke) link.target = '_blank';
  link.click(); if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
}
