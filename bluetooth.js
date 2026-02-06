// 1. CONFIGURATION - Change these to match your actual beacon firmware
const COMPANY_ID = 0xFFFF; // Placeholder: Replace with your Beacon's Company ID (Hex)
const BEACON_NAME_PREFIX = 'FC-'; 

const detectedBeacons = {}; // Memory to keep track of multiple devices

// 2. THE SCANNER (The code you provided with a fix for the event listener)
async function startLiveScan() {
    try {
        console.log("Searching for nearby beacons...");
        
        // Request the scan
        const scan = await navigator.bluetooth.requestLEScan({
            filters: [{ namePrefix: BEACON_NAME_PREFIX }],
            keepRepeatedDevices: true
        });

        console.log("Scan active. Listening...");

        // FIX: The event listener is usually on navigator.bluetooth
        navigator.bluetooth.addEventListener('advertisementreceived', event => {
            const deviceId = event.device.id;
            const deviceName = event.device.name || "Unknown Beacon";
            const rssi = event.rssi;

            // Extract Manufacturer Data
            if (event.manufacturerData.has(COMPANY_ID)) {
                const rawData = event.manufacturerData.get(COMPANY_ID);
                
                // MATH: Adjust based on your firmware's byte map
                const temp = rawData.getInt16(0, true) / 100;
                const humid = rawData.getUint16(2, true) / 100;
                const volt = rawData.getUint16(4, true) / 1000;

                updateOrCreateCard(deviceId, deviceName, temp, humid, volt, rssi);
            }
        });

    } catch (error) {
        console.error("Scan failed: ", error);
        alert("Make sure chrome://flags/#enable-experimental-web-platform-features is ENABLED");
    }
}

// 3. THE UI BUILDER (The Add-on)
// This builds the list dynamically so beacons "pop up" as they are found
function updateOrCreateCard(id, name, temp, humid, volt, rssi) {
    let card = document.getElementById(`card-${id}`);

    if (!card) {
        // Create a new card if this is the first time we see this beacon
        card = document.createElement('div');
        card.id = `card-${id}`;
        card.className = 'card connected-beacon'; // Using classes for styling
        document.getElementById('deviceList').appendChild(card);
    }

    // Update the card content
    card.innerHTML = `
        <div class="card-header">
            <strong>${name}</strong> <small>(${id.slice(-6)})</small>
            <span class="rssi">📶 ${rssi} dBm</span>
        </div>
        <div class="sensor-data">
            <span>🌡️ ${temp.toFixed(2)}°C</span>
            <span>💧 ${humid.toFixed(2)}%</span>
            <span>🔋 ${volt.toFixed(2)}V</span>
        </div>
        <div class="card-footer">Last updated: ${new Date().toLocaleTimeString()}</div>
    `;
}

// 4. EVENT LISTENERS
document.getElementById('connectBtn').addEventListener('click', startLiveScan);