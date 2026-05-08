export function WorkflowInputForm(inputs) {
  const form = document.createElement('form');
  form.className = 'grid grid-cols-1 gap-3';
  inputs.forEach(input => {
    const wrap = document.createElement('label');
    wrap.className = 'text-sm text-secondary flex flex-col gap-1';
    wrap.textContent = `${input.label}${input.required ? ' *' : ''}`;
    const el = input.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (input.type !== 'textarea') el.type = input.type === 'url' ? 'url' : 'text';
    el.name = input.key; el.required = !!input.required;
    el.className = 'rounded-lg bg-black/30 border border-white/10 text-white p-2';
    wrap.appendChild(el); form.appendChild(wrap);
  });
  return form;
}
