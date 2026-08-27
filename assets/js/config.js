// =====================================================
// KONFIGURASI APLIKASI
// INFORMASI SPASIAL BPHL WILAYAH XI
// =====================================================


// =====================================================
// GOOGLE SPREADSHEET
// =====================================================

const CONFIG = {

    // DATA PENANAMAN PBPH
    spreadsheetPenanaman:
        "1kYvLj9RiXRxZ5rpSvZw8AnNAspngHkY9CMFZKMX_Rno",

    // DATA KAWASAN HUTAN
    spreadsheetKawasan:
        "1mXXOn8m0jDvTPOnRmSY4rE61u5mUuX21HLyxmtI8lmE",

    // DATA PRODUKSI KAYU BULAT
    spreadsheetProduksi:
        "11jcpMuO0i8Nh7cId1loAKYOHn6J9jRSNT3lzmT3t4VU",

    // DATA PRODUKSI INDUSTRI
    spreadsheetIndustri:
        "1u9Wx1pUc2M-KzE9997_osg-8NHG5wH4etq4H9am7Rmc",

    // =================================================
    // HOTSPOT SIPONGI - KALIMANTAN SELATAN
    // 24 JAM TERAKHIR
    // =================================================
    sipongiHotspotURL:
        "https://opsroom.sipongidata.my.id/api/opsroom/indoHotspot?wilayah=IN&filterperiode=false&from=&to=&late=24&satelit[]=NASA-MODIS&satelit[]=NASA-SNPP&satelit[]=NASA-NOAA20&confidence[]=low&confidence[]=medium&confidence[]=high&provinsi=12&kabkota="

};


// =====================================================
// URL API OPENSHEET
// =====================================================

const API_CONFIG = {

    baseURL: "https://opensheet.elk.sh",

};


// =====================================================
// KONFIGURASI PETA
// =====================================================

const MAP_CONFIG = {

    center: [-3.3, 114.6],

    zoom: 7,

};


// =====================================================
// KONFIGURASI DATA LOKAL
// =====================================================

const DATA_CONFIG = {

    luasKabupaten: "data_luas_kabupaten.json",

};
