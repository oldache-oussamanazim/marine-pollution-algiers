# Marine Pollution in the Bay of Algiers: Physico-Chemical Analysis and Remote Sensing

## Project overview

This project investigates the use of Sentinel-2 satellite imagery alongside physico-chemical and biological observations to examine marine-water conditions in the Bay of Algiers, Algeria.

The work was developed as a final-year research project titled **“Analyse couplée physico-chimie et télédétection de la pollution marine dans la baie d’Alger”**. It explores whether satellite-derived spectral indices can help describe the spatial patterns of selected water-quality indicators. The project does **not** assume that satellite indices can provide reliable quantitative estimates of pollutant concentrations.

## Study area and in-situ data

- **Geographic context:** Bay of Algiers, with field observations associated with the Borj El Kiffan coastal area.
- **Field campaign period:** March–May 2025.
- **Sampling network:** 14 stations.
- **Sampling depth:** surface water, at approximately 1 m maximum depth.
- **Recorded variables:** temperature, pH, salinity, dissolved oxygen, turbidity, chlorophyll-a, suspended matter (MES), nutrients (including ammonium, nitrate, phosphate and silicate), and biological variables recorded in the working dataset.

The available records identify the campaign by month. Exact sampling days are not available in the current dataset description; therefore, an exact day-by-day satellite match cannot be claimed.

Raw field spreadsheets and other sensitive or unpublished source data are not included in this repository.

## Satellite data and processing

The workflow uses Sentinel-2 imagery and a combination of Google Earth Engine (GEE), SNAP and ACOLITE. Processing approaches documented in the project include:

- Sentinel-2 Level-2A bottom-of-atmosphere (BOA) imagery and monthly composites.
- Sentinel-2 Level-1C imagery processed with ACOLITE using the Dark Spectrum Fitting (DSF) atmospheric-correction approach, followed by band calculations in SNAP.
- Calculation or examination of the following indices: NDTI, NDCI, CDOM-related index, FAI, NDWI and MNDWI.
- Monthly median GeoTIFF products prepared through GEE for the available analysis period.

The exact input product, correction method, date window and masking choices must be recorded for each exported raster before the workflow is considered fully reproducible. Indices should be interpreted as spectral proxies, not as direct measurements of a specific pollutant.

## Methodology

The analysis follows four broad stages:

1. **Prepare observations:** organize field observations by station, month and measured variable, and document units and data quality.
2. **Prepare satellite imagery:** select suitable Sentinel-2 scenes or monthly composites, apply the documented processing workflow, and calculate the selected indices.
3. **Extract and compare values:** extract representative pixel values for the field locations and compare them with the available observations, while documenting spatial and temporal mismatch.
4. **Evaluate relationships and limitations:** use appropriate statistical summaries and error metrics where supported by the data, and assess whether observed relationships justify qualitative mapping or quantitative estimation.

For further details, see [`methodology/methodology.md`](methodology/methodology.md).

## Results and interpretation

The current interpretation is that the relationships between the field measurements and satellite indices are too weak to support reliable quantitative estimation of water-quality concentrations from the indices alone. The indices may still be useful for describing broad spatial patterns related to turbidity, chlorophyll-a and other optical water properties.

This interpretation must be read in the context of the limited sampling period, monthly-only field dates, spatial resolution of the imagery, and the distinction between optical proxies and direct laboratory or field measurements. No concentration-prediction model is claimed by this project.

A structured results record is maintained in [`results/README.md`](results/README.md). Numerical statistics, plots and maps should be added only when the corresponding outputs have been checked and are available for review.

## Tools

- **Google Earth Engine (GEE):** satellite data access and monthly raster preparation.
- **ESA SNAP:** satellite image inspection and band-math operations.
- **ACOLITE:** atmospheric correction for the Level-1C processing branch described above.
- **GIS and statistical tools:** used where applicable to inspect rasters, extract values and compare observations.

Software versions, scene identifiers, processing parameters and scripts should be added when they have been verified from the original workflow.

## Limitations

- Field observations cover March–May 2025; the available records do not specify exact sampling days.
- A precise satellite acquisition match within a defined number of days cannot be asserted without exact field dates.
- Sentinel-2 pixels represent an area, whereas field measurements represent local sampling conditions.
- Water-quality indices are indirect spectral indicators and may respond to multiple optical and environmental influences.
- The available evidence does not justify claiming reliable quantitative concentration retrieval from these indices.
- No predictive machine-learning model is claimed in this repository.

## Reproducibility and data availability

This repository documents the research workflow; it does not currently distribute the raw field dataset or a complete executable processing pipeline. Reproduction will require access to the relevant satellite products, verified processing parameters and any scripts used in the original analysis.

Do not interpret the absence of a file from this repository as evidence that the analysis step was not performed; it means only that the corresponding artifact has not yet been published here.

## Author

**Oussama Nazim Oldache**

- GitHub: [oldache-oussamanazim](https://github.com/oldache-oussamanazim)
- LinkedIn: [Oussama Nazim Oldache](https://www.linkedin.com/in/oldache-oussama-nazim-4210b6266/)
- Portfolio: [oldache-oussamanazim.github.io](https://oldache-oussamanazim.github.io/)

---

*This documentation distinguishes the methods and interpretation currently described for the project.*
