// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT GOOGLE EARTH ENGINE — INDICES DE POLLUTION MARINE
// Zone : Baie d'Alger (Algérie)
// Satellite : Sentinel-2 MSI (COPERNICUS/S2_SR_HARMONIZED)
// Période : Janvier 2025 → Mai 2025
// Auteur : Script scientifique automatisé
// ═══════════════════════════════════════════════════════════════════════════════


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 1 — PARAMÈTRES GLOBAUX CONFIGURABLES               ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Période d'analyse ───────────────────────────────────────────
var START_DATE       = '2025-01-01';
var END_DATE         = '2026-05-15';

// ─── Paramètres de filtrage ───────────────────────────────────────
var CLOUD_THRESHOLD  = 20;   // % couverture nuageuse maximale par scène

// ─── Collection Sentinel-2 ────────────────────────────────────────
var S2_COLLECTION    = 'COPERNICUS/S2_SR_HARMONIZED';

// ─── Résolution d'export (mètres) ────────────────────────────────
var EXPORT_SCALE     = 10;

// ─── Projection d'export ─────────────────────────────────────────
var EXPORT_CRS       = 'EPSG:32631';

// ─── Mois à traiter (liste explicite) ────────────────────────────
var MONTHS = [
  {year: 2025, month: 1,  label: '2025_01'},
  {year: 2025, month: 2,  label: '2025_02'},
  {year: 2025, month: 3,  label: '2025_03'},
  {year: 2025, month: 4,  label: '2025_04'},
  {year: 2025, month: 5,  label: '2025_05'},
  {year: 2025, month: 6,  label: '2025_06'},
  {year: 2025, month: 7,  label: '2025_07'},
  {year: 2025, month: 8,  label: '2025_08'},
  {year: 2025, month: 9,  label: '2025_09'},
  {year: 2025, month: 10,  label: '2025_10'},
  {year: 2025, month: 11,  label: '2025_11'},
  {year: 2025, month: 12,  label: '2025_12'},
  {year: 2025, month: 1,  label: '2026_01'},
  {year: 2025, month: 2,  label: '2026_02'},
  {year: 2025, month: 3,  label: '2026_03'},
  {year: 2025, month: 4,  label: '2026_04'},
  {year: 2025, month: 5,  label: '2026_05'}
];

// ─── Points GPS pour extraction de séries temporelles ────────────
// Format : [longitude, latitude, nom_du_point]
var SAMPLE_POINTS = [
  {lon: 3.0800, lat: 36.7900, name: 'Port_Alger'},
  {lon: 3.1500, lat: 36.7600, name: 'Baie_Centrale'},
  {lon: 3.2000, lat: 36.7800, name: 'Est_Baie'},
  {lon: 3.0500, lat: 36.8200, name: 'Ouest_Baie'}
];


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 2 — ZONE D'ÉTUDE (BAIE D'ALGER)                   ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Géométrie fournie — NE PAS MODIFIER LES COORDONNÉES ─────────
var studyArea = ee.Geometry.Polygon(
  [[[3.001686000262991, 36.880000000000000],
    [3.001686000262991, 36.73158505693197],
    [3.244758510028616, 36.73158505693197],
    [3.244758510028616, 36.880000000000000]]],
  null,
  false
);

// ─── Centrage et affichage de la carte ───────────────────────────
Map.centerObject(studyArea, 11);

// ─── Affichage du contour de la zone d'étude ─────────────────────
var studyAreaOutline = ee.Image().byte().paint({
  featureCollection: ee.FeatureCollection([ee.Feature(studyArea)]),
  color: 1,
  width: 2
});
Map.addLayer(studyAreaOutline, {palette: ['FF0000']}, 'Zone d\'étude (contour)', true);


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 3 — MASQUAGE NUAGES ET PRÉTRAITEMENT               ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * maskS2Clouds : masque nuages et cirrus via la bande QA60 de Sentinel-2.
 * Bit 10 → nuages opaques | Bit 11 → cirrus
 * @param {ee.Image} image - Image Sentinel-2 SR
 * @returns {ee.Image} Image masquée, normalisée en réflectance [0–1]
 */
function maskS2Clouds(image) {
  var qa = image.select('QA60');

  // Bit 10 : nuages opaques (valeur 1024)
  // Bit 11 : cirrus       (valeur 2048)
  var cloudBitMask  = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Conserver uniquement les pixels sans nuages ni cirrus
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  // Conversion réflectance : diviser par 10 000 (valeur Sentinel-2 SR)
  return image.updateMask(mask)
              .divide(10000)
              .copyProperties(image, ['system:time_start', 'system:time_end']);
}

/**
 * loadS2Collection : charge et filtre la collection Sentinel-2.
 * @returns {ee.ImageCollection} Collection filtrée, masquée, normalisée
 */
function loadS2Collection() {
  return ee.ImageCollection(S2_COLLECTION)
    .filterBounds(studyArea)
    .filterDate(START_DATE, END_DATE)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_THRESHOLD))
    .map(maskS2Clouds)
    .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12']);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 4 — CALCUL DES INDICES SPECTRAUX                  ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * computeNDTI : Normalized Difference Turbidity Index
 * Formule : (B4 - B3) / (B4 + B3)
 * Indicateur : turbidité / matières en suspension
 */
function computeNDTI(image) {
  return image.normalizedDifference(['B4', 'B3'])
              .rename('NDTI')
              .copyProperties(image, ['system:time_start']);
}

/**
 * computeNDCI : Normalized Difference Chlorophyll Index
 * Formule : (B5 - B4) / (B5 + B4)
 * Indicateur : concentration en chlorophylle-a / eutrophisation
 */
function computeNDCI(image) {
  return image.normalizedDifference(['B5', 'B4'])
              .rename('NDCI')
              .copyProperties(image, ['system:time_start']);
}

/**
 * computeNDWI : Normalized Difference Water Index
 * Formule : (B3 - B8) / (B3 + B8)
 * Indicateur : détection eau / délimitation eau-terre
 */
function computeNDWI(image) {
  return image.normalizedDifference(['B3', 'B8'])
              .rename('NDWI')
              .copyProperties(image, ['system:time_start']);
}

/**
 * computeMNDWI : Modified Normalized Difference Water Index
 * Formule : (B3 - B11) / (B3 + B11)
 * Indicateur : détection eau améliorée (SWIR), robuste en zones urbaines côtières
 */
function computeMNDWI(image) {
  return image.normalizedDifference(['B3', 'B11'])
              .rename('MNDWI')
              .copyProperties(image, ['system:time_start']);
}

/**
 * computeCDOM : Colored Dissolved Organic Matter (indice empirique côtier)
 * Formule : (B2 - B4) / (B2 + B4)
 * Bandes : B2=Bleu, B4=Rouge
 * Indicateur : matière organique dissoute colorée / eaux estuariennes
 */
function computeCDOM(image) {
  return image.normalizedDifference(['B2', 'B4'])
              .rename('CDOM')
              .copyProperties(image, ['system:time_start']);
}

/**
 * computeFAI : Floating Algae Index (Hu 2009 adapté Sentinel-2)
 * Formule : NIR - [Red + (SWIR - Red) * (λNIR - λRed) / (λSWIR - λRed)]
 * Longueurs d'onde centrales Sentinel-2 :
 *   B4  (Red)  = 665 nm
 *   B8  (NIR)  = 842 nm
 *   B11 (SWIR) = 1610 nm
 * Indicateur : blooms algaux flottants / écumes marines
 */
function computeFAI(image) {
  // Longueurs d'onde centrales (nm) des bandes Sentinel-2 MSI
  var lambda_red  = 665;
  var lambda_nir  = 842;
  var lambda_swir = 1610;

  // Coefficient de pondération linéaire pour la ligne de base
  var coeff = (lambda_nir - lambda_red) / (lambda_swir - lambda_red);
  // coeff ≈ 0.1862

  var red  = image.select('B4');
  var nir  = image.select('B8');
  var swir = image.select('B11');

  // Ligne de base (baseline NIR interpolée entre Red et SWIR)
  var baseline = red.add(swir.subtract(red).multiply(coeff));

  // FAI = NIR - baseline
  var fai = nir.subtract(baseline)
               .rename('FAI')
               .copyProperties(image, ['system:time_start']);
  return fai;
}

/**
 * computeAllIndices : calcule les 6 indices pour une image composite.
 * @param {ee.Image} image - Image Sentinel-2 composite
 * @returns {ee.Image} Image multi-bandes avec tous les indices
 */
function computeAllIndices(image) {
  var ndti  = computeNDTI(image);
  var ndci  = computeNDCI(image);
  var ndwi  = computeNDWI(image);
  var mndwi = computeMNDWI(image);
  var cdom  = computeCDOM(image);
  var fai   = computeFAI(image);

  return ee.Image.cat([ndti, ndci, ndwi, mndwi, cdom, fai])
                 .copyProperties(image, ['system:time_start']);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 5 — COMPOSITES MENSUELS PAR MÉDIANE               ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * buildMonthlyComposite : génère le composite mensuel (médiane) d'un mois donné.
 * La médiane est préférée à la moyenne car elle :
 *   - Réduit l'influence des nuages résiduels
 *   - Minimise les valeurs aberrantes (speckle, brumes)
 *   - Améliore la stabilité spectrale des eaux côtières
 *
 * @param {ee.ImageCollection} collection - Collection S2 filtrée
 * @param {number} year  - Année (ex: 2025)
 * @param {number} month - Mois (1–12)
 * @returns {ee.Image|null} Composite mensuel clipé ou null si vide
 */
function buildMonthlyComposite(collection, year, month) {

  var startDate = ee.Date.fromYMD(year, month, 1);
  var endDate   = startDate.advance(1, 'month');

  var monthly = collection.filterDate(startDate, endDate);

  // CHECK IMAGE COUNT
  var count = monthly.size();

  print('Images disponibles :', year, month, count);

  // Return null if empty
  if (count.getInfo() === 0) {
    return null;
  }

  var composite = monthly.median().clip(studyArea);

  return composite;
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 6 — PALETTES DE VISUALISATION SCIENTIFIQUES       ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Palette turbidité (NDTI) — du bleu propre vers brun turbide ─
var VIZ_NDTI = {
  min: -0.2, max: 0.4,
  palette: ['0d3b66', '1a6faf', '48b5e8', 'f4e87c', 'd4875a', '8b3a0f']
};

// ─── Palette chlorophylle (NDCI) — du bleu vers rouge-algues ─────
var VIZ_NDCI = {
  min: -0.1, max: 0.3,
  palette: ['00007f', '0000ff', '00ffff', '00ff00', 'ffff00', 'ff0000']
};

// ─── Palette eau/terre (NDWI) — du terrestre vers aquatique ──────
var VIZ_NDWI = {
  min: -0.3, max: 0.8,
  palette: ['a52a2a', 'f5deb3', 'e0f7fa', '0288d1', '01579b']
};

// ─── Palette MNDWI — similaire NDWI, plus sensible ───────────────
var VIZ_MNDWI = {
  min: -0.5, max: 0.5,
  palette: ['964b00', 'f5c842', 'ccffcc', '00bcd4', '003366']
};

// ─── Palette CDOM — matière organique dissoute (transparent→brun) ─
var VIZ_CDOM = {
  min: -0.3, max: 0.3,
  palette: ['1a1a2e', '16213e', '0f3460', '533483', 'e94560', 'f5a623']
};

// ─── Palette FAI — algues flottantes (neutre → vert intense) ─────
var VIZ_FAI = {
  min: -0.05, max: 0.05,
  palette: ['084081', '0868ac', '43a2ca', 'a8ddb5', '41ab5d', '006837']
};

// ─── Palette RGB pour image vraie couleur ────────────────────────
var VIZ_RGB = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.0,
  max: 0.3,
  gamma: 1.4
};


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 7 — FONCTIONS D'EXPORT GEOTIFF                    ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * exportIndex : exporte un indice mensuel en GeoTIFF vers Google Drive.
 * @param {ee.Image}  indexImage - Image de l'indice à exporter
 * @param {string}    indexName  - Nom de l'indice (ex: 'NDTI')
 * @param {string}    monthLabel - Label du mois (ex: '2025_01')
 */
function exportIndex(indexImage, indexName, monthLabel) {

  var image = ee.Image(indexImage);

  var fileName   = indexName + '_' + monthLabel;
  var folderName = indexName;

  Export.image.toDrive({
    image: image.toFloat(),
    description: fileName,
    folder: folderName,
    fileNamePrefix: fileName,
    region: studyArea,
    scale: EXPORT_SCALE,
    crs: EXPORT_CRS,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e10
  });
}

/**
 * exportRGB : exporte le composite RGB mensuel vers Google Drive.
 * @param {ee.Image}  composite  - Composite mensuel Sentinel-2
 * @param {string}    monthLabel - Label du mois (ex: '2025_01')
 */
function exportRGB(composite, monthLabel) {
  var fileName = 'RGB_' + monthLabel;

  Export.image.toDrive({
    image:          composite.select(['B4','B3','B2']).toFloat(),
    description:    fileName,
    folder:         'RGB',
    fileNamePrefix: fileName,
    region:         studyArea,
    scale:          EXPORT_SCALE,
    crs:            EXPORT_CRS,
    fileFormat:     'GeoTIFF',
    maxPixels:      1e10
  });
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 8 — EXTRACTION SÉRIES TEMPORELLES (BONUS)         ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * extractTimeSeriesAtPoint : extrait les valeurs de tous les indices
 * pour un point GPS donné sur tous les mois disponibles.
 * Résultats exportés en CSV vers Google Drive.
 *
 * @param {Array}  indicesStack - Liste d'objets {label, indices}
 * @param {Object} pointConfig  - {lon, lat, name}
 */
function extractTimeSeriesAtPoint(indicesStack, pointConfig) {
  var point = ee.Geometry.Point([pointConfig.lon, pointConfig.lat]);

  // Construire une FeatureCollection temporelle
var features = indicesStack.map(function(entry) {

  var image = ee.Image(entry.indices);

  var values = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: point,
    scale: 30,
    maxPixels: 1e6
  });

  return ee.Feature(null, values)
    .set('month_label', entry.label)
    .set('point_name', pointConfig.name)
    .set('longitude', pointConfig.lon)
    .set('latitude', pointConfig.lat);
});

  var fc = ee.FeatureCollection(features);

  Export.table.toDrive({
    collection:       fc,
    description:      'TimeSeries_' + pointConfig.name,
    folder:           'TimeSeries',
    fileNamePrefix:   'TimeSeries_' + pointConfig.name,
    fileFormat:       'CSV'
  });
}

/**
 * computeMonthlyStats : calcule les statistiques mensuelles (min, max,
 * moyenne, médiane, écart-type) pour un indice donné sur la zone d'étude.
 *
 * @param {ee.Image} indexImage - Image de l'indice
 * @param {string}   indexName  - Nom de l'indice
 * @param {string}   monthLabel - Label du mois
 * @returns {ee.Feature} Feature contenant les statistiques
 */
function computeMonthlyStats(indexImage, indexName, monthLabel) {

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
    .set('month_label', monthLabel);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 9 — BOUCLE PRINCIPALE D'AUTOMATISATION            ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Chargement de la collection Sentinel-2 ──────────────────────
print('⏳ Chargement de la collection Sentinel-2...', S2_COLLECTION);
var s2Collection = loadS2Collection();
print('✅ Collection chargée. Nombre d\'images :', s2Collection.size());

// ─── Initialisation des structures pour séries temporelles ───────
var indicesStack        = [];   // [{label, indices}, ...]
var statsFeatures_NDTI  = [];
var statsFeatures_NDCI  = [];
var statsFeatures_NDWI  = [];
var statsFeatures_MNDWI = [];
var statsFeatures_CDOM  = [];
var statsFeatures_FAI   = [];

// ─── Référence au premier mois pour la visualisation ─────────────
// (on affiche le premier composite disponible dans la carte)
var firstComposite    = null;
var firstIndices      = null;
var firstMonthLabel   = '';

// ═════════════════════════════════════════════════════════════════
// BOUCLE SUR LES MOIS
// ═════════════════════════════════════════════════════════════════
for (var i = 0; i < MONTHS.length; i++) {

  var yr    = MONTHS[i].year;
  var mo    = MONTHS[i].month;
  var label = MONTHS[i].label;

  print('──────────────────────────────────────────────');
  print('📅 Traitement du mois :', label);

  // ── 1. Composite mensuel (médiane) ──────────────────────────────
  var composite = buildMonthlyComposite(s2Collection, yr, mo);
if (composite === null) {
  print('⚠ Aucun composite disponible pour :', label);
  continue;
}

  // ── 2. Calcul de tous les indices ──────────────────────────────
  var ndti  = computeNDTI(composite);
  var ndci  = computeNDCI(composite);
  var ndwi  = computeNDWI(composite);
  var mndwi = computeMNDWI(composite);
  var cdom  = computeCDOM(composite);
  var fai   = computeFAI(composite);

  // Image multi-bandes pour extraction ponctuelle
  var allIndices = ee.Image.cat([ndti, ndci, ndwi, mndwi, cdom, fai]);

  // Stockage pour séries temporelles
  indicesStack.push({label: label, indices: allIndices});

  // ── 3. Statistiques mensuelles ─────────────────────────────────
  statsFeatures_NDTI.push(computeMonthlyStats(ndti,  'NDTI',  label));
  statsFeatures_NDCI.push(computeMonthlyStats(ndci,  'NDCI',  label));
  statsFeatures_NDWI.push(computeMonthlyStats(ndwi,  'NDWI',  label));
  statsFeatures_MNDWI.push(computeMonthlyStats(mndwi,'MNDWI', label));
  statsFeatures_CDOM.push(computeMonthlyStats(cdom,  'CDOM',  label));
  statsFeatures_FAI.push(computeMonthlyStats(fai,    'FAI',   label));

  // ── 4. Exports GeoTIFF ─────────────────────────────────────────
  exportIndex(ndti,  'NDTI',  label);
  exportIndex(ndci,  'NDCI',  label);
  exportIndex(ndwi,  'NDWI',  label);
  exportIndex(mndwi, 'MNDWI', label);
  exportIndex(cdom,  'CDOM',  label);
  exportIndex(fai,   'FAI',   label);
  exportRGB(composite,        label);

  print('✅ Exports lancés pour :', label,
        '→ NDTI, NDCI, NDWI, MNDWI, CDOM, FAI, RGB');

  // ── 5. Mémoriser le premier composite pour visualisation ────────
  if (i === 0) {
    firstComposite  = composite;
    firstIndices    = allIndices;
    firstMonthLabel = label;
  }
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 10 — EXPORTS CSV (STATISTIQUES + SÉRIES TEMP.)    ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Export des statistiques mensuelles par indice ────────────────
var statsNames   = ['NDTI', 'NDCI', 'NDWI', 'MNDWI', 'CDOM', 'FAI'];
var statsArrays  = [
  statsFeatures_NDTI,
  statsFeatures_NDCI,
  statsFeatures_NDWI,
  statsFeatures_MNDWI,
  statsFeatures_CDOM,
  statsFeatures_FAI
];

for (var s = 0; s < statsNames.length; s++) {
  var statsFC = ee.FeatureCollection(statsArrays[s]);
  Export.table.toDrive({
    collection:     statsFC,
    description:    'Stats_' + statsNames[s],
    folder:         'Statistics',
    fileNamePrefix: 'Stats_' + statsNames[s],
    fileFormat:     'CSV'
  });
}

// ─── Export des séries temporelles par point GPS ─────────────────
for (var p = 0; p < SAMPLE_POINTS.length; p++) {
  extractTimeSeriesAtPoint(indicesStack, SAMPLE_POINTS[p]);
}

print('📊 Exports CSV statistiques et séries temporelles lancés.');


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 11 — VISUALISATION DANS L'ÉDITEUR GEE             ║
// ╚═══════════════════════════════════════════════════════════════╝

// Affichage basé sur le premier mois (Janvier 2025) ou le premier
// mois disponible avec données

print('🗺️  Ajout des couches de visualisation pour :', firstMonthLabel);

// ─── Vraie couleur RGB ────────────────────────────────────────────
Map.addLayer(
  firstComposite.select(['B4','B3','B2']),
  VIZ_RGB,
  'RGB — ' + firstMonthLabel,
  true
);

// ─── NDTI (Turbidité) ─────────────────────────────────────────────
Map.addLayer(
  firstIndices.select('NDTI'),
  VIZ_NDTI,
  'NDTI (Turbidité) — ' + firstMonthLabel,
  false
);

// ─── NDCI (Chlorophylle) ─────────────────────────────────────────
Map.addLayer(
  firstIndices.select('NDCI'),
  VIZ_NDCI,
  'NDCI (Chlorophylle) — ' + firstMonthLabel,
  false
);

// ─── NDWI (Eau) ──────────────────────────────────────────────────
Map.addLayer(
  firstIndices.select('NDWI'),
  VIZ_NDWI,
  'NDWI (Eau) — ' + firstMonthLabel,
  false
);

// ─── MNDWI (Eau modifié) ─────────────────────────────────────────
Map.addLayer(
  firstIndices.select('MNDWI'),
  VIZ_MNDWI,
  'MNDWI (Eau modifié) — ' + firstMonthLabel,
  false
);

// ─── CDOM (Matière organique dissoute) ────────────────────────────
Map.addLayer(
  firstIndices.select('CDOM'),
  VIZ_CDOM,
  'CDOM (Matière organique) — ' + firstMonthLabel,
  false
);

// ─── FAI (Algues flottantes) ──────────────────────────────────────
Map.addLayer(
  firstIndices.select('FAI'),
  VIZ_FAI,
  'FAI (Algues flottantes) — ' + firstMonthLabel,
  false
);

// ─── Points d'échantillonnage ─────────────────────────────────────
var samplePointsFC = ee.FeatureCollection(
  SAMPLE_POINTS.map(function(pt) {
    return ee.Feature(
      ee.Geometry.Point([pt.lon, pt.lat]),
      {name: pt.name}
    );
  })
);

Map.addLayer(
  samplePointsFC,
  {color: 'FFFF00'},
  'Points d\'échantillonnage',
  true
);


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 12 — AFFICHAGE CONSOLE & HISTOGRAMMES             ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── Informations sur la collection ──────────────────────────────
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('📈 RÉSUMÉ DES TRAITEMENTS');
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('Zone d\'étude     : Baie d\'Alger');
print('Période          : ' + START_DATE + ' → ' + END_DATE);
print('Filtre nuages    : < ' + CLOUD_THRESHOLD + ' %');
print('Composite        : Médiane mensuelle');
print('Résolution export: ' + EXPORT_SCALE + ' m');
print('Projection       : ' + EXPORT_CRS);
print('Mois traités     : ' + MONTHS.length);
print('Indices calculés : NDTI, NDCI, NDWI, MNDWI, CDOM, FAI');
print('Points GPS       : ' + SAMPLE_POINTS.length);
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ─── Histogramme du premier composite (NDTI) ─────────────────────
var chart_NDTI = ui.Chart.image.histogram({
  image:   firstIndices.select('NDTI'),
  region:  studyArea,
  scale:   30,
  maxBuckets: 50
}).setOptions({
  title:  'Histogramme NDTI — ' + firstMonthLabel,
  hAxis:  {title: 'Valeur NDTI'},
  vAxis:  {title: 'Nombre de pixels'},
  colors: ['#1a6faf']
});
print(chart_NDTI);

// ─── Histogramme FAI ─────────────────────────────────────────────
var chart_FAI = ui.Chart.image.histogram({
  image:   firstIndices.select('FAI'),
  region:  studyArea,
  scale:   30,
  maxBuckets: 50
}).setOptions({
  title:  'Histogramme FAI — ' + firstMonthLabel,
  hAxis:  {title: 'Valeur FAI'},
  vAxis:  {title: 'Nombre de pixels'},
  colors: ['#006837']
});
print(chart_FAI);

// ─── Histogramme NDCI ────────────────────────────────────────────
var chart_NDCI = ui.Chart.image.histogram({
  image:   firstIndices.select('NDCI'),
  region:  studyArea,
  scale:   30,
  maxBuckets: 50
}).setOptions({
  title:  'Histogramme NDCI — ' + firstMonthLabel,
  hAxis:  {title: 'Valeur NDCI'},
  vAxis:  {title: 'Nombre de pixels'},
  colors: ['#00a651']
});
print(chart_NDCI);


// ╔═══════════════════════════════════════════════════════════════╗
// ║  SECTION 13 — LÉGENDE VISUELLE DANS LA CARTE               ║
// ╚═══════════════════════════════════════════════════════════════╝

/**
 * makeLegend : crée un panneau de légende pour la carte GEE.
 * @param {string} title    - Titre de la légende
 * @param {Array}  palette  - Tableau de couleurs HEX
 * @param {number} minVal   - Valeur minimale
 * @param {number} maxVal   - Valeur maximale
 */
function makeLegend(title, palette, minVal, maxVal) {
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding:  '8px 15px',
      backgroundColor: 'rgba(255,255,255,0.85)'
    }
  });

  legend.add(ui.Label({
    value: title,
    style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}
  }));

  // Barre de couleur
  var colorBar = ui.Thumbnail({
    image:  ee.Image.pixelLonLat().select(0),
    params: {
      bbox:       '0,0,1,0.1',
      dimensions: '200x20',
      format:     'png',
      min:        0,
      max:        1,
      palette:    palette
    },
    style: {stretch: 'horizontal', margin: '0px 8px'}
  });
  legend.add(colorBar);

  // Étiquettes min/max
  var labels = ui.Panel({
    widgets: [
      ui.Label(minVal.toString(), {margin: '4px 8px'}),
      ui.Label(maxVal.toString(), {
        margin:  '4px 8px',
        textAlign: 'right',
        stretch:   'horizontal'
      })
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  legend.add(labels);

  return legend;
}

// Ajout de la légende NDTI à la carte
Map.add(makeLegend(
  'NDTI — Turbidité\n(Jan. 2025)',
  VIZ_NDTI.palette,
  VIZ_NDTI.min,
  VIZ_NDTI.max
));


// ╔═══════════════════════════════════════════════════════════════╗
// ║  FIN DU SCRIPT                                              ║
// ╚═══════════════════════════════════════════════════════════════╝
print('');
print('✅ Script terminé.');
print('📂 Vérifiez l\'onglet "Tasks" (▶) pour lancer les exports GEE.');
print('📁 Les fichiers seront créés dans Google Drive :');
print('   NDTI/ | NDCI/ | NDWI/ | MNDWI/ | CDOM/ | FAI/ | RGB/');
print('   Statistics/ | TimeSeries/');
print('');
print('⚠️  IMPORTANT : Cliquez sur "RUN ALL" dans l\'onglet Tasks pour');
print('   démarrer tous les exports simultanément.');
