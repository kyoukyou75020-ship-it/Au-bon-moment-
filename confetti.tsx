const COLORS = ["#ff4d88", "#ffd000", "#2ec5ff", "#7a5cff", "#2fbf71", "#ff4d4d", "#ff8c42", "#ff7eb3", "#fff4a3"];

const PIECES = Array.from({ length: 42 }, (_, index) => ({
  left: (index * 19) % 100,
  delay: (index % 14) * 0.16,
  duration: 2.6 + (index % 6) * 0.35,
  drift: `${((index % 9) - 4) * 28}px`,
  width: 7 + (index % 3) * 3,
  height: 8 + (index % 4) * 4,
  color: COLORS[index % COLORS.length],
  round: index % 5 === 0,
}));

export function Confetti({ burst = false, local = false }: { burst?: boolean; local?: boolean }) {
  const pieces = burst ? PIECES : PIECES.filter((_, index) => index % 2 === 0);
  return (
    <div
      className={
        burst
          ? `confetti-burst pointer-events-none overflow-hidden ${local ? "absolute inset-0 z-10" : "fixed inset-0 z-30"}`
          : "pointer-events-none absolute inset-0 overflow-hidden"
      }
      aria-hidden
    >
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.round ? piece.width : piece.height,
            background: piece.color,
            borderRadius: piece.round ? 999 : 2,
            ["--delay" as string]: `${burst ? (index % 8) * 0.04 : piece.delay}s`,
            ["--dur" as string]: `${burst ? 2.2 + (index % 5) * 0.18 : piece.duration}s`,
            ["--drift" as string]: piece.drift,
          }}
        />
      ))}
    </div>
  );
}
