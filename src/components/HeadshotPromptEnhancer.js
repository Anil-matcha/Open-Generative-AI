export function HeadshotPromptEnhancer({ state, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';
  const fields = [
    ['description', 'Industry / role details'],
    ['wardrobeChoice', 'Desired outfit'],
    ['backgroundChoice', 'Background preference'],
    ['tone', 'Mood / tone'],
    ['negativePrompt', 'Negative guidance (optional)'],
  ];
  fields.forEach(([key, label]) => {
    const input = document.createElement('input');
    input.className = 'w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white';
    input.placeholder = label;
    input.value = state[key] || '';
    input.oninput = (e) => onChange(key, e.target.value);
    wrap.appendChild(input);
  });
  return wrap;
}
