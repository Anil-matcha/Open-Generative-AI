// MuAPI adapter - secure via Netlify/Edge proxy
export async function generateMuAPI(params) {
  const res = await fetch('/.netlify/functions/muapi-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function getMuAPIStatus(id) {
  const res = await fetch(`/.netlify/functions/muapi-status?id=${id}`);
  return res.json();
}