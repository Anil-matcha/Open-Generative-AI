/**
 * Layout for /agents/* pages.
 * These pages host the AiAgent component full-screen — no studio chrome needed.
 * Client components read the locally stored BYOK key and send it only to same-origin API routes.
 */
export const metadata = {
  title: "Agent Chat — Open Generative AI",
};

export default function AgentsLayout({ children }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-black">
      {children}
    </div>
  );
}
