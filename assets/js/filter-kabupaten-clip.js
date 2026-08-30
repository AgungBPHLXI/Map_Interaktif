// =====================================================
// FILTER SPASIAL KABUPATEN -> KAWASAN HUTAN
// Jika Kabupaten dipilih, kawasan hutan dipotong mengikuti
// batas administrasi kabupaten yang dipilih.
// Sumber data dan logika filter utama tetap dipertahankan.
// =====================================================

(function () {
    'use strict';

    let clippedKawasanLayer = null;

    function nilaiTerpilih(id) {
        const nilai = $(id).val() || [];
        return nilai.filter(v => v && v !== 'ALL');
    }

    function bersihkanClip() {
        if (clippedKawasanLayer) {
            map.removeLayer(clippedKawasanLayer);
            clippedKawasanLayer = null;
        }
    }

    function tampilkanKawasanAsli() {
        if (typeof kawasanLayer === 'undefined' || !kawasanLayer) return;

        kawasanLayer.eachLayer(function (layer) {
            if (!layer || !layer.setStyle) return;

            const style = (typeof window.styleKawasan === 'function')
                ? window.styleKawasan(layer.feature)
                : {};

            layer.setStyle(style);
            layer.options.interactive = true;
        });
    }

    function sembunyikanKawasanAsli() {
        if (typeof kawasanLayer === 'undefined' || !kawasanLayer) return;

        kawasanLayer.eachLayer(function (layer) {
            if (!layer || !layer.setStyle) return;
            layer.setStyle({
                opacity: 0,
                fillOpacity: 0
            });
            layer.options.interactive = false;
        });
    }

    function kategoriDiizinkan(feature, kategoriTerpilih) {
        if (!kategoriTerpilih.length) return true;

        const kategori = String(
            feature && feature.properties && feature.properties.F2025 || ''
        ).trim();

        return kategoriTerpilih.includes(kategori);
    }

    function namaKabupaten(layer) {
        return String(
            layer && layer.feature && layer.feature.properties && layer.feature.properties.KABUPATEN || ''
        ).trim();
    }

    function gabungkanBatasKabupaten(kabupatenTerpilih) {
        const batas = [];

        if (typeof kabupatenLayer === 'undefined' || !kabupatenLayer) {
            return null;
        }

        kabupatenLayer.eachLayer(function (layer) {
            if (!layer || !layer.feature) return;
            if (kabupatenTerpilih.includes(namaKabupaten(layer))) {
                batas.push(layer.feature);
            }
        });

        if (!batas.length) return null;

        let gabungan = batas[0];

        for (let i = 1; i < batas.length; i++) {
            try {
                gabungan = turf.union(gabungan, batas[i]) || gabungan;
            } catch (error) {
                console.warn('Gagal menggabungkan batas kabupaten:', error);
            }
        }

        return gabungan;
    }

    function clipKawasanKeKabupaten() {
        const kabupatenTerpilih = nilaiTerpilih('#filterKabupaten');
        const kategoriTerpilih = nilaiTerpilih('#filterF2025');

        // Jika tidak ada kabupaten, kembalikan tampilan kawasan normal.
        if (!kabupatenTerpilih.length) {
            bersihkanClip();
            tampilkanKawasanAsli();
            return;
        }

        if (typeof turf === 'undefined') {
            console.warn('Turf belum tersedia, clipping kawasan tidak dijalankan.');
            return;
        }

        const batasKabupaten = gabungkanBatasKabupaten(kabupatenTerpilih);
        if (!batasKabupaten) {
            console.warn('Batas kabupaten terpilih tidak ditemukan.');
            return;
        }

        const hasil = [];

        kawasanLayer.eachLayer(function (layer) {
            if (!layer || !layer.feature) return;
            if (!kategoriDiizinkan(layer.feature, kategoriTerpilih)) return;

            try {
                const potongan = turf.intersect(layer.feature, batasKabupaten);
                if (potongan && potongan.geometry) {
                    potongan.properties = Object.assign(
                        {},
                        layer.feature.properties || {},
                        potongan.properties || {}
                    );
                    hasil.push(potongan);
                }
            } catch (error) {
                console.warn('Gagal memotong kawasan:', error);
            }
        });

        bersihkanClip();
        sembunyikanKawasanAsli();

        clippedKawasanLayer = L.geoJSON(
            {
                type: 'FeatureCollection',
                features: hasil
            },
            {
                style: function (feature) {
                    return (typeof window.styleKawasan === 'function')
                        ? window.styleKawasan(feature)
                        : {};
                },
                onEachFeature: function (feature, layer) {
                    // Pertahankan popup dasar apabila layer asli tidak dapat digunakan.
                    if (feature.properties) {
                        const kategori = feature.properties.F2025 || '-';
                        layer.bindTooltip(String(kategori), { sticky: true });
                    }
                }
            }
        ).addTo(map);

        // Pastikan kawasan terpotong tetap berada di bawah PBPH,
        // sehingga outline PBPH tetap mudah dibaca.
        if (typeof pbphLayer !== 'undefined' && pbphLayer && map.hasLayer(pbphLayer)) {
            pbphLayer.bringToFront();
        }

        console.log(
            'Kawasan hutan telah dipotong mengikuti batas kabupaten:',
            kabupatenTerpilih.join(', '),
            '| fitur:', hasil.length
        );
    }

    // Jalankan setelah handler filter lama, sehingga perubahan ini hanya
    // menjadi tahap spasial tambahan untuk kombinasi Kabupaten + Kawasan.
    $(document).on(
        'change',
        '#filterKabupaten, #filterF2025',
        function () {
            setTimeout(clipKawasanKeKabupaten, 0);
        }
    );

    // Untuk kondisi filter yang sudah aktif ketika halaman selesai dimuat.
    setTimeout(clipKawasanKeKabupaten, 1500);

    window.clipKawasanKeKabupaten = clipKawasanKeKabupaten;
})();
