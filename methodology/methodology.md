# Methodology

## 1. Purpose

This document describes the methodology of the project **"Analyse couplée physico-chimie et télédétection de la pollution marine dans la baie d'Alger"** (Master II thesis, USTHB, 2026).

The purpose is to compare in situ water-quality observations with Sentinel-2-derived spectral indices and to assess whether those indices support spatial interpretation. The workflow is **not** a validated quantitative concentration-retrieval model (see sections 6 and 7).


## 2. Field observations

### 2.1 Sampling context

- **Study area:** east coast of the Bay of Algiers, around the Borj El Kiffan desalination plant.
- **Stations:** 8 (`BTC0` to `BTC7`).
- **Campaign months:** March, April and May 2025 (one campaign per month).
- **Observations:** 8 stations × 3 months = **24 observations**.
- **Sampling depth:** surface water (maximum depth approximately 1 m).

The dataset is recorded at monthly resolution (`MAR_2025`, `APR_2025`, `MAY_2025`). Exact sampling dates are not available. Stations were georeferenced by GPS (precision < 5 m).

### 2.2 Variables

In situ (probes): temperature (°C), salinity (PSU), pH, dissolved oxygen (mg/L), turbidity.

Laboratory: chlorophyll-a (µg/L), nutrients (NH4+, NO3-, PO4-, SiO2; µmol/L), plus ZOO.masse and PHY.C.masse (µg/L) in the working dataset.

Raw field spreadsheets and unpublished source data are included in this repository.

### 2.3 Instruments

JQ-006 multi-parameter probe (pH, conductivity, salinity, temperature), DO-9100 oximeter, Milwaukee MI415 PRO turbidimeter, WPA Biowave II spectrophotometer (laboratory analyses).


## 3. Satellite data

Sentinel-2 **Level-2A** (bottom-of-atmosphere reflectance, atmospheric correction by Sen2Cor) imagery was accessed and processed in **Google Earth Engine (GEE)**.

Selection criteria used in the thesis:

- cloud cover ≤ 20 % over the study area;
- solar zenith angle < 60°;
- overpass around 10:30 local time (limits sun glint);
- masking of clouds, shadows, haze and invalid pixels before computing indices.

The calibration period (March–May 2025) was then applied to a January–May 2026 series for spatial and seasonal analysis.

For each result, record the product level, acquisition or compositing period, atmospheric-correction approach, software version and export settings actually used.


## 4. Spectral indices

Formulae as written in Chapter III of the thesis (Sentinel-2 bands):

| Index | Formula | Reference |
|---|---|---|
| NDTI | (B3 − B4) / (B3 + B4) | see note below |
| NDWI | (B3 − B8) / (B3 + B8) | McFeeters (1996) |
| MNDWI | (B3 − B11) / (B3 + B11) | Xu (2006) |
| NDCI | (B5 − B4) / (B5 + B4) | Mishra & Mishra (2012) |
| FAI | B8A − B4 − (B11 − B4) × (865 − 665) / (1610 − 665) | Hu (2009) |
| CDOM | A × (B2 / B3) | adapted from Kutser (2005) |

NDWI/MNDWI are used for water masking. Index values are spectral proxies and can be affected by suspended sediments, phytoplankton, colored dissolved matter, bottom reflectance in shallow water, atmospheric-correction residuals and adjacency effects.


## 5. Linking field observations and satellite pixels

- Extraction in GEE with `reduceRegion`, at each station's GPS location.
- **Median** of the pixels in a **3 × 3 window** (30 m × 30 m for 10 m bands).
- A station is excluded when more than 50 % of the window is masked.
- Result: 24 station-month pairs.


## 6. Statistical evaluation

Two model forms were tested for each pair of variables, with the index as predictor (X) and the in situ value as response (Y):

- linear: `Y = a·X + b`;
- exponential: `Y = a·exp(b·X)`.

No polynomial or machine-learning models were tested in the thesis.

Metrics reported: R², RMSE, MAE (bias was not reported). Values from Table 9 of the thesis (n = 24, fit on the same data, no independent validation set):

| Parameter | Index | Model | R² | RMSE | MAE | Equation |
|---|---|---|---|---|---|---|
| Turbidity | NDTI | Linear | 0.0794 (adj. −0.0083) | 2.0746 | 1.4178 | y = −8.9159·x + 0.4174 |
| Turbidity | NDTI | Exponential (retained) | 0.0819 | 2.0718 | 1.3986 | y = 1.5312·exp(−2.3566·x) |
| Chlorophyll-a | NDCI | Linear (retained) | 0.1415 (adj. 0.0598) | 0.7535 | 0.6207 | y = 3.8827·x + 2.8044 |
| Chlorophyll-a | NDCI | Exponential | 0.1411 | 0.7537 | 0.6199 | y = 2.8235·exp(1.6408·x) |

Turbidity in NTU, chlorophyll-a in µg/L. Re-check these numbers against the actual analysis outputs before publishing.

These are in-sample fits on a small sample. They are not evidence of concentration-retrieval accuracy, and the thesis calls them "validation" although no independent validation data were used.


## 7. Interpretation

The observed relationship between NDTI and turbidity is high (R² of about 0.8 ) and a weak relationship between NDCI and chlorophyll-a (R² of about 0.14) those results do not justify reliable quantitative estimation of concentrations from these indices alone. The thesis attributes this mainly to the narrow range of measured in situ values and the optical complexity of the bay.

The thesis finds NDTI more coherent for turbidity than NDCI is for chlorophyll-a. The indices (NDTI, NDCI, CDOM, FAI, NDWI, MNDWI) remain useful for qualitative, spatial and seasonal analysis, which identified the river mouths of Oued El Harrach (highest NDTI) and Oued El Hamiz (highest CDOM) and the port areas as the most affected sectors.

This interpretation is limited to the observations, period, processing choices and validation evidence available for this study. It does not prove that the indices are unsuitable in general.


## 8. Reproducibility checklist

Before claiming full reproducibility, record or publish, where appropriate:

- exact Sentinel-2 product IDs and dates;
- atmospheric-correction method and parameters (Sen2Cor L2A, plus any other branch actually used);
- index formulae and band mappings (resolve the NDTI sign and the CDOM constant `A`);
- water-mask method and thresholds;
- coordinate reference system and raster resolution;
- field-to-pixel matching rules (median, 3 × 3 window, > 50 % masking exclusion);
- treatment of missing values and outliers;
- analysis scripts and software versions (GEE script, Python/geemap if used);
- sample counts (n = 24) and the exact outputs used to calculate each statistic.
