# Methodology

## 1. Purpose

This document describes the known methodological components of the project **“Analyse couplée physico-chimie et télédétection de la pollution marine dans la baie d’Alger”**.

The purpose is to compare available water-quality observations with Sentinel-2-derived spectral indices and assess whether those indices support spatial interpretation. The workflow is not described as a validated quantitative concentration-retrieval model.

## 2. Field observations

### 2.1 Sampling context

- **Study area:** Bay of Algiers, with observations associated with the Borj El Kiffan coastal area.
- **Stations:** 14.
- **Campaign months:** March, April and May 2025.
- **Sampling depth:** surface water, with a reported maximum depth of approximately 1 m.

The dataset is recorded at monthly resolution (`MAR_2025`, `APR_2025`, `MAY_2025`). Exact sampling dates are not available.

### 2.2 Variables

The working dataset includes the following variables :

- Station
- Date
- Temperature (`C°`)
- Salinity
- pH
- Dissolved oxygen (`mg\L`)
- Turbidity (`FNU`)
- ZOO.masse (`µg/L`)
- PHY.C.masse (`µg/L`)
- Chlorophyll-a (`µg/L`)
- NH4+ (`µmol/L`)
- NO3- (`µmol/L`)
- PO4- (`µmol/L`)
- SIO2 (`µmol/L`)


Raw field spreadsheets and unpublished source data are included in this repository.

## 3. Satellite data

Sentinel-2 imagery was used to derive spectral indicators of water properties. The documented processing branches include:

1. **Level-2A branch:** Sentinel-2 bottom-of-atmosphere (BOA) imagery, including monthly raster products prepared using Google Earth Engine (GEE).
2. **Level-1C branch:** Sentinel-2 Level-1C imagery processed with ACOLITE using Dark Spectrum Fitting (DSF), followed by band calculations in ESA SNAP.

These are distinct processing branches. They should not be described as one identical correction chain. For each result, record the product level, acquisition or compositing period, atmospheric-correction approach, software version and export settings actually used.

Monthly median GeoTIFF products are documented for March 2025–May 2026, and additional older raster files have been described for January 2016–January 2023. These date ranges do not by themselves establish that every month has valid coverage or that all products were used in the field comparison. List the actual files and dates before making a complete temporal-coverage claim.

## 4. Spectral indices

The project examines the following indices or index families:

- **NDTI:** Normalized Difference Turbidity Index.
- **NDCI:** Normalized Difference Chlorophyll Index.
- **CDOM-related index:** used as a spectral indicator associated with colored dissolved organic matter; the exact formula must be documented from the processing script.
- **FAI:** Floating Algae Index.
- **NDWI:** Normalized Difference Water Index.
- **MNDWI:** Modified Normalized Difference Water Index.

NDWI/MNDWI can be used as part of water masking, but the chosen mask, Index values are spectral proxies and can be affected by suspended sediments, phytoplankton, colored dissolved matter, bottom reflectance in shallow water, atmospheric-correction residuals and adjacency effects.


## 5. Linking field observations and satellite pixels

The project includes comparisons between field observations and representative satellite pixel values. The working notes refer to median pixel extraction and a 3 × 3 pixel neighbourhood as a used extraction approach.


## 6. Statistical evaluation

The project has considered statistical comparison of field measurements and satellite indices. Where computed from verified paired data, appropriate measures may include:

- coefficient of determination (`R²`);
- root mean square error (`RMSE`);
- mean absolute error (`MAE`);
- bias.

These metrics are meaningful only when the compared quantities, units, sample count, pairing rules and model form are clearly specified. In particular, metrics from a fitted relationship should not be presented as evidence of concentration-retrieval accuracy unless the model target, validation design and independent validation data support that interpretation.

Do not add numerical values to this document until they have been checked against the actual analysis outputs. Do not imply that linear, exponential, polynomial or machine-learning models were all retained or validated merely because they were considered during exploration.

## 7. Interpretation

The current project interpretation is that the observed relationships are not sufficiently strong to justify reliable quantitative estimation of water-quality concentrations from the examined indices alone. The indices may still support qualitative or spatial analysis of optical water properties, including patterns associated with turbidity and chlorophyll-a.

This interpretation is not equivalent to proving that the indices are universally unsuitable. It is limited to the observations, period, processing choices and validation evidence available for this study.

## 8. Reproducibility checklist

Before claiming full reproducibility, record or publish, where appropriate:

- exact Sentinel-2 product IDs and dates;
- atmospheric-correction method and parameters for each processing branch;
- index formulae and band mappings;
- water-mask method and thresholds;
- coordinate reference system and raster resolution;
- field-to-pixel matching and neighbourhood extraction rules;
- treatment of missing values and outliers;
- analysis scripts and software versions;
- sample counts and the exact outputs used to calculate each statistic.

Raw field data should be shared only if the author has the right to distribute it and has checked that publication is appropriate.
