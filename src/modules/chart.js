import { logger } from './logger.js';

// Function to get or update the chart element reference
function getChartElement() {
    return document.getElementById('plotly-chart');
}
let currentSubstate = 'idle';
let annotationUpdateCounter = 0;
const ANNOTATION_UPDATE_THROTTLE = 10; // Update every 10 data points
let lastWeight = 0;
let lastTime = 0;
const SMOOTHING_FACTOR = 0.1;
let smoothedWeightChange = 0;

const chartData = {
    pressure: {
        x: [],
        y: [],
        name: 'Pressure',
        type: 'lines',
        mode: 'lines',
        line: { color: '#17c29a' },
        hoverinfo: 'name'
    },
    flow: {
        x: [],
        y: [],
        name: 'Flow',
        type: 'lines',
        mode: 'lines',
        line: { color: '#0358cf' },
        hoverinfo: 'name'
    },
    targetPressure: {
        x: [],
        y: [],
        name: 'Target Pressure',
        type: 'lines',
        mode: 'lines',
        line: { color: '#17c29a', dash: 'dot' },
        hoverinfo: 'name'
    },
    targetFlow: {
        x: [],
        y: [],
        name: 'Target Flow',
        type: 'lines',
        mode: 'lines',
        line: { color: '#0358cf', dash: 'dot' },
        hoverinfo: 'name'
    },
    groupTemperature: {
        x: [],
        y: [],
        name: '°C',
        type: 'lines',
        mode: 'lines',
        line: {color: '#ff97a1'},
        hoverinfo: 'name'
    },
    weight: {
        x: [],
        y: [],
        name: 'Weight',
        type: 'lines',
        mode: 'lines',
        line: { color: '#D8BDA8' }, // light mode
        hoverinfo: 'name'
    }
};

const lightLayout = {
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: { color: 'black' },
    xaxis: { 
        gridcolor: '#E0E0E0',
        dtick: 1,
        fixedrange: true
    },
    yaxis: {
        gridcolor: '#E0E0E0',
        range: [0, 10],
        dtick: 1,
        fixedrange: true
    },
    autosize: true,
    margin: {
        autoexpand: true,
        l: 50,
        r: 50,
        t: 20,
        b: 40,
        pad: 0
    },
    showlegend: false,
    
};

const darkLayout = {
    plot_bgcolor: '#0d0e14',
    paper_bgcolor: '#0d0e14',
    font: { color: '#e8e8e8' },
    xaxis: { 
        gridcolor: '#212227',
        dtick: 1,
        fixedrange: true
    },
    yaxis: { 
        gridcolor: '#212227',
        range: [0, 10],
        dtick: 1
        ,fixedrange: true
    },
    autosize: true,
    margin: {
        autoexpand: true,
        l: 50,
        r: 50,
        t: 20,
        b: 40,
        pad: 0
    },
    showlegend: false,
};

const labelColors = {
    light: {
        pressure: '#17c29a',
        flow: '#0358cf',
        groupTemperature: '#ff97a1',
        weight: '#C7A58D'
    },
    dark: {
        pressure: '#17c29a',
        flow: '#0358cf',
        groupTemperature: '#ff97a1',
        weight: '#695f57'
    }
};

function getAnnotations() {
    const theme = localStorage.getItem('theme') || 'light';
    const annotations = [];
    const labelCandidates = [];

    // 1. Collect potential labels
    for (const traceName in chartData) {
        if (traceName === 'targetPressure' || traceName === 'targetFlow') {
            continue;
        }
        const trace = chartData[traceName];
        if (trace.x.length > 0) {
            labelCandidates.push({
                name: trace.name,
                x: trace.x[trace.x.length - 1],
                y: trace.y[trace.y.length - 1],
                color: (labelColors[theme] && labelColors[theme][traceName]) ? labelColors[theme][traceName] : trace.line.color
            });
        }
    }

    // 2. Sort by y-value, ascending
    labelCandidates.sort((a, b) => a.y - b.y);

    let lastY = -Infinity;
    const minVerticalSeparation = 0.4; // Corresponds to y-axis units
    const minAxisBuffer = 0.2; // Minimum distance from x-axis

    // 3. Adjust positions to avoid overlap, moving from bottom up
    for (const candidate of labelCandidates) {
        let finalY = Math.max(candidate.y, minAxisBuffer);
        
        if (lastY !== -Infinity && finalY - lastY < minVerticalSeparation) {
            finalY = lastY + minVerticalSeparation;
        }
        
        annotations.push({
            x: candidate.x,
            y: finalY,
            xref: 'x',
            yref: 'y',
            text: candidate.name,
            showarrow: false,
            xanchor: 'left',
            yanchor: 'middle',
            xshift: 5,
            font: {
                color: candidate.color,
                size: 16
            }
        });

        lastY = finalY;
    }

    return annotations;
}

export function updateChart(shotStartTime, data, weight, filterToPouring = true) {
    if (data && data.state && data.state.substate) { // Add safety check
        currentSubstate = data.state.substate;
    }
    const time = (new Date(data.timestamp) - shotStartTime) / 1000;

    if (filterToPouring) {
        // Only chart during espresso-related states (preinfusion and pouring)
        // Exclude steam, flush, hot water, and other non-espresso states
        const espressoStates = ['preinfusion', 'pouring'];
        if (!espressoStates.includes(data.state.substate)) {
            return;
        }
    }
    const pressureY = data.pressure;
    const flowY = data.flow;
    const targetPressureY = data.targetPressure;
    const targetFlowY = data.targetFlow;
    const groupTemperatureY = (data.groupTemperature / 100) * 10;
    
    let weightY = 0;
    if (lastTime > 0 && time > lastTime) {
        const timeDiff = time - lastTime;
        const rawWeightChange = (weight - lastWeight) / timeDiff;
        smoothedWeightChange = (SMOOTHING_FACTOR * rawWeightChange) + (1 - SMOOTHING_FACTOR) * smoothedWeightChange;
        weightY = smoothedWeightChange;
    }
    lastWeight = weight;
    lastTime = time;

    chartData.pressure.x.push(time);
    chartData.pressure.y.push(pressureY);
    chartData.flow.x.push(time);
    chartData.flow.y.push(flowY);
    chartData.targetPressure.x.push(time);
    chartData.targetPressure.y.push(targetPressureY);
    chartData.targetFlow.x.push(time);
    chartData.targetFlow.y.push(targetFlowY);
    chartData.groupTemperature.x.push(time);
    chartData.groupTemperature.y.push(groupTemperatureY);
    chartData.weight.x.push(time);
    chartData.weight.y.push(weightY);

    const element = getChartElement();
    if (!element) {
        console.error('updateChart: chartElement not found in DOM');
        return;
    }
    // Calculate appropriate x-axis tick spacing based on the current time
    let dtickValue;
    if (time < 10) {
        dtickValue = 1;  // 1 second intervals for shots less than 10 seconds
    } else if (time < 60) {
        dtickValue = 5;  // 5 second intervals for shots less than 60 seconds
    } else if (time < 100) {
        dtickValue = 20; // 20 second intervals for shots less than 100 seconds
    } else {
        dtickValue = 30; // 30 second intervals for shots 100 seconds or longer
    }

    Plotly.extendTraces(element, {
        x: [[time], [time], [time], [time], [time], [time]],
        y: [[pressureY], [flowY], [targetPressureY], [targetFlowY], [groupTemperatureY], [weightY]]
    }, [0, 1, 2, 3, 4, 5]);

    // Update the x-axis tick spacing
    Plotly.relayout(element, {
        'xaxis.dtick': dtickValue
    });
}

export function clearChart() {
    for (const trace in chartData) {
        chartData[trace].x = [];
        chartData[trace].y = [];
    }
    lastWeight = 0;
    lastTime = 0;
    smoothedWeightChange = 0;
    const theme = localStorage.getItem('theme') || 'light';
    const layout = theme === 'dark' ? darkLayout : lightLayout;
    layout.annotations = [];
    layout.xaxis.range = [0, 10];
    const element = getChartElement();
    if (!element) {
        console.error('clearChart: chartElement not found in DOM');
        return;
    }
    Plotly.react(element, Object.values(chartData), layout);
}

export function plotHistoricalShot(measurements) {
    if (!measurements || measurements.length === 0) {
        return;
    }

    clearChart();

    let shotStartTime = null;

    // First, find the timestamp of the first data point that marks the start of the shot (preinfusion or pouring).
    // This will establish t=0 for the x-axis.
    for (const dataPoint of measurements) {
        const machineData = dataPoint.machine;
        if (machineData && machineData.state && (machineData.state.substate === 'preinfusion' || machineData.state.substate === 'pouring' )) {
            shotStartTime = new Date(machineData.timestamp);
            break; // Exit after finding the first relevant data point
        }
    }

    // If no data point marks the beginning of a shot, we can't plot it correctly from t=0.
    // As a fallback, try to find the earliest timestamp available in the data.
    if (!shotStartTime) {
        console.warn("plotHistoricalShot: Could not find a starting data point (preinfusion/pouring) to begin the chart at t=0.");
        const firstPoint = measurements.find(p => (p.machine && p.machine.timestamp) || (p.scale && p.scale.timestamp));
        if (firstPoint) {
            const machineTs = firstPoint.machine && new Date(firstPoint.machine.timestamp);
            const scaleTs = firstPoint.scale && new Date(firstPoint.scale.timestamp);
            shotStartTime = (machineTs && scaleTs) ? (machineTs < scaleTs ? machineTs : scaleTs) : (machineTs || scaleTs);
        } else {
            console.error("plotHistoricalShot: No timestamps found in any measurements.");
            return; // No data to plot.
        }
    }
    
    // Find the shot end time
    let shotEndTime = null;
    for (let i = measurements.length - 1; i >= 0; i--) {
        const machineData = measurements[i].machine;
        if (machineData && machineData.state && (machineData.state.substate === 'preinfusion' || machineData.state.substate === 'pouring' || machineData.state.substate === 'pouringDone')) {
            shotEndTime = new Date(machineData.timestamp);
            break;
        }
    }

    const tempChartData = {
        pressure: { x: [], y: [] },
        flow: { x: [], y: [] },
        targetPressure: { x: [], y: [] },
        targetFlow: { x: [], y: [] },
        groupTemperature: { x: [], y: [] },
        weight: { x: [], y: [] }
    };

    let lastScaleWeight = 0;
    let lastScaleTime = 0;
    let localSmoothedWeightChange = 0;

    measurements.forEach(dataPoint => {
        const machineData = dataPoint.machine;
        const scaleData = dataPoint.scale;

        if (machineData && machineData.state && (machineData.state.substate === 'preinfusion' || machineData.state.substate === 'pouring' || machineData.state.substate === 'pouringDone')) {
            const time = (new Date(machineData.timestamp) - shotStartTime) / 1000;
            if (time >= 0) {
                tempChartData.pressure.x.push(time);
                tempChartData.pressure.y.push(machineData.pressure);
                tempChartData.flow.x.push(time);
                tempChartData.flow.y.push(machineData.flow);
                tempChartData.targetPressure.x.push(time);
                tempChartData.targetPressure.y.push(machineData.targetPressure);
                tempChartData.targetFlow.x.push(time);
                tempChartData.targetFlow.y.push(machineData.targetFlow);
                tempChartData.groupTemperature.x.push(time);
                tempChartData.groupTemperature.y.push((machineData.groupTemperature / 100) * 10);
            }
        }

        if (scaleData && scaleData.weight) {
            const scaleTimestamp = new Date(scaleData.timestamp);
            if (shotEndTime && scaleTimestamp > shotEndTime) {
                return; // Stop processing scale data after the shot has ended
            }
            const time = (scaleTimestamp - shotStartTime) / 1000;
            if (time >= 0) {
                let weightChange = 0;
                if (lastScaleTime > 0 && time > lastScaleTime) {
                    const timeDiff = time - lastScaleTime;
                    const rawWeightChange = (scaleData.weight - lastScaleWeight) / timeDiff;
                    localSmoothedWeightChange = (SMOOTHING_FACTOR * rawWeightChange) + (1 - SMOOTHING_FACTOR) * localSmoothedWeightChange;
                    weightChange = localSmoothedWeightChange;
                }
                tempChartData.weight.x.push(time);
                tempChartData.weight.y.push(weightChange);
                lastScaleWeight = scaleData.weight;
                lastScaleTime = time;
            }
        }
    });

    Object.keys(tempChartData).forEach(key => {
        if(chartData[key]) {
            chartData[key].x = tempChartData[key].x;
            chartData[key].y = tempChartData[key].y;
        }
    });

    // Calculate the maximum time value to determine appropriate x-axis tick spacing
    let maxTime = 0;
    for (const traceName in tempChartData) {
        const trace = tempChartData[traceName];
        if (trace.x && trace.x.length > 0) {
            const traceMaxTime = Math.max(...trace.x);
            if (traceMaxTime > maxTime) {
                maxTime = traceMaxTime;
            }
        }
    }

    // Determine appropriate x-axis tick spacing based on the maximum time
    let dtickValue;
    if (maxTime < 10) {
        dtickValue = 1;  // 1 second intervals for shots less than 10 seconds
    } else if (maxTime < 60) {
        dtickValue = 5;  // 5 second intervals for shots less than 60 seconds
    } else if (maxTime < 100) {
        dtickValue = 20; // 20 second intervals for shots less than 100 seconds
    } else {
        dtickValue = 30; // 30 second intervals for shots 100 seconds or longer
    }

    const theme = localStorage.getItem('theme') || 'light';
    const layout = theme === 'dark' ? darkLayout : lightLayout;
    layout.annotations = getAnnotations();

    const element = getChartElement();
    if (!element) {
        console.error('plotHistoricalShot: chartElement not found in DOM');
        return;
    }
    Plotly.react(element, Object.values(chartData), layout, {displayModeBar: false});

    // Update the x-axis tick spacing for historical shot
    Plotly.relayout(element, {
        'xaxis.dtick': dtickValue
    });
}

export function plotProfile(profile) {
    if (!profile || !profile.steps || profile.steps.length === 0) {
        clearChart();
        return;
    }

    // Clear all data but keep trace styles
    for (const trace in chartData) {
        chartData[trace].x = [];
        chartData[trace].y = [];
    }

    const tpX = chartData.targetPressure.x;
    const tpY = chartData.targetPressure.y;
    const tfX = chartData.targetFlow.x;
    const tfY = chartData.targetFlow.y;
    const tempX = chartData.groupTemperature.x;
    const tempY = chartData.groupTemperature.y;

    let currentTime = 0;
    
    // Start at 0,0, and initial temperature
    const initialTemp = (parseFloat(profile.steps[0].temperature || 0) / 100) * 10;
    tpX.push(0);
    tpY.push(0);
    tfX.push(0);
    tfY.push(0);
    tempX.push(0);
    tempY.push(initialTemp);

    for (const step of profile.steps) {
        const duration = parseFloat(step.seconds || 0);
        if (duration <= 0) continue;

        const nextTime = currentTime + duration;
        let pressure = null;
        let flow = null;
        const temp = (parseFloat(step.temperature || 0) / 100) * 10;

        if (step.pump === 'pressure') {
            pressure = parseFloat(step.pressure || 0);
        } else if (step.pump === 'flow') {
            flow = parseFloat(step.flow || 0);
        }
        
        // Add points for the step. Plotly will create a step-chart effect.
        // A null value creates a break in the line.
        tpX.push(currentTime, nextTime);
        tpY.push(pressure, pressure);
        
        tfX.push(currentTime, nextTime);
        tfY.push(flow, flow);

        tempX.push(currentTime, nextTime);
        tempY.push(temp, temp);

        currentTime = nextTime;
    }

    const theme = localStorage.getItem('theme') || 'light';
    // Deep copy layout to avoid side effects on other charts
    const layout = JSON.parse(JSON.stringify(theme === 'dark' ? darkLayout : lightLayout));
    layout.annotations = []; // Annotations are for live data, not static profiles
    layout.xaxis.range = [0, currentTime];
    layout.xaxis.dtick = 10; // Set x-axis ticks to every 10 seconds
    
    // Create a deep copy of traces to modify line style for this plot only
    const plotData = JSON.parse(JSON.stringify(Object.values(chartData)));
    
    const targetPressureTrace = plotData.find(trace => trace.name === 'Target Pressure');
    if (targetPressureTrace) {
        targetPressureTrace.line.dash = 'solid';
        targetPressureTrace.line.width = 5;
    }

    const targetFlowTrace = plotData.find(trace => trace.name === 'Target Flow');
    if (targetFlowTrace) {
        targetFlowTrace.line.dash = 'solid';
        targetFlowTrace.line.width = 5;
    }

    const groupTempTrace = plotData.find(trace => trace.name === '°C');
    if (groupTempTrace) {
        groupTempTrace.line.width = 5;
    }

    const element = getChartElement();
    if (!element) {
        console.error('plotProfile: chartElement not found in DOM');
        return;
    }
    Plotly.react(element, plotData, layout, {displayModeBar: false});
}

export function initChart() {
    console.log('initChart: Starting chart initialization');

    // Get the chart element - it should exist by now since this is called after DOM is updated
    const element = getChartElement();
    if (!element) {
        console.error('initChart: chartElement is not found in the DOM');
        return;
    }

    console.log('initChart: chartElement found, offsetParent:', element.offsetParent !== null);
    console.log('initChart: chartElement visibility:', window.getComputedStyle ? window.getComputedStyle(element).visibility : 'unknown');
    console.log('initChart: chartElement display:', window.getComputedStyle ? window.getComputedStyle(element).display : 'unknown');

    const theme = localStorage.getItem('theme') || 'light';
    const layout = theme === 'dark' ? darkLayout : lightLayout;
    chartData.weight.line.color = theme === 'dark' ? '#695f57' : '#e9d3c3';
    layout.annotations = getAnnotations();

    console.log('initChart: About to call Plotly.newPlot');
    try {
        Plotly.newPlot(element, Object.values(chartData), layout, {displayModeBar: false});
        console.log('initChart: Plotly.newPlot completed successfully');
    } catch (error) {
        console.error('initChart: Error in Plotly.newPlot:', error);
    }

    // Create a debounced resize handler to prevent too frequent calls
    let resizeTimeout;
    console.log('initChart: Adding resize event listener');
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Check if the chart element is visible before resizing
            const resizeElement = getChartElement();
            console.log('initChart: Window resize event, checking chart visibility');
            if (resizeElement && resizeElement.offsetParent !== null) {
                console.log('initChart: Chart element is visible, attempting resize');
                try {
                    Plotly.Plots.resize(resizeElement);
                    console.log('initChart: Chart resized successfully');
                } catch (error) {
                    console.warn('Could not resize chart, element may not be visible:', error);
                }
            } else {
                console.log('initChart: Chart element not visible or not found, skipping resize');
            }
        }, 100);
    });
    console.log('initChart: Chart initialization completed');
}

export function setTheme(theme) {
    const layoutUpdate = theme === 'dark' ? darkLayout : lightLayout;
    chartData.weight.line.color = theme === 'dark' ? '#695f57' : '#e9d3c3';
    layoutUpdate.annotations = getAnnotations();
    const data = Object.values(chartData);
    const element = getChartElement();
    if (!element) {
        console.error('setTheme: chartElement not found in DOM');
        return;
    }
    Plotly.react(element, data, layoutUpdate);
}
