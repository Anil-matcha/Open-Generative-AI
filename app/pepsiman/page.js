export const metadata = {
  title: 'Pepsi Man — Web Runner',
  description: 'The classic PlayStation Pepsiman runner, reborn for the web. Dash, jump, slide and grab every Pepsi can!',
};

export default function PepsiManPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <iframe
        src="/pepsiman.html"
        title="Pepsi Man"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
