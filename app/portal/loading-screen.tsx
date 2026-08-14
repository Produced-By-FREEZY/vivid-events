export function PortalLoadingScreen({ message = "Loading your workspace…" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <img
        src="/images/vivid-events-logo.png"
        alt="Vivid Events"
        className="h-20 w-auto animate-[logopulse_1.4s_ease-in-out_infinite] md:h-24"
      />
      <p className="mt-6 text-sm font-medium tracking-wide text-slate-300">{message}</p>
      <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-700/60">
        <div
          className="h-full w-1/2 animate-[loadingbar_1.1s_ease-in-out_infinite] rounded-full"
          style={{ background: "linear-gradient(to right, #8c52ff, #c4a7ff)" }}
        />
      </div>
    </div>
  )
}
