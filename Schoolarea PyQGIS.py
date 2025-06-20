# 1️⃣ Import bawaan PyQGIS
from qgis.core import QgsProject, QgsSpatialIndex, QgsField
from PyQt5.QtCore import QVariant

# 2️⃣ Panggil layer point (sekolah) dan polygon/line (jalan)
layer_sekolah = QgsProject.instance().mapLayersByName('Sekolah')[0]
layer_jalan = QgsProject.instance().mapLayersByName('Jalan')[0]

# 3️⃣ Filter hanya jalan nasional, bikin index hanya untuk itu
features_jalan_nasional = [f for f in layer_jalan.getFeatures() if f['tipe_jalan'] == 'jalan nasional']

index_jalan = QgsSpatialIndex()
for feat in features_jalan_nasional:
    index_jalan.insertFeature(feat)

# 4️⃣ Tambah field 'beside_nation_road' ke sekolah kalau belum ada
layer_sekolah.startEditing()
field_names = [field.name() for field in layer_sekolah.fields()]
if 'beside_nation_road' not in field_names:
    layer_sekolah.dataProvider().addAttributes([QgsField('beside_nation_road', QVariant.String)])
    layer_sekolah.updateFields()

# 5️⃣ Loop semua titik sekolah
for feat in layer_sekolah.getFeatures():
    geom_sekolah = feat.geometry()

    # Cari jalan nasional terdekat pakai spatial index
    candidate_ids = index_jalan.intersects(geom_sekolah.buffer(5, 5).boundingBox())

    # Flag: asumsi default TIDAK di samping jalan nasional
    beside = 'No'

    for fid in candidate_ids:
        feat_jalan = [f for f in features_jalan_nasional if f.id() == fid][0]
        geom_jalan = feat_jalan.geometry()

        # Hitung jarak real geometry
        jarak = geom_sekolah.distance(geom_jalan)

        if jarak <= 5:
            beside = 'Yes'
            break  # kalau udah ketemu, ga perlu cek jalan lain

    # Update field 'beside_nation_road' untuk titik ini
    layer_sekolah.changeAttributeValue(feat.id(), layer_sekolah.fields().indexFromName('beside_nation_road'), beside)

# 6️⃣ Simpan perubahan
layer_sekolah.commitChanges()
print("Selesai bos! Cek field 'beside_nation_road'.")
    