import { REGIONS } from '@/lib/madagascar-geo';
import { MG_PATHS, MG_TRANSFORM, MG_VIEWBOX } from '@/lib/madagascar-silhouette';

// Server component: inline SVG of Madagascar (gradient silhouette) with a dot per région.
// Pure CSS pulse + native <title> tooltips → no client JS needed. Keep DOT_R in sync with the
// `beacon` keyframe start radius in tailwind.config.ts.
const DOT_R = 11;

export function MadagascarMap({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={MG_VIEWBOX}
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>

      <g transform={MG_TRANSFORM} fill="url(#mgGrad)" stroke="none">
        {MG_PATHS.map((d, i) => (
          <path key={`mg-path-${i}`} d={d} />
        ))}
      </g>

      <g>
        {REGIONS.map((r, i) => (
          <g key={r.id}>
            <title>{r.name}</title>
            {/* expanding "radar" halo */}
            <circle
              cx={r.x}
              cy={r.y}
              r={DOT_R}
              className="pointer-events-none animate-beacon fill-white motion-reduce:hidden"
              style={{ animationDelay: `${((i * 0.17) % 2.6).toFixed(2)}s` }}
            />
            {/* solid dot */}
            <circle cx={r.x} cy={r.y} r={DOT_R} className="fill-white" />
          </g>
        ))}
      </g>
    </svg>
  );
}
