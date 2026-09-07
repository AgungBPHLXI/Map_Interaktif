// =====================================================
// TREN HOTSPOT 30 HARI - PER PBPH
// Menampilkan tren masing-masing PBPH berdasarkan rekap_pbph.
// =====================================================
(function () {
  'use strict';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt = v => Number(v || 0).toLocaleString('id-ID');

  function injectStyle() {
    if (document.getElementById('trenPbphStyle')) return;
    const style = document.createElement('style');
    style.id = 'trenPbphStyle';
    style.textContent = `
      .tren-pbph-panel{margin-top:28px;padding:24px;border-top:1px solid rgba(0,0,0,.12)}
      .tren-pbph-panel__header{margin-bottom:18px}
      .tren-pbph-panel__eyebrow,.pbph-trend-card__eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;color:#49633d}
      .tren-pbph-panel h3{margin:6px 0;font-size:24px}
      .tren-pbph-panel p{margin:0;color:#667085}
      .tren-pbph-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px}
      .pbph-trend-card{background:#fff;border:1px solid #d9dfd5;border-radius:14px;padding:18px;box-shadow:0 4px 16px rgba(20,40,20,.06)}
      .pbph-trend-card__header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}
      .pbph-trend-card h4{margin:5px 0 0;font-size:16px;line-height:1.35}
      .pbph-trend-card__total{white-space:nowrap;background:#edf5ea;color:#2e5b2e;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700}
      .pbph-trend-card__chart{height:250px}
      @media(max-width:700px){.tren-pbph-grid{grid-template-columns:1fr}.pbph-trend-card__header{flex-direction:column}.pbph-trend-card__chart{height:220px}}
    `;
    document.head.appendChild(style);
  }

  function render(data) {
    injectStyle();
    const container = document.getElementById('trenPbphCharts');
    if (!container) return;

    container.innerHTML = '';
    const totals = {};

    data.forEach(day => {
      Object.entries(day.rekap_pbph || {}).forEach(([name, count]) => {
        totals[name] = (totals[name] || 0) + Number(count || 0);
      });
    });

    const names = Object.entries(totals)
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    if (!names.length) {
      container.innerHTML = '<div class="dashboard-empty">Belum ada hotspot yang teridentifikasi berada di PBPH pada periode ini.</div>';
      return;
    }

    const labels = data.map(item => {
      const d = new Date(item.tanggal + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {day:'2-digit', month:'short'});
    });

    names.forEach((name, index) => {
      const id = 'pbphTrendCanvas' + index;
      const card = document.createElement('div');
      card.className = 'pbph-trend-card';
      card.innerHTML = `
        <div class="pbph-trend-card__header">
          <div>
            <div class="pbph-trend-card__eyebrow">TREN HOTSPOT PER PBPH</div>
            <h4>${esc(name)}</h4>
          </div>
          <span class="pbph-trend-card__total">${fmt(totals[name])} hotspot</span>
        </div>
        <div class="pbph-trend-card__chart"><canvas id="${id}"></canvas></div>`;
      container.appendChild(card);

      const values = data.map(day => Number((day.rekap_pbph || {})[name] || 0));
      window['grafikTrenPBPH' + index] = new Chart(document.getElementById(id), {
        type:'line',
        data:{
          labels,
          datasets:[{
            label:'Hotspot',
            data:values,
            borderColor:'#2e7d32',
            backgroundColor:'rgba(46,125,50,.12)',
            borderWidth:2.5,
            tension:.25,
            pointRadius:3,
            pointHoverRadius:5,
            fill:true
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          interaction:{mode:'index',intersect:false},
          plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'Hotspot: '+fmt(ctx.raw)}}},
          scales:{
            y:{beginAtZero:true,ticks:{precision:0}},
            x:{ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:10}}
          }
        }
      });
    });
  }

  function filteredData() {
    const data = Array.isArray(window.dataTrenHotspot) ? window.dataTrenHotspot : [];
    const start = document.getElementById('tanggalMulaiTren')?.value;
    const end = document.getElementById('tanggalSelesaiTren')?.value;
    return data.filter(d => (!start || d.tanggal >= start) && (!end || d.tanggal <= end));
  }

  function refresh() {
    const panel = document.getElementById('panel-tren-hotspot');
    if (!panel) return;
    let wrapper = document.getElementById('trenPbphPanel');
    if (!wrapper) {
      wrapper = document.createElement('section');
      wrapper.id = 'trenPbphPanel';
      wrapper.className = 'tren-pbph-panel';
      wrapper.innerHTML = `
        <div class="tren-pbph-panel__header">
          <div class="tren-pbph-panel__eyebrow">ANALISIS PER PBPH</div>
          <h3>Tren Hotspot Setiap PBPH</h3>
          <p>Setiap PBPH yang memiliki hotspot ditampilkan dalam grafik tren harian tersendiri.</p>
        </div>
        <div id="trenPbphCharts" class="tren-pbph-grid"></div>`;
      panel.appendChild(wrapper);
    }
    render(filteredData());
  }

  const originalShow = window.tampilkanTrenHotspot;
  if (typeof originalShow === 'function') {
    window.tampilkanTrenHotspot = async function() {
      const result = await originalShow.apply(this, arguments);
      setTimeout(refresh, 150);
      return result;
    };
  }

  const originalFilter = window.filterRentangTanggalHotspot;
  if (typeof originalFilter === 'function') {
    window.filterRentangTanggalHotspot = function() {
      const result = originalFilter.apply(this, arguments);
      setTimeout(refresh, 150);
      return result;
    };
  }

  window.refreshTrenHotspotPBPH = refresh;
})();