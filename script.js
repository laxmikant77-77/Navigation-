const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Map Setup - Centered on your college
const map = L.map('map').setView([15.759257, 78.037734], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let locations = [];
let userLocation = null;
let routingControl = null;
let watchId = null;
let liveMarker = null;

// Load Data from Supabase
async function getLocations() {
    const { data, error } = await _supabase.from('Location').select('*');
    if (error) return console.error(error);
    
    locations = data;
    locations.forEach(loc => {
        // Red Circle Markers matching your screenshot
        const marker = L.circleMarker([loc.Lat, loc.Lng], {
            radius: 8,
            fillColor: "#ff0000",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <strong>${loc.Name}</strong><br>${loc.Description}<br>
            <button class="nav-go-btn" onclick="startNav(${loc.Lat}, ${loc.Lng})">Go Here</button>
        `);
    });
}

// Search Logic
document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const results = document.getElementById('search-results');
    results.innerHTML = '';
    
    if (term.length > 0) {
        const filtered = locations.filter(l => l.Name.toLowerCase().includes(term));
        filtered.forEach(l => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerText = l.Name;
            div.onclick = () => {
                map.flyTo([l.Lat, l.Lng], 19);
                results.innerHTML = '';
            };
            results.appendChild(div);
        });
    }
});

// Live Location Logic
window.showLiveLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    watchId = navigator.geolocation.watchPosition(pos => {
        userLocation = [pos.coords.latitude, pos.coords.longitude];
        if (!liveMarker) {
            liveMarker = L.circleMarker(userLocation, {radius: 10, fillColor: '#D32F2F', color: 'white', fillOpacity: 0.6}).addTo(map);
        } else {
            liveMarker.setLatLng(userLocation);
        }
        map.setView(userLocation);
    });
};

window.cancelLiveLocation = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (liveMarker) map.removeLayer(liveMarker);
    liveMarker = null;
};

// Routing Logic
window.startNav = (lat, lng) => {
    if (!userLocation) return alert("Please turn on Live Location first!");
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#D32F2F', weight: 6 }] },
        createMarker: () => null
    }).addTo(map);
};

window.cancelRoute = () => {
    if (routingControl) map.removeControl(routingControl);
};

getLocations();
