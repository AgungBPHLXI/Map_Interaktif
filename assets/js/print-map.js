// =====================================================
// CETAK PETA PDF
// Layout cetak profesional menggunakan tampilan Leaflet aktif.
// Tidak mengubah sumber data maupun logika layer/filter.
// =====================================================

(function () {
    'use strict';

    const modal = document.getElementById('printMapModal');
    const titleInput = document.getElementById('printMapTitle');
    const subtitleInput = document.getElementById('printMapSubtitle');
    const noteInput = document.getElementById('printMapNote');
    const printTitle = document.getElementById('printLayoutTitle');
    const printSubtitle = document.getElementById('printLayoutSubtitle');
    const printNote = document.getElementById('printLayoutNote');
    const printMeta = document.getElementById('printLayoutMeta');
    const printLegend = document.getElementById('printLegendItems');

    const kawasanColors = {
        'HK': '#ad3fff',
        'KSA/KPA': '#ad3fff',
        'HL': '#02ad00',
        'HPT': '#8af200',
        'HP': '#ffff00',
        'HPK': '#ff5eff',
        'APL': '#ffffff'
    };

    function selectedValues(selector) {
        if (typeof window.$ === 'function') {
            const value = $(selector).val();
            return Array.isArray(value) ? value.filter(Boolean) : [];
        }
        const select = document.querySelector(selector);
        return select ? Array.from(select.selectedOptions).map(o => o.value).filter(Boolean) : [];
    }

    function formatDate() {
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date());
    }

    function currentFilterText() {
        const parts = [];
        const kabupaten = selectedValues('#filterKabupaten');
        const kawasan = selectedValues('#filterF2025');
        const pbph = selectedValues('#filterNama');
        const industri = selectedValues('#filterIndustri');

        if (kabupaten.length) parts.push(`Kabupaten: ${kabupaten.join(', ')}`);
        if (kawasan.length) parts.push(`Kawasan: ${kawasan.join(', ')}`);
        if (pbph.length) parts.push(`PBPH: ${pbph.join(', ')}`);
        if (industri.length) parts.push(`Industri: ${industri.join(', ')}`);

        return parts.length ? parts.join(' • ') : 'Tampilan seluruh layer yang aktif';
    }

    function buildLegend() {
        const selectedKawasan = selectedValues('#filterF2025');
        const kawasan = selectedKawasan.length
            ? selectedKawasan
            : ['HK', 'HL', 'HPT', 'HP', 'HPK'];

        const items = kawasan.map(name => {
            const color = kawasanColors[name] || '#cccccc';
            return `<div class="print-legend-item"><span class="print-legend-swatch" style="background:${color}"></span><span>${escapeHtml(name)}</span></div>`;
        });

        if (typeof window.pbphLayer !== 'undefined' && window.pbphLayer && map.hasLayer(window.pbphLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--pbph"></span><span>PBPH</span></div>');
        }

        if (typeof window.paphLayer !== 'undefined' && window.paphLayer && map.hasLayer(window.paphLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--paph"></span><span>PAPH</span></div>');
        }

        if (typeof window.kabupatenLayer !== 'undefined' && window.kabupatenLayer && map.hasLayer(window.kabupatenLayer)) {
            items.push('<div class="print-legend-item"><span class="print-legend-line print-legend-line--kabupaten"></span><span>Batas Kabupaten</span></div>');
        }

        printLegend.innerHTML = items.join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[char]);
    }

    function updatePrintLayout() {
        const title = titleInput.value.trim() || 'PETA INFORMASI SPASIAL';
        const subtitle = subtitleInput.value.trim();
        const note = noteInput.value.trim();

        printTitle.textContent = title.toUpperCase();
        printSubtitle.textContent = subtitle || 'BALAI PENGELOLAAN HUTAN LESTARI WILAYAH XI BANJARBARU';
        printNote.textContent = note || currentFilterText();
        printMeta.textContent = `Dicetak: ${formatDate()}`;
        buildLegend();
    }

    function openPrintModal() {
        modal.hidden = false;
        titleInput.focus();
    }

    function closePrintModal() {
        modal.hidden = true;
    }

    function printMap() {
        updatePrintLayout();
        closePrintModal();

        // Beri waktu browser menata ulang elemen cetak dan tile Leaflet.
        requestAnimationFrame(() => {
            if (typeof map !== 'undefined') {
                map.invalidateSize(false);
            }

            setTimeout(() => {
                window.print();
            }, 350);
        });
    }

    window.openPrintMapModal = openPrintModal;
    window.closePrintMapModal = closePrintModal;
    window.printMapPdf = printMap;

    document.getElementById('btnOpenPrintMap').addEventListener('click', openPrintModal);
    document.getElementById('btnClosePrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnCancelPrintMap').addEventListener('click', closePrintModal);
    document.getElementById('btnPrintMap').addEventListener('click', printMap);

    modal.addEventListener('click', function (event) {
        if (event.target === modal) closePrintModal();
    });

    [titleInput, subtitleInput, noteInput].forEach(input => {
        input.addEventListener('input', updatePrintLayout);
    });

    window.addEventListener('afterprint', function () {
        setTimeout(() => {
            if (typeof map !== 'undefined') map.invalidateSize(false);
        }, 250);
    });

    // Kontrol skala Leaflet dipakai pada layout cetak.
    if (typeof map !== 'undefined' && typeof L !== 'undefined') {
        L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 180 }).addTo(map);
    }
})();
