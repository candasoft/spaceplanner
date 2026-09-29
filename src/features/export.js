import { jsPDF } from 'jspdf';
import { state } from '../core/state.js';
import { roomDims } from '../core/constants.js';
import { ITEM_CATALOG } from './catalog.js';
import { showToast } from './toast.js';

/**
 * PDF export: builds an animated 2D "layout sheet" on a canvas
 * (floor plan, dimensions, schedule, compliance stamp) and offers
 * both the sheet and a cost quote as downloadable PDFs via jsPDF.
 */
const exportModal = document.getElementById('exportModal');
const exportCanvas = document.getElementById('exportCanvas');
const exportCtx = exportCanvas.getContext('2d');

document.getElementById('exportBtn').addEventListener('click', () => {
  exportModal.classList.add('open');
  document.getElementById('exportRef').textContent =
    (state.template.substring(0, 3).toUpperCase()) + '-' + Math.floor(Math.random() * 9000 + 1000);
  runExportAnimation();
});
document.getElementById('closeExport').addEventListener('click', () => exportModal.classList.remove('open'));
document.getElementById('closeExport2').addEventListener('click', () => exportModal.classList.remove('open'));

function runExportAnimation() {
  exportCtx.clearRect(0, 0, 920, 560);

  const steps = [
    'Drawing floor plan',
    'Placing furniture',
    'Adding material schedule',
    'Checking fire compliance',
    'Finalizing layout sheet'
  ];
  const stepsEl = document.getElementById('exportSteps');
  stepsEl.innerHTML = '';
  steps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'step-item';
    el.dataset.idx = i;
    el.innerHTML = `<div class="step-dot"><span class="text-[9px] font-mono">${i + 1}</span></div><span>${s}</span>`;
    stepsEl.appendChild(el);
  });

  let progress = 0;
  let currentStep = -1;

  function animate() {
    progress = Math.min(1, progress + 0.012);
    drawExportSheet(progress);

    const stepIdx = Math.floor(progress * steps.length);
    if (stepIdx > currentStep && stepIdx < steps.length) {
      currentStep = stepIdx;
      const el = stepsEl.children[currentStep - 1];
      if (el) {
        el.classList.add('done');
        el.querySelector('.step-dot').innerHTML = '<i class="fa-solid fa-check text-[9px]"></i>';
      }
    }

    if (progress < 1) requestAnimationFrame(animate);
    else {
      // Mark all done
      [...stepsEl.children].forEach(el => {
        el.classList.add('done');
        el.querySelector('.step-dot').innerHTML = '<i class="fa-solid fa-check text-[9px]"></i>';
      });
    }
  }
  animate();
}

function drawExportSheet(progress) {
  const ctx = exportCtx;
  const W = 920, H = 560;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#F5F1EA';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(31, 58, 95, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(31, 58, 95, 0.12)';
  for (let x = 0; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Title bar
  ctx.fillStyle = '#2A2826';
  ctx.fillRect(0, 0, W, 36);
  ctx.fillStyle = '#F5F1EA';
  ctx.font = 'bold 13px "Archivo Variable", Archivo, sans-serif';
  ctx.fillText('ATELIER · LAYOUT SHEET', 18, 23);
  ctx.font = '11px "JetBrains Mono Variable", JetBrains Mono, monospace';
  ctx.fillText(state.template.toUpperCase() + ' · ' + new Date().toLocaleDateString(), 200, 23);
  ctx.fillText('SHEET 01 / 04', W - 110, 23);

  // Floor plan box (scaled to the current room footprint)
  const planX = 50, planY = 70, planW = 560, planH = 420;
  const sx = planW / roomDims.w;   // px per meter (x)
  const sy = planH / roomDims.d;   // px per meter (z)
  const toPlanX = (x) => planX + (x + roomDims.w / 2) * sx;
  const toPlanY = (z) => planY + (z + roomDims.d / 2) * sy;

  // Room outline (thick)
  ctx.strokeStyle = '#2A2826';
  ctx.lineWidth = 3;
  ctx.strokeRect(planX, planY, planW, planH);

  // Door indicator (gap on right wall — matches room.js door at z = D * 0.4)
  const doorW = Math.min(1.2, roomDims.d * 0.35) * sy;
  const doorY = toPlanY(roomDims.d * 0.4);
  ctx.fillStyle = '#F5F1EA';
  ctx.fillRect(planX + planW - 2, doorY - doorW / 2, 4, doorW);
  ctx.strokeStyle = state.brandColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(planX + planW, doorY + doorW / 2, doorW, Math.PI / 2, Math.PI);
  ctx.stroke();

  // Window indicators (on top wall — matches room.js window fractions)
  ctx.fillStyle = '#F5F1EA';
  ctx.fillRect(planX + (0.23 - 0.115) * planW, planY - 2, 0.23 * planW, 4);
  if (roomDims.w >= 12) {
    ctx.fillRect(planX + (0.68 - 0.1) * planW, planY - 2, 0.2 * planW, 4);
  }
  ctx.strokeStyle = '#1F3A5F';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(planX + (0.23 - 0.115) * planW, planY); ctx.lineTo(planX + (0.23 + 0.115) * planW, planY);
  if (roomDims.w >= 12) {
    ctx.moveTo(planX + (0.68 - 0.1) * planW, planY); ctx.lineTo(planX + (0.68 + 0.1) * planW, planY);
  }
  ctx.stroke();

  // Dimension lines
  ctx.strokeStyle = '#1F3A5F';
  ctx.fillStyle = '#1F3A5F';
  ctx.lineWidth = 1;
  ctx.font = '10px "JetBrains Mono Variable", JetBrains Mono, monospace';
  // Horizontal (top)
  ctx.beginPath();
  ctx.moveTo(planX, planY - 18); ctx.lineTo(planX + planW, planY - 18);
  ctx.stroke();
  for (let i = 0; i <= 4; i++) {
    const x = planX + (planW / 4) * i;
    ctx.beginPath(); ctx.moveTo(x, planY - 22); ctx.lineTo(x, planY - 14); ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.fillText(roomDims.w.toFixed(1) + ' m', planX + planW / 2, planY - 26);
  // Vertical (left)
  ctx.beginPath();
  ctx.moveTo(planX - 18, planY); ctx.lineTo(planX - 18, planY + planH);
  ctx.stroke();
  for (let i = 0; i <= 4; i++) {
    const y = planY + (planH / 4) * i;
    ctx.beginPath(); ctx.moveTo(planX - 22, y); ctx.lineTo(planX - 14, y); ctx.stroke();
  }
  ctx.save();
  ctx.translate(planX - 30, planY + planH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(roomDims.d.toFixed(1) + ' m', 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';

  // Items appearing
  const visibleCount = Math.floor(state.placedItems.length * Math.min(1, progress * 1.5));
  state.placedItems.slice(0, visibleCount).forEach(item => {
    const px = toPlanX(item.position.x);
    const py = toPlanY(item.position.z);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(item.rotation);

    const isSeat = ITEM_CATALOG[item.type].seats > 0;
    ctx.fillStyle = isSeat ? state.brandColor : '#2A2826';

    if (item.type === 'round_table') {
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2A2826'; ctx.lineWidth = 1; ctx.stroke();
    } else if (item.type === 'rect_table' || item.type === 'desk') {
      ctx.fillRect(-18, -10, 36, 20);
      ctx.strokeStyle = '#2A2826'; ctx.lineWidth = 1; ctx.strokeRect(-18, -10, 36, 20);
    } else if (item.type === 'chair' || item.type === 'accent_chair') {
      ctx.fillRect(-5, -5, 10, 10);
    } else if (item.type === 'stool') {
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    } else if (item.type === 'sofa') {
      ctx.fillRect(-20, -8, 40, 16);
    } else if (item.type === 'counter') {
      ctx.fillRect(-30, -8, 60, 16);
      ctx.fillStyle = state.brandColor;
      ctx.fillRect(-30, -8, 60, 2);
    } else if (item.type === 'shelf') {
      ctx.fillRect(-10, -4, 20, 8);
      ctx.fillStyle = state.brandColor;
      ctx.fillRect(-10, -4, 20, 1);
    } else if (item.type === 'rack') {
      ctx.strokeStyle = '#2A2826'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -4, 20, 8);
      ctx.fillStyle = state.brandColor;
      ctx.fillRect(-8, -2, 4, 4); ctx.fillRect(-2, -2, 4, 4);
      ctx.fillRect(4, -2, 4, 4);
    } else if (item.type === 'plant') {
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#4A6741'; ctx.fill();
    } else if (item.type === 'pendant') {
      ctx.strokeStyle = '#2A2826'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 3);
      ctx.stroke();
      ctx.fillStyle = state.brandColor;
      ctx.beginPath(); ctx.arc(0, 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });

  // Right info panel (appears at 60%)
  if (progress > 0.55) {
    const alpha = Math.min(1, (progress - 0.55) * 2.5);
    ctx.globalAlpha = alpha;

    const infoX = 660, infoY = 70;

    // Schedule box
    ctx.strokeStyle = '#2A2826';
    ctx.lineWidth = 2;
    ctx.strokeRect(infoX, infoY, 230, 220);

    ctx.fillStyle = '#2A2826';
    ctx.fillRect(infoX, infoY, 230, 26);
    ctx.fillStyle = '#F5F1EA';
    ctx.font = 'bold 11px "Archivo Variable", Archivo, sans-serif';
    ctx.fillText('SCHEDULE', infoX + 12, infoY + 17);

    const seats = state.placedItems.reduce((s, i) => s + i.seats, 0);
    const total = state.placedItems.reduce((s, i) => s + i.price, 0);
    const totalWithFees = Math.round(total * 1.2);

    ctx.font = '11px "Manrope Variable", Manrope, sans-serif';
    const rows = [
      ['Floor area', state.roomArea + ' m²'],
      ['Items', state.placedItems.length + ''],
      ['Seats', seats + ''],
      ['Density', (seats / state.roomArea).toFixed(2) + ' /m²'],
      ['Fire egress', seats > state.maxCapacity ? 'OVER LIMIT' : 'OK'],
      ['Subtotal', '$' + total.toLocaleString()],
      ['+ delivery', '$' + Math.round(total * 0.12).toLocaleString()],
      ['Total', '$' + totalWithFees.toLocaleString()],
    ];
    rows.forEach((r, i) => {
      const y = infoY + 48 + i * 20;
      ctx.fillStyle = '#6B6863';
      ctx.fillText(r[0], infoX + 12, y);
      ctx.fillStyle = '#2A2826';
      ctx.font = 'bold 11px "JetBrains Mono Variable", JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(r[1], infoX + 218, y);
      ctx.font = '11px "Manrope Variable", Manrope, sans-serif';
      ctx.textAlign = 'left';
    });

    // Brand swatch
    ctx.fillStyle = state.brandColor;
    ctx.fillRect(infoX, infoY + 240, 230, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px "Archivo Variable", Archivo, sans-serif';
    ctx.fillText('BRAND COLOR', infoX + 12, infoY + 258);
    ctx.font = '11px "JetBrains Mono Variable", JetBrains Mono, monospace';
    ctx.fillText(state.brandColor.toUpperCase(), infoX + 12, infoY + 278);

    // Compliance stamp (appears last)
    if (progress > 0.85) {
      const stampAlpha = Math.min(1, (progress - 0.85) * 6);
      ctx.globalAlpha = alpha * stampAlpha;
      ctx.save();
      ctx.translate(infoX + 115, infoY + 360);
      ctx.rotate(-0.08);
      const overLimit = seats > state.maxCapacity;
      ctx.strokeStyle = overLimit ? '#B0432E' : '#6B8E4E';
      ctx.lineWidth = 2;
      ctx.strokeRect(-70, -20, 140, 40);
      ctx.fillStyle = overLimit ? '#B0432E' : '#6B8E4E';
      ctx.font = 'bold 14px "Archivo Variable", Archivo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(overLimit ? 'REVIEW NEEDED' : 'COMPLIANT', 0, 5);
      ctx.restore();
      ctx.textAlign = 'left';
    }

    ctx.globalAlpha = 1;
  }

  // Scale bar at bottom (2 m / 4 m ticks, true to plan scale)
  ctx.strokeStyle = '#2A2826';
  ctx.fillStyle = '#2A2826';
  ctx.lineWidth = 1.5;
  const barLen = 4 * sx;
  ctx.beginPath();
  ctx.moveTo(planX, planY + planH + 30);
  ctx.lineTo(planX + barLen, planY + planH + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(planX, planY + planH + 25); ctx.lineTo(planX, planY + planH + 35);
  ctx.moveTo(planX + barLen / 2, planY + planH + 28); ctx.lineTo(planX + barLen / 2, planY + planH + 32);
  ctx.moveTo(planX + barLen, planY + planH + 25); ctx.lineTo(planX + barLen, planY + planH + 35);
  ctx.stroke();
  ctx.font = '9px "JetBrains Mono Variable", JetBrains Mono, monospace';
  ctx.fillText('0', planX - 3, planY + planH + 48);
  ctx.fillText('2 m', planX + barLen / 2 - 8, planY + planH + 48);
  ctx.fillText('4 m', planX + barLen - 10, planY + planH + 48);

  // North arrow
  ctx.save();
  ctx.translate(planX + planW - 30, planY + 30);
  ctx.fillStyle = '#2A2826';
  ctx.beginPath();
  ctx.moveTo(0, -15); ctx.lineTo(5, 5); ctx.lineTo(0, 0); ctx.lineTo(-5, 5); ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 9px "Archivo Variable", Archivo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -18);
  ctx.textAlign = 'left';
  ctx.restore();

  // Footer
  ctx.fillStyle = '#6B6863';
  ctx.font = '9px "JetBrains Mono Variable", JetBrains Mono, monospace';
  ctx.fillText('Atelier Space Planner · Generated ' + new Date().toLocaleString(), 18, H - 12);
// ========== DOWNLOAD ==========
document.getElementById('downloadPdf').addEventListener('click', () => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const imgData = exportCanvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 8, 8, 281, 193);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Atelier Space Planner · ' + new Date().toLocaleString(), 8, 205);
  pdf.save(`atelier-${state.template}-layout.pdf`);
  showToast('PDF downloaded successfully', 'fa-circle-check');
  exportModal.classList.remove('open');
});

document.getElementById('exportCostBtn').addEventListener('click', () => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtotal = state.placedItems.reduce((s, i) => s + i.price, 0);
  const total = Math.round(subtotal * 1.2);

  pdf.setFillColor(245, 241, 234);
  pdf.rect(0, 0, 210, 297, 'F');

  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text('Cost Estimate', 20, 30);
  pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 100, 100);
  pdf.text(state.template.toUpperCase() + ' template · ' + new Date().toLocaleDateString(), 20, 38);

  pdf.setFontSize(11); pdf.setTextColor(40, 40, 40);
  let y = 55;
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITEM', 20, y); pdf.text('QTY', 110, y); pdf.text('PRICE', 130, y); pdf.text('TOTAL', 170, y);
  pdf.setDrawColor(200, 200, 200); pdf.line(20, y + 2, 190, y + 2);
  y += 10;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);

  const grouped = {};
  state.placedItems.forEach(i => {
    if (!grouped[i.type]) grouped[i.type] = { count: 0, ...i };
    grouped[i.type].count++;
  });
  Object.values(grouped).forEach(g => {
    pdf.text(g.name, 20, y);
    pdf.text(g.count + '', 115, y);
    pdf.text('$' + g.price, 130, y);
    pdf.text('$' + (g.price * g.count).toLocaleString(), 170, y);
    y += 7;
  });

  y += 10;
  pdf.line(20, y, 190, y); y += 10;
  pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
  pdf.text('Total: $' + total.toLocaleString(), 130, y);

  pdf.save(`atelier-${state.template}-quote.pdf`);
  showToast('Quote PDF downloaded', 'fa-circle-check');
});

}
