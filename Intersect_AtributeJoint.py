# Ambil layer polygon dan point
layer_Polygon1 = QgsProject.instance().mapLayersByName('10K_Kota_Magelang')[0]
layer_polygon = QgsProject.instance().mapLayersByName('ADMINISTRASI_AR_DESAKEL')[0]

# Tambahkan field 'WADMKC' ke layer titik jika belum ada
from qgis.PyQt.QtCore import QVariant
field_names = [field.name() for field in layer_Polygon1.fields()]
if 'WADMKD' not in field_names:
    layer_Polygon1.startEditing()
    layer_Polygon1.dataProvider().addAttributes([QgsField('WADMKD', QVariant.String)])
    layer_Polygon1.updateFields()
    layer_Polygon1.commitChanges()

# Buat spatial index dari layer polygon
spatial_index = QgsSpatialIndex(layer_polygon.getFeatures())

# Mulai proses update
layer_Polygon1.startEditing()
for Polygon1 in layer_Polygon1.getFeatures():
    geom_Polygon1 = Polygon1.geometry()
    sudah_ditemukan = False  # untuk cek apakah sudah nemu polygon

    # Ambil calon polygon yang kemungkinan bersinggungan
    candidate_ids = spatial_index.intersects(geom_Polygon1.boundingBox())

    for fid in candidate_ids:
        polygon = layer_polygon.getFeature(fid)
        if polygon.geometry().contains(geom_Polygon1):
            Polygon1['WADMKD'] = polygon['DESA']  # ambil nama kecamatan dari polygon
            layer_Polygon1.updateFeature(Polygon1)
            sudah_ditemukan = True
            break

    if not sudah_ditemukan:
        Polygon1['WADMKD'] = 'Tidak Diketahui'
        layer_Polygon1.updateFeature(Polygon1)

layer_Polygon1.commitChanges()
print("✅ Selesai: Field WADMKD diisi berdasarkan lokasi spasial terhadap ADMINISTRASI_AR_KECAMATAN.")
    