const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Setup Map with Dark Mode
const map = L.map('map', { zoomControl: false }).setView([15.759257, 78.037734], 17);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let locations = [], userLocation = null, routingControl = null, watchId = null;
let liveMarker = null, accuracyCircle = null;

// Fetch Campus Data
async function init() {
    const { data } = await _supabase.from('Location').select('*');
    if (data) {
        locations = data;
        data.forEach(loc => {
            const marker = L.circleMarker([loc.Lat, loc.Lng], {
                radius: 8, fillColor: "#ff0000", color: "#fff", weight: 2, fillOpacity: 0.9
            }).addTo(map);

            marker.bindPopup(`
                <div style="text-align:center;">
                    <b style="color:#ff0000; font-size:16px;">${loc.Name}</b><br>
                    <button onclick="startNav(${loc.Lat}, ${loc.Lng})" class="glass-btn" style="width:100%; margin-top:10px; padding:8px; font-size:12px;">Navigate</button>
                </div>
            `);
        });
    }
}

// TOGGLE LIVE LOCATION (High Accuracy Mode)
window.toggleLiveLocation = () => {
    const btnText = document.getElementById('live-text');
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        watchId = null;
        btnText.innerText = "Show Live";
        document.getElementById('accuracy-badge').classList.add('hidden');
        return;
    }

    btnText.innerText = "Locating...";
    
    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        userLocation = [latitude, longitude];

        // Update Accuracy UI
        document.getElementById('accuracy-badge').classList.remove('hidden');
        document.getElementById('accuracy-val').innerText = Math.round(accuracy);
        btnText.innerText = "Live Active";

        // Draw User Marker & Accuracy Circle
        if (!liveMarker) {
            liveMarker = L.circleMarker(userLocation, { radius: 10, fillColor: '#ff0000', color: '#fff', fillOpacity: 1 }).addTo(map);
            accuracyCircle = L.circle(userLocation, { radius: accuracy, color: '#ff0000', weight: 1, fillOpacity: 0.15 }).addTo(map);
        } else {
            liveMarker.setLatLng(userLocation);
            accuracyCircle.setLatLng(userLocation).setRadius(accuracy);
        }
        
        map.flyTo(userLocation, 18, { animate: true });
    }, err => alert("Please enable GPS"), {
        enableHighAccuracy: true, // THE KEY FOR PHONES
        maximumAge: 0,
        timeout: 10000
    });
};

// ROUTING
window.startNav = (lat, lng) => {
    if (!userLocation) return alert("Enable 'Show Live' first!");
    if (routingControl) map.removeControl(routingControl);
    
    routingControl = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 7 }] },
        createMarker: () => null,
        addWaypoints: false
    }).addTo(map);

    document.getElementById('cancel-route-btn').classList.remove('hidden');
    map.closePopup();
};

window.cancelRoute = () => {
    if (routingControl) map.removeControl(routingControl);
    document.getElementById('cancel-route-btn').classList.add('hidden');
};

// SEARCH
document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const res = document.getElementById('search-results');
    res.innerHTML = '';
    if (term.length > 0) {
        locations.filter(l => l.Name.toLowerCase().includes(term)).forEach(l => {
            const d = document.createElement('div');
            d.className = 'search-item';
            d.innerText = l.Name;
            d.onclick = () => { map.flyTo([l.Lat, l.Lng], 19); res.innerHTML = ''; };
            res.appendChild(d);
        });
    }
});

init();
                                                     
