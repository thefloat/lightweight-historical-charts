/* 
Copyright 2023 opolopo eniyan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 
*/


import * as LightweightCharts from 'lightweight-charts';
import * as sl from './series-source-lookup'; //sl - source lookup
import CSVParser, { type ChartEvents } from '../utils/csv-parser';
import { ChartDropdown, type ChartItem } from './chart-dropdown';


interface SeriesInstance<TSeriesType extends LightweightCharts.SeriesType> {
    suffix?: string;
    seriesSource: sl.SeriesSource;
    seriesType: TSeriesType;
    series: LightweightCharts.ISeriesApi<TSeriesType>;
    data?: LightweightCharts.SeriesDataItemTypeMap[TSeriesType][];
    legendElement: HTMLElement;
}

interface MarkerInstance<HorzScaleItem> {
    pluginApi: LightweightCharts.ISeriesMarkersPluginApi<HorzScaleItem>;
    data: LightweightCharts.SeriesMarker<HorzScaleItem>[];
    label: string;
}

// ============================================================================
// Series Factory Functions
// ============================================================================

/**
 * Creates a line series with consistent scale margins.
 * Used for all trend lines and indicators displayed as lines.
 */
function addLineSeries(
  chart: LightweightCharts.IChartApi,
  options?: LightweightCharts.SeriesPartialOptionsMap["Line"],
  paneIndex?: number
): LightweightCharts.ISeriesApi<"Line"> {
    const series = chart.addSeries(LightweightCharts.LineSeries, options);
    
    series.priceScale().applyOptions({
        scaleMargins: {
            top: 0.1,
            bottom: 0.4,
        },
    });

    if (paneIndex) {
        series.moveToPane(paneIndex)
    }
    
    return series;
}

/**
 * Creates a volume histogram series with a consistent price scale
 */
function addHistogramSeries(
  chart: LightweightCharts.IChartApi,
  options?: LightweightCharts.SeriesPartialOptionsMap["Histogram"],
  paneIndex?: number
): LightweightCharts.ISeriesApi<"Histogram"> {
    const series = chart.addSeries(LightweightCharts.HistogramSeries, options);
    
    series.priceScale().applyOptions({
        scaleMargins: {
            top: 0.7,
            bottom: 0,
        },
    });

    if (paneIndex) {
        series.moveToPane(paneIndex)
    }
    
    return series;
}

/**
 * Creates a candlestick series configured for optimal price display.
 * Sets scaling options to prevent rendering issues.
 */
function addCandlestickSeries(
  chart: LightweightCharts.IChartApi,
  options?: LightweightCharts.SeriesPartialOptionsMap["Candlestick"],
  paneIndex?: number
): LightweightCharts.ISeriesApi<"Candlestick"> {
    const series = chart.addSeries(LightweightCharts.CandlestickSeries, options);
    
    series.priceScale().applyOptions({
        autoScale: true, // Note: Setting to false causes a bug where chart doesn't render sometimes
        scaleMargins: {
            top: 0.1,
            bottom: 0.4,
        },
    });

    if (paneIndex) {
        series.moveToPane(paneIndex)
    }
    
    return series;
}

function createTradeEventMarkers(
    chartEvents: ChartEvents[]
): LightweightCharts.SeriesMarkerBar<LightweightCharts.Time>[] {

    const markers: LightweightCharts.SeriesMarkerBar<LightweightCharts.Time>[] = [];
    chartEvents.forEach((ce) => {
        const events_counts = ce.events.reduce((acc , curr) => {
            const count = (acc.get(curr) ?? 0) +1;
            return acc.set(curr, count);
        }, new Map<string, number>())

        events_counts.forEach((v, k) => {
            if (!(k in sl.MarkerBarConfig)) return;

            const markerOptions = {...sl.MarkerBarConfig[k as sl.EventType]};

            const count = v > 1 ? v : '' 

            markers.push({
                ...markerOptions,
                time: ce.time,
                text: markerOptions.text ? markerOptions.text + count : undefined
            })
        })
    })
    return markers;
}

/**
 * Create legend element for a simple series.
 */
function createLegendElement(): HTMLElement {
    const legendDiv = document.createElement('div');
    legendDiv.classList.add('legend');
    return legendDiv;
}

/**
 * Create legend element to hold all series for a particular indicator.
 */
function createLegendGroupDiv(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'legend-group';
    return div;
}

/**
 * Create symbol for a group div
 */
function createGroupSymbolElement(symbol: string): HTMLElement {
    const symElement = document.createElement('span');
    symElement.className = 'legend-sym';
    symElement.textContent = symbol + ':';
    return symElement;
}

function createSeriesInstance(
    seriesSource: sl.SeriesSource,
    seriesType: 'Candlestick',
    chart: LightweightCharts.IChartApi,
    seriesOptions?: LightweightCharts.SeriesPartialOptionsMap["Candlestick"],
    paneIndex?: number,
    suffix?: string
): SeriesInstance<'Candlestick'> | undefined;

function createSeriesInstance(
    seriesSource: sl.SeriesSource,
    seriesType: 'Histogram',
    chart: LightweightCharts.IChartApi,
    seriesOptions?: LightweightCharts.SeriesPartialOptionsMap["Histogram"],
    paneIndex?: number,
    suffix?: string
): SeriesInstance<'Histogram'> | undefined;

function createSeriesInstance(
    seriesSource: sl.SeriesSource,
    seriesType: 'Line',
    chart: LightweightCharts.IChartApi,
    seriesOptions?: LightweightCharts.SeriesPartialOptionsMap["Line"],
    paneIndex?: number,
    suffix?: string
): SeriesInstance<'Line'> | undefined;

function createSeriesInstance<TSeriesType extends LightweightCharts.SeriesType>(
    seriesSource: sl.SeriesSource, 
    seriesType: TSeriesType,
    chart: LightweightCharts.IChartApi,
    seriesOptions?: LightweightCharts.SeriesPartialOptionsMap[TSeriesType],
    paneIndex?: number,
    suffix?: string
): SeriesInstance<TSeriesType> | undefined;

/**
 * Create a new SeriesIntance object. 
 * Takes the all require parameters to create the core ISeriesAPI
 */
function createSeriesInstance<TSeriesType extends LightweightCharts.SeriesType>(
    seriesSource: sl.SeriesSource, 
    seriesType: TSeriesType,
    chart: LightweightCharts.IChartApi,
    seriesOptions?: LightweightCharts.SeriesPartialOptionsMap[TSeriesType],
    paneIndex?: number,
    suffix?: string
): SeriesInstance<TSeriesType> | undefined {
    let series;

    switch (seriesType) {
        case 'Candlestick':
            series = addCandlestickSeries(chart);
            break;
        case 'Histogram':
            series = addHistogramSeries(chart, seriesOptions);
            break;
        case 'Line':
            series = addLineSeries(chart, seriesOptions, paneIndex);
            break;
        default:
            console.error('Unhandled series type:', seriesType);
            (series as never);
            return undefined;
    }

    return {
        suffix: suffix,
        seriesSource: seriesSource,
        seriesType: seriesType,
        series: series as LightweightCharts.ISeriesApi<TSeriesType>,
        legendElement: createLegendElement()
    };
}

function createTradeMarkerInstance(
    candlestickSeries: LightweightCharts.ISeriesApi<'Candlestick'>, 
    csvParser: CSVParser
): MarkerInstance<LightweightCharts.Time> {

    return {
        pluginApi: LightweightCharts.createSeriesMarkers(candlestickSeries),
        data: createTradeEventMarkers(csvParser.parseTradeEvents()),
        label: 'Trade Events'
    }
}

type BbAndDc = Extract<sl.SeriesSource, `bb_${string}` | `dc_${string}`>

function getSourceOptions<S extends BbAndDc>(
    source: S, num: number
): LightweightCharts.SeriesPartialOptionsMap[sl.SeriesSources[S]] {
    const sourceColorMap = {
        'bb_ul': ['#dc7369', '#c22929', '#87312b'],
        'bb_m': ['#feff83', '#ffff00', '#9e9e00'],
        'dc_ul': ['#5f73da', '#2e29c2', '#181577'],
        'dc_m': ['#a95ea7', '#800080', '#273186']
    }

    const sourceOptions = {...sl.SeriesSourceConfigs[source]['seriesOptions']}
    switch (source) {
        case 'bb_upper':
        case 'bb_lower':
            sourceOptions.color = sourceColorMap['bb_ul'][num]
            break;
        case 'bb_middle':
            sourceOptions.color = sourceColorMap['bb_m'][num]
            break;
        case 'dc_upper':
        case 'dc_lower':
            sourceOptions.color = sourceColorMap['dc_ul'][num]
            break;
        case 'dc_middle':
            sourceOptions.color = sourceColorMap['dc_m'][num]
            break;
        }

    return sourceOptions
}

/**
 * Adds and manages ISeriesAPI object of the associated IChartApi object 
 * through SeriesInstance objects.
 */
export class SeriesManager {
    private seriesInstances: Map<string, SeriesInstance<LightweightCharts.SeriesType>>;
    private markerInstances: Map<string, MarkerInstance<LightweightCharts.Time>>;
    private chartDropdown: ChartDropdown;
    private chart: LightweightCharts.IChartApi;
    private legendsDiv: HTMLDivElement;
    
    constructor(chart: LightweightCharts.IChartApi, legendsDiv: HTMLDivElement) {
        this.chart = chart
        this.legendsDiv =legendsDiv

        this.seriesInstances = new Map();
        this.markerInstances = new Map();

        // Initialize chart dropdown with callback to update series visibility based on user selection
        this.chartDropdown = new ChartDropdown('dropdownList', (selectedSeries) => {
            // show/hide series
            this.seriesInstances.forEach((seriesInstance, key) => {
                this.toggleSeriesVisibility(seriesInstance, selectedSeries.has(key));
            });

            // show/hide series markers
            this.markerInstances.forEach((markerInstance, key) => {
                this.toggleSeriesMarkerVisibility(markerInstance, selectedSeries.has(key))
            })
        });
    }

    updateAll(csvText: string): boolean {
        const csvParser = new CSVParser(csvText);

        const seriesInstances = this.addSeriesFromCsv(csvParser);

        if (seriesInstances.size === 0) {
            return false;
        }

        this.cleanup();

        this.seriesInstances = seriesInstances;
        this.setSeriesData(csvParser);

        this.createMarkerInstances(csvParser);
        this.setMarkers();
        
        this.updateUI()

        return true;
    }

    private addSeriesFromCsv(csvParser: CSVParser): Map<string, SeriesInstance<LightweightCharts.SeriesType>> {
		const rawCsvHeaders = csvParser.getHeaders();
        const seriesInstances = new Map();

        const sourceCount: {[S in sl.SeriesSource]: number} = {
            'candlestick': 0,
            'volume': 0,
            'bb_upper': 0,
            'bb_middle': 0,
            'bb_lower': 0,
            'dc_upper': 0,
            'dc_middle': 0,
            'dc_lower': 0,
            'adx': 0,
            'plusDi': 0,
            'minusDi': 0,
            'er': 0,
            'atr': 0,
            'kama': 0,
        }

        const ohlc = ['open', 'high', 'low', 'close'];
        const allOhlcPresent = ohlc.every(c => rawCsvHeaders.includes(c));

        if (allOhlcPresent) {
            const seriesInstance = createSeriesInstance(
                            'candlestick',
                            'Candlestick',
                            this.chart,
                            sl.SeriesSourceConfigs['candlestick']['seriesOptions']
                        )
            if (seriesInstance) {
                seriesInstances.set('candlestick',seriesInstance)
                sourceCount['candlestick']++
            };
        } else {
            // If ever making a production version, consider adding a fallback here
            console.error('Missing one or more OHLC columns: ', ohlc);
        }

        for (const header of rawCsvHeaders) {
            const matchingSource = (Object.keys(sl.SeriesSources) as sl.SeriesSource[]).find(s => header.startsWith(s))
            if (!matchingSource) {
                continue
            }
            
            const suffix = header.slice(matchingSource.length)
            switch (matchingSource) {
                case 'adx':
                case 'plusDi':
                case 'minusDi':
                case 'er':
                case 'atr': {
                    const seriesInstance = createSeriesInstance(
                            matchingSource,
                            sl.SeriesSources[matchingSource],
                            this.chart,
                            sl.SeriesSourceConfigs[matchingSource]['seriesOptions'],
                            this.getPaneIndex(matchingSource, seriesInstances),
                            suffix
                        )
                    if (seriesInstance) {
                        seriesInstances.set(header, seriesInstance)  
                        sourceCount[matchingSource]++
                    }
                    break;
                }     
                case 'kama': {
                    const seriesInstance = createSeriesInstance(
                            matchingSource, 
                            sl.SeriesSources[matchingSource], 
                            this.chart,
                            sl.SeriesSourceConfigs[matchingSource]['seriesOptions'],
                            undefined,
                            suffix
                            
                        )   
                    if (seriesInstance) {
                        seriesInstances.set(header, seriesInstance)
                        sourceCount[matchingSource]++
                    }
                    break;
                }
                case 'bb_upper':
                case 'bb_middle':
                case 'bb_lower':
                case 'dc_upper':
                case 'dc_middle':
                case 'dc_lower': {
                    const seriesInstance = createSeriesInstance(
                            matchingSource, 
                            sl.SeriesSources[matchingSource], 
                            this.chart, 
                            getSourceOptions(matchingSource, sourceCount[matchingSource]),
                            undefined,
                            suffix
                            
                        )   
                    if (seriesInstance) {
                        seriesInstances.set(header, seriesInstance)
                        sourceCount[matchingSource]++
                    }
                    break;
                }
                default: {
                    const seriesInstance = createSeriesInstance(
                            matchingSource, 
                            sl.SeriesSources[matchingSource], 
                            this.chart, 
                            sl.SeriesSourceConfigs[matchingSource]['seriesOptions'],
                            undefined,
                            suffix
                            
                        )   
                    if (seriesInstance) {
                        seriesInstances.set(header, seriesInstance)
                        sourceCount[matchingSource]++
                    }
                    break;
                }
            }
        }

        if (seriesInstances.size == 0) {
            console.error('No valid series found in CSV headers:', rawCsvHeaders);
        }

        return seriesInstances;
    }

    /**
     * Returns the pane index for a given series source.
     * Use index for existing pane if a series from same source is already present,
     * otherwise returns the next available pane index.
     * Applies only to non-main panes (e.g. DMI, ER).
     */
    private getPaneIndex<T extends 'adx' | 'plusDi'| 'minusDi' | 'er' | 'atr'>(
        seriesSource: T, 
        seriesInstances: Map<string, SeriesInstance<LightweightCharts.SeriesType>>
    ): number {
        const seriesGroup = sl.SeriesSourceConfigs[seriesSource].indicator ?? seriesSource

        for (const instance of seriesInstances.values()) {
            const instanceGroup = sl.SeriesSourceConfigs[instance.seriesSource].indicator ?? instance.seriesSource

            if (instanceGroup === seriesGroup) {
                return instance.series.getPane().paneIndex();
            }
        }

        return this.chart.panes().length;
    }

    private setSeriesData(csvParser: CSVParser) {
        for (const [key, seriesInstance] of this.seriesInstances.entries()) {
            switch (seriesInstance.seriesType) {
                case 'Candlestick':
                    seriesInstance.data = csvParser.parseCandlestickData();
                    break;
                case 'Histogram':
                    seriesInstance.data = csvParser.parseHistogramData(key);
                    break;
                case 'Line':
                    seriesInstance.data = csvParser.parseLineData(key);
                    break;
                default:
                    console.error('Encountered unknown series type while parsing data: ', seriesInstance.seriesType);
                    (seriesInstance.seriesType as never);
                    seriesInstance.data = [];
                    break;
            }
            // ensure we never call setData with undefined
            seriesInstance.series.setData(seriesInstance.data)
        }

        // this.createTradeEventMarkerPlugin(csvParser);
    }

    private setMarkers() {
        for (const markerInstance of this.markerInstances.values()) {
            markerInstance.pluginApi.setMarkers(markerInstance.data)
        }
    }

    private createMarkerInstances(csvParser: CSVParser) {
        this.markerInstances = new Map(); // reset markerInstances
        const seriesInstance = this.seriesInstances.get('candlestick');

        if (seriesInstance?.seriesType === 'Candlestick' && csvParser.getHeaders().includes('event')) {
            this.markerInstances.set(
                'trade_events', 
                createTradeMarkerInstance(
                    // type assertion because type inference not applicable/applied for some reason
                    seriesInstance.series as LightweightCharts.ISeriesApi<"Candlestick">,
                    csvParser
                )
            )
        }

    }

    private updateUI() {

        // ===== Dropdown Menu =====

        const chartItems: ChartItem[] = [];
        // Series
        this.seriesInstances.forEach((instance, key) => {
            const suffix = instance.suffix || undefined
            const sourceConfig = sl.SeriesSourceConfigs[instance.seriesSource]
            const configLabel = sourceConfig['label']
            const indicator = sourceConfig['indicator']

            const label = suffix ? configLabel + ` ${suffix}` : configLabel

             let group;
             if (indicator) {
                const indicatorId = suffix ? indicator + `_${suffix}` : indicator
                const indicatorLabel = suffix ? sl.Indicators[indicator] + ` ${suffix}` : sl.Indicators[indicator]
                group = {id: indicatorId, label: indicatorLabel}
             }

            chartItems.push({
                id: key,
                label: label,
                group: group
            }) 
        });

        // Markers
        this.markerInstances.forEach((instance, key) => {
            chartItems.push({
                id: key,
                label: instance.label,
            }) 
        })

        this.chartDropdown.update(chartItems);


        //===== Legends =====

        const groupedSources = [...this.seriesInstances.values()].reduce<Map<string, HTMLElement[]>>(
        (acc, instance) => {
            const sourceGroup = sl.SeriesSourceConfigs[instance.seriesSource].indicator ??
             instance.seriesSource;

            const legendElement = instance.legendElement;

            const existing = acc.get(sourceGroup);
            if (existing) {
                existing.push(legendElement);
            } else {
                acc.set(sourceGroup, [legendElement]);
            }

            return acc;
        }, new Map<string, HTMLElement[]>());

        // Add legends to legendsDiv
        for (const [sourceGroup, legends] of groupedSources.entries()) {
            const groupDiv = createLegendGroupDiv();

            const groupSymbol = sourceGroup.slice(0, 2);
            groupDiv.appendChild(createGroupSymbolElement(groupSymbol.toUpperCase()))

            legends.forEach(l => groupDiv.appendChild(l));

            this.legendsDiv.appendChild(groupDiv);
        }

        this.chart.timeScale().fitContent();
    }

    private cleanup() {
        for (const seriesInstance of this.seriesInstances.values()) {
			this.chart.removeSeries(seriesInstance.series);

            seriesInstance.legendElement.remove();
        }

        // Ensure any untracked legends are removed
        this.legendsDiv.replaceChildren();
    }

    crosshairMoveHandler(param: LightweightCharts.MouseEventParams) {
        if (!param.time) {
            return;
        }
        
        for (const seriesInstance of this.seriesInstances.values()) {
            const dataPoint = param.seriesData.get(seriesInstance.series);
            if (dataPoint) {
                const priceFormatter = seriesInstance.series.priceFormatter()
                const formateData = sl.SeriesSourceConfigs[seriesInstance.seriesSource].formatData
                seriesInstance.legendElement.textContent = formateData(priceFormatter, dataPoint)
            }
        }
    }

    toggleSeriesVisibility(seriesInstance: SeriesInstance<LightweightCharts.SeriesType>, visible: boolean) {
        seriesInstance.series.applyOptions({ visible });
    }

    toggleSeriesMarkerVisibility(marker: MarkerInstance<LightweightCharts.Time>, visible: boolean) {
        marker.pluginApi.setMarkers(visible ? marker.data : []);
    }
}