// Inisialisasi Area dan Periode Citra
Map.centerObject(table, 9);

// Fungsi untuk masking awan pada citra Sentinel-2
function maskS2clouds(image) {
  var qa = image.select('QA10'); // Gunakan QA10 untuk Sentinel-2 Level-2A
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
             .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// Filter dan proses citra Sentinel-2 untuk periode pertama
var Sentinel1 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2019-08-17', '2019-08-19')
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .median()
  .clip(table);

// Filter dan proses citra Sentinel-2 untuk periode kedua
var Sentinel2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2023-12-19', '2023-12-21') // Ganti dengan periode yang diinginkan
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .median()
  .clip(table);

// Fungsi untuk menghitung NDVI
function hitungNDVI(citra) {
  var ndvi = citra.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return citra.addBands(ndvi);
}

// Hitung NDVI untuk kedua citra
var citraNDVI1 = hitungNDVI(Sentinel1);
var citraNDVI2 = hitungNDVI(Sentinel2);

// Hitung selisih NDVI
var selisihNDVI = citraNDVI2.select('NDVI').subtract(citraNDVI1.select('NDVI')).rename('Selisih_NDVI');

// Visualisasi citra RGB
var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2']
};

Map.addLayer(Sentinel1, visualization, 'RGB 1');
Map.addLayer(Sentinel2, visualization, 'RGB 2');

// Tampilkan citra NDVI
Map.addLayer(citraNDVI1, {bands: 'NDVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra NDVI 1');
Map.addLayer(citraNDVI2, {bands: 'NDVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra NDVI 2');

// Tampilkan selisih NDVI
Map.addLayer(selisihNDVI, {min: -1, max: 1, palette: ['red', 'white', 'blue']}, 'Selisih NDVI');

// Output perbandingan NDVI pada console
print('NDVI Citra 1:', citraNDVI1.select('NDVI'));
print('NDVI Citra 2:', citraNDVI2.select('NDVI'));
print('Selisih NDVI:', selisihNDVI);

// Ekspor citra NDVI ke Google Drive
Export.image.toDrive({
  image: citraNDVI1.select('NDVI'),
  description: 'NDVI_KotaJaksel_2019_1',
  folder: 'GEE_Exports',
  scale: 10, 
  region: table.geometry().bounds(),
  fileFormat: 'GeoTIFF',
});

Export.image.toDrive({
  image: citraNDVI2.select('NDVI'),
  description: 'NDVI_KotaJaksel_2023_2',
  folder: 'GEE_Exports',
  scale: 10, 
  region: table.geometry().bounds(),
  fileFormat: 'GeoTIFF',
});

Export.image.toDrive({
  image: selisihNDVI,
  description: 'Selisih_NDVI_jaksel_2023',
  folder: 'GEE_Exports',
  scale: 10, 
  region: table.geometry().bounds(),
  fileFormat: 'GeoTIFF',
});


// Inisialisasi Area dan Periode Citra 
// Pastikan 'table' telah didefinisikan dengan benar, 
// misalnya dengan menggambar area di Map atau mengimpor shapefile.
Map.centerObject(table, 9);

// Fungsi untuk masking awan pada citra Sentinel-2
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Membuat masker awan dan cirrus
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// Fungsi untuk menghitung NDVI
function hitungNDVI(citra) {
  var ndvi = citra.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return citra.addBands(ndvi);
}

// Fungsi untuk menghitung luas vegetasi dalam meter persegi
function hitungLuasVegetasi(veg) {
  return veg.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: table.geometry(),
    scale: 10,
    maxPixels: 1e13
  });
}

// ---  2019  ---
var Sentinel2019 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2019-06-01', '2019-06-30') // Gunakan tahun 2017
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) // Longgarkan filter awan
  .map(maskS2clouds);

print('Jumlah citra 2019:', Sentinel2019.size()); // Cek jumlah citra

var citraNDVI2019 = hitungNDVI(Sentinel2019.median().clip(table));

// ---  2022  ---
var Sentinel2021 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2021-07-17', '2021-07-21')
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) // Longgarkan filter awan
  .map(maskS2clouds);

print('Jumlah citra 2021:', Sentinel2021.size()); // Cek jumlah citra

var citraNDVI2021 = hitungNDVI(Sentinel2021.median().clip(table));

// ---  2023  ---
var Sentinel2023 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2023-07-22', '2023-07-27') // Gunakan tahun 2023
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) // Longgarkan filter awan
  .map(maskS2clouds);

print('Jumlah citra 2023:', Sentinel2023.size()); // Cek jumlah citra

var citraNDVI2023 = hitungNDVI(Sentinel2023.median().clip(table));


// Tentukan threshold NDVI (coba nilai yang lebih rendah)
var ndviThreshold = 0.3; 

// Klasifikasi citra berdasarkan threshold NDVI
var veg2019 = citraNDVI2019.select('NDVI').gt(ndviThreshold);
var veg2021 = citraNDVI2021.select('NDVI').gt(ndviThreshold);
var veg2023 = citraNDVI2023.select('NDVI').gt(ndviThreshold); // Gunakan tahun 2023


// Hitung luas area vegetasi 
var area2019 = hitungLuasVegetasi(veg2019);
var area2021 = hitungLuasVegetasi(veg2021);
var area2023 = hitungLuasVegetasi(veg2023); // Gunakan tahun 2023

// Konversi luas vegetasi ke kilometer persegi
var luasVeg2019 = ee.Number(area2019.get('NDVI')).divide(1e6);
var luasVeg2021 = ee.Number(area2021.get('NDVI')).divide(1e6);
var luasVeg2023 = ee.Number(area2023.get('NDVI')).divide(1e6); // Gunakan tahun 2023


// Print nilai luas untuk debugging
print('Luas Vegetasi 2017 (m²):', area2019);
print('Luas Vegetasi 2021 (m²):', area2021);
print('Luas Vegetasi 2023 (m²):', area2023);


// Buat grafik perbandingan luas vegetasi
var chart = ui.Chart.array.values({
  array: [luasVeg2019, luasVeg2021, luasVeg2023], // Gunakan tahun 2023
  axis: 0
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Perubahan Luas Vegetasi',
  hAxis: {title: 'Tahun', ticks: [{v: 0, f: '2019'}, {v: 1, f: '2021'}, {v: 2, f: '2023'}]}, // Gunakan tahun 2023
  vAxis: {
    title: 'Luas Vegetasi (km²)',
    viewWindow: {min: 0, max: 100} 
  },
  series: {
    0: {color: 'green'}
  }
});

print(chart);

// Visualisasi citra
var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2']
};

Map.addLayer(Sentinel2019.median().clip(table), visualization, 'RGB 2019');
Map.addLayer(Sentinel2021.median().clip(table), visualization, 'RGB 2021');
Map.addLayer(Sentinel2023.median().clip(table), visualization, 'RGB 2023'); // Gunakan tahun 2023

// Tampilkan citra NDVI 
Map.addLayer(citraNDVI2019, {bands: 'NDVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra NDVI 2019');
Map.addLayer(citraNDVI2021, {bands: 'NDVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra NDVI 2022');
Map.addLayer(citraNDVI2023, {bands: 'NDVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra NDVI 2023'); // Gunakan tahun 2023

// Output perbandingan NDVI dan luas vegetasi pada console
print('Luas Vegetasi 2019 (km²):', luasVeg2019);
print('Luas Vegetasi 2021 (km²):', luasVeg2021);
print('Luas Vegetasi 2023 (km²):', luasVeg2023); // Gunakan tahun 2023