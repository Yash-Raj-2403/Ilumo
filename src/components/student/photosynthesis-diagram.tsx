// The sample lesson's diagram. Screen readers get the generated description instead.
export function PhotosynthesisDiagram() {
  return (
    <svg viewBox="0 0 400 280" role="img" aria-label="Diagram of photosynthesis: a plant with sunlight, water, carbon dioxide and oxygen arrows" className="w-full rounded-2xl bg-tint-blue">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#251d6b" />
        </marker>
      </defs>
      <rect y="210" width="400" height="70" fill="#8a6a4a" rx="0" />
      <circle cx="340" cy="45" r="26" fill="#ffb434" />
      <g stroke="#ffb434" strokeWidth="5" strokeLinecap="round">
        <path d="M300 45h-14M340 5v-12M312 17l-9-9M368 17l9-9" />
      </g>
      <path d="M296 62L235 120" stroke="#ffb434" strokeWidth="4" strokeDasharray="6 6" markerEnd="url(#ah)" />
      <text x="262" y="72" fontSize="14" fontWeight="700" fill="#251d6b">sunlight</text>
      <rect x="196" y="120" width="8" height="100" fill="#3f8f57" />
      <ellipse cx="170" cy="130" rx="42" ry="20" fill="#58b98e" transform="rotate(-20 170 130)" />
      <ellipse cx="232" cy="118" rx="42" ry="20" fill="#58b98e" transform="rotate(20 232 118)" />
      <text x="140" y="96" fontSize="13" fontWeight="700" fill="#10123f">sugar (food)</text>
      <path d="M120 230v-30q0-20 76-20" fill="none" stroke="#251d6b" strokeWidth="3" markerEnd="url(#ah)" />
      <text x="40" y="250" fontSize="14" fontWeight="700" fill="#fff">water (roots)</text>
      <path d="M60 130h60" stroke="#251d6b" strokeWidth="3" markerEnd="url(#ah)" />
      <text x="16" y="120" fontSize="14" fontWeight="700" fill="#251d6b">carbon dioxide</text>
      <path d="M262 150h60" stroke="#251d6b" strokeWidth="3" markerEnd="url(#ah)" />
      <text x="270" y="170" fontSize="14" fontWeight="700" fill="#251d6b">oxygen</text>
    </svg>
  );
}
