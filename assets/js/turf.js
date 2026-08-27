// =====================================================
// TURF.JS
// REKAPITULASI HOTSPOT SPASIAL
// BPHL WILAYAH XI BANJARBARU
// =====================================================


// =====================================================
// CEK DATA SUDAH SIAP
// =====================================================

function hitungRekapHotspot() {

    console.log("====================================");
    console.log("MEMULAI REKAPITULASI HOTSPOT");
    console.log("====================================");


    // =================================================
    // VALIDASI DATA HOTSPOT
    // =================================================

    if (
        !hotspotSipongiData ||
        !Array.isArray(hotspotSipongiData.features)
    ) {

        console.warn(
            "Data hotspot belum tersedia."
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


            // Pastikan geometry Point
            if (
                !hotspot.geometry ||
                hotspot.geometry.type !== "Point"
            ) {

                return;

            }


            // Buat Turf Point
            var titikHotspot =
                turf.point(
                    hotspot.geometry.coordinates
                );


            // =============================================
            // STATUS
            // =============================================

            var ditemukanPBPH = false;

            var namaPBPH = null;

            var kategoriKawasan = null;


            // =============================================
            // CEK HOTSPOT DI DALAM PBPH
            // =============================================

            pbphLayer.eachLayer(
                function(layerPBPH) {

                    // Jika sudah ditemukan
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

                        // Cek titik berada di PBPH
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

                        // Cek titik berada di kawasan
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
            // BUAT NAMA KATEGORI REKAP
            // =============================================

            var kategoriRekap = "";


            // ---------------------------------------------
            // PRIORITAS 1
            // ADA PBPH
            // ---------------------------------------------

            if (
                ditemukanPBPH
            ) {

                // Jika PBPH juga berada di kawasan
                if (
                    kategoriKawasan
                ) {

                    kategoriRekap =
                        namaPBPH +
                        " (" +
                        kategoriKawasan +
                        ")";

                }


                // PBPH tetapi tidak ditemukan kawasan
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
            // DI LUAR PBPH DAN KAWASAN
            // ---------------------------------------------

            else {

                kategoriRekap =
                    "DI LUAR KAWASAN HUTAN";

            }


            // =============================================
            // SIMPAN KE REKAP
            // =============================================

            if (
                !rekap[kategoriRekap]
            ) {

                rekap[kategoriRekap] = 0;

            }


            rekap[kategoriRekap]++;

        }
    );


    // =================================================
    // URUTKAN DARI TERBESAR
    // =================================================

    var hasilRekap =
        Object.entries(rekap)
        .sort(
            function(a, b) {

                return b[1] - a[1];

            }
        );


    // =================================================
    // TAMPILKAN KE CONSOLE
    // =================================================

    console.log(
        "HASIL REKAPITULASI HOTSPOT:"
    );


    console.table(
        hasilRekap.map(
            function(item) {

                return {

                    Kategori: item[0],

                    Jumlah_Hotspot: item[1]

                };

            }
        )
    );


    // =================================================
    // TAMPILKAN DI SIDEBAR
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

        max-height:350px;

        overflow-y:auto;

    `;


    // =================================================
    // JUDUL
    // =================================================

    var html = `

        <div style="
            font-weight:bold;
            font-size:15px;
            margin-bottom:10px;
            color:#d32f2f;
        ">

            🔥 REKAP HOTSPOT

        </div>

    `;


    // =================================================
    // TOTAL
    // =================================================

    var total = 0;


    hasilRekap.forEach(
        function(item) {

            total += item[1];

        }
    );


    html += `

        <div style="
            background:#fff3e0;
            padding:8px;
            border-radius:6px;
            margin-bottom:10px;
        ">

            <b>Total Hotspot:</b>
            ${total}

        </div>

    `;


    // =================================================
    // TABEL
    // =================================================

    html += `

        <table style="
            width:100%;
            border-collapse:collapse;
            font-size:12px;
        ">

            <thead>

                <tr>

                    <th style="
                        text-align:left;
                        padding:6px;
                        border-bottom:1px solid #ddd;
                    ">

                        Lokasi

                    </th>


                    <th style="
                        text-align:center;
                        padding:6px;
                        border-bottom:1px solid #ddd;
                    ">

                        Jumlah

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
                        padding:7px 4px;
                        border-bottom:1px solid #eee;
                    ">

                        ${item[0]}

                    </td>


                    <td style="
                        text-align:center;
                        font-weight:bold;
                        border-bottom:1px solid #eee;
                    ">

                        ${item[1]}

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


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
