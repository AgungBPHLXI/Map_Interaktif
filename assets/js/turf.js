// =====================================================
// TURF.JS
// ANALISIS SPASIAL HOTSPOT
// BPHL WILAYAH XI BANJARBARU
// =====================================================


// =====================================================
// FUNGSI NORMALISASI NAMA
// =====================================================

function normalizeValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");

}


// =====================================================
// CEK HOTSPOT DI DALAM POLYGON
// =====================================================

function hotspotDiDalamLayer(
    hotspotFeature,
    leafletLayer
) {

    try {

        return turf.booleanPointInPolygon(
            hotspotFeature,
            leafletLayer.feature
        );

    }

    catch (error) {

        return false;

    }

}


// =====================================================
// CARI PBPH TEMPAT HOTSPOT BERADA
// =====================================================

function cariPBPH(hotspotFeature) {

    let hasil = null;


    if (
        typeof pbphLayer === "undefined" ||
        !pbphLayer
    ) {

        return null;

    }


    pbphLayer.eachLayer(function(layer) {

        // Jika sudah ditemukan,
        // tidak perlu diproses lagi
        if (hasil) {

            return;

        }


        if (
            !layer.feature ||
            !layer.feature.geometry
        ) {

            return;

        }


        try {

            if (
                turf.booleanPointInPolygon(
                    hotspotFeature,
                    layer.feature
                )
            ) {

                hasil = layer;

            }

        }

        catch (error) {

            console.warn(
                "Gagal membaca polygon PBPH:",
                error
            );

        }

    });


    return hasil;

}


// =====================================================
// CARI KAWASAN HUTAN TEMPAT HOTSPOT BERADA
// =====================================================

function cariKawasan(hotspotFeature) {

    let hasil = null;


    if (
        typeof kawasanLayer === "undefined" ||
        !kawasanLayer
    ) {

        return null;

    }


    kawasanLayer.eachLayer(function(layer) {

        // Jika sudah ditemukan
        if (hasil) {

            return;

        }


        if (
            !layer.feature ||
            !layer.feature.geometry
        ) {

            return;

        }


        try {

            if (
                turf.booleanPointInPolygon(
                    hotspotFeature,
                    layer.feature
                )
            ) {

                hasil = layer;

            }

        }

        catch (error) {

            console.warn(
                "Gagal membaca polygon kawasan:",
                error
            );

        }

    });


    return hasil;

}


// =====================================================
// ANALISIS REKAP HOTSPOT
// =====================================================

function hitungRekapHotspot() {

    console.log(
        "Memulai analisis spasial hotspot..."
    );


    // Pastikan data hotspot tersedia
    if (
        typeof hotspotSipongiData === "undefined" ||
        !hotspotSipongiData ||
        !hotspotSipongiData.features
    ) {

        console.warn(
            "Data hotspot belum tersedia."
        );

        return;

    }


    // Pastikan layer PBPH tersedia
    if (
        typeof pbphLayer === "undefined" ||
        !pbphLayer
    ) {

        console.warn(
            "Layer PBPH belum tersedia."
        );

        return;

    }


    // Pastikan layer kawasan tersedia
    if (
        typeof kawasanLayer === "undefined" ||
        !kawasanLayer
    ) {

        console.warn(
            "Layer Kawasan belum tersedia."
        );

        return;

    }


    // Objek hasil rekap
    let rekap = {};


    // Total hotspot
    let totalHotspot = 0;


    // Hotspot dalam PBPH
    let totalDalamPBPH = 0;


    // Hotspot kawasan hutan tanpa PBPH
    let totalKawasanTanpaPBPH = 0;


    // Hotspot di luar kawasan
    let totalLuarKawasan = 0;


    // =================================================
    // LOOP SETIAP HOTSPOT
    // =================================================

    hotspotSipongiData.features.forEach(
        function(hotspot) {

            totalHotspot++;


            // =============================================
            // CARI PBPH
            // =============================================

            let pbph = cariPBPH(hotspot);


            // =============================================
            // CARI KAWASAN HUTAN
            // =============================================

            let kawasan = cariKawasan(hotspot);


            // =============================================
            // AMBIL NAMA PBPH
            // =============================================

            let namaPBPH = null;


            if (pbph) {

                namaPBPH = normalizeValue(
                    pbph.feature.properties?.NAMOBJ
                );

            }


            // =============================================
            // AMBIL FUNGSI KAWASAN
            // =============================================

            let fungsiKawasan = null;


            if (kawasan) {

                fungsiKawasan = normalizeValue(
                    kawasan.feature.properties?.F2025
                );

            }


            // =============================================
            // HOTSPOT DI DALAM PBPH
            // =============================================

            if (namaPBPH) {

                totalDalamPBPH++;


                // Jika fungsi kawasan tidak ditemukan
                if (
                    !fungsiKawasan ||
                    fungsiKawasan === "-"
                ) {

                    fungsiKawasan =
                        "Fungsi Kawasan Tidak Teridentifikasi";

                }


                let key =
                    "PBPH|" +
                    namaPBPH +
                    "|" +
                    fungsiKawasan;


                if (!rekap[key]) {

                    rekap[key] = {

                        kategori: "PBPH",

                        nama: namaPBPH,

                        fungsi: fungsiKawasan,

                        jumlah: 0

                    };

                }


                rekap[key].jumlah++;

            }


            // =============================================
            // DALAM KAWASAN,
            // TAPI TIDAK ADA PBPH
            // =============================================

            else if (fungsiKawasan) {

                totalKawasanTanpaPBPH++;


                let key =
                    "KAWASAN|" +
                    fungsiKawasan;


                if (!rekap[key]) {

                    rekap[key] = {

                        kategori: "KAWASAN HUTAN",

                        nama: "-",

                        fungsi: fungsiKawasan,

                        jumlah: 0

                    };

                }


                rekap[key].jumlah++;

            }


            // =============================================
            // DI LUAR KAWASAN
            // =============================================

            else {

                totalLuarKawasan++;


                let key =
                    "LUAR_KAWASAN";


                if (!rekap[key]) {

                    rekap[key] = {

                        kategori: "LUAR KAWASAN",

                        nama: "-",

                        fungsi: "Di luar kawasan hutan",

                        jumlah: 0

                    };

                }


                rekap[key].jumlah++;

            }

        }
    );


    // =================================================
    // UBAH OBJECT MENJADI ARRAY
    // =================================================

    let hasilRekap =
        Object.values(rekap);


    // Urutkan berdasarkan jumlah hotspot terbesar
    hasilRekap.sort(
        function(a, b) {

            return b.jumlah - a.jumlah;

        }
    );


    // =================================================
    // SIMPAN HASIL GLOBAL
    // =================================================

    window.hasilRekapHotspot = {

        total: totalHotspot,

        dalamPBPH: totalDalamPBPH,

        kawasanTanpaPBPH:
            totalKawasanTanpaPBPH,

        luarKawasan:
            totalLuarKawasan,

        detail: hasilRekap

    };


    console.log(
        "HASIL REKAP HOTSPOT:",
        window.hasilRekapHotspot
    );


    // Tampilkan ke HTML
    tampilkanRekapHotspot();


    return window.hasilRekapHotspot;

}


// =====================================================
// TAMPILKAN REKAP DI SIDEBAR
// =====================================================

function tampilkanRekapHotspot() {

    let container =
        document.getElementById(
            "rekapHotspot"
        );


    if (!container) {

        console.warn(
            "Container #rekapHotspot belum ditemukan."
        );

        return;

    }


    if (
        !window.hasilRekapHotspot
    ) {

        return;

    }


    let data =
        window.hasilRekapHotspot;


    let html = `

        <div style="
            font-size:14px;
            margin-bottom:10px;
        ">

            <b>Total Hotspot:</b>
            ${data.total}

            <br>

            <b>Dalam PBPH:</b>
            ${data.dalamPBPH}

            <br>

            <b>Kawasan tanpa PBPH:</b>
            ${data.kawasanTanpaPBPH}

            <br>

            <b>Luar Kawasan:</b>
            ${data.luarKawasan}

        </div>

        <hr>

    `;


    // =================================================
    // DETAIL REKAP
    // =================================================

    data.detail.forEach(
        function(item) {

            // ===============================
            // PBPH
            // ===============================

            if (
                item.kategori === "PBPH"
            ) {

                html += `

                    <div style="
                        background:white;
                        padding:8px;
                        margin-bottom:7px;
                        border-radius:6px;
                        border-left:4px solid #e67e22;
                    ">

                        <b>${item.nama}</b>

                        <br>

                        <span style="
                            font-size:12px;
                            color:#666;
                        ">

                            Fungsi:
                            ${item.fungsi}

                        </span>

                        <br>

                        <b style="
                            color:#c0392b;
                        ">

                            🔥 ${item.jumlah} hotspot

                        </b>

                    </div>

                `;

            }


            // ===============================
            // KAWASAN TANPA PBPH
            // ===============================

            else if (
                item.kategori ===
                "KAWASAN HUTAN"
            ) {

                html += `

                    <div style="
                        background:#f5f5f5;
                        padding:8px;
                        margin-bottom:7px;
                        border-radius:6px;
                        border-left:4px solid #2e7d32;
                    ">

                        <b>Kawasan Hutan</b>

                        <br>

                        <span style="
                            font-size:12px;
                            color:#666;
                        ">

                            Fungsi:
                            ${item.fungsi}

                        </span>

                        <br>

                        <b style="
                            color:#c0392b;
                        ">

                            🔥 ${item.jumlah} hotspot

                        </b>

                    </div>

                `;

            }


            // ===============================
            // LUAR KAWASAN
            // ===============================

            else {

                html += `

                    <div style="
                        background:#fff3e0;
                        padding:8px;
                        margin-bottom:7px;
                        border-radius:6px;
                        border-left:4px solid #757575;
                    ">

                        <b>Di Luar Kawasan Hutan</b>

                        <br>

                        <b style="
                            color:#c0392b;
                        ">

                            🔥 ${item.jumlah} hotspot

                        </b>

                    </div>

                `;

            }

        }
    );


    container.innerHTML = html;

}
