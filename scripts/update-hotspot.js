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
// CEK POINT BERADA DI GARIS
// =====================================================

function pointOnSegment(
    point,
    a,
    b
) {

    const x =
        point[0];

    const y =
        point[1];

    const x1 =
        a[0];

    const y1 =
        a[1];

    const x2 =
        b[0];

    const y2 =
        b[1];


    const cross =
        (
            x - x1
        ) *
        (
            y2 - y1
        )
        -
        (
            y - y1
        ) *
        (
            x2 - x1
        );


    if (
        Math.abs(
            cross
        ) > 1e-10
    ) {

        return false;

    }


    const dot =
        (
            x - x1
        ) *
        (
            x2 - x1
        )
        +
        (
            y - y1
        ) *
        (
            y2 - y1
        );


    if (
        dot < 0
    ) {

        return false;

    }


    const lengthSquared =
        (
            x2 - x1
        ) *
        (
            x2 - x1
        )
        +
        (
            y2 - y1
        ) *
        (
            y2 - y1
        );


    return (
        dot <=
        lengthSquared
    );

}


// =====================================================
// CEK POINT DALAM RING POLYGON
// =====================================================

function pointInRing(
    point,
    ring
) {

    if (
        !Array.isArray(
            ring
        ) ||
        ring.length < 3
    ) {

        return false;

    }


    const x =
        point[0];

    const y =
        point[1];

    let inside =
        false;


    for (
        let i = 0,
            j = ring.length - 1;

        i < ring.length;

        j = i++
    ) {

        const xi =
            ring[i][0];

        const yi =
            ring[i][1];

        const xj =
            ring[j][0];

        const yj =
            ring[j][1];


        // Titik berada tepat pada batas
        if (
            pointOnSegment(
                point,
                ring[j],
                ring[i]
            )
        ) {

            return true;

        }


        const intersect =
            (
                (
                    yi > y
                ) !==
                (
                    yj > y
                )
            )
            &&
            (
                x <
                (
                    (
                        xj - xi
                    ) *
                    (
                        y - yi
                    )
                ) /
                (
                    yj - yi
                )
                +
                xi
            );


        if (
            intersect
        ) {

            inside =
                !inside;

        }

    }


    return inside;

}


// =====================================================
// CEK POINT DALAM POLYGON
// =====================================================

function pointInPolygon(
    point,
    coordinates
) {

    if (
        !Array.isArray(
            coordinates
        ) ||
        coordinates.length === 0
    ) {

        return false;

    }


    // Ring luar
    if (
        !pointInRing(
            point,
            coordinates[0]
        )
    ) {

        return false;

    }


    // Cek lubang polygon
    for (
        let i = 1;

        i < coordinates.length;

        i++
    ) {

        if (
            pointInRing(
                point,
                coordinates[i]
            )
        ) {

            return false;

        }

    }


    return true;

}


// =====================================================
// CEK POINT DALAM GEOMETRY
// MENDUKUNG POLYGON DAN MULTIPOLYGON
// =====================================================

function pointInGeometry(
    point,
    geometry
) {

    if (
        !geometry
    ) {

        return false;

    }


    if (
        geometry.type ===
        "Polygon"
    ) {

        return pointInPolygon(
            point,
            geometry.coordinates
        );

    }


    if (
        geometry.type ===
        "MultiPolygon"
    ) {

        return geometry.coordinates.some(
            function(
                polygon
            ) {

                return pointInPolygon(
                    point,
                    polygon
                );

            }
        );

    }


    return false;

}


// =====================================================
// CARI PBPH
// =====================================================

function cariPBPH(
    titik,
    featuresPBPH
) {

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


        if (
            pointInGeometry(
                titik,
                feature.geometry
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


    return {
        ditemukan:
            false,

        nama:
            ""
    };

}


// =====================================================
// CARI KATEGORI KAWASAN HUTAN
// =====================================================

function cariKawasan(
    titik,
    featuresKawasan
) {

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


        const f2025 =
            String(
                feature.properties?.F2025 ||
                ""
            )
            .trim()
            .toUpperCase();


        // =============================================
        // ABAIKAN DATA NON-KAWASAN HUTAN
        // =============================================

        if (
            f2025 === ""
        ) {

            continue;

        }


        if (
            f2025 ===
            "SISTEM LAHAN"
        ) {

            continue;

        }


        if (
            f2025 ===
            "PAPH"
        ) {

            continue;

        }


        // =============================================
        // CEK TITIK DALAM KAWASAN
        // =============================================

        if (
            pointInGeometry(
                titik,
                feature.geometry
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


    return {
        ditemukan:
            false,

        kategori:
            ""
    };

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


        const dataKawasan =
            bacaGeoJSON(
                fileKawasan,
                "Kawasanhutan.geojson"
            );


        const featuresPBPH =
            ambilFeatures(
                dataPBPH
            );


        const featuresKawasan =
            ambilFeatures(
                dataKawasan
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
                // CEK PBPH
                // =========================================

                const hasilPBPH =
                    cariPBPH(
                        titik,
                        featuresPBPH
                    );


                // =========================================
                // CEK KAWASAN HUTAN
                // =========================================

                const hasilKawasan =
                    cariKawasan(
                        titik,
                        featuresKawasan
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
        // VALIDASI TOTAL SPASIAL
        // =================================================

        const totalKategori =
            totalPBPH +
            totalKawasan +
            totalLuarKawasan;


        if (
            totalKategori !==
            totalHotspot
        ) {

            console.warn(
                "PERINGATAN: Total kategori spasial tidak sama dengan total hotspot."
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
        // URUTKAN BERDASARKAN TANGGAL
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
