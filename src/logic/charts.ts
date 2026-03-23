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


// External libraries
import * as LightweightCharts from 'lightweight-charts';

// Local utils
import { CSVLoader } from '../utils/csv-loader';

// Local config and types
import {
    SeriesManager,
    // SeriesKey
} from './series-config'

// DOM elements and application variables
const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
const refreshButton = document.getElementById('refresh') as HTMLButtonElement;
const legendsDiv = document.getElementById('legendsDiv') as HTMLDivElement;
let lastLoadedSource: string | File = 'data/BTCUSDT_4-11-2026_to_6-11-2026_5m.csv';

// Chart creation and configuration
function createChart(): LightweightCharts.IChartApi {
    const chartElement = document.getElementById('chartArea');
    if (!chartElement) {
        throw new Error('Chart container element not found');
    }

    const chart = LightweightCharts.createChart(
        chartElement,
        {
            layout: {
                background: { color: '#222' },
                textColor: "#C3BCDB",
            },
            grid: {
                vertLines: { color: '#444' },
                horzLines: { color: '#444' },
            },
            autoSize: true,
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
        }
    );

    chart.priceScale('right').applyOptions({
        borderColor: '#71649C',
    });

    chart.timeScale().applyOptions({
        borderColor: '#71649C',
        timeVisible: true,
        secondsVisible: true,
    });

    return chart;
}

async function loadChartData(source: string | File): Promise<string> {
    let csvText: string = '';
    try {

        if (source instanceof File) {
            csvText = await source.text();
        } else {
            const loadedText = await CSVLoader.loadCSVText(source);
            if (loadedText === null) {
                throw new Error('Failed to load CSV file');
            }
            csvText = loadedText;
        }
    } catch (error) {
        console.error('Error loading CSV data:', error);
    }
    return csvText;
}

const chart = createChart();
const seriesManager = new SeriesManager(chart, legendsDiv);

// Initial load with default file
const csvText = await loadChartData(lastLoadedSource); 
seriesManager.updateAll(csvText);

chart.subscribeCrosshairMove((param) => seriesManager.crosshairMoveHandler(param)); // use lambda to preserve 'this' context

// Event listeners
fileInput.addEventListener('change', async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        const csvText = await loadChartData(file);
        const updated = seriesManager.updateAll(csvText)
        if (updated) lastLoadedSource = file
    }
});

// Add refresh button event listener after other event listeners
refreshButton.addEventListener('click', async () => {
    const csvText = await loadChartData(lastLoadedSource)
    seriesManager.updateAll(csvText)
});
