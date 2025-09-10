export function PixelBackground() {
  return (
    <div
      className="absolute inset-0 z-0 h-full w-full"
      style={
        {
          "--bg-size": "25px",
          "--bg-color": "hsl(var(--primary) / 0.15)",
          background:
            "radial-gradient(circle, var(--bg-color) 1px, transparent 1px)",
          backgroundSize: "var(--bg-size) var(--bg-size)",
        } as React.CSSProperties
      }
    />
  );
}
