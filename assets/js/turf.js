// =====================================================
// TURF.JS
// REKAPITULASI HOTSPOT SPASIAL
// BPHL WILAYAH XI BANJARBARU
// =====================================================


// =====================================================
// HITUNG REKAP HOTSPOT
// =====================================================

function hitungRekapHotspot() {

    console.log("====================================");
    console.log("MEMULAI REKAPITULASI HOTSPOT");
    console.log("====================================");


    // =================================================
    // VALIDASI DATA HOTSPOT
    // =================================================

    if (
        typeof hotspotSipongiData === "undefined" ||
        !hotspotSipongiData ||
        !Array.isArray(hotspotSipongiData.features)
    ) {

        console.warn(
            "Data hotspot belum tersedia."
        );

        return;
    }


    // =================================================
    // VALIDASI TURF
    // =================================================

    if (
        typeof turf === "undefined"
    ) {

        console.warn(
            "Turf.js belum tersedia."
        );

        return;
    }


    // =================================================
    // VALIDASI LAYER PBPH
    // =================================================

    if (
        typeof pbphLayer === "undefined" ||
        !pbphLayer
    ) {

        console.warn(
            "Layer PBPH belum tersedia."
        );

        return;
    }


    // =================================================
    // VALIDASI LAYER KAWASAN
    // =================================================

    if (
        typeof kawasanLayer === "undefined" ||
        !kawasanLayer
    ) {

        console.warn(
            "Layer Kawasan belum tersedia."
        );

        return;
    }


    // =================================================
    // OBJECT HASIL REKAP
    // =================================================

    var rekap = {};


    // =================================================
    // LOOP SETIAP HOTSPOT
    // =================================================

    hotspotSipongiData.features.forEach(
        function(hotspot) {


            // =============================================
            // PASTIKAN GEOMETRY POINT
            // =============================================

            if (
                !hotspot.geometry ||
                hotspot.geometry.type !== "Point"
            ) {

                return;

            }


            // =============================================
            // AMBIL CONFIDENCE
            // =============================================

            var confidence =
                String(
                    hotspot.properties?.confidence_level || ""
                )
                .toLowerCase()
                .trim();


            // Pastikan hanya High / Medium / Low

            if (
                confidence !== "high" &&
                confidence !== "medium" &&
                confidence !== "low"
            ) {

                confidence = "low";

            }


            // =============================================
            // BUAT TITIK TURF
            // =============================================

            var titikHotspot =
                turf.point(
                    hotspot.geometry.coordinates
                );


            // =============================================
            // STATUS AWAL
            // =============================================

            var ditemukanPBPH = false;

            var namaPBPH = null;

            var kategoriKawasan = null;


            // =============================================
            // CEK HOTSPOT DI DALAM PBPH
            // =============================================

            pbphLayer.eachLayer(
                function(layerPBPH) {


                    // Jika sudah ditemukan PBPH
                    // tidak perlu cek lagi

                    if (
                        ditemukanPBPH
                    ) {

                        return;

                    }


                    var featurePBPH =
                        layerPBPH.feature;


                    if (
                        !featurePBPH ||
                        !featurePBPH.geometry
                    ) {

                        return;

                    }


                    try {

                        if (

                            turf.booleanPointInPolygon(
                                titikHotspot,
                                featurePBPH
                            )

                        ) {

                            ditemukanPBPH = true;


                            namaPBPH =
                                featurePBPH.properties?.NAMOBJ ||
                                "PBPH TANPA NAMA";

                        }

                    }

                    catch(error) {

                        console.warn(
                            "Error cek PBPH:",
                            error
                        );

                    }

                }
            );


            // =============================================
            // CEK HOTSPOT DI DALAM KAWASAN HUTAN
            // =============================================

            kawasanLayer.eachLayer(
                function(layerKawasan) {


                    // Jika kawasan sudah ditemukan
                    // tidak perlu cek lagi

                    if (
                        kategoriKawasan !== null
                    ) {

                        return;

                    }


                    var featureKawasan =
                        layerKawasan.feature;


                    if (
                        !featureKawasan ||
                        !featureKawasan.geometry
                    ) {

                        return;

                    }


                    try {

                        if (

                            turf.booleanPointInPolygon(
                                titikHotspot,
                                featureKawasan
                            )

                        ) {

                            kategoriKawasan =
                                featureKawasan.properties?.F2025 ||
                                "KAWASAN";

                        }

                    }

                    catch(error) {

                        console.warn(
                            "Error cek Kawasan:",
                            error
                        );

                    }

                }
            );


            // =============================================
            // BUAT KATEGORI REKAP
            // =============================================

            var kategoriRekap = "";


            // ---------------------------------------------
            // PRIORITAS 1
            // HOTSPOT DI DALAM PBPH
            // ---------------------------------------------

            if (
                ditemukanPBPH
            ) {


                // PBPH + Kawasan Hutan

                if (
                    kategoriKawasan
                ) {

                    kategoriRekap =
                        namaPBPH +
                        " (" +
                        kategoriKawasan +
                        ")";

                }


                // PBPH tanpa kawasan

                else {

                    kategoriRekap =
                        namaPBPH +
                        " (PBPH)";

                }

            }


            // ---------------------------------------------
            // PRIORITAS 2
            // TIDAK ADA PBPH
            // TAPI ADA KAWASAN HUTAN
            // ---------------------------------------------

            else if (
                kategoriKawasan
            ) {

                kategoriRekap =
                    "KAWASAN HUTAN (" +
                    kategoriKawasan +
                    ")";

            }


            // ---------------------------------------------
            // PRIORITAS 3
            // DI LUAR KAWASAN HUTAN
            // ---------------------------------------------

            else {

                kategoriRekap =
                    "DI LUAR KAWASAN HUTAN";

            }


            // =============================================
            // BUAT OBJECT JIKA BELUM ADA
            // =============================================

            if (
                !rekap[kategoriRekap]
            ) {

                rekap[kategoriRekap] = {

                    high: 0,

                    medium: 0,

                    low: 0,

                    total: 0

                };

            }


            // =============================================
            // TAMBAH BERDASARKAN CONFIDENCE
            // =============================================

            rekap[kategoriRekap][confidence]++;


            // Total

            rekap[kategoriRekap].total++;

        }
    );


    // =================================================
    // UBAH OBJECT MENJADI ARRAY
    // =================================================

    var hasilRekap =
        Object.entries(rekap)
        .map(
            function(item) {

                return {

                    lokasi: item[0],

                    high: item[1].high,

                    medium: item[1].medium,

                    low: item[1].low,

                    total: item[1].total

                };

            }
        )
        .sort(
            function(a, b) {

                return b.total - a.total;

            }
        );


    // =================================================
    // TAMPILKAN KE CONSOLE
    // =================================================

    console.log(
        "HASIL REKAPITULASI HOTSPOT:"
    );


    console.table(
        hasilRekap
    );


    // =================================================
    // TAMPILKAN KE SIDEBAR
    // =================================================

    tampilkanRekapHotspot(
        hasilRekap
    );


    console.log("====================================");
    console.log("REKAPITULASI SELESAI");
    console.log("====================================");

}



// =====================================================
// TAMPILKAN REKAP KE SIDEBAR
// =====================================================

function tampilkanRekapHotspot(
    hasilRekap
) {


    // =================================================
    // HAPUS PANEL LAMA
    // =================================================

    var panelLama =
        document.getElementById(
            "hotspotRekap"
        );


    if (
        panelLama
    ) {

        panelLama.remove();

    }


    // =================================================
    // HITUNG TOTAL CONFIDENCE
    // =================================================

    var totalHigh = 0;

    var totalMedium = 0;

    var totalLow = 0;

    var totalHotspot = 0;


    hasilRekap.forEach(
        function(item) {

            totalHigh += item.high;

            totalMedium += item.medium;

            totalLow += item.low;

            totalHotspot += item.total;

        }
    );


    // =================================================
    // BUAT PANEL
    // =================================================

    var panel =
        document.createElement(
            "div"
        );


    panel.id =
        "hotspotRekap";


    panel.style.cssText = `

        margin-top:15px;

        background:white;

        border-radius:10px;

        padding:12px;

        box-shadow:
            0 2px 8px
            rgba(0,0,0,0.15);

        font-size:13px;

        max-height:520px;

        overflow-y:auto;

    `;


    // =================================================
    // JUDUL
    // =================================================

    var html = `

        <div style="
            font-weight:bold;
            font-size:15px;
            margin-bottom:12px;
            color:#d32f2f;
        ">

            🔥 REKAP HOTSPOT

        </div>

    `;


    // =================================================
    // RINGKASAN HIGH MEDIUM LOW
    // =================================================

    html += `

        <div style="
            display:grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap:6px;
            margin-bottom:8px;
        ">


            <!-- HIGH -->

            <div style="
                background:#ffebee;
                border-radius:7px;
                padding:8px 4px;
                text-align:center;
                border:1px solid #ef9a9a;
            ">

                <div style="
                    font-size:11px;
                    font-weight:bold;
                    color:#c62828;
                ">

                    HIGH

                </div>

                <div style="
                    font-size:20px;
                    font-weight:bold;
                    color:#d32f2f;
                ">

                    ${totalHigh}

                </div>

            </div>


            <!-- MEDIUM -->

            <div style="
                background:#fff8e1;
                border-radius:7px;
                padding:8px 4px;
                text-align:center;
                border:1px solid #ffe082;
            ">

                <div style="
                    font-size:11px;
                    font-weight:bold;
                    color:#f57f17;
                ">

                    MEDIUM

                </div>

                <div style="
                    font-size:20px;
                    font-weight:bold;
                    color:#f9a825;
                ">

                    ${totalMedium}

                </div>

            </div>


            <!-- LOW -->

            <div style="
                background:#e8f5e9;
                border-radius:7px;
                padding:8px 4px;
                text-align:center;
                border:1px solid #a5d6a7;
            ">

                <div style="
                    font-size:11px;
                    font-weight:bold;
                    color:#2e7d32;
                ">

                    LOW

                </div>

                <div style="
                    font-size:20px;
                    font-weight:bold;
                    color:#388e3c;
                ">

                    ${totalLow}

                </div>

            </div>


        </div>

    `;


    // =================================================
    // TOTAL HOTSPOT
    // =================================================

    html += `

        <div style="
            background:#fff3e0;
            padding:8px;
            border-radius:7px;
            margin-bottom:12px;
            text-align:center;
            border:1px solid #ffcc80;
        ">

            <span style="
                font-weight:bold;
            ">

                TOTAL HOTSPOT

            </span>

            <div style="
                font-size:22px;
                font-weight:bold;
                color:#ef6c00;
            ">

                ${totalHotspot}

            </div>

        </div>

    `;


    // =================================================
    // TABEL
    // =================================================

    html += `

        <div style="
            overflow-x:auto;
        ">

            <table style="
                width:100%;
                border-collapse:collapse;
                font-size:11px;
            ">


                <thead>

                    <tr>

                        <th style="
                            text-align:left;
                            padding:7px 4px;
                            border-bottom:2px solid #ddd;
                        ">

                            Lokasi

                        </th>


                        <th style="
                            text-align:center;
                            padding:7px 4px;
                            border-bottom:2px solid #ddd;
                            color:#d32f2f;
                        ">

                            H

                        </th>


                        <th style="
                            text-align:center;
                            padding:7px 4px;
                            border-bottom:2px solid #ddd;
                            color:#f9a825;
                        ">

                            M

                        </th>


                        <th style="
                            text-align:center;
                            padding:7px 4px;
                            border-bottom:2px solid #ddd;
                            color:#388e3c;
                        ">

                            L

                        </th>


                        <th style="
                            text-align:center;
                            padding:7px 4px;
                            border-bottom:2px solid #ddd;
                        ">

                            Total

                        </th>

                    </tr>

                </thead>


                <tbody>

    `;


    // =================================================
    // ISI TABEL
    // =================================================

    hasilRekap.forEach(
        function(item) {


            html += `

                <tr>


                    <td style="
                        padding:8px 4px;
                        border-bottom:1px solid #eee;
                        line-height:1.3;
                    ">

                        ${item.lokasi}

                    </td>


                    <td style="
                        text-align:center;
                        font-weight:bold;
                        color:#d32f2f;
                        border-bottom:1px solid #eee;
                    ">

                        ${item.high}

                    </td>


                    <td style="
                        text-align:center;
                        font-weight:bold;
                        color:#f9a825;
                        border-bottom:1px solid #eee;
                    ">

                        ${item.medium}

                    </td>


                    <td style="
                        text-align:center;
                        font-weight:bold;
                        color:#388e3c;
                        border-bottom:1px solid #eee;
                    ">

                        ${item.low}

                    </td>


                    <td style="
                        text-align:center;
                        font-weight:bold;
                        border-bottom:1px solid #eee;
                    ">

                        ${item.total}

                    </td>


                </tr>

            `;

        }
    );


    html += `

                </tbody>

            </table>

        </div>

    `;


    // =================================================
    // MASUKKAN HTML KE PANEL
    // =================================================

    panel.innerHTML =
        html;


    // =================================================
    // MASUKKAN KE SIDEBAR
    // =================================================

    var sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        sidebar
    ) {

        sidebar.appendChild(
            panel
        );

    }

}
