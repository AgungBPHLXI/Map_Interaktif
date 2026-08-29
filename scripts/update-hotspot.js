// =====================================================
// UPDATE DATA HOTSPOT HARIAN
// BPHL XI BANJARBARU
// =====================================================

const fs = require("fs");
const path = require("path");


// =====================================================
// TANGGAL HARI INI
// MENGGUNAKAN ZONA WAKTU INDONESIA
// ASIA/JAKARTA
// =====================================================

const sekarang = new Date();


const formatterTanggal =
    new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "Asia/Jakarta",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    );


const hariIni =
    formatterTanggal.format(
        sekarang
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
// FOLDER DATA HOTSPOT
// =====================================================

const folderData =
    path.join(
        __dirname,
        "..",
        "data",
        "hotspot-harian"
    );


// =====================================================
// FILE TREN 30 HARI
//
// DISIMPAN DI:
// data/hotspot-harian/
// =====================================================

const fileTren =
    path.join(
        folderData,
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
            "========================================"
        );


        console.log(
            "UPDATE DATA HOTSPOT SIPONGI"
        );


        console.log(
            "Tanggal:",
            hariIni
        );


        console.log(
            "========================================"
        );


        // =============================================
        // AMBIL DATA API
        // =============================================

        console.log(
            "Mengambil data dari SiPongi..."
        );


        const response =
            await fetch(
                SIPONGI_HOTSPOT_URL
            );


        // =============================================
        // VALIDASI RESPONSE
        // =============================================

        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP Error: " +
                response.status
            );

        }


        // =============================================
        // UBAH RESPONSE MENJADI JSON
        // =============================================

        const data =
            await response.json();


        console.log(
            "Data SiPongi berhasil diterima."
        );


        // =============================================
        // VALIDASI FORMAT DATA
        // =============================================

        if (
            !data ||
            !Array.isArray(
                data.features
            )
        ) {

            throw new Error(
                "Format data hotspot tidak sesuai."
            );

        }


        // =================================================
        // SIMPAN DATA HOTSPOT HARIAN LENGKAP
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
            "Data harian disimpan:"
        );


        console.log(
            fileHarian
        );


        // =================================================
        // HITUNG REKAP CONFIDENCE
        // =================================================

        let high = 0;

        let medium = 0;

        let low = 0;


        // =============================================
        // PROSES SETIAP HOTSPOT
        // =============================================

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


                // =========================================
                // HIGH
                // =========================================

                if (
                    confidence === "high"
                ) {

                    high++;

                }


                // =========================================
                // MEDIUM
                // =========================================

                else if (
                    confidence === "medium"
                ) {

                    medium++;

                }


                // =========================================
                // LOW
                //
                // TERMASUK CONFIDENCE TIDAK VALID /
                // KOSONG AGAR KONSISTEN DENGAN APLIKASI
                // =========================================

                else {

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


        console.log(
            "Rekap hari ini:"
        );


        console.log(
            rekapHariIni
        );


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
                    )
                    .trim();


                // =========================================
                // JIKA FILE TIDAK KOSONG
                // =========================================

                if (
                    isiFile
                ) {

                    const hasilBaca =
                        JSON.parse(
                            isiFile
                        );


                    if (
                        Array.isArray(
                            hasilBaca
                        )
                    ) {

                        dataTren =
                            hasilBaca;

                    }

                }

            }

            catch (
                error
            ) {

                console.log(
                    "File tren lama tidak dapat dibaca."
                );


                console.log(
                    "Membuat data tren baru."
                );


                dataTren = [];

            }

        }


        // =================================================
        // HAPUS DATA DENGAN TANGGAL YANG SAMA
        //
        // AGAR DATA HARI INI TIDAK DUPLIKAT
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
                    String(
                        a.tanggal
                    ).localeCompare(
                        String(
                            b.tanggal
                        )
                    )
                );

            }
        );


        // =================================================
        // AMBIL MAKSIMAL 30 DATA TERAKHIR
        // =================================================

        dataTren =
            dataTren.slice(
                -30
            );


        // =================================================
        // SIMPAN DATA TREN 30 HARI
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
            "========================================"
        );


        console.log(
            "DATA TREN BERHASIL DIPERBARUI"
        );


        console.log(
            "File tren:",
            fileTren
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


        console.log(
            "========================================"
        );


    }

    catch (
        error
    ) {

        console.error(
            "========================================"
        );


        console.error(
            "GAGAL UPDATE HOTSPOT"
        );


        console.error(
            error
        );


        console.error(
            "========================================"
        );


        process.exit(
            1
        );

    }

}


// =====================================================
// JALANKAN UPDATE
// =====================================================

updateHotspot();
