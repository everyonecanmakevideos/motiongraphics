export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-strong rounded-2xl px-6 py-8 text-center max-w-md">
        <div className="text-sm text-neutral-400 mb-2">404</div>
        <div className="text-xl font-semibold text-white mb-2">Page not found</div>
        <div className="text-sm text-neutral-400 leading-relaxed">
          The page you’re looking for doesn’t exist.
        </div>
      </div>
    </div>
  );
}

