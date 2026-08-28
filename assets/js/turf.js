// =====================================================
// STATUS DATA UNTUK REKAPITULASI HOTSPOT
// =====================================================

var hotspotSipongiLoaded = false;

var pbphLoaded = false;

var kawasanLoaded = false;


// =====================================================
// CEK SEMUA DATA SUDAH SIAP
// =====================================================

function cekDanHitungRekapHotspot() {

    // Hotspot belum selesai dimuat
    if (!hotspotSipongiLoaded) {

        console.log("Menunggu data hotspot...");

        return;
    }


    // PBPH belum selesai dimuat
    if (!pbphLoaded) {

        console.log("Menunggu layer PBPH...");

        return;
    }


    // Kawasan hutan belum selesai dimuat
    if (!kawasanLoaded) {

        console.log("Menunggu layer Kawasan Hutan...");

        return;
    }


    // Semua data sudah siap
    console.log(
        "Semua layer siap. Menghitung rekap hotspot..."
    );


    hitungRekapHotspot();

}


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

                // ======================================
                // VALIDASI CONFIDENCE
                // ======================================
                            if (
                    confidence !== "high" &&
                    confidence !== "medium" &&
                    confidence !== "low"
                ) {
                
                    console.warn(
                        "Confidence tidak dikenali:",
                        p.confidence_level,
                        p
                    );
                
                    return;
                
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

        // Jika kawasan hutan sudah ditemukan
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


        // =========================================
        // AMBIL KATEGORI KAWASAN
        // =========================================

        var f2025 =
            String(
                featureKawasan.properties?.F2025 || ""
            )
            .trim()
            .toUpperCase();


        // =========================================
        // ABAIKAN LAYER NON-KAWASAN HUTAN
        // =========================================
        //
        // SISTEM LAHAN dan PAPH bukan kategori
        // kawasan hutan untuk rekap hotspot
        //
        // =========================================

        if (
            f2025 === "SISTEM LAHAN" ||
            f2025 === "PAPH"
        ) {

            return;

        }


        // Jika tidak memiliki kategori kawasan,
        // jangan dihitung sebagai kawasan hutan

        if (
            f2025 === ""
        ) {

            return;

        }


        // =========================================
        // CEK TITIK HOTSPOT
        // DI DALAM POLIGON KAWASAN HUTAN
        // =========================================

        try {

            if (

                turf.booleanPointInPolygon(
                    titikHotspot,
                    featureKawasan
                )

            ) {

                kategoriKawasan = f2025;

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
            
            if (ditemukanPBPH && kategoriKawasan) {
            
                kategoriRekap =
                    namaPBPH +
                    " (" +
                    kategoriKawasan +
                    ")";

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
    // URUTKAN REKAP HOTSPOT
    // =================================================

    const urutanLokasi = {

        "DI LUAR KAWASAN HUTAN": 1,

        "KAWASAN HUTAN (HL)": 2,

        "KAWASAN HUTAN (HP)": 3,

        "KAWASAN HUTAN (HPT)": 4,

        "KAWASAN HUTAN (HPK)": 5,

        "KAWASAN HUTAN (HK)": 6

    };


    hasilRekap.sort(
        function(a, b) {


            const lokasiA =
                String(
                    a.lokasi || ""
                ).trim();


            const lokasiB =
                String(
                    b.lokasi || ""
                ).trim();


            const urutanA =
                urutanLokasi[
                    lokasiA
                ] || 7;


            const urutanB =
                urutanLokasi[
                    lokasiB
                ] || 7;


            if (
                urutanA !== urutanB
            ) {

                return (
                    urutanA - urutanB
                );

            }


            return lokasiA.localeCompare(
                lokasiB,
                "id"
            );


        }
    );


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

    position:fixed;

    top:90px;

    right:20px;

    z-index:2000;

    width:420px;

    max-width:calc(100vw - 120px);

    max-height:calc(100vh - 130px);

    overflow-y:auto;

    background:white;

    border-radius:12px;

    padding:15px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,0.25);

    font-size:13px;

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
    // TOMBOL EXPORT EXCEL
    // =================================================

    html += `

        <button
            id="btnExportHotspotExcel"
            type="button"
            style="
                width:100%;
                padding:10px;
                margin-bottom:12px;
                border:none;
                border-radius:7px;
                background:#2e7d32;
                color:white;
                font-size:13px;
                font-weight:bold;
                cursor:pointer;
            "
        >

            📥 DOWNLOAD DATA HOTSPOT EXCEL

        </button>

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
    // EVENT TOMBOL EXPORT EXCEL
    // =================================================

    var tombolExportExcel =
    panel.querySelector(
        "#btnExportHotspotExcel"
    );


    if (
        tombolExportExcel
    ) {

        tombolExportExcel.addEventListener(
            "click",
            function() {

                exportHotspotExcel();

            }
        );

    }

    // =================================================
// MASUKKAN PANEL KE HALAMAN / PETA
// =================================================

document.body.appendChild(
    panel
);


// =================================================
// TOMBOL EXPORT EXCEL
// =================================================

var tombolExportExcel =
    panel.querySelector(
        "#btnExportHotspotExcel"
    );


if (
    tombolExportExcel
) {

    tombolExportExcel.addEventListener(
        "click",
        function() {

            exportHotspotExcel();

        }
    );

}


// =================================================
// TOMBOL TUTUP PANEL
// =================================================

var tombolTutup =
    panel.querySelector(
        "#tutupRekapHotspot"
    );


if (
    tombolTutup
) {

    tombolTutup.addEventListener(
        "click",
        function() {

            panel.remove();

        }
    );

}


}


// =====================================================
// EXPORT DATA HOTSPOT KE EXCEL
// =====================================================

function exportHotspotExcel() {


    // =================================================
    // VALIDASI DATA HOTSPOT
    // =================================================

    if (
        typeof hotspotSipongiData === "undefined" ||
        !hotspotSipongiData ||
        !Array.isArray(
            hotspotSipongiData.features
        ) ||
        hotspotSipongiData.features.length === 0
    ) {

        alert(
            "Data hotspot belum tersedia."
        );

        return;

    }


    // =================================================
    // CEK LIBRARY EXCEL
    // =================================================

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Library Excel belum dimuat. Periksa script SheetJS di index.html."
        );

        return;

    }


    // =================================================
    // BUAT ARRAY DATA EXCEL
    // =================================================

    var dataExcel = [];


    // =================================================
    // PROSES SETIAP HOTSPOT
    // =================================================

    hotspotSipongiData.features.forEach(
        function(feature) {


            // =========================================
            // VALIDASI GEOMETRY
            // =========================================

            if (
                !feature.geometry ||
                feature.geometry.type !== "Point" ||
                !Array.isArray(
                    feature.geometry.coordinates
                )
            ) {

                return;

            }


            // =========================================
            // AMBIL PROPERTY
            // =========================================

            var p =
                feature.properties || {};


            // =========================================
            // AMBIL KOORDINAT
            // GEOJSON:
            // [LONGITUDE, LATITUDE]
            // =========================================

            var longitude =
                feature.geometry.coordinates[0];


            var latitude =
                feature.geometry.coordinates[1];


            // =========================================
            // AMBIL TANGGAL HOTSPOT
            // =========================================

            var tanggalRaw =
                p.date_hotspot || "";


            var tanggalExcel =
                "";


            var waktuExcel =
                "";


            // =========================================
            // AMBIL TANGGAL DARI date_hotspot
            // =========================================

            var hasilTanggal =
                String(
                    tanggalRaw
                ).match(
                    /^(\d{4}-\d{2}-\d{2})/
                );


            if (
                hasilTanggal
            ) {

                tanggalExcel =
                    hasilTanggal[1];

            }


            // =========================================
            // AMBIL WAKTU DARI date_hotspot
            // =========================================

            var hasilWaktuDariTanggal =
                String(
                    tanggalRaw
                ).match(
                    /(\d{2}:\d{2}:\d{2})/
                );


            if (
                hasilWaktuDariTanggal
            ) {

                waktuExcel =
                    hasilWaktuDariTanggal[1];

            }


            // =========================================
            // JIKA WAKTU BELUM ADA,
            // AMBIL DARI hs_date
            // =========================================

            if (
                !waktuExcel &&
                p.hs_date
            ) {

                var hasilWaktu =
                    String(
                        p.hs_date
                    ).match(
                        /(\d{2}:\d{2}:\d{2})/
                    );


                if (
                    hasilWaktu
                ) {

                    waktuExcel =
                        hasilWaktu[1];

                }

            }


            // =========================================
            // JIKA TANGGAL TIDAK TERBACA,
            // GUNAKAN DATA ASLI
            // =========================================

            if (
                !tanggalExcel &&
                tanggalRaw
            ) {

                tanggalExcel =
                    tanggalRaw;

            }


            // =========================================
            // MASUKKAN DATA KE EXCEL
            // =========================================

            dataExcel.push({

                "No":
                    dataExcel.length + 1,


                "Provinsi":
                    p.nama_provinsi || "-",


                "Kabupaten":
                    p.kabkota || "-",


                "Kecamatan":
                    p.kecamatan || "-",


                "Desa":
                    p.desa || "-",


                "Sumber":
                    p.sumber || "-",


                "Confidence":
                    p.confidence_level || "-",


                "Nilai Confidence":
                    p.confidence || "-",


                "Tanggal":
                    tanggalExcel || "-",


                "Waktu":
                    waktuExcel || "-",


                "Latitude":
                    latitude,


                "Longitude":
                    longitude

            });

        }
    );


    // =================================================
    // VALIDASI HASIL EXPORT
    // =================================================

    if (
        dataExcel.length === 0
    ) {

        alert(
            "Tidak ada data hotspot yang dapat diexport."
        );

        return;

    }


    // =================================================
    // BUAT WORKSHEET EXCEL
    // =================================================

    var worksheet =
        XLSX.utils.json_to_sheet(
            dataExcel
        );


    // =================================================
    // ATUR LEBAR KOLOM
    // =================================================

    worksheet["!cols"] = [

        { wch: 8 },

        { wch: 22 },

        { wch: 25 },

        { wch: 22 },

        { wch: 22 },

        { wch: 18 },

        { wch: 15 },

        { wch: 18 },

        { wch: 15 },

        { wch: 12 },

        { wch: 14 },

        { wch: 14 }

    ];


    // =================================================
    // BUAT WORKBOOK
    // =================================================

    var workbook =
        XLSX.utils.book_new();


    // =================================================
    // MASUKKAN WORKSHEET
    // =================================================

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Data Hotspot"
    );


    // =================================================
    // TANGGAL UNTUK NAMA FILE
    // =================================================

    var sekarang =
        new Date();


    var tanggalFile =
        sekarang.getFullYear() +
        "-" +
        String(
            sekarang.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            sekarang.getDate()
        ).padStart(
            2,
            "0"
        );


    // =================================================
    // NAMA FILE EXCEL
    // =================================================

    var namaFile =
        "Data_Hotspot_Kalimantan_Selatan_" +
        tanggalFile +
        ".xlsx";


    // =================================================
    // DOWNLOAD EXCEL
    // =================================================

    XLSX.writeFile(
        workbook,
        namaFile
    );


    // =================================================
    // INFORMASI BERHASIL
    // =================================================

    console.log(
        "Export Excel berhasil:",
        dataExcel.length,
        "data hotspot"
    );

}
