// =====================================================
// MODUL PETA
// INFORMASI SPASIAL BPHL WILAYAH XI
// =====================================================


// =======================
// BASEMAP
// =======================

var map = L.map('map', {
    zoomControl: false
}).setView([-3.3, 114.6], 7);


L.control.zoom({
    position: 'topright'
}).addTo(map);


// =======================
// BASEMAP OSM & SATELIT
// =======================

var osm = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
        attribution: '©OpenStreetMap ©Carto'
    }
);


var satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles © Esri'
    }
);


// DEFAULT TAMPIL OSM

osm.addTo(map);


// =======================
// MODE STYLE OTOMATIS
// =======================


// Mode Transparan (Satelit)

function setTransparentMode() {

    pbphLayer.eachLayer(function(layer) {

        layer.setStyle({
            weight: 1,
            fillOpacity: 0.12,
            opacity: 0.6
        });

    });


    kawasanLayer.eachLayer(function(layer) {

        layer.setStyle({
            weight: 1,
            fillOpacity: 0.12,
            opacity: 0.6
        });

    });

}


// Mode Normal (OSM)

function setNormalMode() {

    pbphLayer.eachLayer(function(layer) {

        layer.setStyle(stylePBPH());

    });


    kawasanLayer.eachLayer(function(layer) {

        layer.setStyle(
            styleKawasan(layer.feature)
        );

    });

}


// =======================
// TOGGLE SATELIT
// =======================

var isSatellite = false;


var satelliteControl = L.control({
    position: 'topright'
});


satelliteControl.onAdd = function(map) {

    var btn = L.DomUtil.create('button');


    btn.innerHTML = "🛰️";

    btn.title = "Toggle Citra Satelit";


    btn.style.background = "white";

    btn.style.width = "38px";

    btn.style.height = "38px";

    btn.style.border = "2px solid #ccc";

    btn.style.borderRadius = "8px";

    btn.style.cursor = "pointer";

    btn.style.fontSize = "18px";

    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";


    btn.onclick = function(e) {

        L.DomEvent.stopPropagation(e);


        if (!isSatellite) {

            map.removeLayer(osm);

            satellite.addTo(map);


            btn.style.background = "#1565c0";

            btn.style.color = "white";


            setTransparentMode();

        } else {

            map.removeLayer(satellite);

            osm.addTo(map);


            btn.style.background = "white";

            btn.style.color = "black";


            setNormalMode();

        }


        isSatellite = !isSatellite;

    };


    return btn;

};


satelliteControl.addTo(map);


// =======================
// FITUR POSISI SAYA
// =======================

var markerLokasi = null;

var circleLokasi = null;


function onLocationFound(e) {

    var radius = e.accuracy;


    if (markerLokasi) {

        map.removeLayer(markerLokasi);

        map.removeLayer(circleLokasi);

    }


    markerLokasi = L.marker(e.latlng)
        .addTo(map)
        .bindPopup(
            "📍 Anda berada di sini<br>Akurasi: " +
            Math.round(radius) +
            " meter"
        )
        .openPopup();


    circleLokasi = L.circle(
        e.latlng,
        radius,
        {
            color: "#136AEC",
            fillColor: "#136AEC",
            fillOpacity: 0.15
        }
    ).addTo(map);


    map.flyTo(e.latlng, 15);

}


function onLocationError(e) {

    alert(
        "Tidak bisa mendeteksi lokasi: " +
        e.message
    );

}


map.on(
    'locationfound',
    onLocationFound
);


map.on(
    'locationerror',
    onLocationError
);


// =======================
// TOMBOL POSISI SAYA
// =======================

var locateControl = L.control({
    position: 'topright'
});


locateControl.onAdd = function(map) {

    var btn = L.DomUtil.create('button');


    btn.innerHTML = "📍";


    btn.style.background = "white";

    btn.style.width = "34px";

    btn.style.height = "34px";

    btn.style.border = "2px solid #ccc";

    btn.style.cursor = "pointer";


    btn.onclick = function() {

        map.locate({
            setView: true,
            maxZoom: 16
        });

    };


    return btn;

};


locateControl.addTo(map);


// =======================
// LAYER TERPILIH
// =======================

var selectedLayer = null;
