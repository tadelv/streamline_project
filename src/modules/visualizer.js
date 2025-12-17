class VisualizerAPI {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.baseURL = 'https://visualizer.coffee/api';
    }

    getAuthHeader() {
        return 'Basic ' + btoa(this.username + ':' + this.password);
    }

    async uploadShot(shotData, onRetry) {
        const retries = 3;
        const delay = 2000;
        const url = `${this.baseURL}/shots/upload`;

        for (let i = 0; i < retries; i++) {
            try {
                const formData = new FormData();
                const shotBlob = new Blob([JSON.stringify(shotData)], { type: 'application/json' });
                formData.append('file', shotBlob, 'file.shot');

                const headers = {
                    'Authorization': this.getAuthHeader(),
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });

                if (response.ok) {
                    return await response.json();
                }

                const errorText = await response.text();
                // For client-side errors (4xx), don't retry, just fail.
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
                }
                // For server-side errors (5xx), a retry might help.
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);

            } catch (error) {
                console.error(`Upload attempt ${i + 1}/${retries} failed:`, error.message);
                if (i === retries - 1) {
                    throw error; // Re-throw the error on the last attempt
                }
                if (onRetry) {
                    onRetry(i + 1, retries);
                }
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    async checkCredentials() {
        const url = `${this.baseURL}/me`;
        const headers = {
            'Authorization': this.getAuthHeader()
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            return response.ok;
        } catch (error) {
            console.error('Error checking Visualizer credentials:', error);
            return false;
        }
    }
}

export function convertReaToVisualizerFormat(reaShot) {
    if (!reaShot || !reaShot.measurements || reaShot.measurements.length === 0) {
        throw new Error("Invalid or empty REA shot data for conversion.");
    }

    const firstTimestamp = new Date(reaShot.measurements[0].machine.timestamp).getTime();
    const lastMeasurement = reaShot.measurements[reaShot.measurements.length - 1];
    const lastTimestamp = new Date(lastMeasurement.machine.timestamp).getTime();
    let totalWaterDispensed = 0;

    const visualizerShot = {
        timestamp: Math.floor(firstTimestamp / 1000),
        duration: (lastTimestamp - firstTimestamp) / 1000,
        elapsed: [],
        pressure: { pressure: [], goal: [] },
        flow: { flow: [], goal: [], by_weight: [] },
        temperature: { mix: [], basket: [], goal: [] },
        totals: {},
        state_change: [],
        profile: reaShot.workflow.profile,
        app: {
            data: {
                settings: {
                    bean_weight: String(reaShot.workflow.doseData.doseIn),
                    drink_weight: String(lastMeasurement.scale.weight),
                    target_weight: String(reaShot.workflow.profile.target_weight),
                }
            }
        }
    };

    for (let i = 0; i < reaShot.measurements.length; i++) {
        const m = reaShot.measurements[i];
        const machine = m.machine;
        const scale = m.scale;

        const currentTimestamp = new Date(machine.timestamp).getTime();
        const elapsed = (currentTimestamp - firstTimestamp) / 1000;
        visualizerShot.elapsed.push(elapsed);

        visualizerShot.pressure.pressure.push(machine.pressure);
        visualizerShot.pressure.goal.push(machine.targetPressure);
        visualizerShot.flow.flow.push(machine.flow);
        visualizerShot.flow.goal.push(machine.targetFlow);
        visualizerShot.flow.by_weight.push(scale?.weightFlow ?? 0);
        visualizerShot.temperature.mix.push(machine.mixTemperature);
        visualizerShot.temperature.basket.push(machine.groupTemperature);
        visualizerShot.temperature.goal.push(machine.targetMixTemperature);
        visualizerShot.state_change.push(machine.state.substate);

        if (i > 0) {
            const prevMachine = reaShot.measurements[i - 1].machine;
            const timeDelta = elapsed - visualizerShot.elapsed[i - 1];
            totalWaterDispensed += prevMachine.flow * timeDelta;
        }
    }

    visualizerShot.totals.water_dispensed = totalWaterDispensed;

    return visualizerShot;
}

export default VisualizerAPI;