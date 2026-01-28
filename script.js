const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map('map', { zoomControl: false }).setView([15.759257, 78.037734], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let locations = [], userPos = null, routing = null, watchId = null;
let liveMarker = null, accCircle = null;

async function fetchBuildings() {
    const { data } = await _supabase.from('Location').select('*');
    if (data) {
        locations = data;
        data.forEach(loc => {
            const m = L.circleMarker([loc.Lat, loc.Lng], {
                radius: 8, fillColor: "#ff0000", color: "#fff", weight: 2, fillOpacity: 1
            }).addTo(map);

            m.bindPopup(`
                <b style="color:#ff0000">${loc.Name}</b><br>
                <button onclick="startNav(${loc.Lat}, ${loc.Lng})" style="background:#ff0000; color:#fff; border:none; padding:8px; margin-top:10px; width:100%; border-radius:5px;">Navigate</button>
            `);
        });
    }
}

window.toggleLiveLocation = () => {
    const btn = document.getElementById('btn-live');
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        if (accCircle) map.removeLayer(accCircle);
        watchId = null;
        btn.innerText = "📍 Show Live Location";
        return;
    }

    btn.innerText = "⌛ Locating...";

    // High Accuracy Configuration
    watchId = navigator.geolocation.watchPosition(pos => {
        userPos = [pos.coords.latitude, pos.coords.longitude];
        btn.innerText = "❌ Cancel Live Location";

        if (!liveMarker) {
            liveMarker = L.circleMarker(userPos, { radius: 9, fillColor: '#007bff', color: 'white', weight: 3, fillOpacity: 1 }).addTo(map);
            accCircle = L.circle(userPos, { radius: pos.coords.accuracy, color: '#ff0000', weight: 1, fillOpacity: 0.1 }).addTo(map);
        } else {
            liveMarker.setLatLng(userPos);
            accCircle.setLatLng(userPos).setRadius(pos.coords.accuracy);
        }
        map.flyTo(userPos, 18);
    }, null, { enableHighAccuracy: true, maximumAge: 0 });
};

window.startNav = (lat, lng) => {
    if (!userPos) return alert("Enable 'Show Live' first!");
    if (routing) map.removeControl(routing);

    routing = L.Routing.control({
        waypoints: [L.latLng(userPos), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 7 }] },
        createMarker: () => null
    }).addTo(map);

    document.getElementById('btn-cancel-route').classList.remove('hidden');
    map.closePopup();
};

window.cancelRoute = () => {
    if (routing) {
        map.removeControl(routing);
        document.getElementById('btn-cancel-route').classList.add('hidden');
    }
};

document.getElementById('search-input').oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const res = document.getElementById('search-results');
    res.innerHTML = '';
    if (term) {
        res.classList.remove('hidden');
        locations.filter(l => l.Name.toLowerCase().includes(term)).forEach(l => {
            const d = document.createElement('div');
            d.className = 'result-item';
            d.innerText = l.Name;
            d.onclick = () => { map.flyTo([l.Lat, l.Lng], 19); res.classList.add('hidden'); };
            res.appendChild(d);
        });
    } else res.classList.add('hidden');
};

fetchBuildings();
    
