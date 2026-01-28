const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 📍 1. Define Campus Boundary Coordinates (Adjust these points to fit your college)
const campusPolygon = [
    [15.762, 78.034],
    [15.762, 78.042],
    [15.756, 78.042],
    [15.756, 78.034]
];

// 📍 2. Setup Map with Strict Boundary Restrictions
const map = L.map('map', { 
    zoomControl: false,
    maxBounds: L.latLngBounds(campusPolygon), // Prevents scrolling away
    maxBoundsViscosity: 1.0
}).setView([15.759257, 78.037734], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 📍 3. Draw Campus Boundary Line
L.polygon(campusPolygon, {
    color: '#ff0000',
    weight: 2,
    fillOpacity: 0.05,
    dashArray: '5, 10'
}).addTo(map);

let locations = [], userPos = null, routing = null, watchId = null;
let liveMarker = null, accCircle = null;

// Fetch Building Data
async function init() {
    const { data } = await _supabase.from('Location').select('*');
    if (data) {
        locations = data;
        data.forEach(loc => {
            const m = L.circleMarker([loc.Lat, loc.Lng], {
                radius: 8, fillColor: "#ff0000", color: "#fff", weight: 2, fillOpacity: 1
            }).addTo(map);

            m.bindPopup(`
                <div style="text-align:center">
                    <b style="color:#ff0000; font-size:16px">${loc.Name}</b><br>
                    <button onclick="startNav(${loc.Lat}, ${loc.Lng})" style="background:#ff0000; color:white; border:none; padding:10px; width:100%; border-radius:5px; margin-top:10px; cursor:pointer">Navigate</button>
                </div>
            `);
        });
    }
}

// TOGGLE LIVE LOCATION (Reduced Error + Red Circle)
window.toggleLiveLocation = () => {
    const btn = document.getElementById('live-btn');
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        if (accCircle) map.removeLayer(accCircle);
        watchId = null;
        btn.innerText = "📍 Show Live Location";
        document.getElementById('gps-status').classList.add('hidden');
        return;
    }

    btn.innerText = "📡 Syncing GPS...";

    // Force High Accuracy
    watchId = navigator.geolocation.watchPosition(pos => {
        userPos = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy;

        document.getElementById('gps-status').classList.remove('hidden');
        document.getElementById('acc-val').innerText = Math.round(accuracy);
        btn.innerText = "🛑 Stop Live Location";

        if (!liveMarker) {
            liveMarker = L.circleMarker(userPos, { radius: 10, fillColor: '#ff0000', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
            accCircle = L.circle(userPos, { radius: accuracy, color: '#ff0000', weight: 1, fillOpacity: 0.15 }).addTo(map);
        } else {
            liveMarker.setLatLng(userPos);
            accCircle.setLatLng(userPos).setRadius(accuracy);
        }
        map.flyTo(userPos, 18);
    }, null, { enableHighAccuracy: true, maximumAge: 0 });
};

// NAVIGATION ROUTE SYSTEM
window.startNav = (lat, lng) => {
    if (!userPos) return alert("Please enable 'Live Location' first!");
    if (routing) map.removeControl(routing);

    routing = L.Routing.control({
        waypoints: [L.latLng(userPos), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 8, opacity: 0.8 }] },
        createMarker: () => null,
        addWaypoints: false,
        show: false // Hides the written directions box for a cleaner UI
    }).addTo(map);

    document.getElementById('cancel-route-btn').classList.remove('hidden');
    map.closePopup();
};

window.cancelRoute = () => {
    if (routing) {
        map.removeControl(routing);
        document.getElementById('cancel-route-btn').classList.add('hidden');
    }
};

// Search Functionality
document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const res = document.getElementById('search-results');
    res.innerHTML = '';
    if (term) {
        res.classList.remove('hidden');
        locations.filter(l => l.Name.toLowerCase().includes(term)).forEach(l => {
            const d = document.createElement('div');
            d.className = 'search-item';
            d.innerText = l.Name;
            d.onclick = () => { map.flyTo([l.Lat, l.Lng], 19); res.classList.add('hidden'); };
            res.appendChild(d);
        });
    } else res.classList.add('hidden');
};

init();
                
