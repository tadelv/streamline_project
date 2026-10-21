// THROWAWAY measurement build for the live-chart flush gate.
//
// Question under test: the machine snapshot transport runs at ~15 Hz on Bengle
// (p50 gap 66.6 ms) while the historical gate pins painting to 100 ms, so a
// third of the delivered frames wait behind the gate. Does letting the gate
// settle at the observed cadence (MIN 25 ms) cost anything the tablet notices?
//
// Reports through console.info, NOT logger.info: logger.info is a no-op
// (modules/logger.js) and this data is read back from Decaid's
// /api/v1/webview/logs, which captures the WebView console.
//
// Delete this module and its four call sites once the numbers are in.

const PREFIX = '[chart-perf]';
const HEARTBEAT_MS = 5000;

let arrivals = [];
let flushes = [];
let paints = [];          // { mode, ms }
let longTasks = 0;
let longTaskMs = 0;
let startedAt = 0;
let lastHeartbeatAt = 0;

const now = () => performance.now();

function percentile(sorted, p) {
    if (!sorted.length) return 0;
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function round(value, digits = 1) {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function stats(values) {
    if (!values.length) return 'n=0';
    const sorted = [...values].sort((a, b) => a - b);
    return `p50=${round(percentile(sorted, 0.5))} p95=${round(percentile(sorted, 0.95))} max=${round(sorted[sorted.length - 1])}`;
}

function gaps(times) {
    const out = [];
    for (let i = 1; i < times.length; i++) out.push(times[i] - times[i - 1]);
    return out;
}

try {
    if (typeof PerformanceObserver === 'function') {
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                longTasks++;
                longTaskMs += entry.duration;
            }
        }).observe({ entryTypes: ['longtask'] });
    }
} catch (e) {
    // longtask is optional; the rest of the numbers still stand without it.
}

export function reset() {
    arrivals = [];
    flushes = [];
    paints = [];
    longTasks = 0;
    longTaskMs = 0;
    startedAt = now();
    lastHeartbeatAt = startedAt;
}

export function arrival() {
    if (!startedAt) reset();
    arrivals.push(now());
}

export function flush(gateMs) {
    if (!startedAt) reset();
    flushes.push({ at: now(), gate: gateMs });
    if (now() - lastHeartbeatAt >= HEARTBEAT_MS) {
        lastHeartbeatAt = now();
        emit('live');
    }
}

export function recordPaint(mode, ms) {
    paints.push({ mode, ms });
}

function line(label) {
    const elapsed = (now() - startedAt) / 1000;
    const arrivalGaps = gaps(arrivals);
    const flushGaps = gaps(flushes.map(f => f.at));
    const livePaints = paints.filter(p => p.mode === 'live').map(p => p.ms);
    const allPaints = paints.map(p => p.ms);
    const gates = flushes.map(f => f.gate);
    const arrivalsPerSec = elapsed > 0 ? arrivals.length / elapsed : 0;
    const flushesPerSec = elapsed > 0 ? flushes.length / elapsed : 0;
    // The number the gate actually settled on is what proves the floor is or is
    // not the binding constraint: 100 means clamped, ~67 means it tracked the
    // transport.
    const gateSettled = gates.length ? `${round(Math.min(...gates))}..${round(Math.max(...gates))}` : 'n/a';
    return `${PREFIX} ${label} shot=${round(elapsed)}s` +
        ` | arrivals=${arrivals.length} (${round(arrivalsPerSec)}/s gap ${stats(arrivalGaps)})` +
        ` | flushes=${flushes.length} (${round(flushesPerSec)}/s gap ${stats(flushGaps)})` +
        ` | gate=${gateSettled}` +
        ` | paintLive ${stats(livePaints)}` +
        ` | paintAll ${stats(allPaints)}` +
        ` | longtasks=${longTasks} ${round(longTaskMs)}ms`;
}

function emit(label) {
    try {
        console.info(line(label));
    } catch (e) {
        // Never let measurement break a shot.
    }
}

/** Final report; call once when the shot ends. */
export function report(label = 'final') {
    if (!startedAt) return;
    emit(label);
}

/** Cheap per-frame guard so a shot that never finalises still yields numbers. */
export function isRelevant() {
    return arrivals.length > 0;
}
