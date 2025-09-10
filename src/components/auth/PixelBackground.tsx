export function PixelBackground() {
  return (
    <div
      className="absolute inset-0 z-0 h-full w-full"
      style={
        {
          '--bg-size': '40px',
          '--bg-color-1': 'hsl(var(--primary) / 0.1)',
          '--bg-color-2': 'hsl(var(--primary) / 0.15)',
          '--bg-color-3': 'hsl(var(--primary) / 0.2)',
          background: `
            linear-gradient(135deg, var(--bg-color-1) 25%, transparent 25%),
            linear-gradient(225deg, var(--bg-color-1) 25%, transparent 25%),
            linear-gradient(45deg, var(--bg-color-1) 25%, transparent 25%),
            linear-gradient(315deg, var(--bg-color-1) 25%, var(--background) 25%)
          `,
          backgroundSize: 'var(--bg-size) var(--bg-size)',
          backgroundPosition: '0 0, 20px 20px, 20px 20px, 0 0',
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 z-10 h-full w-full animate-[move-background_20s_linear_infinite]"
        style={
          {
            '--bg-size': '80px',
            background: `
              linear-gradient(135deg, var(--bg-color-2) 25%, transparent 25%),
              linear-gradient(225deg, var(--bg-color-2) 25%, transparent 25%),
              linear-gradient(45deg, var(--bg-color-2) 25%, transparent 25%),
              linear-gradient(315deg, var(--bg-color-2) 25%, transparent 25%)
            `,
            backgroundSize: 'var(--bg-size) var(--bg-size)',
            backgroundPosition: '0 0, 40px 40px, 40px 40px, 0 0',
          } as React.CSSProperties
        }
      />
      <div
        className="absolute inset-0 z-20 h-full w-full animate-[move-background_40s_linear_infinite]"
        style={
          {
            '--bg-size': '160px',
            background: `
              linear-gradient(135deg, var(--bg-color-3) 25%, transparent 25%),
              linear-gradient(225deg, var(--bg-color-3) 25%, transparent 25%),
              linear-gradient(45deg, var(--bg-color-3) 25%, transparent 25%),
              linear-gradient(315deg, var(--bg-color-3) 25%, transparent 25%)
            `,
            backgroundSize: 'var(--bg-size) var(--bg-size)',
            backgroundPosition: '0 0, 80px 80px, 80px 80px, 0 0',
          } as React.CSSProperties
        }
      />
    </div>
  );
}
