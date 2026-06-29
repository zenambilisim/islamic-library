const HeroPattern = () => (
  <svg
    className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 opacity-60"
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden
  >
    <g stroke="var(--accent)" strokeWidth="0.8" opacity="0.7">
      {[...Array(8)].map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={100}
            y1={100}
            x2={100 + Math.cos(a) * 90}
            y2={100 + Math.sin(a) * 90}
          />
        );
      })}
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="55" />
      <circle cx="100" cy="100" r="85" />
      <rect x="60" y="60" width="80" height="80" transform="rotate(0 100 100)" />
      <rect x="60" y="60" width="80" height="80" transform="rotate(45 100 100)" />
    </g>
  </svg>
);

export default HeroPattern;
