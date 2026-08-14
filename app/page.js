'use client';
import { useState } from 'react';

export default function Studio() {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('image');
  const [orientation, setOrientation] = useState('square');
  const [length, setLength] = useState('short');
  const [referenceAsset, setReferenceAsset] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle local reference file selection and convert to base64
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceAsset(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleGeneration() {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type, orientation, length, referenceAsset }),
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.data);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      alert("An error occurred while connecting to the server.");
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto', padding: '24px', background: '#16161e', color: '#fff', borderRadius: '12px', fontFamily: 'sans-serif', border: '1px solid #2d2d3d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Open-Generative-AI Studio</h2>
        <span style={{ background: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Identity Consistency Mode</span>
      </div>

      {/* Type Selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setType('image')} 
          style={{ flex: 1, padding: '10px', background: type === 'image' ? '#7c3aed' : '#0b0b0f', color: '#fff', border: '1px solid #2d2d3d', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          Image Mode
        </button>
        <button 
          onClick={() => setType('video')} 
          style={{ flex: 1, padding: '10px', background: type === 'video' ? '#7c3aed' : '#0b0b0f', color: '#fff', border: '1px solid #2d2d3d', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          Video Mode
        </button>
      </div>

      {/* Conditional Options: Orientation for Images, Length for Videos */}
      {type === 'image' ? (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Image Orientation</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['square', 'portrait', 'landscape'].map((ori) => (
              <button
                key={ori}
                onClick={() => setOrientation(ori)}
                style={{ flex: 1, padding: '8px', background: orientation === ori ? '#2563eb' : '#0b0b0f', color: '#fff', border: '1px solid #2d2d3d', borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '12px' }}
              >
                {ori}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Video Duration / Length</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['short', 'long'].map((len) => (
              <button
                key={len}
                onClick={() => setLength(len)}
                style={{ flex: 1, padding: '8px', background: length === len ? '#2563eb' : '#0b0b0f', color: '#fff', border: '1px solid #2d2d3d', borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '12px' }}
              >
                {len}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reference Asset Uploader for Facial/Figure Consistency */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Reference Asset (Identity & Feature Lock)</label>
        <input 
          type="file" 
          accept="image/*,video/*" 
          onChange={handleFileChange}
          style={{ width: '100%', padding: '8px', background: '#0b0b0f', border: '1px solid #2d2d3d', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
        />
      </div>

      {/* Prompt Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Creative Prompt</label>
        <textarea 
          rows={3} 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Describe your scene, pose, or motion..."
          style={{ width: '100%', padding: '10px', boxSizing: 'border-box', background: '#0b0b0f', border: '1px solid #2d2d3d', color: '#fff', borderRadius: '6px', fontSize: '14px' }}
        />
      </div>

      <button 
        onClick={handleGeneration} 
        disabled={loading}
        style={{ width: '100%', background: '#7c3aed', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' }}
      >
        {loading ? `Synthesizing ${type}...` : `Generate ${type === 'image' ? 'Image' : 'Video'}`}
      </button>

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>Output Panel</label>
      <div style={{ padding: '16px', background: '#0b0b0f', border: '1px solid #2d2d3d', borderRadius: '6px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {loading && <p style={{ color: '#a1a1aa' }}>Processing model pipeline with identity preservation...</p>}
        {!loading && !output && <p style={{ color: '#52525b' }}>Ready for your selections...</p>}
        {!loading && output && type === 'image' && <img src={output} alt="Generated output" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />}
        {!loading && output && type === 'video' && <video src={output} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />}
      </div>
    </div>
  );
}
