This folder contains selected figures, maps and statistical results from the marine pollution analysis.

# Results and interpretation

## Status of published outputs

The results below are taken from the final Master II thesis (USTHB, 2026), Chapter IV.
## Field observations (March–May 2025)

Eight stations (`BTC0`–`BTC7`) near the Borj El Kiffan desalination plant, sampled once per month (n = 8 per month, 24 observations in total). Exact sampling days are not recorded.

| Variable | March 2025 | April 2025 | May 2025 |
|---|---|---|---|
| Turbidity, mean (range), FNU | not reproduced here (max 11.04 at BTC4) | 2.65 (1.09–3.77) | 3.69 (2.80–4.88) |
| Chlorophyll-a, mean (range), µg/L | 2.09 (1.45–3.81) | 3.28 (2.62–4.28) | 1.92 (1.49–2.51) |
| NO3-, mean (range), µmol/L | 0.46 (0.27–0.72) | 0.73 (0.55–0.90) | 0.53 (0.18–0.84) |

Other variables (temperature, salinity, pH, dissolved oxygen, silicates) are summarised in Table 8 of the thesis. The thesis reports a pH drop and a dissolved-oxygen anomaly in May 2025 and itself notes that these may reflect a probe issue; they are not interpreted further here.

Units: the thesis reports turbidity in FNU in its tables but in NTU in its regression results. This needs to be harmonised before publication.

## Satellite–field comparison

Sentinel-2 L2A indices were extracted at each station (median of a 3 × 3 pixel window) and compared with the field values by simple regression (n = 24, same data used to fit and evaluate, no independent validation set):

| Parameter | Index | Model | R² | RMSE | MAE |
|---|---|---|---|---|---|
| Turbidity | NDTI | Linear | 0.0794 | 2.0746 | 1.4178 |
| Turbidity | NDTI | Exponential | 0.0819 | 2.0718 | 1.3986 |
| Chlorophyll-a | NDCI | Linear | 0.1415 | 0.7535 | 0.6207 |
| Chlorophyll-a | NDCI | Exponential | 0.1411 | 0.7537 | 0.6199 |

Bias was not reported. Equations are in `methodology.md` (section 6).

## Current interpretation

- The relationships between the field observations and the spectral indices are weak (R² ≈ 0.08 for NDTI–turbidity, ≈ 0.14 for NDCI–chlorophyll-a). They do not support reliable quantitative estimation of concentrations from these indices alone.
- The thesis finds NDCI more coherent for chlorophyll-a than NDTI is for turbidity, and attributes the modest performance mainly to the narrow range of measured in situ values and the optical complexity of the bay.
- The indices (NDTI, NDCI, CDOM, FAI, NDWI, MNDWI) are used as qualitative, spatial and seasonal indicators. On the January–May 2026 series, the thesis identifies the mouths of Oued El Harrach (highest NDTI) and Oued El Hamiz (highest CDOM), and the port areas, as the most affected sectors. These are patterns in spectral indices, not measured pollutant concentrations.

## Outputs still to add to `results/`

The figures below exist in the thesis. Tick an item once the file is in this repository and checked.

- [ ] **Study-area map:** study area and the eight stations, with scale, coordinate reference and data source.
- [ ] **Field-observation summary:** number of valid observations per variable and month, with units (Table 8).
- [ ] **Index maps:** NDWI/MNDWI (Figures 36, 43, 45), NDTI (37, 46), CDOM (39, 48), FAI (40, 49), NDCI (41, 47) and the combined views (42, 44), with legends and processing periods.
- [ ] **Comparison plots:** the 24 paired observations and extracted index values, with sample count and the month-only matching limitation.
- [ ] **Statistical summary:** Table 9 exported from the analysis script, with the exact sample and method.
- [ ] **Limitations statement:** consequences of monthly-only field dates, pixel size, coastal mixed pixels and the proxy nature of spectral indices.

## Interpretation limits

- The field records cover March–May 2025 and do not specify exact sampling days, so a day-specific match with satellite acquisitions cannot be asserted.
- The January–May 2026 maps rely on relationships calibrated on 2025 data and are not supported by 2026 field measurements.
- Satellite indices are not direct measurements of pollutant concentration.
- Shallow-water reflectance, suspended matter, phytoplankton, dissolved colored material, atmospheric-correction residuals and land adjacency can influence spectral signals.
- A relationship fitted to the same data used to develop it is not, by itself, independent validation, and the sample (n = 24) is small.
- No predictive model or validated quantitative concentration-retrieval product is claimed here.
- The thesis text calls the NDTI–turbidity relation "robust" and NDTI a "reliable estimator". The reported R² does not support that wording, and it is not repeated here.

## Reporting rule

Do not enter numerical values, statistical significance, trend claims or map descriptions until they have been checked against the original analysis outputs. If a result is not available or cannot be verified, state that explicitly rather than estimating or reconstructing it.
