// Logo del servidor. Por defecto usa el monograma "NV" (public/logo.png).
// Desde el panel se puede sustituir por otra imagen (settings.logoUrl).
export function Logo({ src, size = 34, className }: { src?: string; size?: number; className?: string }) {
  return (
    <img
      src={src || '/lsrp/logo.png'}
      alt="Los Santos Roleplay"
      width={size}
      height={size}
      className={className}
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
      draggable={false}
    />
  );
}
