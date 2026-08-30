// =====================================================
// UPDATE DATA HOTSPOT HARIAN
// BPHL XI BANJARBARU
// =====================================================

const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");


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
// PATH DATA
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
        folderData,
        "hotspot-tren-30-hari.json"
    );


// =====================================================
// FILE SPASIAL
// =====================================================

const filePBPH =
    path.join(
        __dirname,
        "..",
        "pbph.geojson"
    );


const fileKawasan =
    path.join(
        __dirname,
        "..",
        "Kawasanhutan.geojson"
    );

const fileKonservasi =
    path.join(
        __dirname,
        "..",
        "Konservasi.geojson"
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
// FUNGSI BACA GEOJSON
// =====================================================

function bacaGeoJSON(
    filePath,
    namaFile
) {

    if (
        !fs.existsSync(
            filePath
        )
    ) {

        throw new Error(
            namaFile +
            " tidak ditemukan: " +
            filePath
        );

    }


    try {

        return JSON.parse(
            fs.readFileSync(
                filePath,
                "utf8"
            )
        );

    }

    catch (
        error
    ) {

        throw new Error(
            "Gagal membaca " +
            namaFile +
            ": " +
            error.message
        );

    }

}


// =====================================================
// AMBIL FEATURE DARI GEOJSON
// =====================================================

function ambilFeatures(
    geojson
) {

    if (
        !geojson
    ) {

        return [];

    }


    if (
        geojson.type ===
        "FeatureCollection"
    ) {

        return Array.isArray(
            geojson.features
        )
            ? geojson.features
            : [];

    }


    if (
        geojson.type ===
        "Feature"
    ) {

        return [
            geojson
        ];

    }


    return [];

}


// =====================================================
// CARI PBPH
//
// MENGGUNAKAN TURF.JS
// SAMA DENGAN METODE DI APLIKASI
// =====================================================

function cariPBPH(
    titik,
    featuresPBPH
) {

    // =============================================
    // UBAH KOORDINAT MENJADI TURF POINT
    // =============================================

    const titikTurf =
        turf.point(
            titik
        );


    // =============================================
    // CEK SETIAP POLIGON PBPH
    // =============================================

    for (
        const feature
        of featuresPBPH
    ) {

        if (
            !feature ||
            !feature.geometry
        ) {

            continue;

        }


        try {

            // =========================================
            // CEK HOTSPOT BERADA DALAM PBPH
            //
            // METODE SAMA DENGAN APLIKASI
            // =========================================

            if (
                turf.booleanPointInPolygon(
                    titikTurf,
                    feature
                )
            ) {

                return {

                    ditemukan:
                        true,


                    nama:
                        String(
                            feature.properties?.NAMOBJ ||
                            "PBPH"
                        )
                        .trim()

                };

            }

        }

        catch (
            error
        ) {

            console.warn(
                "Error cek PBPH:",
                error.message
            );

        }

    }


    // =============================================
    // HOTSPOT TIDAK BERADA DALAM PBPH
    // =============================================

    return {

        ditemukan:
            false,


        nama:
            ""

    };

}
// =====================================================
// CARI KATEGORI KAWASAN HUTAN
//
// MENGGUNAKAN TURF.JS
// SAMA DENGAN METODE DI APLIKASI
// =====================================================

function cariKawasan(
    titik,
    featuresKawasan
) {

    // =============================================
    // UBAH KOORDINAT MENJADI TURF POINT
    // =============================================

    const titikTurf =
        turf.point(
            titik
        );


    // =============================================
    // CEK SETIAP POLIGON KAWASAN
    // =============================================

    for (
        const feature
        of featuresKawasan
    ) {

        if (
            !feature ||
            !feature.geometry
        ) {

            continue;

        }


        // =============================================
        // AMBIL KATEGORI KAWASAN
        // =============================================

        const f2025 =
            String(
                feature.properties?.F2025 ||
                ""
            )
            .trim()
            .toUpperCase();


        // =============================================
        // HANYA GUNAKAN KATEGORI KAWASAN YANG VALID
        // =============================================

        if (
            f2025 !== "HL" &&
            f2025 !== "HP" &&
            f2025 !== "HPT" &&
            f2025 !== "HPK" &&
            f2025 !== "HK"
        ) {

            continue;

        }


        try {

            // =========================================
            // CEK HOTSPOT BERADA DALAM KAWASAN
            //
            // METODE SAMA DENGAN TURF.JS APLIKASI
            // =========================================

            if (
                turf.booleanPointInPolygon(
                    titikTurf,
                    feature
                )
            ) {

                return {

                    ditemukan:
                        true,

                    kategori:
                        f2025

                };

            }

        }

        catch (
            error
        ) {

            console.warn(
                "Error cek Kawasan:",
                error.message
            );

        }

    }


    // =============================================
    // HOTSPOT TIDAK BERADA DALAM KAWASAN HUTAN
    // =============================================

    return {

        ditemukan:
            false,

        kategori:
            ""

    };

}


// =====================================================
// AMBIL DATA DARI SIPONGI
// =====================================================// =====================================================
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
        // BACA DATA SPASIAL
        // =============================================

        console.log(
            "Membaca data PBPH..."
        );


        const dataPBPH =
            bacaGeoJSON(
                filePBPH,
                "pbph.geojson"
            );


        console.log(
            "Membaca data Kawasan Hutan..."
        );


       // =================================================
// BACA DATA KAWASAN HUTAN
// =================================================

const dataKawasan =
    bacaGeoJSON(
        fileKawasan,
        "Kawasanhutan.geojson"
    );


// =================================================
// BACA DATA KONSERVASI
// =================================================

const dataKonservasi =
    bacaGeoJSON(
        fileKonservasi,
        "Konservasi.geojson"
    );


// =================================================
// AMBIL FEATURE PBPH
// =================================================

const featuresPBPH =
    ambilFeatures(
        dataPBPH
    );


// =================================================
// AMBIL FEATURE KAWASAN HUTAN
// =================================================

const featuresKawasan =
    ambilFeatures(
        dataKawasan
    );


// =================================================
// AMBIL FEATURE KONSERVASI
// =================================================

const featuresKonservasi =
    ambilFeatures(
        dataKonservasi
    );


// =================================================
// SAMAKAN KATEGORI KONSERVASI DENGAN APLIKASI
//
// Semua feature Konservasi dikategorikan sebagai HK
// =================================================

featuresKonservasi.forEach(
    function(
        feature
    ) {

        if (
            !feature.properties
        ) {

            feature.properties =
                {};

        }


        feature.properties.F2025 =
            "HK";

    }
);


// =================================================
// GABUNGKAN KAWASAN HUTAN + KONSERVASI
// =================================================

featuresKawasan.push(
    ...featuresKonservasi
);

        console.log(
            "Jumlah feature PBPH:",
            featuresPBPH.length
        );


        console.log(
            "Jumlah feature Kawasan:",
            featuresKawasan.length
        );


        // =============================================
        // AMBIL DATA API SIPONGI
        // =============================================

        console.log(
            "Mengambil data dari SiPongi..."
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
        // SIMPAN DATA HOTSPOT HARIAN ASLI
        //
        // DATA DARI SIPONGI TIDAK DIUBAH
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
            "Data harian asli disimpan:"
        );


        console.log(
            fileHarian
        );


        // =================================================
        // HITUNG REKAP
        // =================================================

        let high =
            0;

        let medium =
            0;

        let low =
            0;


        let totalHotspot =
            0;


        let totalPBPH =
            0;


        let totalKawasan =
            0;


        let totalLuarKawasan =
            0;
        // =================================================
// REKAP DETAIL UNTUK DATA TREN
// =================================================

const rekapKawasan = {

    HL:
        0,

    HP:
        0,

    HPT:
        0,

    HPK:
        0,

    HK:
        0,

    "Di Luar Kawasan":
        0

};


const rekapPBPH = {};


        // =================================================
        // PROSES SETIAP HOTSPOT
        // =================================================

        data.features.forEach(
            function(
                feature
            ) {

                if (
                    !feature ||
                    !feature.geometry ||
                    feature.geometry.type !==
                    "Point"
                ) {

                    return;

                }


                const coordinates =
                    feature.geometry.coordinates;


                if (
                    !Array.isArray(
                        coordinates
                    ) ||
                    coordinates.length < 2
                ) {

                    return;

                }


                const longitude =
                    Number(
                        coordinates[0]
                    );


                const latitude =
                    Number(
                        coordinates[1]
                    );


                if (
                    !Number.isFinite(
                        longitude
                    ) ||
                    !Number.isFinite(
                        latitude
                    )
                ) {

                    return;

                }


                const p =
                    feature.properties || {};


                const confidence =
                    String(
                        p.confidence_level ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                // =========================================
                // HITUNG CONFIDENCE
                // =========================================

                if (
                    confidence ===
                    "high"
                ) {

                    high++;

                }


                else if (
                    confidence ===
                    "medium"
                ) {

                    medium++;

                }


                else {

                    low++;

                }


                totalHotspot++;


                // =========================================
                // TITIK UNTUK ANALISIS SPASIAL
                // [LONGITUDE, LATITUDE]
                // =========================================

                const titik =
                    [
                        longitude,
                        latitude
                    ];

               // =========================================
// CEK KAWASAN HUTAN
// =========================================

const hasilKawasan =
    cariKawasan(
        titik,
        featuresKawasan
    );


// =========================================
// CEK PBPH
//
// Dilakukan TERPISAH dari klasifikasi kawasan.
// =========================================

const hasilPBPH =
    cariPBPH(
        titik,
        featuresPBPH
    );
            // =========================================
// KLASIFIKASI KAWASAN
//
// Klasifikasi kawasan dilakukan
// TERPISAH dari klasifikasi PBPH.
// =========================================

if (
    hasilKawasan.ditemukan
) {

    // =====================================
    // TAMBAHKAN TOTAL KAWASAN
    // =====================================

    totalKawasan++;


    // =====================================
    // AMBIL KATEGORI KAWASAN
    // =====================================

    const kategoriKawasan =
        String(
            hasilKawasan.kategori ||
            ""
        )
        .trim()
        .toUpperCase();


    // =====================================
    // TAMBAHKAN KE REKAP KAWASAN
    // =====================================

    if (
        rekapKawasan[
            kategoriKawasan
        ] !== undefined
    ) {

        rekapKawasan[
            kategoriKawasan
        ]++;

    }

}


else {

    // =====================================
    // HOTSPOT DI LUAR KAWASAN
    // =====================================

    totalLuarKawasan++;


    rekapKawasan[
        "Di Luar Kawasan"
    ]++;

}


// =========================================
// KLASIFIKASI PBPH
//
// Dilakukan TERPISAH dari kawasan.
// =========================================

if (
    hasilPBPH.ditemukan
) {

    // =====================================
    // TAMBAHKAN TOTAL PBPH
    // =====================================

    totalPBPH++;


    // =====================================
    // AMBIL NAMA PBPH
    // =====================================

    const namaPBPH =
        hasilPBPH.nama;


    // =====================================
    // TAMBAHKAN KE REKAP BERDASARKAN
    // NAMA PBPH
    // =====================================

    if (
        namaPBPH
    ) {

        if (
            rekapPBPH[
                namaPBPH
            ] === undefined
        ) {

            rekapPBPH[
                namaPBPH
            ] = 0;

        }


        rekapPBPH[
            namaPBPH
        ]++;

    }

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
        totalHotspot,


    // =================================================
    // TOTAL REKAP
    // =================================================

    pbph:
        totalPBPH,


    kawasan:
        totalKawasan,


    luar_kawasan:
        totalLuarKawasan,


    // =================================================
    // REKAP DETAIL UNTUK DATA TREN
    // =================================================

    rekap_kawasan:
        rekapKawasan,


    rekap_pbph:
        rekapPBPH

};


// =================================================
// TAMPILKAN HASIL REKAP DI CONSOLE
// =================================================

console.log(
    "Rekap hari ini:"
);


console.log(
    rekapHariIni
);

        // =================================================
// VALIDASI TOTAL KAWASAN
//
// Setiap hotspot harus masuk salah satu:
//
// 1. Kawasan Hutan
// 2. Di Luar Kawasan
//
// PBPH TIDAK dijumlahkan di sini karena PBPH adalah
// klasifikasi terpisah dan dapat tumpang tindih
// dengan Kawasan Hutan.
// =================================================

const totalKategori =
    totalKawasan +
    totalLuarKawasan;


if (
    totalKategori !==
    totalHotspot
) {

    console.warn(
        "PERINGATAN: Total Kawasan + Di Luar Kawasan tidak sama dengan total hotspot."
    );

}


// =================================================
// VALIDASI PBPH
//
// PBPH adalah klasifikasi terpisah.
//
// Nilai totalPBPH boleh sama atau lebih kecil
// dari totalHotspot.
// =================================================

if (
    totalPBPH >
    totalHotspot
) {

    console.warn(
        "PERINGATAN: Total PBPH lebih besar dari total hotspot."
    );

}


        // =================================================
        // BACA DATA TREN LAMA
        // =================================================

        let dataTren =
            [];


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


                dataTren =
                    [];

            }

        }


     // =================================================
// HAPUS DATA DENGAN TANGGAL YANG SAMA
// =================================================

dataTren =
    dataTren.filter(
        function(
            item
        ) {

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
// URUTKAN DATA BERDASARKAN TANGGAL
// =================================================

dataTren.sort(
    function(
        a,
        b
    ) {

        return (
            String(
                a.tanggal
            )
            .localeCompare(
                String(
                    b.tanggal
                )
            )
        );

    }
);
// =================================================
// SIMPAN SELURUH DATA HISTORIS HOTSPOT
//
// Data tidak lagi dibatasi 30 hari.
// Data dari bulan dan tahun sebelumnya
// tetap tersimpan.
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


        // =================================================
        // LOG HASIL
        // =================================================

        console.log(
            "========================================"
        );


        console.log(
            "DATA HOTSPOT BERHASIL DIPERBARUI"
        );


        console.log(
            "========================================"
        );


        console.log(
            "Tanggal:",
            hariIni
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
            totalHotspot
        );


        console.log(
            "PBPH:",
            totalPBPH
        );


        console.log(
            "Kawasan:",
            totalKawasan
        );


        console.log(
            "Di Luar Kawasan:",
            totalLuarKawasan
        );


        console.log(
            "Total Kategori:",
            totalKategori
        );


        console.log(
            "File tren:",
            fileTren
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
