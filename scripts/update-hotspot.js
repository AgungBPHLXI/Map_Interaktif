// =====================================================
// UPDATE DATA HOTSPOT HARIAN
// BPHL XI BANJARBARU
// =====================================================

const fs = require("fs");
const path = require("path");


// =====================================================
// TANGGAL HARI INI
// MENGGUNAKAN WAKTU UTC
// =====================================================

const sekarang = new Date();

const hariIni =
    sekarang.getUTCFullYear() +
    "-" +
    String(
        sekarang.getUTCMonth() + 1
    ).padStart(
        2,
        "0"
    ) +
    "-" +
    String(
        sekarang.getUTCDate()
    ).padStart(
        2,
        "0"
    );


// =====================================================
// URL API SIPONGI
// =====================================================

const SIPONGI_HOTSPOT_URL =
    "https://opsroom.sipongidata.my.id/api/opsroom/indoHotspot" +
    "?wilayah=IN" +
    "&filterperiode=true" +
    "&from=" + hariIni +
    "&to=" + hariIni +
    "&late=custom" +
    "&satelit[]=NASA-MODIS" +
    "&satelit[]=NASA-SNPP" +
    "&satelit[]=NASA-NOAA20" +
    "&confidence[]=low" +
    "&confidence[]=medium" +
    "&confidence[]=high" +
    "&provinsi=12" +
    "&kabkota=";


// =====================================================
// FOLDER DATA
// =====================================================

const folderData =
    path.join(
        __dirname,
        "..",
        "data",
        "hotspot-harian"
    );


const fileTren =
    path.join(
        __dirname,
        "..",
        "data",
        "hotspot-tren-30-hari.json"
    );


// =====================================================
// BUAT FOLDER JIKA BELUM ADA
// =====================================================

if (
    !fs.existsSync(
        folderData
    )
) {

    fs.mkdirSync(
        folderData,
        {
            recursive: true
        }
    );

}


// =====================================================
// AMBIL DATA DARI SIPONGI
// =====================================================

async function updateHotspot() {

    try {

        console.log(
            "Mengambil data hotspot:",
            hariIni
        );


        const response =
            await fetch(
                SIPONGI_HOTSPOT_URL
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        const data =
            await response.json();


        // =================================================
        // VALIDASI DATA
        // =================================================

        if (
            !data ||
            !Array.isArray(
                data.features
            )
        ) {

            throw new Error(
                "Format data hotspot tidak sesuai"
            );

        }


        // =================================================
        // SIMPAN DATA HARIAN LENGKAP
        // =================================================

        const fileHarian =
            path.join(
                folderData,
                hariIni + ".json"
            );


        fs.writeFileSync(
            fileHarian,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );


        console.log(
            "Data harian disimpan:",
            fileHarian
        );


        // =================================================
        // HITUNG REKAP CONFIDENCE
        // =================================================

        let high = 0;

        let medium = 0;

        let low = 0;


        data.features.forEach(
            function(feature) {


                const p =
                    feature.properties || {};


                const confidence =
                    String(
                        p.confidence_level || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    confidence === "high"
                ) {

                    high++;

                }

                else if (
                    confidence === "medium"
                ) {

                    medium++;

                }

                else if (
                    confidence === "low"
                ) {

                    low++;

                }

            }
        );


        // =================================================
        // BUAT DATA REKAP HARI INI
        // =================================================

        const rekapHariIni = {

            tanggal:
                hariIni,

            high:
                high,

            medium:
                medium,

            low:
                low,

            total:
                data.features.length

        };


        // =================================================
        // BACA DATA TREN LAMA
        // =================================================

        let dataTren = [];


        if (
            fs.existsSync(
                fileTren
            )
        ) {

            try {

                const isiFile =
                    fs.readFileSync(
                        fileTren,
                        "utf8"
                    );


                dataTren =
                    JSON.parse(
                        isiFile
                    );


                if (
                    !Array.isArray(
                        dataTren
                    )
                ) {

                    dataTren = [];

                }

            }

            catch (
                error
            ) {

                console.log(
                    "File tren lama tidak dapat dibaca."
                );


                dataTren = [];

            }

        }


        // =================================================
        // HAPUS DATA TANGGAL YANG SAMA
        // =================================================

        dataTren =
            dataTren.filter(
                function(item) {

                    return (
                        item.tanggal !==
                        hariIni
                    );

                }
            );


        // =================================================
        // TAMBAHKAN DATA HARI INI
        // =================================================

        dataTren.push(
            rekapHariIni
        );


        // =================================================
        // URUTKAN BERDASARKAN TANGGAL
        // =================================================

        dataTren.sort(
            function(a, b) {

                return (
                    new Date(
                        a.tanggal
                    ) -
                    new Date(
                        b.tanggal
                    )
                );

            }
        );


        // =================================================
        // AMBIL 30 HARI TERAKHIR
        // =================================================

        dataTren =
            dataTren.slice(
                -30
            );


        // =================================================
        // SIMPAN DATA TREN
        // =================================================

        fs.writeFileSync(
            fileTren,
            JSON.stringify(
                dataTren,
                null,
                2
            ),
            "utf8"
        );


        console.log(
            "Rekap tren berhasil diperbarui."
        );


        console.log(
            "High:",
            high
        );


        console.log(
            "Medium:",
            medium
        );


        console.log(
            "Low:",
            low
        );


        console.log(
            "Total:",
            data.features.length
        );


    }

    catch (
        error
    ) {

        console.error(
            "GAGAL UPDATE HOTSPOT:",
            error
        );


        process.exit(
            1
        );

    }

}


// =====================================================
// JALANKAN
// =====================================================

updateHotspot();
