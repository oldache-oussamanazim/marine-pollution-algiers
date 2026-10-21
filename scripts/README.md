# Google Earth Engine Scripts

## Overview

This directory contains the Google Earth Engine (GEE) scripts developed for the project **“Coupled Physico-Chemical Analysis and Remote Sensing of Marine Pollution in the Bay of Algiers, Algeria.”**

The scripts process Sentinel-2 satellite imagery to investigate the spatial and temporal distribution of selected water-quality-related spectral indices.

Two temporal compositing approaches are used in the project: **monthly median composites** and **seasonal median composites**.


## 1. Monthly Median Composites

The monthly workflow uses the median of satellite observations available within each month to produce monthly composite images.

This approach supports the examination of month-to-month variations in spectral indices and the mapping of their spatial distribution over the study area.

The workflow include:

- Filtering Sentinel-2 imagery by date and study area.
- Applying the image-quality and masking procedures implemented in the script.
- Generating monthly median composites.
- Calculating and processing the selected spectral indices.
- Exporting raster products for further analysis and visualization.


## 2. Seasonal Median Composites

The seasonal workflow uses the median of satellite observations grouped by season to produce seasonal composite images.

This approach supports the comparison of broader seasonal patterns while reducing the influence of individual observations on the composite.


## 3. Spectral Indices

The project investigates the following indices or index families:

- Normalized Difference Turbidity Index (NDTI)
- Normalized Difference Chlorophyll Index (NDCI)
- CDOM-related index
- Floating Algae Index (FAI)
- Normalized Difference Water Index (NDWI)
- Modified Normalized Difference Water Index (MNDWI)


## 4. Data and Tools

- **Google Earth Engine:** satellite-image filtering, compositing, index processing and raster export.
- **Sentinel-2:** satellite imagery used in the project.
- **QGis:** Used for geospatial data visualization, final map design and cartography, custom raster calculations, layer masking, and spatial overlay with in situ sampling station coordinates.


## 5. Usage

1. Open the relevant script in the Google Earth Engine Code Editor.
2. Check the study-area geometry, date ranges and image filters.
3. Verify the required Earth Engine assets and permissions.
4. Run the script and inspect the resulting composites and indices.
5. Export the outputs using the settings defined in the script.

Some workflows may require private assets or external data that are not included in this repository.

## 6. Reproducibility and Limitations

The scripts document the satellite-processing approaches used in the project. Full reproducibility depends on access to the required inputs, assets, processing parameters and software environment.

Spectral indices are indirect indicators of optical water properties. They should not be interpreted as direct pollutant concentrations without appropriate calibration and validation.

Raw field measurements and unpublished source datasets are not included in this directory.

## Related Documentation

- [Project overview](../README.md)
- [Methodology](../methodology/methodology.md)
- [Results and interpretation](../results/README.md)

---


*This documentation describes the two temporal compositing approaches used in the project.*

*Note: Complete mathematical derivations, calibration coefficients, and exhaustive methodological details are documented in the accompanying Projet de Fin d'Études (PFE) manuscript.*
