export default function MainCanvas({ children }) {
  return (
    <main className="flex-1 bg-surface-950 overflow-auto">
      <div className="min-h-full">
        {children}
      </div>
    </main>
  )
}