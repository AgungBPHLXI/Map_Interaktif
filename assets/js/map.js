// =====================================================
// MODUL PETA
// INFORMASI SPASIAL BPHL WILAYAH XI
// =====================================================


// =====================================================
// INISIALISASI PETA
// =====================================================

var map = L.map("map", {
    zoomControl: false
}).setView(
    MAP_CONFIG.center,
    MAP_CONFIG.zoom
);


// =====================================================
// TOMBOL ZOOM
// =====================================================

L.control.zoom({
    position: "topright"
}).addTo(map);


// =====================================================
// BASEMAP
// =====================================================

var osm = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution: "© OpenStreetMap © CARTO"
    }
);


var satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles © Esri"
    }
);


// =====================================================
// DEFAULT BASEMAP
// =====================================================

osm.addTo(map);


// =====================================================
// STATUS BASEMAP
// =====================================================

var isSatellite = false;


// =====================================================
// MODE TRANSPARAN
// =====================================================

function setTransparentMode() {

    if (
        typeof pbphLayer !== "undefined" &&
        pbphLayer
    ) {

        pbphLayer.eachLayer(function(layer) {

            layer.setStyle({
                weight: 1,
                fillOpacity: 0.12,
                opacity: 0.6
            });

        });

    }


    if (
        typeof kawasanLayer !== "undefined" &&
        kawasanLayer
    ) {

        kawasanLayer.eachLayer(function(layer) {

            layer.setStyle({
                weight: 1,
                fillOpacity: 0.12,
                opacity: 0.6
            });

        });

    }

}


// =====================================================
// MODE NORMAL
// =====================================================

function setNormalMode() {

    if (
        typeof pbphLayer !== "undefined" &&
        pbphLayer &&
        typeof stylePBPH === "function"
    ) {

        pbphLayer.eachLayer(function(layer) {

            layer.setStyle(
                stylePBPH(layer.feature)
            );

        });

    }


    if (
        typeof kawasanLayer !== "undefined" &&
        kawasanLayer &&
        typeof styleKawasan === "function"
    ) {

        kawasanLayer.eachLayer(function(layer) {

            layer.setStyle(
                styleKawasan(layer.feature)
            );

        });

    }

}


// =====================================================
// TOGGLE CITRA SATELIT
// HANYA SATU TOMBOL
// =====================================================

var satelliteControl = L.control({
    position: "topright"
});


satelliteControl.onAdd = function() {

    var container = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control"
    );


    var btn = L.DomUtil.create(
        "a",
        "",
        container
    );


    btn.innerHTML = "🛰️";

    btn.href = "#";

    btn.title = "Toggle Citra Satelit";


    btn.style.width = "38px";

    btn.style.height = "38px";

    btn.style.lineHeight = "38px";

    btn.style.textAlign = "center";

    btn.style.fontSize = "18px";

    btn.style.cursor = "pointer";


    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.disableScrollPropagation(container);


    L.DomEvent.on(
        btn,
        "click",
        function(e) {

            L.DomEvent.preventDefault(e);


            // =========================
            // AKTIFKAN SATELIT
            // =========================

            if (!isSatellite) {

                if (map.hasLayer(osm)) {

                    map.removeLayer(osm);

                }


                if (!map.hasLayer(satellite)) {

                    satellite.addTo(map);

                }


                btn.style.background = "#1565c0";

                btn.style.color = "white";


                setTransparentMode();


                isSatellite = true;

            }


            // =========================
            // KEMBALI KE BASEMAP NORMAL
            // =========================

            else {

                if (map.hasLayer(satellite)) {

                    map.removeLayer(satellite);

                }


                if (!map.hasLayer(osm)) {

                    osm.addTo(map);

                }


                btn.style.background = "white";

                btn.style.color = "black";


                setNormalMode();


                isSatellite = false;

            }

        }
    );


    return container;

};


// TAMBAHKAN CONTROL SEKALI SAJA

satelliteControl.addTo(map);


// =====================================================
// FITUR POSISI SAYA
// =====================================================

var markerLokasi = null;

var circleLokasi = null;


// =====================================================
// LOKASI BERHASIL DITEMUKAN
// =====================================================

function onLocationFound(e) {

    var radius = e.accuracy;


    if (markerLokasi) {

        map.removeLayer(markerLokasi);

    }


    if (circleLokasi) {

        map.removeLayer(circleLokasi);

    }


    markerLokasi = L.marker(
        e.latlng
    )
        .addTo(map)
        .bindPopup(
            "📍 Anda berada di sini<br>" +
            "Akurasi: " +
            Math.round(radius) +
            " meter"
        )
        .openPopup();


    circleLokasi = L.circle(
        e.latlng,
        {
            radius: radius,
            color: "#136AEC",
            fillColor: "#136AEC",
            fillOpacity: 0.15
        }
    ).addTo(map);


    map.flyTo(
        e.latlng,
        15
    );

}


// =====================================================
// GAGAL MENDETEKSI LOKASI
// =====================================================

function onLocationError(e) {

    alert(
        "Tidak bisa mendeteksi lokasi: " +
        e.message
    );

}


// =====================================================
// EVENT LOKASI
// =====================================================

map.on(
    "locationfound",
    onLocationFound
);


map.on(
    "locationerror",
    onLocationError
);


// =====================================================
// TOMBOL POSISI SAYA
// =====================================================

var locateControl = L.control({
    position: "topright"
});


locateControl.onAdd = function() {

    var container = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control"
    );


    var btn = L.DomUtil.create(
        "a",
        "",
        container
    );


    btn.innerHTML = "📍";

    btn.href = "#";

    btn.title = "Posisi Saya";


    btn.style.width = "38px";

    btn.style.height = "38px";

    btn.style.lineHeight = "38px";

    btn.style.textAlign = "center";

    btn.style.fontSize = "18px";

    btn.style.cursor = "pointer";


    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.disableScrollPropagation(container);


    L.DomEvent.on(
        btn,
        "click",
        function(e) {

            L.DomEvent.preventDefault(e);


            map.locate({
                setView: true,
                maxZoom: 16,
                enableHighAccuracy: true
            });

        }
    );


    return container;

};


locateControl.addTo(map);

