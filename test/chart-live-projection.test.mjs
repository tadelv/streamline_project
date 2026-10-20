import assert from 'node:assert/strict';
import { test } from 'node:test';

import { destroyChart, renderChart } from '../src/modules/echarts-renderer.js';

function fixture() {
    const calls = [];
    let disposed = 0;
    const chart = {
        setOption: (option, settings) => calls.push({ option, settings }),
        getOption: () => ({ legend: [{ selected: { Pressure: false } }] }),
        resize() {},
        dispose() { disposed++; }
    };
    return {
        calls,
        element: { clientWidth: 800, clientHeight: 400, style: {}, replaceChildren() {} },
        echarts: { init: () => chart },
        chart,
        disposed: () => disposed
    };
}

test('live renderer extends stable projected arrays without touching earlier points', () => {
    const { calls, element, echarts } = fixture();
    const traces = [
        { name: 'Pressure', x: [0], y: [0] },
        { name: 'Flow', x: [0], y: [0] }
    ];
    const layout = { xaxis: { range: [0, 65] }, yaxis: {}, showlegend: true };
    globalThis.window = { devicePixelRatio: 1 };
    renderChart(echarts, element, traces, layout);
    const data = calls[0].option.series.map(series => series.data);
    const firstPoints = data.map(points => points[0]);

    for (let frame = 1; frame <= 600; frame++) {
        for (const trace of traces) {
            trace.x.push(frame / 10);
            trace.y.push(frame);
        }
        renderChart(echarts, element, traces, layout, 'live');
        const call = calls.at(-1);
        assert.deepEqual(call.option.series.map(series => series.id), ['trace-0', 'trace-1']);
        for (let index = 0; index < traces.length; index++) {
            assert.strictEqual(call.option.series[index].data, data[index]);
            assert.strictEqual(data[index][0], firstPoints[index]);
            assert.deepEqual(data[index].at(-1), [frame / 10, frame]);
            assert.equal(data[index].length, frame + 1);
            assert.equal(traces[index].x.length, traces[index].y.length);
        }
        assert.deepEqual(call.settings, { notMerge: false, lazyUpdate: true, silent: true });
        assert.equal(call.option.legend, undefined);
    }
    assert.deepEqual(traces[0].x, data[0].map(point => point[0]));
    assert.deepEqual(traces[0].y, data[0].map(point => point[1]));
    renderChart(echarts, element, traces, layout);
    assert.notStrictEqual(calls.at(-1).option.series[0].data, data[0]);
    assert.deepEqual(calls.at(-1).option.legend[0].selected, { Pressure: false });
    destroyChart(element);
});

test('a failed live setOption does not duplicate projected points on retry', () => {
    const { calls, element, echarts, chart } = fixture();
    const traces = [{ x: [0], y: [0] }];
    globalThis.window = { devicePixelRatio: 1 };
    renderChart(echarts, element, traces, {});
    traces[0].x.push(1);
    traces[0].y.push(2);
    const setOption = chart.setOption;
    chart.setOption = () => { throw new Error('transient render failure'); };
    assert.throws(() => renderChart(echarts, element, traces, {}, 'live'), /transient render failure/);
    chart.setOption = setOption;
    renderChart(echarts, element, traces, {}, 'live');
    assert.deepEqual(calls.at(-1).option.series[0].data, [[0, 0], [1, 2]]);
    destroyChart(element);
});

test('renderer invalidates projections on new sources, full render, trace count and disposal', () => {
    const { calls, element, echarts, disposed } = fixture();
    const traces = [{ name: 'Pressure', x: [0, 1], y: [0, 9] }];
    const layout = { xaxis: {}, yaxis: {} };
    globalThis.window = { devicePixelRatio: 1 };
    renderChart(echarts, element, traces, layout);
    let previous = calls.at(-1).option.series[0].data;

    // A hidden chart may skip clear's full render, then resume live on new arrays.
    traces[0].x = [0];
    traces[0].y = [2];
    renderChart(echarts, element, traces, layout, 'live');
    assert.notStrictEqual(calls.at(-1).option.series[0].data, previous);
    assert.deepEqual(calls.at(-1).option.series[0].data, [[0, 2]]);
    previous = calls.at(-1).option.series[0].data;

    // Theme changes and finalizeLiveChart use the full-render path.
    renderChart(echarts, element, traces, { ...layout, paper_bgcolor: '#000' });
    assert.notStrictEqual(calls.at(-1).option.series[0].data, previous);
    assert.deepEqual(calls.at(-1).settings.replaceMerge, ['series', 'grid', 'xAxis', 'yAxis', 'legend']);
    previous = calls.at(-1).option.series[0].data;

    traces.push({ name: 'Flow', x: [0], y: [3] });
    renderChart(echarts, element, traces, layout, 'live');
    assert.notStrictEqual(calls.at(-1).option.series[0].data, previous);
    assert.equal(calls.at(-1).settings.lazyUpdate, false);
    previous = calls.at(-1).option.series[0].data;
    destroyChart(element);
    renderChart(echarts, element, traces, layout, 'live');
    assert.equal(disposed(), 1);
    assert.notStrictEqual(calls.at(-1).option.series[0].data, previous);
    assert.equal(calls.at(-1).settings.lazyUpdate, false);
    destroyChart(element);
});
