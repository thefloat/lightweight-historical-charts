# lightweight-historical-charts
A simple, lightweight browser-based application designed to run locally, 
built on [Lightweght Charts](https://github.com/tradingview/lightweight-charts) library.
It is designed to work with user-supplied time-series data.

## What it does

Analysts may be interested in visualizing historical data alongside indicators, event markers, 
and additional time-series data generated from backtests or analysis (e.g. using pandas). 
This is the primary use case the application is designed for.

The application does not currently include advanced charting or technical analysis tools 
(such as drawing arbitrary lines or curves), though these could be added based on user demand.

It does not perform calculations (e.g. indicator computation). 
Instead, it operates entirely on user-provided data--you are expected to supply a CSV 
containing time-series data that conforms to the expected [schema](#list-of-supported-series-indicators).
There's an example CSV [here](public/data/BTCUSDT_4-11-2026_to_6-11-2026_5m.csv)

## Features
* Show/hide a series

## Prerequisites
- Node.js: https://nodejs.org/

## Dependencies
- lightweight-charts: https://github.com/tradingview/lightweight-charts

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   
2. Install dependencies
    ```bash
    npm install
    
3. Start the development server
    ```bash
    npm run dev

4. If successful, this will output a local development URL (e.g. http://localhost:3000/).
   Open your browser and navigate to: ```http://localhost:3000/chart```

## List of supported series (Indicators)
Asterisks (*) indicate required columns.
| Indicator/Group                        | Column/Series |
|----------------------------------------|---------------|
| Datetime                               | *time         |
| Candlestick                            | open          |
|                                        | high          |
|                                        | low           |
|                                        | close         |
| Volume                                 | volume        |
| Bollinger Bands                        | bb_upper      |
|                                        | bb_middle     |
|                                        | bb_lower      |
| Donchian Channel                       | dc_upper      |
|                                        | dc_middle     |
|                                        | dc_lower      |
| Average Directional Index (ADX)        | adx           |
|                                        | plusDi        |
|                                        | minusDi       |
| Kaufman Efficiency Ratio               | er            |
| Average True Range (ATR)               | atr           |
| Kaufman Adaptive Moving Average (KAMA) | kama          |



