'use client';
// Простые графики на чистом SVG (без библиотек). type: 'bar' — столбцы, 'line' — линия с заливкой.
// data: [{ label, v: [значение1, значение2...] }], series: [{ name, color }]
const nice = (m) => { const p = 10 ** Math.floor(Math.log10(m)); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? +(n / 1e3).toFixed(1) + 'k' : Math.round(n));

export default function Chart({ type = 'bar', data, series }) {
  const W = 640, H = 250, L = 46, R = 10, T = 10, B = 30;
  const iw = W - L - R, ih = H - T - B;
  const max = nice(Math.max(1, ...data.flatMap((d) => d.v)));
  const y = (v) => T + ih - (v / max) * ih;
  const step = Math.ceil(data.length / 8);
  const gw = iw / Math.max(1, data.length);
  const lx = (i) => L + (data.length <= 1 ? iw / 2 : (i * iw) / (data.length - 1));
  return (
    <>
      <div className="adm-legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart" role="img">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y((max * i) / 4)} y2={y((max * i) / 4)} stroke="#dccdb6" />
            <text x={L - 8} y={y((max * i) / 4) + 4} textAnchor="end" fontSize="11" fill="#6f5d4d">{short((max * i) / 4)}</text>
          </g>
        ))}
        {type === 'bar' && data.map((d, i) => {
          const bw = Math.min(28, (gw * 0.72) / series.length);
          const x0 = L + i * gw + gw / 2 - (bw * series.length) / 2;
          return d.v.map((v, k) => <rect key={i + '-' + k} x={x0 + k * bw} y={y(v)} width={bw - 2} height={Math.max(0, T + ih - y(v))} rx="4" fill={series[k].color}><title>{`${d.label}: ${Math.round(v)}`}</title></rect>);
        })}
        {type === 'line' && series.map((s, k) => {
          const pts = data.map((d, i) => `${lx(i)},${y(d.v[k])}`).join(' ');
          return (
            <g key={s.name}>
              {k === 0 && data.length > 1 && <polygon points={`${lx(0)},${T + ih} ${pts} ${lx(data.length - 1)},${T + ih}`} fill={s.color} opacity=".12" />}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
              {data.length <= 40 && data.map((d, i) => <circle key={i} cx={lx(i)} cy={y(d.v[k])} r="3" fill={s.color}><title>{`${d.label}: ${Math.round(d.v[k])}`}</title></circle>)}
            </g>
          );
        })}
        {data.map((d, i) => i % step === 0 && (
          <text key={i} x={type === 'bar' ? L + i * gw + gw / 2 : lx(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6f5d4d">{d.label}</text>
        ))}
      </svg>
    </>
  );
}
