let tooltipEl = null;

export function initTooltips() {
  if (tooltipEl) return;
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'neprakta-tooltip';
  tooltipEl.className = 'neprakta-tooltip hidden';
  document.body.appendChild(tooltipEl);

  document.addEventListener('mousemove', (e) => {
    if (!tooltipEl || tooltipEl.classList.contains('hidden')) return;
    positionTooltip(e.clientX, e.clientY);
  });
}

export function showTooltip(htmlContent, clientX = 0, clientY = 0) {
  if (!tooltipEl) initTooltips();
  tooltipEl.innerHTML = htmlContent;
  tooltipEl.classList.remove('hidden');
  positionTooltip(clientX, clientY);
}

export function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.add('hidden');
}

function positionTooltip(x, y) {
  if (!tooltipEl) return;
  const pad = 16;
  const rect = tooltipEl.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;

  if (left + rect.width > window.innerWidth - 12) {
    left = Math.max(12, x - rect.width - pad);
  }
  if (top + rect.height > window.innerHeight - 12) {
    top = Math.max(12, y - rect.height - pad);
  }

  tooltipEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}
