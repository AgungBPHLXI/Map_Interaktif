// =======================
// DATA HOTSPOT GLOBAL
// =======================

var hotspotSipongiData = null;

// =======================
// LOAD DATA LUAS KABUPATEN
// =======================

var dataLuasKab = {};

fetch(DATA_CONFIG.luasKabupaten)
.then(res => res.json())
.then(data => {

    dataLuasKab = data;

    console.log("Data luas kabupaten berhasil dimuat");

})
.catch(err => {

    console.error("Gagal memuat data luas kabupaten:", err);

});


let chartSemuaInstance = null;


// =======================
// DIAGRAM SEMUA
// =======================

function tampilkanDiagramSemua(){

    document.getElementById("chartSemua").style.display = "block";

    document.getElementById("chartKawasan").style.display = "none";


    let totalHL = 0;
    let totalHP = 0;
    let totalHPK = 0;
    let totalHPT = 0;
    let totalHK = 0;


    for(let kab in dataLuasKab){

        totalHL += Number(dataLuasKab[kab].HL) || 0;

        totalHP += Number(dataLuasKab[kab].HP) || 0;

        totalHPK += Number(dataLuasKab[kab].HPK) || 0;

        totalHPT += Number(dataLuasKab[kab].HPT) || 0;

        totalHK += Number(dataLuasKab[kab].HK) || 0;

    }


    // Hancurkan chart lama

    if(chartSemuaInstance){

        chartSemuaInstance.destroy();

    }


    chartSemuaInstance = new Chart(

        document.getElementById("chartSemua"),

        {

            type: "bar",

            data: {

                labels: [

                    "HL",
                    "HP",
                    "HPK",
                    "HPT",
                    "HK"

                ],

                datasets: [

                    {

                        label: "Total Luas (Ha)",

                        data: [

                            totalHL,
                            totalHP,
                            totalHPK,
                            totalHPT,
                            totalHK

                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        display: false

                    }

                }

            }

        }

    );

}


// =====================================================
// MAP
// =====================================================
//
// MAP SUDAH DIBUAT DI:
// assets/js/map.js
//
// JANGAN BUAT:
// var map = L.map(...)
// DI FILE app.js
//
// =====================================================


// =======================
// LAYER TERPILIH
// =======================

var selectedLayer = null;


// =====================================================
// HOTSPOT SIPONGI - KALIMANTAN SELATAN
// =====================================================


// =====================================================
// LAYER HOTSPOT
// =====================================================

// Layer utama
var hotspotSipongiLayer = L.layerGroup();

// Layer berdasarkan confidence
var hotspotHighLayer = L.layerGroup();

var hotspotMediumLayer = L.layerGroup();

var hotspotLowLayer = L.layerGroup();


// Masukkan layer confidence ke layer utama
hotspotSipongiLayer.addLayer(
    hotspotHighLayer
);

hotspotSipongiLayer.addLayer(
    hotspotMediumLayer
);

hotspotSipongiLayer.addLayer(
    hotspotLowLayer
);


// Status data hotspot
var hotspotSipongiLoaded = false;

// Simpan data hotspot dari SiPongi
var hotspotSipongiData = null;


// ==================================================
// TANGGAL HARI INI
// ==================================================

const hariIni = new Date().toLocaleDateString(
    "en-CA",
    {
        timeZone: "Asia/Makassar"
    }
);


// ==================================================
// URL API SIPONGI
// ==================================================

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
// LOAD HOTSPOT SIPONGI
// =====================================================

function loadHotspotSipongi() {

    console.log(
        "Hotspot Karhutla Kalsel diklik"
    );


    // ==========================================
    // JIKA HOTSPOT SUDAH TAMPIL
    // SEMBUNYIKAN
    // ==========================================

   if (
    map.hasLayer(
        hotspotSipongiLayer
    )
) {

    // Sembunyikan hotspot
    map.removeLayer(
        hotspotSipongiLayer
    );


    // Sembunyikan panel rekap
    const panelRekap =
        document.getElementById(
            "hotspotRekap"
        );

    if (
        panelRekap
    ) {

        panelRekap.style.display =
            "none";

    }


    console.log(
        "Hotspot dan rekap disembunyikan"
    );

    return;

}


    // ==========================================
    // JIKA DATA SUDAH PERNAH DIMUAT
    // TAMPILKAN KEMBALI
    // ==========================================

   if (
    hotspotSipongiLoaded
) {

    // Tampilkan kembali hotspot
    hotspotSipongiLayer.addTo(map);


    // Terapkan filter terakhir
    updateHotspotFilter();


    // Tampilkan kembali panel rekap
    const panelRekap =
        document.getElementById(
            "hotspotRekap"
        );

    if (
        panelRekap
    ) {

        panelRekap.style.display =
            "block";

    }


    console.log(
        "Hotspot dan rekap ditampilkan kembali"
    );

    return;

}


    // ==========================================
    // TAMPILKAN LAYER UTAMA
    // ==========================================

    hotspotSipongiLayer.addTo(map);


    console.log(
        "Memuat Hotspot SiPongi Kalimantan Selatan..."
    );


    // Bersihkan data lama
    hotspotHighLayer.clearLayers();

    hotspotMediumLayer.clearLayers();

    hotspotLowLayer.clearLayers();


    // ==========================================
    // AMBIL DATA API
    // ==========================================

    fetch(
        SIPONGI_HOTSPOT_URL
    )

        .then(response => {

            if (
                !response.ok
            ) {

                throw new Error(
                    "HTTP Error: " +
                    response.status
                );

            }


            return response.json();

        })


        .then(data => {

    console.log("Data Hotspot SiPongi:", data);


    // ==========================================
    // VALIDASI DATA
    // ==========================================

    if (
        !data ||
        !Array.isArray(data.features)
    ) {

        throw new Error(
            "Format data hotspot tidak sesuai"
        );

    }


    // Simpan data hotspot secara global
    hotspotSipongiData = data;



            // ==========================================
            // PROSES SETIAP HOTSPOT
            // ==========================================

            data.features.forEach(
                function(feature) {


                    const p =
                        feature.properties || {};


                    // Pastikan geometry point
                    if (
                        !feature.geometry ||
                        feature.geometry.type !== "Point"
                    ) {

                        return;

                    }


                    const coordinates =
                        feature.geometry.coordinates;


                    // GeoJSON:
                    // [longitude, latitude]

                    const longitude =
                        coordinates[0];

                    const latitude =
                        coordinates[1];


                    const confidence =
                        String(
                            p.confidence_level || ""
                        )
                        .toLowerCase();


                    let warna =
                        "#fbc02d";


                    // ======================================
                    // WARNA HOTSPOT
                    // ======================================

                    // LOW = HIJAU
                    if (
                        confidence === "low"
                    ) {

                        warna =
                            "#43a047";

                    }


                    // MEDIUM = KUNING
                    else if (
                        confidence === "medium"
                    ) {

                        warna =
                            "#fbc02d";

                    }


                    // HIGH = MERAH
                    else if (
                        confidence === "high"
                    ) {

                        warna =
                            "#e53935";

                    }


                    // ======================================
// BUAT MARKER HOTSPOT
// ======================================

// Ambil zoom peta saat ini
const zoomSekarang = map.getZoom();

// Tentukan ukuran marker berdasarkan zoom
let ukuranMarker = 5;

// Jika zoom sangat jauh
if (zoomSekarang <= 7) {

    ukuranMarker = 2;

}

// Jika zoom sedang
else if (zoomSekarang <= 9) {

    ukuranMarker = 3;

}

// Jika zoom agak dekat
else if (zoomSekarang <= 11) {

    ukuranMarker = 4;

}

// Jika zoom dekat
else {

    ukuranMarker = 5;

}


// Buat marker
const marker =
    L.circleMarker(
        [
            latitude,
            longitude
        ],
        {

            radius: ukuranMarker,

            color: warna,

            weight: 1,

            fillColor: warna,

            fillOpacity: 0.85

        }
    );


// Simpan ukuran marker
marker.options.ukuranAwal = 5;
// ======================================
// POPUP
// ======================================

// Ambil data tanggal asli
const dateHotspotRaw =
    p.date_hotspot || "-";

// Variabel tanggal dan waktu
let tanggalHotspot = "-";
let waktuHotspot = "-";


// ======================================
// PISAHKAN TANGGAL DAN WAKTU
// ======================================

if (dateHotspotRaw !== "-") {

    const dataTanggal =
        String(dateHotspotRaw).trim();

    // Ambil waktu HH:MM:SS
    const hasilWaktu =
        dataTanggal.match(
            /(\d{2}:\d{2}:\d{2})/
        );

    if (hasilWaktu) {

        waktuHotspot =
            hasilWaktu[1];

    }


    // Hapus waktu dari tanggal
    tanggalHotspot =
        dataTanggal
            .replace(
                /\s*\d{2}:\d{2}:\d{2}.*/,
                ""
            )
            .trim();

}


// ======================================
// HTML POPUP
// ======================================

const html = `

    <div style="
        min-width:220px;
        font-size:13px;
        line-height:1.6;
    ">

        <div style="
            font-weight:bold;
            font-size:15px;
            margin-bottom:8px;
            color:#d32f2f;
        ">

            🔥 HOTSPOT SIPONGI

        </div>


        <b>Provinsi:</b>
        ${p.nama_provinsi || "-"}
        <br>

        <b>Kabupaten:</b>
        ${p.kabkota || "-"}
        <br>

        <b>Kecamatan:</b>
        ${p.kecamatan || "-"}
        <br>

        <b>Desa:</b>
        ${p.desa || "-"}
        <br>

        <hr>


        <b>Sumber:</b>
        ${p.sumber || "-"}
        <br>

        <b>Confidence:</b>
        ${p.confidence_level || "-"}
        <br>

        <b>Nilai Confidence:</b>
        ${p.confidence || "-"}
        <br>

        <b>Tanggal:</b>
        ${tanggalHotspot}
        <br>

        <b>Waktu:</b>
        ${waktuHotspot}
        <br>

        <hr>


        <b>Latitude:</b>
        ${latitude}
        <br>

        <b>Longitude:</b>
        ${longitude}

    </div>

`;


marker.bindPopup(
    html
);
                    // ======================================
                    // TOOLTIP
                    // ======================================

                    marker.bindTooltip(

                        `
                        🔥 ${p.kabkota || "Hotspot"}
                        <br>
                        Confidence:
                        ${p.confidence_level || "-"}
                        `,

                        {

                            direction: "top",

                            offset: [0, -8],

                            sticky: true

                        }

                    );


                    // ======================================
                    // MASUKKAN KE LAYER SESUAI CONFIDENCE
                    // ======================================

                    if (
                        confidence === "high"
                    ) {

                        hotspotHighLayer.addLayer(
                            marker
                        );

                    }


                    else if (
                        confidence === "medium"
                    ) {

                        hotspotMediumLayer.addLayer(
                            marker
                        );

                    }


                    else {

                        hotspotLowLayer.addLayer(
                            marker
                        );

                    }

                }
            );


            // ==========================================
            // DATA BERHASIL DIMUAT
            // ==========================================

          hotspotSipongiLoaded = true;

// Terapkan filter checkbox
updateHotspotFilter();

// Cek apakah PBPH dan Kawasan Hutan
// sudah selesai dimuat
cekDanHitungRekapHotspot();


            console.log(
                "================================"
            );

            console.log(
                "HOTSPOT SIPONGI BERHASIL DIMUAT"
            );

            console.log(
                "Total:",
                data.features.length
            );

            console.log(
                "================================"
            );

        })


        .catch(error => {

            console.error(
                "Gagal memuat Hotspot SiPongi:",
                error
            );


            map.removeLayer(
                hotspotSipongiLayer
            );


            alert(
                "Gagal memuat data Hotspot SiPongi."
            );

        });

}
// =====================================================
// UKURAN MARKER SESUAI ZOOM PETA
// =====================================================

function updateUkuranMarkerHotspot() {

    // Ambil zoom peta
    const zoomSekarang = map.getZoom();

    // Tentukan ukuran marker
    let ukuranMarker;

    // Zoom sangat jauh
    if (zoomSekarang <= 7) {

        ukuranMarker = 2;

    }

    // Zoom sedang
    else if (zoomSekarang <= 9) {

        ukuranMarker = 3;

    }

    // Zoom agak dekat
    else if (zoomSekarang <= 11) {

        ukuranMarker = 4;

    }

    // Zoom dekat
    else {

        ukuranMarker = 5;

    }


    // ======================================
    // UBAH MARKER HIGH
    // ======================================

    hotspotHighLayer.eachLayer(
        function(marker) {

            marker.setRadius(
                ukuranMarker
            );

        }
    );


    // ======================================
    // UBAH MARKER MEDIUM
    // ======================================

    hotspotMediumLayer.eachLayer(
        function(marker) {

            marker.setRadius(
                ukuranMarker
            );

        }
    );


    // ======================================
    // UBAH MARKER LOW
    // ======================================

    hotspotLowLayer.eachLayer(
        function(marker) {

            marker.setRadius(
                ukuranMarker
            );

        }
    );

}
// =====================================================
// JALANKAN SAAT ZOOM BERUBAH
// =====================================================

map.on(
    "zoomend",
    function() {

        updateUkuranMarkerHotspot();

    }
);

// =====================================================
// FILTER HOTSPOT HIGH / MEDIUM / LOW
// =====================================================

function updateHotspotFilter() {


    // Jika data belum dimuat
    if (
        !hotspotSipongiLoaded
    ) {

        return;

    }


    // Ambil status checkbox

    const showHigh =
        document.getElementById(
            "filterHotspotHigh"
        ).checked;


    const showMedium =
        document.getElementById(
            "filterHotspotMedium"
        ).checked;


    const showLow =
        document.getElementById(
            "filterHotspotLow"
        ).checked;


    // ==========================================
    // FILTER HIGH
    // ==========================================

    if (showHigh) {

        if (
            !hotspotSipongiLayer.hasLayer(
                hotspotHighLayer
            )
        ) {

            hotspotSipongiLayer.addLayer(
                hotspotHighLayer
            );

        }

    }

    else {

        hotspotSipongiLayer.removeLayer(
            hotspotHighLayer
        );

    }


    // ==========================================
    // FILTER MEDIUM
    // ==========================================

    if (showMedium) {

        if (
            !hotspotSipongiLayer.hasLayer(
                hotspotMediumLayer
            )
        ) {

            hotspotSipongiLayer.addLayer(
                hotspotMediumLayer
            );

        }

    }

    else {

        hotspotSipongiLayer.removeLayer(
            hotspotMediumLayer
        );

    }


    // ==========================================
    // FILTER LOW
    // ==========================================

    if (showLow) {

        if (
            !hotspotSipongiLayer.hasLayer(
                hotspotLowLayer
            )
        ) {

            hotspotSipongiLayer.addLayer(
                hotspotLowLayer
            );

        }

    }

    else {

        hotspotSipongiLayer.removeLayer(
            hotspotLowLayer
        );

    }


    console.log(
        "Filter Hotspot:",
        {
            high: showHigh,
            medium: showMedium,
            low: showLow
        }
    );

}
// =======================
// LAYER UPLOAD SHP
// =======================

var uploadLayer = L.geoJSON(

    null,

    {

        style: {

            color: "#00FFD5",

            weight: 4,

            fillOpacity: 0

        },


        pointToLayer: function(feature, latlng){

            return L.circleMarker(

                latlng,

                {

                    radius: 6,

                    color: "#ff0000",

                    fillColor: "#ff5555",

                    fillOpacity: 0.8

                }

            );

        },


        onEachFeature: function(feature, layer){

            let props = feature.properties || {};

            let html = "<b>INFORMASI SHP</b><br><br>";


            for(let key in props){

                html +=

                    "<b>" +

                    key +

                    "</b> : " +

                    props[key] +

                    "<br>";

            }


            layer.bindPopup(html);


            layer.on(

                "click",

                function(){

                    highlightFeature(layer);

                }

            );

        }

    }

).addTo(map);

// =======================
// STYLE
// =======================

function stylePBPH(){
    return {
        color:"#ff6600",
        weight:5,
        fillOpacity:0
    };
}
function styleKawasan(feature){

    var kategori = feature.properties?.F2025;

    // =========================
    // STYLE KHUSUS PAPH
    // =========================
    if(kategori === "PAPH"){

        return {
            color:"#ff0000",
            weight:2,
            opacity:1,
            fillColor:"#ff0000",
            fillOpacity:0.15
        };

    }

   // =========================
// STYLE SISTEM LAHAN
// =========================

if(kategori === "SISTEM LAHAN"){

    let morfogen = feature.properties?.MORFOGEN;

    let warnaMorfogen = {

        "Denudasional":"#7B3F00",
        "Fluvial":"#39FF14",
        "Marin":"#00BFFF",
        "Solusional":"#FFA500",
        "Struktural":"#8000FF"
    };

    return {
        color:"#555",
        weight:1,
        fillColor:warnaMorfogen[morfogen] || "#cccccc",
        fillOpacity:0.35,
        opacity:1
    };
}

    // =========================
    // STYLE KAWASAN HUTAN
    // =========================
    var warna = {
        "HL":"#02AD00",
        "HP":"#FFFF00",
        "HPT":"#8AF200",
        "HPK":"#FF5EFF",
        "HK":"#AD3FFF"
    };

    return {
        color:"#2e7d32",
        weight:1,
        fillColor:warna[kategori] || "#999",
        fillOpacity:0.6
    };
}

// =======================
// HIGHLIGHT
// =======================

function highlightFeature(layer){

    if(selectedLayer){
        selectedLayer.setStyle(selectedLayer.originalStyle);
    }

    layer.originalStyle = {...layer.options};

    layer.setStyle({
        weight:7,
        color:"#000000"
    });

    selectedLayer = layer;

   if(layer.getBounds){
    map.flyToBounds(layer.getBounds(),{
        padding:[40,40],
        duration:0.8
    });
}else if(layer.getLatLng){
    map.flyTo(layer.getLatLng(), 12);
}
}
// =======================
// PBPH LAYER
// =======================

var pbphLayer = L.geoJSON(null,{
    style:stylePBPH,

    onEachFeature:function(feature,layer){

       var props = feature.properties;

       var luas = props?.LUAS
            ? Number(props.LUAS).toLocaleString()
            : "0";

       var tglSK = "-";

       if(props?.TGL_SK){
            var date = new Date(Number(props.TGL_SK));
            tglSK = date.toLocaleDateString("id-ID");
       }

       layer.bindPopup(
            "<b>"+(props?.NAMOBJ || "-")+"</b><br><br>" +
            "NO SK : " + (props?.NO_SK || "-") + "<br>" +
            "TGL SK : " + tglSK + "<br>" +
            "JENIS : " + (props?.JENIS || "-") + "<br>" +
            "STATUS IZIN : " + (props?.STAT_IZIN || "-") + "<br>" +
            "LUAS : " + luas + " Ha"
       );

       layer.on("click",function(){
            highlightFeature(layer);
       });
    }
});
fetch("pbph.geojson")
.then(res => res.json())
.then(data => {

    pbphLayer.addData(data);

    pbphLayer.bringToFront();

    loadNamaOptions();


    // PBPH sudah selesai dimuat
    pbphLoaded = true;


    // Cek apakah semua data sudah siap
    cekDanHitungRekapHotspot();

});

// =======================
// KAWASAN LAYER
// =======================

var kawasanLayer = L.geoJSON(null, {

    style: styleKawasan,

    onEachFeature: function(feature, layer){

        // =====================
        // POPUP KHUSUS PAPH
        // =====================

        if(feature.properties?.F2025 === "PAPH"){

            let luas = feature.properties?.LUAS
                ? parseFloat(
                    feature.properties.LUAS
                        .toString()
                        .replace(",", ".")
                  ).toLocaleString("id-ID",{
                        minimumFractionDigits:2,
                        maximumFractionDigits:2
                  })
                : "0";

            let isiPopup =
                "<b>LUAS PAPH</b><br>" +
                luas + " Ha";

            layer.bindPopup(isiPopup);

            layer.on("click", function(){

                highlightFeature(layer);

                layer.openPopup();

            });

        }

        // =====================
        // KLIK NORMAL
        // =====================

        else {

            layer.on("click", function(e){

                highlightFeature(layer);

                // popup khusus sistem lahan
                if(feature.properties?.F2025 === "SISTEM LAHAN"){

                    let kode = feature.properties?.m_symlfac || "-";

                    layer.bindPopup(
                        "<b>KODE SISTEM LAHAN</b><br>" + kode
                    ).openPopup();

                }

            });

        }

    }

});

// =======================
// LOAD KAWASAN HUTAN
// =======================

fetch("Kawasanhutan.geojson")
.then(res=>res.json())
.then(data=>{

    kawasanLayer.addData(data);

    return fetch("Konservasi.geojson");

})

.then(res=>res.json())
.then(dataHK=>{

    dataHK.features.forEach(function(f){

        f.properties.F2025 = "HK";

    });

    kawasanLayer.addData(dataHK);

    // =====================
    // LOAD PAPH
    // =====================

    return fetch("PAPH.geojson");

})

.then(res=>res.json())
.then(dataPAPH=>{

    dataPAPH.features.forEach(function(f){

        f.properties.F2025 = "PAPH";

    });

    kawasanLayer.addData(dataPAPH);

    // =====================
    // LOAD SISTEM LAHAN
    // =====================

    return fetch("SISTEM LAHAN.geojson");

})

.then(res=>res.json())
.then(dataSL=>{

    dataSL.features.forEach(function(f){

        f.properties.F2025 = "SISTEM LAHAN";

    });

 // sederhanakan geometri jika ada
dataSL.features = dataSL.features.filter(f => f.geometry);

kawasanLayer.addData(dataSL);

    // reload filter
    loadKategoriOptions();

    // Tandai seluruh layer kawasan sudah selesai dimuat
kawasanLoaded = true;

// Cek apakah semua data sudah siap untuk rekap
cekDanHitungRekapHotspot();

})

.catch(err=>{

    console.log("ERROR LOAD KAWASAN:", err);

});
// =======================
// INDUSTRI 6000 UP LAYER
// =======================

var industriLayer = L.geoJSON(null,{
    pointToLayer: function(feature, latlng){
        return L.circleMarker(latlng, {
            radius: 6,
            color: "#800000",
            fillColor: "#cc0000",
            fillOpacity: 0.9
        });
    },
    onEachFeature:function(feature,layer){

        var nama = feature.properties?.name;
        
layer.bindPopup("<b>" + nama + "</b>");
       layer.bindTooltip(nama, {
permanent: false,
sticky:true,
    direction: "top",
    offset: [0, -8]
});

        layer.on("click",function(){
            highlightFeature(layer);
        });
    }
});

fetch("PBPHH_6000_KE_ATAS.geojson")
.then(res=>res.json())
.then(data=>{
    industriLayer.addData(data);
    loadIndustriOptions();
});
// =======================
// TOOLTIP ZOOM CONTROL
// =======================
map.on("zoomend", function() {

    if(map.getZoom() < 13){

        industriLayer.eachLayer(function(layer){
            layer.closeTooltip();
        });

        return;
    }

    industriLayer.eachLayer(function(layer){
        layer.openTooltip();
    });

});
// =======================
// KABUPATEN LAYER
// =======================

var kabupatenLayer = L.geoJSON(null,{

    interactive:false,

    style:{
        color:"#005eff",
        weight:2,
        fillOpacity:0
    },
    onEachFeature:function(feature,layer){

        let namaKab = feature.properties?.KABUPATEN;

        layer.on("click",function(){

            highlightFeature(layer);

            if(dataLuasKab[namaKab]){

                let d = dataLuasKab[namaKab];

                layer.bindPopup(
                    "<b>"+namaKab+"</b><br><br>" +
                    "HL : " + d.HL.toLocaleString() + " Ha<br>" +
                    "HP : " + d.HP.toLocaleString() + " Ha<br>" +
                    "HPK : " + d.HPK.toLocaleString() + " Ha<br>" +
                    "HPT : " + d.HPT.toLocaleString() + " Ha<br>" +
                    "HK : " + d.HK.toLocaleString() + " Ha"
                ).openPopup();
            }
        });
    }
}).addTo(map);

fetch("Kabupaten.geojson")
.then(res=>res.json())
.then(data=>{
    kabupatenLayer.addData(data);
    loadKabupatenOptions();

    map.fitBounds(kabupatenLayer.getBounds());
});
// =======================
// AKTIFKAN SELECT2
// =======================

$('#filterF2025').select2({
    placeholder:"Pilih Kategori"
});

$('#filterNama').select2({
    placeholder:"Pilih Nama PBPH"
});

$('#filterIndustri').select2({
    placeholder:"Pilih Industri 6000 UP"
});
    
$('#filterKabupaten').select2({
    placeholder:"Pilih Kabupaten"
});
// =======================
// LOAD OPTION DINAMIS
// =======================

function loadKategoriOptions(){

    let set = new Set();

    $('#filterF2025').empty();

    $('#filterF2025').append(`<option value="ALL">Semua</option>`);

    kawasanLayer.eachLayer(function(layer){

        let kategori = layer.feature.properties?.F2025;
    
        if(kategori){
            set.add(kategori);
        }

    });

    set.forEach(val=>{
        $('#filterF2025').append(`<option value="${val}">${val}</option>`);
    });
}
function loadNamaOptions(){
    let set = new Set();

    $('#filterNama').empty(); // TAMBAHAN

    $('#filterNama').append(`<option value="ALL">Semua</option>`);

    pbphLayer.eachLayer(function(layer){
        if(layer.feature.properties?.NAMOBJ){
            set.add(layer.feature.properties.NAMOBJ);
        }
    });

    set.forEach(val=>{
        $('#filterNama').append(`<option value="${val}">${val}</option>`);
    });
}
function loadKabupatenOptions(){

    let set = new Set();

    $('#filterKabupaten').empty();
    $('#filterKabupaten').append(`<option value="ALL">Semua</option>`);

    kabupatenLayer.eachLayer(function(layer){

        let nama = layer.feature.properties?.KABUPATEN;

        if(nama){
            set.add(nama);
        }
    });

    set.forEach(val=>{
        $('#filterKabupaten').append(`<option value="${val}">${val}</option>`);
    });
}
function loadIndustriOptions(){

    let set = new Set();

    $('#filterIndustri').empty();
    $('#filterIndustri').append(`<option value="ALL">Semua</option>`);

    industriLayer.eachLayer(function(layer){

        let nama = layer.feature.properties?.name;

        if(nama){
            set.add(nama);
        }
    });

    set.forEach(val=>{
        $('#filterIndustri').append(`<option value="${val}">${val}</option>`);
    });
}
   function setLayerInteractivity(){

    // NONAKTIFKAN SEMUA DULU
    kabupatenLayer.eachLayer(l=>{
        l.options.interactive = false;
    });

    kawasanLayer.eachLayer(l=>{
        l.options.interactive = false;
    });

    pbphLayer.eachLayer(l=>{
        l.options.interactive = false;
    });

    industriLayer.eachLayer(l=>{
        l.options.interactive = false;
    });

    // AKTIFKAN SESUAI FILTER

    let selectedKategori = $('#filterF2025').val() || [];
    let selectedNama = $('#filterNama').val() || [];
    let selectedKabupaten = $('#filterKabupaten').val() || [];
    let selectedIndustri = $('#filterIndustri').val() || [];

    // PRIORITAS 1 = PBPH
    if(selectedNama.length > 0){

        pbphLayer.eachLayer(l=>{
            l.options.interactive = true;
        });

        pbphLayer.bringToFront();

        return;
    }

    // PRIORITAS 2 = INDUSTRI
    if(selectedIndustri.length > 0){

        industriLayer.eachLayer(l=>{
            l.options.interactive = true;
        });

        industriLayer.bringToFront();

        return;
    }

    // PRIORITAS 3 = KAWASAN
    if(selectedKategori.length > 0){

        kawasanLayer.eachLayer(l=>{
            l.options.interactive = true;
        });

        kawasanLayer.bringToFront();

        return;
    }

    // PRIORITAS 4 = KABUPATEN
    kabupatenLayer.eachLayer(l=>{
        l.options.interactive = true;
    });

    kabupatenLayer.bringToFront();

} 
// =======================
// FILTER FUNCTION FINAL
// =======================
   
function applyFilter(){

    map.closePopup();

    var selectedKategori = $('#filterF2025').val() || [];

    var selectedNama = $('#filterNama').val() || [];

    var selectedKabupaten = $('#filterKabupaten').val() || [];

    var selectedIndustri = $('#filterIndustri').val() || [];

    // =====================
    // PANEL PPT
    // =====================

    if(selectedKategori.includes("SISTEM LAHAN")){

        document.getElementById("pptInfo").style.display = "block";

    }else{

        document.getElementById("pptInfo").style.display = "none";

    }

    // =====================
    // RESET SEMUA LAYER
    // =====================

    kawasanLayer.eachLayer(function(layer){
        map.removeLayer(layer);
    });

    pbphLayer.eachLayer(function(layer){
        map.removeLayer(layer);
    });

    industriLayer.eachLayer(function(layer){
        map.removeLayer(layer);
    });

    kabupatenLayer.eachLayer(function(layer){
        map.removeLayer(layer);
    });

    var bounds = L.latLngBounds([]);

    // =====================
    // FILTER KAWASAN
    // =====================

    kawasanLayer.eachLayer(function(layer){

        var props = layer.feature.properties || {};
        var kategori = props.F2025 || "";
        var tampil = false;

        // tampil semua
if(selectedKategori.includes("ALL")){

    tampil = true;

}

// jika belum pilih filter
else if(selectedKategori.length === 0){

    tampil = false;

}

// tampil kategori tertentu
else if(selectedKategori.includes(kategori)){

    tampil = true;

}
        if(tampil){

            layer.addTo(map);

            layer.setStyle(styleKawasan(layer.feature));

            // LABEL SISTEM LAHAN
           layer.unbindTooltip();

            if(layer.getBounds){
                bounds.extend(layer.getBounds());
            }

        }

    });

  // =====================
// FILTER PBPH
// =====================

pbphLayer.eachLayer(function(layer){

    var nama = layer.feature.properties?.NAMOBJ || "";

    // HAPUS DULU SEMUA
    map.removeLayer(layer);

    // tampil semua jika filter kosong
    if(selectedNama.length === 0){

        return;

    }

    // tampil semua PBPH
    if(selectedNama.includes("ALL")){

        layer.addTo(map);

        if(layer.getBounds){
            bounds.extend(layer.getBounds());
        }

    }

    // tampil PBPH tertentu
    else if(selectedNama.includes(nama)){

        layer.addTo(map);

        if(layer.getBounds){
            bounds.extend(layer.getBounds());
        }

    }

});

    // =====================
    // FILTER INDUSTRI
    // =====================

    industriLayer.eachLayer(function(layer){

        var nama = layer.feature.properties?.name || "";

        var tampil = false;

       if(selectedIndustri.includes("ALL")){

    tampil = true;

}

else if(selectedIndustri.length === 0){

    tampil = false;

}

else if(selectedIndustri.includes(nama)){

    tampil = true;

}
        if(tampil){

            layer.addTo(map);

            if(layer.getLatLng){
                bounds.extend(layer.getLatLng());
            }

        }

    });
    
// =====================
// FILTER KABUPATEN
// =====================

kabupatenLayer.eachLayer(function(layer){

    var namaKab = layer.feature.properties?.KABUPATEN || "";

    // HAPUS DULU
    map.removeLayer(layer);

    // jika kosong -> jangan tampil
   if(selectedKabupaten.length === 0){

    layer.addTo(map);

    if(layer.getBounds){
        bounds.extend(layer.getBounds());
    }

    return;
}

    // tampil semua kabupaten
    if(selectedKabupaten.includes("ALL")){

        layer.addTo(map);

        if(layer.getBounds){
            bounds.extend(layer.getBounds());
        }

    }

    // tampil kabupaten tertentu
    else if(selectedKabupaten.includes(namaKab)){

        layer.addTo(map);

        if(layer.getBounds){
            bounds.extend(layer.getBounds());
        }

    }

});

    // =====================
    // AUTO ZOOM
    // =====================
    if(selectedKabupaten.includes("ALL")){
    tampilkanDiagramSemua();
}
  if(bounds.isValid()){

    map.flyToBounds(bounds,{
        padding:[40,40],
        duration:0.3
    });

}

// AKTIFKAN PRIORITAS KLIK
setLayerInteractivity();

}

// =======================
// EVENT FILTER
// =======================

$('#filterF2025').on('change', applyFilter);
$('#filterNama').on('change', applyFilter);
$('#filterKabupaten').on('change', applyFilter);
$('#filterIndustri').on('change', applyFilter);

// =======================
// MENU DASHBOARD DINAMIS
// =======================

let chartInstance = null;

function parseAngka(value){
    if(!value) return 0;
    return parseFloat(
        value.toString()
             .replace(/\./g,'')
             .replace(',', '.')
    ) || 0;
}

// =======================
// LOAD PENANAMAN (DINAMIS TAHUN)
// =======================
function loadPenanaman(){

    document.getElementById("chartOverlay").style.display = "block";

    document.getElementById("chartSemua").style.display = "none";

    document.getElementById("chartKawasan").style.display = "block";
    // Hapus header lama
    let oldTotal = document.getElementById("totalBox");
    if(oldTotal) oldTotal.remove();

    if(chartInstance){
        chartInstance.destroy();
    }

    const spreadsheetId = CONFIG.spreadsheetPenanaman;
    const sheetName = "Penanaman";

    fetch(`${API_CONFIG.baseURL}/${spreadsheetId}/${sheetName}`)
    .then(res => res.json())
    .then(data => {

        if(!Array.isArray(data) || data.length === 0){
            alert("Data tidak terbaca.");
            return;
        }

// Ambil periode dari C2
const periode = data[0]["Periode"] || "";

// Filter baris kosong
data = data.filter(row => row["Nama PBPH"] && row["Nama PBPH"] !== "");

document.getElementById("chartOverlay").insertAdjacentHTML(
    "afterbegin",
    `<div id="totalBox" 
        style="background:linear-gradient(90deg,#1565c0,#0d47a1);
               color:white;
               padding:10px;
               border-radius:8px;
               margin-bottom:10px;
               font-weight:bold;
               font-size:15px;
               text-align:center">
        🌱 PENANAMAN PBPH PERIODE ${periode}
    </div>`
);

        const labels = data.map(r => r["Nama PBPH"]);
        const rencana = data.map(r => parseAngka(r["Rencana"]));
        const realisasi = data.map(r => parseAngka(r["Realisasi"]));

        let totalRencana = rencana.reduce((a,b)=>a+b,0);
        let totalRealisasi = realisasi.reduce((a,b)=>a+b,0);

        labels.push("TOTAL");
        rencana.push(totalRencana);
        realisasi.push(totalRealisasi);

        chartInstance = new Chart(
            document.getElementById("chartKawasan"),
            {
                type:'bar',
                data:{
                    labels: labels,
                    datasets:[
                        {label:'Rencana (Ha)', data:rencana},
                        {label:'Realisasi (Ha)', data:realisasi}
                    ]
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{
                        legend:{ position:'top' },
                    },
                    scales:{
                        x:{
                            ticks:{
                                maxRotation:45,
                                minRotation:45,
                                autoSkip:false
                            }
                        },
                        y:{
                            beginAtZero:true
                        }
                    }
                },
                
            }
        );

    })
    .catch(err=>{
        console.log("Error ambil data:", err);
    });
}


// =======================
// LOAD KAWASAN
// =======================
function loadKawasan(){

    document.getElementById("chartSemua").style.display = "none";
    document.getElementById("chartKawasan").style.display = "block";

    document.getElementById("chartOverlay").style.display = "block";

    // Hapus header lama
    let oldTotal = document.getElementById("totalBox");
    if(oldTotal) oldTotal.remove();

    if(chartInstance){
        chartInstance.destroy();
    }

    const spreadsheetId = CONFIG.spreadsheetKawasan;
    const sheetName = "Kawasan";

    fetch(`${API_CONFIG.baseURL}/${spreadsheetId}/${sheetName}`)
    .then(res => res.json())
    .then(data => {

        const filtered = data.filter(row =>
            row["Kabupaten"] &&
            row["Kabupaten"] !== "Total Luas"
        );

        const labels = filtered.map(r => r["Kabupaten"]);

        const HL  = filtered.map(r => parseAngka(r["HL (Ha)"]));
        const HP  = filtered.map(r => parseAngka(r["HP (Ha)"]));
        const HPK = filtered.map(r => parseAngka(r["HPK (Ha)"]));
        const HPT = filtered.map(r => parseAngka(r["HPT (Ha)"]));
        const HK  = filtered.map(r => parseAngka(r["HK (Ha)"]));

        let totalHL  = HL.reduce((a,b)=>a+b,0);
        let totalHP  = HP.reduce((a,b)=>a+b,0);
        let totalHPK = HPK.reduce((a,b)=>a+b,0);
        let totalHPT = HPT.reduce((a,b)=>a+b,0);
        let totalHK  = HK.reduce((a,b)=>a+b,0);

        document.getElementById("chartOverlay").insertAdjacentHTML(
            "afterbegin",
            `<div id="totalBox" 
                style="background:#e8f5e9;
                       padding:10px;
                       border-radius:8px;
                       margin-bottom:10px;
                       font-weight:bold;
                       font-size:13px">
                TOTAL HL: ${totalHL.toLocaleString()} Ha |
                HP: ${totalHP.toLocaleString()} Ha |
                HPK: ${totalHPK.toLocaleString()} Ha |
                HPT: ${totalHPT.toLocaleString()} Ha |
                HK: ${totalHK.toLocaleString()} Ha
            </div>`
        );

        chartInstance = new Chart(
            document.getElementById("chartKawasan"),
            {
                type:'bar',
                data:{
                    labels: labels,
                    datasets:[
                        {label:'HL',  data:HL},
                        {label:'HP',  data:HP},
                        {label:'HPK', data:HPK},
                        {label:'HPT', data:HPT},
                        {label:'HK',  data:HK}
                    ]
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{
                        legend:{ position:'top' }
                    },
                    scales:{
                        x:{ stacked:true },
                        y:{ stacked:true, beginAtZero:true }
                    }
                }
            }
        );

    })
    .catch(err=>{
        console.log("Gagal ambil data:", err);
    });
}
// =======================
// LOAD PRODUKSI KAYU BULAT
// =======================
function loadProduksi() {

    // Tampilkan overlay chart
    document.getElementById("chartOverlay").style.display = "block";

    // Sembunyikan chart sebelumnya
    document.getElementById("chartSemua").style.display = "none";
    document.getElementById("chartKawasan").style.display = "block";

    // Hapus total box lama
    const oldTotal = document.getElementById("totalBox");
    if (oldTotal) {
        oldTotal.remove();
    }

    // Hapus chart lama
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // =======================
    // KONFIGURASI SPREADSHEET
    // =======================
    const spreadsheetId = CONFIG.spreadsheetProduksi;
    const sheetName = "Produksi Kayu Bulat";

    // Encode nama sheet agar aman
    const url =
        `${API_CONFIG.baseURL}/${spreadsheetId}/${encodeURIComponent(sheetName)}`;

    console.log("URL PRODUKSI:", url);

    // =======================
    // AMBIL DATA
    // =======================
    fetch(url)
        .then(res => {

            if (!res.ok) {
                throw new Error(
                    `Gagal mengambil data. Status: ${res.status}`
                );
            }

            return res.json();
        })

        .then(data => {

            console.log("DATA PRODUKSI:", data);

            // Validasi data
            if (!Array.isArray(data) || data.length === 0) {

                alert("Data Produksi tidak terbaca.");

                document.getElementById("chartOverlay").style.display = "none";

                return;
            }

            // =======================
            // AMBIL PERIODE
            // =======================
            const firstData = data.find(
                row => row["Periode"] && row["Periode"] !== ""
            );

            const periode = firstData
                ? firstData["Periode"]
                : "";

            // =======================
            // DATA GRAFIK
            // =======================
            const labels = data.map(
                r => r["Nama PBPH"] || "-"
            );

            const rencana = data.map(
                r => parseAngka(r["Rencana"])
            );

            const realisasi = data.map(
                r => parseAngka(r["Realisasi"])
            );

            // =======================
            // HITUNG TOTAL
            // =======================
            const totalRencana = rencana.reduce(
                (a, b) => a + b,
                0
            );

            const totalRealisasi = realisasi.reduce(
                (a, b) => a + b,
                0
            );

            // =======================
            // HEADER PRODUKSI
            // =======================
            document
                .getElementById("chartOverlay")
                .insertAdjacentHTML(
                    "afterbegin",
                    `
                    <div id="totalBox"
                        style="
                            background:linear-gradient(
                                90deg,
                                #2e7d32,
                                #1b5e20
                            );
                            color:white;
                            padding:12px 15px;
                            border-radius:8px;
                            margin-bottom:10px;
                        "
                    >

                        <div
                            style="
                                font-weight:bold;
                                font-size:15px;
                                text-align:center;
                                margin-bottom:8px;
                            "
                        >
                            📦 PRODUKSI KAYU BULAT PBPH
                            PERIODE ${periode}
                        </div>

                        <div
                            style="
                                display:flex;
                                justify-content:center;
                                gap:30px;
                                flex-wrap:wrap;
                                font-size:13px;
                                text-align:center;
                            "
                        >

                            <div>
                                <span style="opacity:.8">
                                    TOTAL RENCANA
                                </span>
                                <br>

                                <strong>
                                    ${totalRencana.toLocaleString("id-ID")} m³
                                </strong>
                            </div>

                            <div>
                                <span style="opacity:.8">
                                    TOTAL REALISASI
                                </span>
                                <br>

                                <strong>
                                    ${totalRealisasi.toLocaleString("id-ID")} m³
                                </strong>
                            </div>

                        </div>

                    </div>
                    `
                );

            // =======================
            // TAMBAHKAN TOTAL KE GRAFIK
            // =======================
            labels.push("TOTAL");

            rencana.push(totalRencana);

            realisasi.push(totalRealisasi);

            // =======================
            // BUAT CHART
            // =======================
            chartInstance = new Chart(
                document.getElementById("chartKawasan"),
                {

                    type: "bar",

                    data: {

                        labels: labels,

                        datasets: [

                            // =======================
                            // RENCANA
                            // =======================
                            {
                                label: "Rencana Volume (m³)",

                                data: rencana,

                                backgroundColor: labels.map(
                                    (_, index) =>
                                        index === labels.length - 1
                                            ? "rgba(33, 150, 243, 0.90)"
                                            : "rgba(100, 149, 237, 0.55)"
                                ),

                                borderColor: labels.map(
                                    (_, index) =>
                                        index === labels.length - 1
                                            ? "rgba(25, 118, 210, 1)"
                                            : "rgba(70, 130, 180, 1)"
                                ),

                                borderWidth: 1
                            },

                            // =======================
                            // REALISASI
                            // =======================
                            {
                                label: "Realisasi Volume (m³)",

                                data: realisasi,

                                backgroundColor: labels.map(
                                    (_, index) =>
                                        index === labels.length - 1
                                            ? "rgba(244, 67, 54, 0.90)"
                                            : "rgba(229, 115, 115, 0.55)"
                                ),

                                borderColor: labels.map(
                                    (_, index) =>
                                        index === labels.length - 1
                                            ? "rgba(198, 40, 40, 1)"
                                            : "rgba(198, 40, 40, 0.8)"
                                ),

                                borderWidth: 1
                            }

                        ]
                    },

                    // =======================
                    // PENGATURAN CHART
                    // =======================
                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        plugins: {

                            // =======================
                            // LEGEND
                            // =======================
                            legend: {

                                position: "top",

                                labels: {

                                    font: {
                                        size: 12
                                    }

                                }

                            },

                            // =======================
                            // TOOLTIP
                            // =======================
                            tooltip: {

                                callbacks: {

                                    label: function (context) {

                                        const value =
                                            context.raw || 0;

                                        return (
                                            context.dataset.label +
                                            ": " +
                                            Number(value)
                                                .toLocaleString("id-ID") +
                                            " m³"
                                        );

                                    }

                                }

                            }

                        },

                        scales: {

                            // =======================
                            // SUMBU X
                            // =======================
                            x: {

                                ticks: {

                                    maxRotation: 45,

                                    minRotation: 45,

                                    autoSkip: false,

                                    font: {
                                        size: 11
                                    }

                                }

                            },

                            // =======================
                            // SUMBU Y
                            // =======================
                            y: {

                                beginAtZero: true,

                                ticks: {

                                    callback: function (value) {

                                        return Number(value)
                                            .toLocaleString("id-ID");

                                    }

                                }

                            }

                        }

                    }

                }
            );

        })

        // =======================
        // ERROR HANDLER
        // =======================
        .catch(err => {

            console.error(
                "Gagal ambil data Produksi:",
                err
            );

            alert(
                "Gagal mengambil data Produksi Kayu Bulat."
            );

            document.getElementById("chartOverlay").style.display = "none";

        });

}
// =======================
// TOGGLE MENU SIDEBAR
// =======================

function toggleMenu(element){
    let child = element.nextElementSibling;

    if(child.style.display === "block"){
        child.style.display = "none";
    } else {
        child.style.display = "block";
    }
}
function loadProduksiIndustri(){

    document.getElementById("chartSemua").style.display = "none";
    document.getElementById("chartKawasan").style.display = "block";

    document.getElementById("chartOverlay").style.display = "block";

    let oldTotal = document.getElementById("totalBox");
    if(oldTotal) oldTotal.remove();

    if(chartInstance){
        chartInstance.destroy();
    }

    document.getElementById("chartOverlay").insertAdjacentHTML(
        "afterbegin",
        `<div id="totalBox"
            style="
                background:linear-gradient(90deg,#6a1b9a,#4a148c);
                color:white;
                padding:10px;
                border-radius:8px;
                margin-bottom:10px;
                font-weight:bold;
                font-size:15px;
                text-align:center">
            🏭 PRODUKSI INDUSTRI 6000 UP
        </div>`
    );

    chartInstance = new Chart(
        document.getElementById("chartKawasan"),
        {
            type:'bar',
            data:{
                labels:['Data Belum Tersedia'],
                datasets:[{
                    label:'Produksi',
                    data:[0]
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false
            }
        }
    );

}
function loadSheetData(sheetName){

    const spreadsheetId = CONFIG.spreadsheetIndustri;
    const url = `${API_CONFIG.baseURL}/${spreadsheetId}/${sheetName}`;

    fetch(url)
    .then(res => res.json())
    .then(data => {

        let html = "<table border='1' style='border-collapse:collapse;font-size:12px;width:100%'>";
        
        if(data.length > 0){
            html += "<tr>";
            Object.keys(data[0]).forEach(key=>{
                html += `<th style='padding:4px;background:#eee;'>${key}</th>`;
            });
            html += "</tr>";

            data.forEach(row=>{
                html += "<tr>";
                Object.values(row).forEach(val=>{
                    html += `<td style='padding:4px;'>${val}</td>`;
                });
                html += "</tr>";
            });
        }

        html += "</table>";

        document.getElementById("dashboardContent").innerHTML = html;

    })
    .catch(err=>{
        document.getElementById("dashboardContent").innerHTML =
        "Gagal mengambil data Google Sheet.";
    });
}

document.getElementById("toggleSidebar").onclick = function(){

    if(window.innerWidth <= 768){
        document.getElementById("sidebar").classList.toggle("active");
    } else {
        document.getElementById("sidebar").classList.toggle("collapsed");
    }

};
    console.log("Load Kawasan Clicked");
  // =======================
// DRAG CHART OVERLAY
// =======================

const chartOverlay = document.getElementById("chartOverlay");

let isDragging = false;
let offsetX, offsetY;

chartOverlay.addEventListener("mousedown", function(e){

    if(e.target.tagName === "BUTTON") return;

    isDragging = true;
    offsetX = e.clientX - chartOverlay.offsetLeft;
    offsetY = e.clientY - chartOverlay.offsetTop;

    chartOverlay.style.transform = "none";
});

document.addEventListener("mousemove", function(e){
    if(isDragging){
        chartOverlay.style.left = (e.clientX - offsetX) + "px";
        chartOverlay.style.top = (e.clientY - offsetY) + "px";
    }
});

document.addEventListener("mouseup", function(){
    isDragging = false;
});
// =======================
// CLOSE OVERLAY FINAL FIX
// =======================
document.addEventListener("DOMContentLoaded", function(){

    const btnClose = document.getElementById("btnCloseChart");
    const overlay = document.getElementById("chartOverlay");

    if(btnClose){
        btnClose.addEventListener("click", function(){
    if(chartSemuaInstance){
    chartSemuaInstance.destroy();
    chartSemuaInstance = null;
}


// Hapus grafik Tren Hotspot jika ada
if(grafikTrenHotspot){
    grafikTrenHotspot.destroy();
    grafikTrenHotspot = null;
}


// Tutup overlay
overlay.style.display = "none";

            // Hapus header jika ada
            let oldTotal = document.getElementById("totalBox");
            if(oldTotal) oldTotal.remove();

            // Hancurkan chart supaya bersih
            if(typeof chartInstance !== "undefined" && chartInstance){
                chartInstance.destroy();
                chartInstance = null;
            }

        });
    }

});
// =======================
// CLOSE SIDEBAR MOBILE
// =======================

function closeSidebarMobile() {

    if (window.innerWidth <= 768) {

        const sidebar = document.getElementById("sidebar");

        if (sidebar) {

            sidebar.classList.remove("active");

        }


        // Refresh ukuran Leaflet setelah sidebar tertutup
        setTimeout(function () {

            if (typeof map !== "undefined" && map) {

                map.invalidateSize(true);

            }

        }, 400);

    }

}
// =======================
// ROUTING MODE PROFESIONAL
// =======================

var routingControl = null;
var routingActive = false;
var routingPoints = [];
var routingBtnElement = null;

// Tombol Toggle Routing
var routingButton = L.control({position:'topright'});

routingButton.onAdd = function(map){

    var btn = L.DomUtil.create('button','routing-btn');

    routingBtnElement = btn;

    btn.innerHTML = "🧭";
    btn.title = "Aktifkan Routing";

    btn.onclick = function(e){

        L.DomEvent.stopPropagation(e);

        routingActive = !routingActive;

        btn.classList.toggle("active");

        if(routingActive){
            L.popup()
                .setLatLng(map.getCenter())
                .setContent("Klik titik A lalu titik B")
                .openOn(map);
        } else {
            resetRouting();
        }
    };

    return btn;
};

routingButton.addTo(map);

// Klik Map untuk A → B
map.on('click', function(e){

    if(!routingActive) return;

    routingPoints.push(e.latlng);

    if(routingPoints.length === 2){

        if(routingControl){
            map.removeControl(routingControl);
        }

        routingControl = L.Routing.control({
            waypoints: routingPoints,
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            lineOptions:{
                styles:[{color:'#1565c0', weight:5}]
            }
        }).addTo(map);

        routingControl.on('routesfound', function(e){

            var route = e.routes[0];
            var distance = (route.summary.totalDistance / 1000).toFixed(2);
            var lastCoord = route.coordinates[route.coordinates.length - 1];

            L.popup()
                .setLatLng([lastCoord.lat, lastCoord.lng])
                .setContent("📏 Jarak: <b>" + distance + " km</b>")
                .openOn(map);
        });

        routingPoints = []; // reset agar bisa klik lagi
    }
});

// =======================
// RESET ROUTING FUNCTION
// =======================

function resetRouting(){

    if(routingControl){
        map.removeControl(routingControl);
        routingControl = null;
    }

    routingPoints = [];
    routingActive = false;

    if(routingBtnElement){
        routingBtnElement.classList.remove("active");
    }

    map.closePopup();
}
    map.on("click", function(e){

    if(routingActive) return;

    if(!e.originalEvent.target.closest(".leaflet-interactive")){

        if(selectedLayer){

            selectedLayer.setStyle(selectedLayer.originalStyle);

            selectedLayer = null;

        }

    }
});
    // =======================
// UPLOAD SHP ZIP
// =======================

document.getElementById("uploadShp")
.addEventListener("change", function(e){

    let file = e.target.files[0];

    if(!file){

        return;

    }

    let reader = new FileReader();

    reader.onload = function(event){

        shp(event.target.result)

        .then(function(geojson){

            // HAPUS LAYER LAMA
            uploadLayer.clearLayers();

            // TAMBAH KE PETA
            uploadLayer.addData(geojson);

            // ZOOM KE LAYER
            map.fitBounds(uploadLayer.getBounds());

            alert("SHP berhasil dimuat!");

        })

        .catch(function(err){

            console.log(err);

            alert("Gagal membaca SHP");

        });

    };

    reader.readAsArrayBuffer(file);

});

// =====================================================
// CLOSE SIDEBAR SETELAH MEMILIH FILTER MOBILE
// =====================================================

$(document).on(
    "select2:select select2:unselect select2:clear",
    "#filterKabupaten, #filterF2025, #filterNama, #filterIndustri",
    function () {

        if (window.innerWidth <= 768) {

            setTimeout(function () {

                var sidebar =
                    document.getElementById("sidebar");

                if (sidebar) {

                    sidebar.classList.remove("active");

                }


                refreshMapMobile();

            }, 200);

        }

    }
);
// =====================================================
// FIX FILTER MOBILE & KONTROL LEAFLET
// =====================================================

$(document).on(
    "select2:select select2:unselect select2:clear",
    "#filterKabupaten, #filterF2025, #filterNama, #filterIndustri",
    function () {

        if (window.innerWidth <= 768) {

            setTimeout(function () {

                // Tutup sidebar mobile
                const sidebar = document.getElementById("sidebar");

                if (sidebar) {
                    sidebar.classList.remove("active");
                }


                // Refresh ukuran peta Leaflet
                if (typeof map !== "undefined" && map) {
                    map.invalidateSize(true);
                }


                // Pastikan kontrol Leaflet dirender ulang
                const controls =
                    document.querySelector(".leaflet-control-container");

                if (controls) {

                    controls.style.display = "none";

                    setTimeout(function () {
                        controls.style.display = "";
                    }, 50);

                }

            }, 300);

        }

    }
);
// =====================================================
// GRAFIK TREN HOTSPOT 30 HARI
// =====================================================

let grafikTrenHotspot = null;


async function tampilkanTrenHotspot() {

    try {

        // =============================================
        // HAPUS PANEL LAMA JIKA SUDAH ADA
        // =============================================

        const panelLama =
            document.getElementById(
                "panel-tren-hotspot"
            );


        if (
            panelLama
        ) {

            panelLama.remove();

        }


        // =============================================
        // BUAT PANEL GRAFIK
        // =============================================

        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            "panel-tren-hotspot";


        panel.style.position =
            "fixed";

        panel.style.top =
            "50%";

        panel.style.left =
            "50%";

        panel.style.transform =
            "translate(-50%, -50%)";

        panel.style.width =
            "min(900px, 90vw)";

        panel.style.maxHeight =
            "85vh";

        panel.style.background =
            "white";

        panel.style.zIndex =
            "99999";

        panel.style.padding =
            "25px";

        panel.style.borderRadius =
            "15px";

        panel.style.boxShadow =
            "0 10px 40px rgba(0,0,0,0.35)";

        panel.style.overflow =
            "auto";


        panel.innerHTML = `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                "
            >

                <h2
                    style="
                        margin:0;
                        color:#8b3d2e;
                    "
                >
                    🔥 Tren Hotspot 30 Hari
                </h2>


                <button
                    onclick="tutupTrenHotspot()"
                    style="
                        border:none;
                        background:#8b3d2e;
                        color:white;
                        width:35px;
                        height:35px;
                        border-radius:50%;
                        cursor:pointer;
                        font-size:18px;
                    "
                >
                    ✕
                </button>

            </div>


            <div
                id="info-tren-hotspot"
                style="
                    text-align:center;
                    padding:30px;
                    color:#666;
                "
            >
                Memuat data tren hotspot...
            </div>


            <div
                id="container-grafik-hotspot"
                style="
                    display:none;
                    position:relative;
                    height:400px;
                "
            >
                <canvas
                    id="grafik-tren-hotspot"
                ></canvas>
            </div>

        `;


        document.body.appendChild(
            panel
        );


        // =============================================
        // AMBIL DATA JSON
        // =============================================

        const response =
            await fetch(
                "data/hotspot-harian/hotspot-tren-30-hari.json"
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Data tren hotspot tidak ditemukan"
            );

        }


        const data =
            await response.json();


        // =============================================
        // VALIDASI DATA
        // =============================================

        if (
            !Array.isArray(
                data
            )
        ) {

            throw new Error(
                "Format data tren tidak valid"
            );

        }


        if (
            data.length === 0
        ) {

            document.getElementById(
                "info-tren-hotspot"
            ).innerHTML =
                `
                <div
                    style="
                        font-size:18px;
                        margin-bottom:10px;
                    "
                >
                    📭
                </div>

                Belum ada data hotspot.
                `;


            return;

        }


        // =============================================
        // FORMAT LABEL TANGGAL
        // =============================================

        const labels =
            data.map(
                function(item) {

                    const tanggal =
                        new Date(
                            item.tanggal +
                            "T00:00:00"
                        );


                    return tanggal.toLocaleDateString(
                        "id-ID",
                        {
                            day:
                                "2-digit",

                            month:
                                "short"
                        }
                    );

                }
            );


        // =============================================
        // DATA HIGH
        // =============================================

        const dataHigh =
            data.map(
                function(item) {

                    return Number(
                        item.high || 0
                    );

                }
            );


        // =============================================
        // DATA MEDIUM
        // =============================================

        const dataMedium =
            data.map(
                function(item) {

                    return Number(
                        item.medium || 0
                    );

                }
            );


        // =============================================
        // DATA LOW
        // =============================================

        const dataLow =
            data.map(
                function(item) {

                    return Number(
                        item.low || 0
                    );

                }
            );


        // =============================================
        // DATA TOTAL
        // =============================================

        const dataTotal =
            data.map(
                function(item) {

                    return Number(
                        item.total || 0
                    );

                }
            );


        // =============================================
        // TAMPILKAN GRAFIK
        // =============================================

        document.getElementById(
            "info-tren-hotspot"
        ).style.display =
            "none";


        document.getElementById(
            "container-grafik-hotspot"
        ).style.display =
            "block";


        const canvas =
            document.getElementById(
                "grafik-tren-hotspot"
            );


        const context =
            canvas.getContext(
                "2d"
            );


        // HAPUS GRAFIK SEBELUMNYA
        if (
            grafikTrenHotspot
        ) {

            grafikTrenHotspot.destroy();

        }


        // =============================================
        // BUAT GRAFIK
        // =============================================

        grafikTrenHotspot =
            new Chart(
                context,
                {

                    type:
                        "line",


                    data:
                        {

                            labels:
                                labels,


                            datasets:
                                [

                                    {

                                        label:
                                            "High",


                                        data:
                                            dataHigh,


                                        borderColor:
                                            "#d9534f",


                                        backgroundColor:
                                            "rgba(217,83,79,0.15)",


                                        borderWidth:
                                            3,


                                        tension:
                                            0.3,


                                        pointRadius:
                                            4,


                                        pointHoverRadius:
                                            6

                                    },


                                    {

                                        label:
                                            "Medium",


                                        data:
                                            dataMedium,


                                        borderColor:
                                            "#f0ad4e",


                                        backgroundColor:
                                            "rgba(240,173,78,0.15)",


                                        borderWidth:
                                            3,


                                        tension:
                                            0.3,


                                        pointRadius:
                                            4,


                                        pointHoverRadius:
                                            6

                                    },


                                    {

                                        label:
                                            "Low",


                                        data:
                                            dataLow,


                                        borderColor:
                                            "#5cb85c",


                                        backgroundColor:
                                            "rgba(92,184,92,0.15)",


                                        borderWidth:
                                            3,


                                        tension:
                                            0.3,


                                        pointRadius:
                                            4,


                                        pointHoverRadius:
                                            6

                                    },


                                    {

                                        label:
                                            "Total Hotspot",


                                        data:
                                            dataTotal,


                                        borderColor:
                                            "#333333",


                                        backgroundColor:
                                            "rgba(0,0,0,0.05)",


                                        borderWidth:
                                            3,


                                        tension:
                                            0.3,


                                        pointRadius:
                                            4,


                                        pointHoverRadius:
                                            6

                                    }

                                ]

                        },


                    options:
                        {

                            responsive:
                                true,


                            maintainAspectRatio:
                                false,


                            interaction:
                                {

                                    mode:
                                        "index",


                                    intersect:
                                        false

                                },


                            plugins:
                                {

                                    legend:
                                        {

                                            position:
                                                "top"

                                        },


                                    title:
                                        {

                                            display:
                                                true,


                                            text:
                                                "Perkembangan Hotspot Kalimantan Selatan"

                                        }

                                },


                            scales:
                                {

                                    y:
                                        {

                                            beginAtZero:
                                                true,


                                            ticks:
                                                {

                                                    precision:
                                                        0

                                                },


                                            title:
                                                {

                                                    display:
                                                        true,


                                                    text:
                                                        "Jumlah Hotspot"

                                                }

                                        },


                                    x:
                                        {

                                            title:
                                                {

                                                    display:
                                                        true,


                                                    text:
                                                        "Tanggal"

                                                }

                                        }

                                }

                        }

                }
            );


    }

    catch (
        error
    ) {

        console.error(
            error
        );


        const info =
            document.getElementById(
                "info-tren-hotspot"
            );


        if (
            info
        ) {

            info.innerHTML =
                `

                <div
                    style="
                        font-size:30px;
                        margin-bottom:10px;
                    "
                >
                    ⚠️
                </div>


                <b>
                    Gagal memuat data tren hotspot
                </b>


                <br>


                <small>
                    ${error.message}
                </small>

                `;

        }

    }

}


// =====================================================
// TUTUP PANEL TREN HOTSPOT
// =====================================================

function tutupTrenHotspot() {

    const panel =
        document.getElementById(
            "panel-tren-hotspot"
        );


    if (
        panel
    ) {

        panel.remove();

    }


    if (
        grafikTrenHotspot
    ) {

        grafikTrenHotspot.destroy();

        grafikTrenHotspot =
            null;

    }

}

// loadHotspotSipongi();

