import { RADII } from '../../utils/search.js';

export default function RadiusSlider({ value, onChange, radii = RADII }) {
  const index = Math.max(0, radii.indexOf(value));
  const pct = (index / (radii.length - 1)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <label htmlFor="radius" className="text-[13px] font-semibold text-ink">Distância máxima</label>
        <output htmlFor="radius" className="font-display text-xl font-extrabold text-brand">{value} km</output>
      </div>
      <input
        id="radius"
        type="range"
        min={0}
        max={radii.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(radii[Number(e.target.value)])}
        aria-valuetext={`${value} quilômetros`}
        className="slider h-5 w-full cursor-pointer"
        style={{ '--pct': `${pct}%` }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-muted" aria-hidden="true">
        {radii.map((r) => <span key={r} className={r === value ? 'text-brand-dark' : ''}>{r}</span>)}
      </div>
    </div>
  );
}
