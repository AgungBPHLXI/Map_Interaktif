// =====================================================
// MODUL HOTSPOT SIPONGI
// BPHL XI BANJARBARU
// =====================================================


// =====================================================
// VARIABEL GLOBAL
// =====================================================

let hotspotLayer = null;

let hotspotData = null;


// =====================================================
// WARNA HOTSPOT BERDASARKAN CONFIDENCE
// =====================================================

function getHotspotColor(confidence) {

    confidence =
        String(
            confidence || ""
        )
        .trim()
        .toLowerCase();


    if (
        confidence === "high"
    ) {

        return "#e53935";

    }


    if (
        confidence === "medium"
    ) {

        return "#fbc02d";

    }


    return "#43a047";

}


// =====================================================
// UKURAN HOTSPOT
// =====================================================

function getHotspotRadius(
    confidence
) {

    confidence =
        String(
            confidence || ""
        )
        .trim()
        .toLowerCase();


    if (
        confidence === "high"
    ) {

        return 7;

    }


    if (
        confidence === "medium"
    ) {

        return 6;

    }


    return 5;

}


// =====================================================
// LOAD DATA HOTSPOT HARIAN
// =====================================================

async function loadHotspotHarian(
    tanggal
) {

    try {

        console.log(
            "Memuat hotspot:",
            tanggal
        );


        const url =
            "data/hotspot-harian/" +
            tanggal +
            ".json";


        const response =
            await fetch(
                url
            );


        if (
            !response.ok
        ) {

            console.warn(
                "Data hotspot tidak ditemukan:",
                url
            );


            return null;

        }


        const data =
            await response.json();


        return data;

    }

    catch (
        error
    ) {

        console.error(
            "Gagal memuat data hotspot:",
            error
        );


        return null;

    }

}


// =====================================================
// TAMPILKAN HOTSPOT KE PETA
// =====================================================

function tampilkanHotspot(
    data
) {

    if (
        !data ||
        !Array.isArray(
            data.features
        )
    ) {

        console.warn(
            "Data hotspot kosong."
        );


        return;

    }


    // =============================================
    // HAPUS LAYER LAMA
    // =============================================

    if (
        hotspotLayer &&
        map.hasLayer(
            hotspotLayer
        )
    ) {

        map.removeLayer(
            hotspotLayer
        );

    }


    // =============================================
    // BUAT LAYER BARU
    // =============================================

    hotspotLayer =
        L.geoJSON(
            data,
            {

                pointToLayer:
                    function(
                        feature,
                        latlng
                    ) {

                        const properties =
                            feature.properties || {};


                        const confidence =
                            properties.confidence_level;


                        return L.circleMarker(
                            latlng,
                            {

                                radius:
                                    getHotspotRadius(
                                        confidence
                                    ),

                                fillColor:
                                    getHotspotColor(
                                        confidence
                                    ),

                                color:
                                    "#ffffff",

                                weight:
                                    1,

                                opacity:
                                    1,

                                fillOpacity:
                                    0.85

                            }
                        );

                    },


                onEachFeature:
                    function(
                        feature,
                        layer
                    ) {

                        const p =
                            feature.properties || {};


                        layer.bindPopup(
                            `
                            <b>HOTSPOT</b>
                            <br>

                            Confidence:
                            ${p.confidence_level || "-"}

                            <br>

                            Satellite:
                            ${p.satellite || "-"}

                            <br>

                            Date:
                            ${p.acq_date || p.date || "-"}

                            <br>

                            Time:
                            ${p.acq_time || "-"}
                            `
                        );

                    }

            }
        );


    hotspotLayer.addTo(
        map
    );


    hotspotData =
        data;


    console.log(
        "Hotspot ditampilkan:",
        data.features.length
    );

}


// =====================================================
// LOAD HOTSPOT BERDASARKAN TANGGAL
// =====================================================

async function loadDanTampilkanHotspot(
    tanggal
) {

    const data =
        await loadHotspotHarian(
            tanggal
        );


    if (
        !data
    ) {

        return;

    }


    tampilkanHotspot(
        data
    );

}
