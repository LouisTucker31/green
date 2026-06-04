// Green PWA | Component — UK map rendering and course pin logic

function renderMapDots(dotsElementId, playedIds) {
  const dots = document.getElementById(dotsElementId);
  if (!dots) return;
  dots.innerHTML = '';

  const minLat = 49.19, maxLat = 60.38;
  const minLng = -7.70, maxLng = 1.73;
  const svgMinX = 650, svgMaxX = 1130;
  const svgMinY = 15,  svgMaxY = 820;

  const played = COURSES_DATA.data.filter(c => playedIds.includes(c.id) && c.lat && c.lng);

  played.forEach(c => {
    const x = svgMinX + ((c.lng - minLng) / (maxLng - minLng)) * (svgMaxX - svgMinX);
    const y = svgMaxY - ((c.lat - minLat) / (maxLat - minLat)) * (svgMaxY - svgMinY);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toFixed(1));
    circle.setAttribute('cy', y.toFixed(1));
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', 'var(--green-600)');
    circle.setAttribute('opacity', '0.85');
    dots.appendChild(circle);
  });
}