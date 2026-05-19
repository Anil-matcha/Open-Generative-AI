// Main preview component for headshot results
export default function HeadshotPreview({ result }) {
  return result ? <img src={result.url} alt="Headshot" /> : null;
}