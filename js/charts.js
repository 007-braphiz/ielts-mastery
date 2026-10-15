/* Small dependency-free SVG chart helpers (line, bar, sparkline, task visuals). */
IM.charts = (function () {
  const esc = s => IM.util.esc(s);
  const COL = ['#e0246b', '#9b4dea', '#0f9b8e', '#d97706', '#2f6fed'];
  const DASH = ['', '6 3', '2 3', '8 3 2 3', '1 4'];

  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

  function legend(names) {
    return `<div class="legend row small" style="gap:14px">${names.map((n, i) => `<span><i class="legend-dot" style="background:${COL[i % COL.length]}"></i>${esc(n)}</span>`).join('')}</div>`;
  }

  function line(o) {
    const w = o.w || 520, h = o.h || 260, m = { l: 44, r: 14, t: 16, b: 34 };
    const all = o.series.flatMap(s => s.ys.filter(v => v != null));
    const maxV = o.max != null ? o.max : niceMax(Math.max(...all, 1));
    const minV = o.min != null ? o.min : 0;
    const n = o.xs.length;
    const X = i => m.l + (n === 1 ? (w - m.l - m.r) / 2 : (i * (w - m.l - m.r)) / (n - 1));
    const Y = v => m.t + (h - m.t - m.b) * (1 - (v - minV) / (maxV - minV || 1));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = minV + ((maxV - minV) * k) / 4, y = Y(v);
      g += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${y}" y2="${y}"/><text x="${m.l - 6}" y="${y + 4}" text-anchor="end">${Math.round(v * 10) / 10}</text>`;
    }
    o.xs.forEach((x, i) => { g += `<text x="${X(i)}" y="${h - 12}" text-anchor="middle">${esc(x)}</text>`; });
    o.series.forEach((s, si) => {
      const pts = s.ys.map((v, i) => (v == null ? null : [X(i), Y(v)]));
      let d = '', pen = false;
      pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' '; pen = true; });
      g += `<path d="${d}" fill="none" stroke="${COL[si % COL.length]}" stroke-width="2.5" stroke-dasharray="${DASH[si % DASH.length]}" stroke-linejoin="round"/>`;
      pts.forEach((p, i) => { if (p) g += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${COL[si % COL.length]}"><title>${esc(s.name)} ${esc(o.xs[i])}: ${s.ys[i]}</title></circle>`; });
    });
    const t = o.title ? `<div class="small muted"><b>${esc(o.title)}</b></div>` : '';
    return `${t}<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title || 'Line chart')}">${g}<line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${h - m.b}"/><line class="axis" x1="${m.l}" x2="${w - m.r}" y1="${h - m.b}" y2="${h - m.b}"/></svg>${o.series.length > 1 || o.legend ? legend(o.series.map(s => s.name)) : ''}`;
  }

  function bar(o) {
    const w = o.w || 520, h = o.h || 260, m = { l: 44, r: 14, t: 16, b: 40 };
    const all = o.series.flatMap(s => s.vals);
    const maxV = o.max != null ? o.max : niceMax(Math.max(...all, 1));
    const gw = (w - m.l - m.r) / o.cats.length;
    const bw = Math.min(40, (gw * 0.8) / o.series.length);
    const Y = v => m.t + (h - m.t - m.b) * (1 - v / maxV);
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = (maxV * k) / 4, y = Y(v); g += `<line class="gridline" x1="${m.l}" x2="${w - m.r}" y1="${y}" y2="${y}"/><text x="${m.l - 6}" y="${y + 4}" text-anchor="end">${Math.round(v)}</text>`; }
    o.cats.forEach((c, ci) => {
      const cx = m.l + gw * ci + gw / 2;
      g += `<text x="${cx}" y="${h - 22}" text-anchor="middle">${esc(c)}</text>`;
      o.series.forEach((s, si) => {
        const x = cx - (bw * o.series.length) / 2 + si * bw, v = s.vals[ci], y = Y(v);
        g += `<rect x="${x}" y="${y}" width="${bw - 2}" height="${h - m.b - y}" fill="${COL[si % COL.length]}" rx="3"><title>${esc(s.name)} ${esc(c)}: ${v}${o.unit || ''}</title></rect><text x="${x + (bw - 2) / 2}" y="${y - 3}" text-anchor="middle">${v}</text>`;
      });
    });
    const t = o.title ? `<div class="small muted"><b>${esc(o.title)}</b></div>` : '';
    return `${t}<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title || 'Bar chart')}">${g}<line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${h - m.b}"/><line class="axis" x1="${m.l}" x2="${w - m.r}" y1="${h - m.b}" y2="${h - m.b}"/></svg>${legend(o.series.map(s => s.name))}`;
  }

  /* Horizontal bars for a list of {label, pct, n}. */
  function hbars(rows, cls) {
    return rows.map(r => `<div class="row" style="flex-wrap:nowrap;margin:6px 0"><div style="flex:0 0 42%;min-width:0" class="small">${esc(r.label)}</div><div style="flex:1">${IM.ui.bar(r.pct, r.label + ' ' + r.pct + '%', cls || (r.pct >= 80 ? 'good' : r.pct >= 60 ? '' : 'warn'))}</div><div class="small" style="flex:0 0 3.2rem;text-align:right">${r.pct}%${r.n != null ? `<span class="muted"> (${r.n})</span>` : ''}</div></div>`).join('');
  }

  function spark(values, o) {
    o = o || {};
    const w = o.w || 120, h = o.h || 34;
    if (!values || values.length < 2) return '';
    const mn = o.min != null ? o.min : Math.min(...values), mx = o.max != null ? o.max : Math.max(...values);
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Trend"><polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="2"/></svg>`;
  }

  /* Visual for a Writing Task 1 prompt. */
  function task1Visual(chart) {
    if (!chart) return '';
    if (chart.kind === 'table') {
      return `<div class="table-wrap"><table class="t"><caption class="small muted">${esc(chart.caption)}</caption><thead><tr>${chart.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${chart.rows.map(r => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (chart.kind === 'line') return line({ xs: chart.xs, series: chart.series, title: chart.title, h: 280 });
    if (chart.kind === 'bar') return bar({ cats: chart.cats, series: chart.series, title: chart.title, unit: '%' });
    if (chart.kind === 'process') return `<ol class="flow-list" style="max-width:560px">${chart.steps.map((s, i) => `<li><div class="flow-box" style="text-align:left"><b>Stage ${i + 1}:</b> ${esc(s)}</div></li>`).join('')}</ol>`;
    if (chart.kind === 'map') return `<div class="grid c2">${chart.maps.map(m => `<div><p><b>${esc(m.label)}</b></p>${m.svg}</div>`).join('')}</div>`;
    return '';
  }

  return { line, bar, hbars, spark, legend, task1Visual, niceMax };
})();
