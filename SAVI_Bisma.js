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

// Fungsi untuk menghitung SAVI
function hitungSAVI(citra) {
  var savi = citra.expression(
    '(1 + L) * (NIR - RED) / (NIR + RED + L)', 
    {
      'NIR': citra.select('B8'),
      'RED': citra.select('B4'),
      'L': 0.5  // Nilai L dapat disesuaikan 
    }
  ).rename('SAVI');
  return citra.addBands(savi);
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
  .filterDate('2019-06-01', '2019-06-30') 
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) 
  .map(maskS2clouds);

print('Jumlah citra 2019:', Sentinel2019.size()); 

var citraSAVI2019 = hitungSAVI(Sentinel2019.median().clip(table)).toFloat(); // Konversi ke Float32

// ---  2021  ---
var Sentinel2021 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2021-07-17', '2021-07-21')
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) 
  .map(maskS2clouds);

print('Jumlah citra 2021:', Sentinel2021.size()); 

var citraSAVI2021 = hitungSAVI(Sentinel2021.median().clip(table)).toFloat(); // Konversi ke Float32

// ---  2023  ---
var Sentinel2023 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterDate('2023-07-22', '2023-07-27')
  .filterBounds(table)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
  .map(maskS2clouds);

print('Jumlah citra 2023:', Sentinel2023.size());

var citraSAVI2023 = hitungSAVI(Sentinel2023.median().clip(table)).toFloat(); // Konversi ke Float32

// Tentukan threshold SAVI 
var saviThreshold = 0.3667;  

// Klasifikasi citra berdasarkan threshold SAVI
var veg2019 = citraSAVI2019.select('SAVI').gt(saviThreshold);
var veg2021 = citraSAVI2021.select('SAVI').gt(saviThreshold);
var veg2023 = citraSAVI2023.select('SAVI').gt(saviThreshold);

// Hitung luas area vegetasi 
var area2019 = hitungLuasVegetasi(veg2019);
var area2021 = hitungLuasVegetasi(veg2021);
var area2023 = hitungLuasVegetasi(veg2023);

// Konversi luas vegetasi ke kilometer persegi dan format 2 digit
var luasVeg2019 = ee.Number(area2019.get('SAVI')).divide(1e6).format('%.2f');
var luasVeg2021 = ee.Number(area2021.get('SAVI')).divide(1e6).format('%.2f');
var luasVeg2023 = ee.Number(area2023.get('SAVI')).divide(1e6).format('%.2f');

// Print nilai luas 
print('Luas Vegetasi 2019 (km²):', luasVeg2019);
print('Luas Vegetasi 2021 (km²):', luasVeg2021);
print('Luas Vegetasi 2023 (km²):', luasVeg2023);

// Visualisasi citra
var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2']
};

Map.addLayer(Sentinel2019.median().clip(table), visualization, 'RGB 2019');
Map.addLayer(Sentinel2021.median().clip(table), visualization, 'RGB 2021');
Map.addLayer(Sentinel2023.median().clip(table), visualization, 'RGB 2023'); 

// Tampilkan citra SAVI 
Map.addLayer(citraSAVI2019, {bands: 'SAVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra SAVI 2019');
Map.addLayer(citraSAVI2021, {bands: 'SAVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra SAVI 2021');
Map.addLayer(citraSAVI2023, {bands: 'SAVI', min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'Citra SAVI 2023');

// Export citra SAVI 2019
Export.image.toDrive({
  image: citraSAVI2019,
  description: 'Citra_SAVI_2019',
  folder: 'GEE_Exports', // Ganti dengan nama folder di Google Drive
  scale: 10,
  region: table.geometry()
});

// Export citra SAVI 2021
Export.image.toDrive({
  image: citraSAVI2021,
  description: 'Citra_SAVI_2021',
  folder: 'GEE_Exports', // Ganti dengan nama folder di Google Drive
  scale: 10,
  region: table.geometry()
});

// Export citra SAVI 2023
Export.image.toDrive({
  image: citraSAVI2023,
  description: 'Citra_SAVI_2023',
  folder: 'GEE_Exports', // Ganti dengan nama folder di Google Drive
  scale: 10,
  region: table.geometry()
});