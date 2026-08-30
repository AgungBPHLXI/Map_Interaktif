// =====================================================
// SIMBOLOGI PETA BERDASARKAN SK MENLHK NO. 399 TAHUN 2024
// Fokus: batas kabupaten, kawasan hutan, dan PBPH.
// Tidak mengubah sumber data, filter, atau logika hotspot.
// =====================================================

(function () {
    'use strict';

    // SK 399/2024 - Kawasan Hutan
    // KSA/KPA = 173, 63, 255
    // HL      =   2,173,   0
    // HPT     = 138,242,   0
    // HP      = 255,255,   0
    // HPK     = 255, 94, 255
    // APL     = 255,255, 255
    const WARNA_KAWASAN = {
        'KSA/KPA': '#AD3FFF',
        'KSA': '#AD3FFF',
        'KPA': '#AD3FFF',
        'HK': '#AD3FFF',
        'HL': '#02AD00',
        'HPT': '#8AF200',
        'HP': '#FFFF00',
        'HPK': '#FF5EFF',
        'APL': '#FFFFFF'
    };

    // SK 399/2024 - Perizinan Berusaha Pemanfaatan Hutan (PBPH)
    // RGB 255, 85, 0 dengan outline width 2.
    const WARNA_PBPH = '#FF5500';

    // Batas kabupaten merupakan unsur peta dasar RBI.
    // SK 399/2024 merujuk simbologi RBI; digunakan garis netral agar
    // tidak bersaing dengan warna tematik kawasan dan PBPH.
    const STYLE_KABUPATEN = {
        color: '#000000',
        weight: 1.2,
        opacity: 0.85,
        fill: false,
        fillOpacity: 0
    };

    const styleKawasanSebelumnya = window.styleKawasan;
    const stylePBPHsebelumnya = window.stylePBPH;

    window.styleKawasan = function (feature) {
        const kategori = String(
            feature && feature.properties && feature.properties.F2025 || ''
        ).trim().toUpperCase();

        if (WARNA_KAWASAN[kategori]) {
            return {
                color: '#000000',
                weight: 0.8,
                opacity: 0.9,
                fillColor: WARNA_KAWASAN[kategori],
                fillOpacity: 0.72
            };
        }

        // PAPH dan layer lain mempertahankan gaya/logika yang sudah ada.
        if (typeof styleKawasanSebelumnya === 'function') {
            return styleKawasanSebelumnya(feature);
        }

        return {
            color: '#666666',
            weight: 1,
            fillOpacity: 0.2
        };
    };

    window.stylePBPH = function () {
        return {
            color: WARNA_PBPH,
            weight: 2,
            opacity: 1,
            fillOpacity: 0
        };
    };

    function terapkanSimbologi() {
        let kawasanSiap = false;
        let pbphSiap = false;
        let kabupatenSiap = false;

        if (typeof kawasanLayer !== 'undefined' && kawasanLayer && kawasanLayer.eachLayer) {
            kawasanLayer.eachLayer(function (layer) {
                if (layer && layer.feature && layer.setStyle) {
                    layer.setStyle(window.styleKawasan(layer.feature));
                    kawasanSiap = true;
                }
            });
        }

        if (typeof pbphLayer !== 'undefined' && pbphLayer && pbphLayer.eachLayer) {
            pbphLayer.eachLayer(function (layer) {
                if (layer && layer.setStyle) {
                    layer.setStyle(window.stylePBPH(layer.feature));
                    pbphSiap = true;
                }
            });
        }

        if (typeof kabupatenLayer !== 'undefined' && kabupatenLayer) {
            if (typeof kabupatenLayer.setStyle === 'function') {
                kabupatenLayer.setStyle(STYLE_KABUPATEN);
            }
            kabupatenSiap = true;
        }

        return kawasanSiap || pbphSiap || kabupatenSiap;
    }

    // Layer GeoJSON dimuat asinkron, sehingga simbologi diterapkan ulang
    // beberapa kali sampai seluruh layer utama tersedia.
    let percobaan = 0;
    const timer = window.setInterval(function () {
        terapkanSimbologi();
        percobaan += 1;

        if (percobaan >= 60) {
            window.clearInterval(timer);
        }
    }, 500);

    window.setTimeout(terapkanSimbologi, 100);
    window.setTimeout(terapkanSimbologi, 1500);
    window.setTimeout(terapkanSimbologi, 5000);
})();
