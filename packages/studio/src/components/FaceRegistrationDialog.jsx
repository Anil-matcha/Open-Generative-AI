"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaSpinner,
  FaQrcode,
  FaUpload,
  FaCheck,
  FaCopy,
  FaRegSmile
} from 'react-icons/fa';

export default function FaceRegistrationDialog({ open, onClose, onRegistered }) {
  const [step, setStep] = useState('name'); // 'name' | 'verify' | 'photo' | 'processing' | 'done'
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [groupId, setGroupId] = useState('');
  const [assetUri, setAssetUri] = useState('');
  const [photo, setPhoto] = useState(null);
  const [h5Link, setH5Link] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const fileRef = useRef(null);
  const cancelPollRef = useRef(false);

  const reset = () => {
    cancelPollRef.current = true;
    setStep('name');
    setDisplayName('');
    setBusy(false);
    setStatusText('');
    setGroupId('');
    setAssetUri('');
    setPhoto(null);
    setH5Link('');
    setQrUrl('');
  };

  const startVerification = async () => {
    if (!displayName.trim()) {
      toast.error('Введите имя');
      return;
    }
    cancelPollRef.current = false;
    setBusy(true);
    setStatusText('Создаём сессию верификации…');
    try {
      const resp = await fetch('/api/face/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackUrl: `${window.location.origin}/api/face/callback` }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.h5Link) throw new Error(json.error || 'Не удалось создать сессию');

      setH5Link(json.h5Link);
      setQrUrl(json.shortUrl || json.h5Link);
      setStep('verify');
      setBusy(false);
      setStatusText('');

      // Запускаем поллинг результата
      pollGroup(json.bytedToken);
    } catch (e) {
      toast.error(e.message || 'Ошибка');
      setBusy(false);
      setStep('name');
    }
  };

  const pollGroup = async (bytedToken) => {
    for (let i = 0; i < 40; i++) {
      if (cancelPollRef.current) return;
      await new Promise(r => setTimeout(r, 3000));
      if (cancelPollRef.current) return;
      try {
        const resp = await fetch('/api/face/get-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bytedToken }),
        });
        const json = await resp.json();
        if (json.groupId) {
          setGroupId(json.groupId);
          setStep('photo');
          setStatusText('Загрузите фото этого человека (анфас, лицо крупно)');
          return;
        }
      } catch {}
    }
    toast.error('Время верификации истекло. Начните заново.');
    setStep('name');
  };

  const onPickPhoto = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Нужно изображение');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result);
    reader.readAsDataURL(file);
  };

  const uploadAndCreateAsset = async () => {
    if (!photo || !groupId) return;
    setBusy(true);
    setStep('processing');
    setStatusText('Загружаем фото…');
    try {
      // Convert data URL to blob
      const arr = photo.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      const u8 = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
      const blob = new Blob([u8], { type: mime });

      // Upload to TOS
      const ext = mime.split('/')[1] || 'jpg';
      const uploadResp = await fetch(`/api/upload-file?filename=face.${ext}&type=${encodeURIComponent(mime)}`);
      const uploadData = await uploadResp.json();
      if (!uploadData.putUrl) throw new Error('Не удалось получить URL загрузки');

      const tosResp = await fetch(uploadData.putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mime },
        body: blob,
      });
      if (!tosResp.ok) throw new Error('Не удалось загрузить фото');

      // Get public URL
      const publicUrl = uploadData.publicUrl;

      setStatusText('Регистрируем лицо в Volcano ARK…');
      const caResp = await fetch('/api/face/create-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, url: publicUrl, assetType: 'Image', name: displayName.trim() }),
      });
      const caJson = await caResp.json();
      if (!caResp.ok || !caJson.assetId) throw new Error(caJson.error || 'Не удалось создать ассет');
      const assetId = caJson.assetId;

      setStatusText('Обрабатываем (сверка лица)…');
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const gaResp = await fetch('/api/face/get-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId }),
        });
        const gaJson = await gaResp.json();
        if (gaJson.status === 'Active') {
          const uri = `asset://${assetId}`;
          setAssetUri(uri);
          setStep('done');
          setStatusText('');
          setBusy(false);
          onRegistered?.(uri, displayName.trim());
          toast.success('Лицо зарегистрировано!');
          return;
        }
        if (gaJson.status === 'Failed') throw new Error('ARK отклонил фото: лицо не совпадает или несколько лиц на фото.');
      }
      throw new Error('Обработка слишком долгая, попробуйте позже.');
    } catch (e) {
      toast.error(e.message || 'Ошибка');
      setBusy(false);
      setStep('photo');
    }
  };

  const handleClose = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose]);

  useEffect(() => { if (!open) reset(); }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaRegSmile className="h-5 w-5 text-[#22d3ee]" />
            <h3 className="text-lg font-semibold text-white">Регистрация лица</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={busy}
            className="text-white/40 hover:text-white disabled:opacity-40"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          {['name', 'verify', 'photo', 'done'].map((s) => {
            const order = ['name', 'verify', 'photo', 'processing', 'done'];
            const active = order.indexOf(step) >= order.indexOf(s);
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${active ? 'bg-[#22d3ee]' : 'bg-white/10'}`}
              />
            );
          })}
        </div>

        {/* Step 1: Name */}
        {step === 'name' && (
          <>
            <p className="text-xs text-white/60 leading-relaxed">
              Seedance 2.0 разрешает оживлять реальные лица только после <b>верификации живого человека</b>.
              Это займет ~1 минуту: проверка лица (селфи) → загрузка фото → готово.
            </p>
            <div>
              <label className="block text-xs text-white/50 mb-1">Имя персонажа</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Я сам"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22d3ee]"
              />
            </div>
            <button
              onClick={startVerification}
              disabled={busy || !displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:from-[#06b6d4] hover:to-[#9333ea] disabled:opacity-50 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {busy ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaQrcode className="h-4 w-4" />}
              {busy ? statusText : 'Начать верификацию'}
            </button>
          </>
        )}

        {/* Step 2: Verify via QR */}
        {step === 'verify' && (
          <div className="py-2 text-center space-y-3">
            <p className="text-sm font-medium text-white">Отсканируйте QR-код телефоном</p>
            {qrUrl && (
              <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                <div className="w-[220px] h-[220px] bg-white flex items-center justify-center text-center text-xs text-gray-400">
                  QR: {qrUrl.slice(0, 30)}...
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-[#22d3ee]">
              <FaSpinner className="h-3.5 w-3.5 animate-spin" />
              Ожидаем прохождение проверки…
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Наведите камеру телефона на QR-код → откроется проверка лица.
              Сделайте селфи по инструкции. Окно обновится автоматически.
            </p>
            <button
              onClick={() => window.open(h5Link, '_blank')}
              className="text-xs text-white/60 hover:text-[#22d3ee] underline"
            >
              Или пройти на этом устройстве →
            </button>
          </div>
        )}

        {/* Step 3: Photo */}
        {step === 'photo' && (
          <>
            <p className="text-xs text-white/60">
              ✓ Лицо подтверждено. Теперь загрузите фото этого же человека — анфас, лицо крупным планом, без других людей.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickPhoto(f); e.target.value = ''; }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-square max-h-64 mx-auto bg-white/5 border border-dashed border-white/20 hover:border-[#22d3ee] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-white/40">
                  <FaUpload className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-xs">Нажми чтобы выбрать фото</span>
                </div>
              )}
            </div>
            <button
              onClick={uploadAndCreateAsset}
              disabled={!photo}
              className="w-full py-3 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:from-[#06b6d4] hover:to-[#9333ea] disabled:opacity-50 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <FaQrcode className="h-4 w-4" /> Зарегистрировать
            </button>
          </>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="py-6 text-center space-y-3">
            <FaSpinner className="h-10 w-10 animate-spin text-[#22d3ee] mx-auto" />
            <p className="text-sm text-white">{statusText}</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <FaCheck className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-white">Лицо «{displayName}» зарегистрировано!</p>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-[#22d3ee] truncate flex-1">{assetUri}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(assetUri); toast.success('Скопировано'); }}
                className="text-white/60 hover:text-[#22d3ee]"
              >
                <FaCopy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-white/50">Теперь можно использовать это лицо в видео.</p>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] font-medium rounded-xl transition-colors"
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
