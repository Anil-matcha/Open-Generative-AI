export default function Home() {
  return (
    <div style={{ 
      backgroundColor: '#111827', 
      color: '#e5e7eb', 
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          AI Video Outreach Studio
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '30px' }}>
          Create personalized video messages for outreach and engagement.
        </p>
        <div style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '12px', 
          padding: '30px',
          border: '1px solid #374151'
        }}>
          <h2 style={{ margin: '0 0 16px 0' }}>Workflow Automation</h2>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            Automate your video creation, personalization, and distribution workflows.
          </p>
        </div>
      </div>
    </div>
  );
}