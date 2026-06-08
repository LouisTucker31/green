// Green PWA | Component — UK map rendering and course pin logic

function renderMapDots(dotsElementId, playedIds, onCountyClick) {
  const dots = document.getElementById(dotsElementId);
  if (!dots) return;
  dots.innerHTML = '';

  const minLat = 49.19, maxLat = 60.38;
  const minLng = -7.70, maxLng = 1.73;
  const svgMinX = 650, svgMaxX = 1130;
  const svgMinY = 15,  svgMaxY = 820;
  const BASE_R  = 6;

  const played = COURSES_DATA.data.filter(c => playedIds.includes(c.id) && c.lat && c.lng);

  // Convert to SVG coords, keeping course reference for county click
  const points = played.map(c => ({
    x: svgMinX + ((c.lng - minLng) / (maxLng - minLng)) * (svgMaxX - svgMinX),
    y: svgMaxY - ((c.lat - minLat) / (maxLat - minLat)) * (svgMaxY - svgMinY),
    county: c.county,
  }));

  // Cluster touching dots (centres within 2 × BASE_R)
  const used     = new Array(points.length).fill(false);
  const clusters = [];
  const TOUCH    = BASE_R * 2;

  points.forEach((p, i) => {
    if (used[i]) return;
    const cluster = [p];
    used[i] = true;
    points.forEach((q, j) => {
      if (used[j]) return;
      const dx = p.x - q.x, dy = p.y - q.y;
      if (Math.sqrt(dx * dx + dy * dy) < TOUCH) {
        cluster.push(q);
        used[j] = true;
      }
    });
    const cx     = cluster.reduce((s, pt) => s + pt.x, 0) / cluster.length;
    const cy     = cluster.reduce((s, pt) => s + pt.y, 0) / cluster.length;
    const county = cluster[0].county;
    clusters.push({ cx, cy, count: cluster.length, county });
  });

  clusters.forEach(({ cx, cy, count, county }) => {
    const r      = count > 1 ? BASE_R + Math.min(count * 1.5, 8) : BASE_R;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toFixed(1));
    circle.setAttribute('cy', cy.toFixed(1));
    circle.setAttribute('r', r.toFixed(1));
    circle.setAttribute('fill', 'var(--green-600)');
    circle.setAttribute('opacity', '0.85');
    circle.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    circle.style.animation = 'dot-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both';
    if (onCountyClick && county) {
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', () => onCountyClick(county));
    }
    dots.appendChild(circle);
  });
}