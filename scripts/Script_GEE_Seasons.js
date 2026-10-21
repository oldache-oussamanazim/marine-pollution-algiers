// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT GOOGLE EARTH ENGINE — INDICES DE POLLUTION MARINE (SAISONNIER)
// Colab Claude + Nazim
// Zone : Baie d'Alger 
// Satellite : Sentinel-2 MSI (COPERNICUS/S2_SR_HARMONIZED)
// Période : 2024–2025 (4 saisons) (a adapter)
// ═══════════════════════════════════════════════════════════════════════════════


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 1 — PARAMÈTRES GLOBAUX CONFIGURABLES               ║
// ╚═══════════════════════════════════════════════════════════════╝

var CLOUD_THRESHOLD = 15;
var S2_COLLECTION   = 'COPERNICUS/S2_SR_HARMONIZED';
var EXPORT_SCALE    = 10;
var EXPORT_CRS      = 'EPSG:32631';

// ─── Définition des saisons ───────────────────────────────────────
// Chaque saison couvre 3 mois ; le composite est la médiane sur ces mois.
// L'Hiver chevauche deux années (Déc N → Fév N+1).
var SEASONS = [
  {
    label: 'HIVER_2025',
    startDate: '2024-12-01',
    endDate: '2025-03-01'   // Décembre 2024 + Janvier + Février 2025
  },
  {
    label: 'PRINTEMPS_2025',
    startDate: '2025-03-01',
    endDate: '2025-06-01'   // Mars + Avril + Mai 2025
  },
  {
    label: 'ETE_2025',
    startDate: '2025-06-01',
    endDate: '2025-09-01'   // Juin + Juillet + Août 2025
  },
  {
    label: 'AUTOMNE_2025',
    startDate: '2025-09-01',
    endDate: '2025-12-01'   // Septembre + Octobre + Novembre 2025
  },
  {
    label: 'HIVER_2026',
    startDate: '2025-12-01',
    endDate: '2026-03-01'   // Décembre 2025 + Janvier + Février 2026 (si besoin de boucler l'année)
  }
];

// ─── Points GPS pour extraction de séries temporelles ────────────
var SAMPLE_POINTS = [
  {lon: 3.0800, lat: 36.7900, name: 'Port_Alger'},
  {lon: 3.1500, lat: 36.7600, name: 'Baie_Centrale'},
  {lon: 3.2000, lat: 36.7800, name: 'Est_Baie'},
  {lon: 3.0500, lat: 36.8200, name: 'Ouest_Baie'}
];


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 2 — ZONE D'ÉTUDE (BAIE D'ALGER)                   ║
// ╚═══════════════════════════════════════════════════════════════╝

var studyArea = ee.Geometry.Polygon(
  [[[3.001686000262991, 36.880000000000000],
    [3.001686000262991, 36.73158505693197],
    [3.244758510028616, 36.73158505693197],
    [3.244758510028616, 36.880000000000000]]],
  null, false
);

Map.centerObject(studyArea, 11);

var studyAreaOutline = ee.Image().byte().paint({
  featureCollection: ee.FeatureCollection([ee.Feature(studyArea)]),
  color: 1, width: 2
});
Map.addLayer(studyAreaOutline, {palette: ['FF0000']}, 'Zone d\'étude (contour)', true);


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 3 — MASQUAGE NUAGES ET PRÉTRAITEMENT               ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * maskS2Clouds : masque nuages (bit 10) et cirrus (bit 11) via QA60.
 * Normalise la réflectance en divisant par 10 000.
 */
function maskS2Clouds(image) {
  var qa            = image.select('QA60');
  var cloudBitMask  = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
              .divide(10000)
              .copyProperties(image, ['system:time_start', 'system:time_end']);
}

/**
 * loadS2ForSeason : charge la collection Sentinel-2 pour une saison donnée.
 */
function loadS2ForSeason(startDate, endDate) {
  return ee.ImageCollection(S2_COLLECTION)
    .filterBounds(studyArea)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_THRESHOLD))
    .map(maskS2Clouds)
    .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12']);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 4 — CALCUL DES INDICES SPECTRAUX                  ║
// ╚═══════════════════════════════════════════════════════════════╝

/** NDTI — Turbidité : (B4 - B3) / (B4 + B3) */
function computeNDTI(image) {
  return image.normalizedDifference(['B4', 'B3'])
              .rename('NDTI')
              .copyProperties(image, ['system:time_start']);
}

/** NDCI — Chlorophylle : (B5 - B4) / (B5 + B4) */
function computeNDCI(image) {
  return image.normalizedDifference(['B5', 'B4'])
              .rename('NDCI')
              .copyProperties(image, ['system:time_start']);
}

/** NDWI — Eau : (B3 - B8) / (B3 + B8) */
function computeNDWI(image) {
  return image.normalizedDifference(['B3', 'B8'])
              .rename('NDWI')
              .copyProperties(image, ['system:time_start']);
}

/** MNDWI — Eau modifié : (B3 - B11) / (B3 + B11) */
function computeMNDWI(image) {
  return image.normalizedDifference(['B3', 'B11'])
              .rename('MNDWI')
              .copyProperties(image, ['system:time_start']);
}

/** CDOM — Matière organique dissoute : (B2 - B4) / (B2 + B4) */
function computeCDOM(image) {
  return image.normalizedDifference(['B2', 'B4'])
              .rename('CDOM')
              .copyProperties(image, ['system:time_start']);
}

/**
 * FAI — Floating Algae Index (Hu 2009, adapté Sentinel-2)
 * FAI = B8 - [B4 + (B11 - B4) × (842 - 665) / (1610 - 665)]
 * Longueurs d'onde : B4=665nm, B8=842nm, B11=1610nm
 */
function computeFAI(image) {
  var lambda_red  = 665;
  var lambda_nir  = 842;
  var lambda_swir = 1610;
  var coeff = (lambda_nir - lambda_red) / (lambda_swir - lambda_red); // ≈ 0.1862

  var red      = image.select('B4');
  var nir      = image.select('B8');
  var swir     = image.select('B11');
  var baseline = red.add(swir.subtract(red).multiply(coeff));

  return nir.subtract(baseline)
            .rename('FAI')
            .copyProperties(image, ['system:time_start']);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 5 — PALETTES DE VISUALISATION SCIENTIFIQUES       ║
// ╚═══════════════════════════════════════════════════════════════╝

var VIZ_NDTI  = {min: -0.2,  max: 0.4,  palette: ['0d3b66','1a6faf','48b5e8','f4e87c','d4875a','8b3a0f']};
var VIZ_NDCI  = {min: -0.1,  max: 0.3,  palette: ['00007f','0000ff','00ffff','00ff00','ffff00','ff0000']};
var VIZ_NDWI  = {min: -0.3,  max: 0.8,  palette: ['a52a2a','f5deb3','e0f7fa','0288d1','01579b']};
var VIZ_MNDWI = {min: -0.5,  max: 0.5,  palette: ['964b00','f5c842','ccffcc','00bcd4','003366']};
var VIZ_CDOM  = {min: -0.3,  max: 0.3,  palette: ['1a1a2e','16213e','0f3460','533483','e94560','f5a623']};
var VIZ_FAI   = {min: -0.05, max: 0.05, palette: ['084081','0868ac','43a2ca','a8ddb5','41ab5d','006837']};
var VIZ_RGB   = {bands: ['B4','B3','B2'], min: 0.0, max: 0.3, gamma: 1.4};


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 6 — FONCTIONS D'EXPORT GEOTIFF ET CSV             ║
// ╚═══════════════════════════════════════════════════════════════╝

/** exportIndex : exporte un indice saisonnier en GeoTIFF vers Google Drive. */
function exportIndex(indexImage, indexName, seasonLabel) {
  var fileName = indexName + '_' + seasonLabel;
  Export.image.toDrive({
    image:          ee.Image(indexImage).toFloat(),
    description:    fileName,
    folder:         indexName,
    fileNamePrefix: fileName,
    region:         studyArea,
    scale:          EXPORT_SCALE,
    crs:            EXPORT_CRS,
    crsTransform:   null,
    fileFormat:     'GeoTIFF',
    maxPixels:      1e10
  });
}

/** exportRGB : exporte le composite RGB saisonnier vers Google Drive. */
function exportRGB(composite, seasonLabel) {
  var fileName = 'RGB_' + seasonLabel;
  Export.image.toDrive({
    image:          composite.select(['B4','B3','B2']).toFloat(),
    description:    fileName,
    folder:         'RGB',
    fileNamePrefix: fileName,
    region:         studyArea,
    scale:          EXPORT_SCALE,
    crs:            EXPORT_CRS,
    crsTransform:   null,
    fileFormat:     'GeoTIFF',
    maxPixels:      1e10
  });
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 7 — STATISTIQUES SAISONNIÈRES                     ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * computeSeasonalStats : calcule min, max, mean, median, stdDev, P25, P75
 * pour un indice donné sur la zone d'étude.
 */
function computeSeasonalStats(indexImage, indexName, seasonLabel) {
  var image = ee.Image(indexImage);
  var stats = image.reduceRegion({
    reducer: ee.Reducer.mean()
      .combine(ee.Reducer.median(), '', true)
      .combine(ee.Reducer.stdDev(), '', true)
      .combine(ee.Reducer.min(), '', true)
      .combine(ee.Reducer.max(), '', true)
      .combine(ee.Reducer.percentile([25, 75]), '', true),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e10
  });
  return ee.Feature(null, stats)
    .set('index_name', indexName)
    .set('season_label', seasonLabel);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 8 — EXTRACTION SÉRIES TEMPORELLES PAR POINT GPS   ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * extractTimeSeriesAtPoint : extrait les valeurs de tous les indices
 * pour un point GPS sur toutes les saisons. Exporté en CSV.
 */
function extractTimeSeriesAtPoint(indicesStack, pointConfig) {
  var point = ee.Geometry.Point([pointConfig.lon, pointConfig.lat]);

  var features = indicesStack.map(function(entry) {
    var image  = ee.Image(entry.indices);
    var values = image.reduceRegion({
      reducer:  ee.Reducer.mean(),
      geometry: point,
      scale:    30,
      maxPixels: 1e6
    });
    return ee.Feature(null, values)
      .set('season_label', entry.label)
      .set('point_name',   pointConfig.name)
      .set('longitude',    pointConfig.lon)
      .set('latitude',     pointConfig.lat);
  });

  Export.table.toDrive({
    collection:     ee.FeatureCollection(features),
    description:    'TimeSeries_' + pointConfig.name,
    folder:         'TimeSeries',
    fileNamePrefix: 'TimeSeries_' + pointConfig.name,
    fileFormat:     'CSV'
  });
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 9 — BOUCLE PRINCIPALE PAR SAISON                  ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Initialisation des structures ───────────────────────────────
var indicesStack        = [];
var statsFeatures_NDTI  = [];
var statsFeatures_NDCI  = [];
var statsFeatures_NDWI  = [];
var statsFeatures_MNDWI = [];
var statsFeatures_CDOM  = [];
var statsFeatures_FAI   = [];

var firstComposite  = null;
var firstIndices    = null;
var firstLabel      = '';

// ═════════════════════════════════════════════════════════════════
// BOUCLE SUR LES SAISONS
// ═════════════════════════════════════════════════════════════════
for (var i = 0; i < SEASONS.length; i++) {

  var season = SEASONS[i];
  var label  = season.label;

  print('──────────────────────────────────────────────');
  print('🌍 Traitement de la saison :', label);

  // ── 1. Chargement de la collection saisonnière ──────────────────
  var collection = loadS2ForSeason(season.startDate, season.endDate);
  var count      = collection.size();
  print('   Images disponibles :', count);

  if (count.getInfo() === 0) {
    print('⚠ Aucune image disponible pour :', label);
    continue;
  }

  // ── 2. Composite saisonnier (médiane) ───────────────────────────
  var composite = collection.median().clip(studyArea);

  // ── 3. Calcul des indices ───────────────────────────────────────
  var ndti  = computeNDTI(composite);
  var ndci  = computeNDCI(composite);
  var ndwi  = computeNDWI(composite);
  var mndwi = computeMNDWI(composite);
  var cdom  = computeCDOM(composite);
  var fai   = computeFAI(composite);

  var allIndices = ee.Image.cat([ndti, ndci, ndwi, mndwi, cdom, fai]);

  // Stockage pour séries temporelles
  indicesStack.push({label: label, indices: allIndices});

  // ── 4. Statistiques saisonnières ────────────────────────────────
  statsFeatures_NDTI.push(computeSeasonalStats(ndti,  'NDTI',  label));
  statsFeatures_NDCI.push(computeSeasonalStats(ndci,  'NDCI',  label));
  statsFeatures_NDWI.push(computeSeasonalStats(ndwi,  'NDWI',  label));
  statsFeatures_MNDWI.push(computeSeasonalStats(mndwi,'MNDWI', label));
  statsFeatures_CDOM.push(computeSeasonalStats(cdom,  'CDOM',  label));
  statsFeatures_FAI.push(computeSeasonalStats(fai,    'FAI',   label));

  // ── 5. Exports GeoTIFF ──────────────────────────────────────────
  exportIndex(ndti,  'NDTI',  label);
  exportIndex(ndci,  'NDCI',  label);
  exportIndex(ndwi,  'NDWI',  label);
  exportIndex(mndwi, 'MNDWI', label);
  exportIndex(cdom,  'CDOM',  label);
  exportIndex(fai,   'FAI',   label);
  exportRGB(composite,        label);

  print('✅ Exports lancés pour :', label,
        '→ NDTI, NDCI, NDWI, MNDWI, CDOM, FAI, RGB');

  // ── 6. Mémoriser la première saison pour visualisation ──────────
  if (i === 0) {
    firstComposite = composite;
    firstIndices   = allIndices;
    firstLabel     = label;
  }
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 10 — EXPORTS CSV (STATISTIQUES + SÉRIES TEMP.)    ║
// ╚═══════════════════════════════════════════════════════════════╝

var statsNames  = ['NDTI', 'NDCI', 'NDWI', 'MNDWI', 'CDOM', 'FAI'];
var statsArrays = [
  statsFeatures_NDTI, statsFeatures_NDCI, statsFeatures_NDWI,
  statsFeatures_MNDWI, statsFeatures_CDOM, statsFeatures_FAI
];

for (var s = 0; s < statsNames.length; s++) {
  Export.table.toDrive({
    collection:     ee.FeatureCollection(statsArrays[s]),
    description:    'Stats_' + statsNames[s],
    folder:         'Statistics',
    fileNamePrefix: 'Stats_' + statsNames[s],
    fileFormat:     'CSV'
  });
}

for (var p = 0; p < SAMPLE_POINTS.length; p++) {
  extractTimeSeriesAtPoint(indicesStack, SAMPLE_POINTS[p]);
}

print('📊 Exports CSV statistiques et séries temporelles lancés.');


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 11 — VISUALISATION (PREMIÈRE SAISON DISPONIBLE)   ║
// ╚═══════════════════════════════════════════════════════════════╝

print('🗺️  Visualisation de la saison :', firstLabel);

Map.addLayer(firstComposite.select(['B4','B3','B2']), VIZ_RGB,   'RGB — '   + firstLabel, true);
Map.addLayer(firstIndices.select('NDTI'),  VIZ_NDTI,  'NDTI  (Turbidité) — '      + firstLabel, false);
Map.addLayer(firstIndices.select('NDCI'),  VIZ_NDCI,  'NDCI  (Chlorophylle) — '   + firstLabel, false);
Map.addLayer(firstIndices.select('NDWI'),  VIZ_NDWI,  'NDWI  (Eau) — '            + firstLabel, false);
Map.addLayer(firstIndices.select('MNDWI'), VIZ_MNDWI, 'MNDWI (Eau modifié) — '   + firstLabel, false);
Map.addLayer(firstIndices.select('CDOM'),  VIZ_CDOM,  'CDOM  (Mat. organique) — ' + firstLabel, false);
Map.addLayer(firstIndices.select('FAI'),   VIZ_FAI,   'FAI   (Algues flottantes) — ' + firstLabel, false);

// ─── Points d'échantillonnage ─────────────────────────────────────
var samplePointsFC = ee.FeatureCollection(
  SAMPLE_POINTS.map(function(pt) {
    return ee.Feature(ee.Geometry.Point([pt.lon, pt.lat]), {name: pt.name});
  })
);
Map.addLayer(samplePointsFC, {color: 'FFFF00'}, 'Points d\'échantillonnage', true);


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 12 — HISTOGRAMMES CONSOLE                         ║
// ╚═══════════════════════════════════════════════════════════════╝

print(ui.Chart.image.histogram({
  image: firstIndices.select('NDTI'), region: studyArea, scale: 30, maxBuckets: 50
}).setOptions({title: 'Histogramme NDTI — ' + firstLabel,
  hAxis: {title: 'Valeur NDTI'}, vAxis: {title: 'Pixels'}, colors: ['#1a6faf']}));

print(ui.Chart.image.histogram({
  image: firstIndices.select('NDCI'), region: studyArea, scale: 30, maxBuckets: 50
}).setOptions({title: 'Histogramme NDCI — ' + firstLabel,
  hAxis: {title: 'Valeur NDCI'}, vAxis: {title: 'Pixels'}, colors: ['#00a651']}));

print(ui.Chart.image.histogram({
  image: firstIndices.select('FAI'), region: studyArea, scale: 30, maxBuckets: 50
}).setOptions({title: 'Histogramme FAI — ' + firstLabel,
  hAxis: {title: 'Valeur FAI'}, vAxis: {title: 'Pixels'}, colors: ['#006837']}));


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 13 — LÉGENDE VISUELLE                             ║
// ╚═══════════════════════════════════════════════════════════════╝

function makeLegend(title, palette, minVal, maxVal) {
  var legend = ui.Panel({
    style: {position: 'bottom-left', padding: '8px 15px',
            backgroundColor: 'rgba(255,255,255,0.85)'}
  });
  legend.add(ui.Label({value: title,
    style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}}));
  legend.add(ui.Thumbnail({
    image:  ee.Image.pixelLonLat().select(0),
    params: {bbox: '0,0,1,0.1', dimensions: '200x20', format: 'png',
             min: 0, max: 1, palette: palette},
    style:  {stretch: 'horizontal', margin: '0px 8px'}
  }));
  legend.add(ui.Panel({
    widgets: [
      ui.Label(minVal.toString(), {margin: '4px 8px'}),
      ui.Label(maxVal.toString(), {margin: '4px 8px', textAlign: 'right', stretch: 'horizontal'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  }));
  return legend;
}

Map.add(makeLegend('NDTI — Turbidité\n(' + firstLabel + ')',
  VIZ_NDTI.palette, VIZ_NDTI.min, VIZ_NDTI.max));


// ╔═══════════════════════════════════════════════════════════════╗
// ║  RÉSUMÉ CONSOLE                                             ║
// ╚═══════════════════════════════════════════════════════════════╝

print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('📈 RÉSUMÉ DES TRAITEMENTS');
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('Zone            : Baie d\'Alger');
print('Composite       : Médiane saisonnière');
print('Saisons         : Hiver | Printemps | Été | Automne');
print('Filtre nuages   : < ' + CLOUD_THRESHOLD + ' %');
print('Résolution      : ' + EXPORT_SCALE + ' m');
print('Projection      : ' + EXPORT_CRS);
print('Indices         : NDTI, NDCI, NDWI, MNDWI, CDOM, FAI');
print('Points GPS      : ' + SAMPLE_POINTS.length);
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('✅ Script terminé.');
print('📂 Vérifiez l\'onglet "Tasks" pour lancer les exports.');
print('📁 Google Drive : NDTI/ | NDCI/ | NDWI/ | MNDWI/ | CDOM/ | FAI/ | RGB/');
print('                  Statistics/ | TimeSeries/');