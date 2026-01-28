const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

// Initialize Supabase correctly for the browser
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Setup Map - Centered on your college coordinates
const map = L.map('map').setView([15.759257, 78.037734], 17);

// Add Dark Theme Map tiles to match the "Red/Black" vibe
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let locations = [];
let userLocation = null;
let routingControl = null;
let watchId = null;
let liveMarker = null;

// FETCH DATA
async function getLocations() {
    // Note: 'Location' must have a capital L as per your database
    const { data, error } = await _supabase.from('Location').select('*');
    
    if (error) {
        console.error("Supabase Error:", error);
        return;
    }
    
    locations = data;
    locations.forEach(loc => {
        // We use loc.Lat and loc.Lng (Capitalized) as per your column names
        const marker = L.circleMarker([loc.Lat, loc.Lng], {
            radius: 8,
            fillColor: "#ff0000", // Red markers
            color: "#fff",
            weight: 2,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <div style="color:#000">
                <strong style="color:#ff0000">${loc.Name}</strong><br>
                ${loc.Description}<br><br>
                <button onclick="startNav(${loc.Lat}, ${loc.Lng})" style="background:#ff0000; color:#fff; border:none; padding:8px; width:100%; cursor:pointer; border-radius:4px;">Go Here</button>
            </div>
        `);
    });
}

// SEARCH FUNCTION
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

// LIVE LOCATION
window.showLiveLocation = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    
    // UI update: Hide "Show" and show "Cancel" if you have those buttons
    watchId = navigator.geolocation.watchPosition(pos => {
        userLocation = [pos.coords.latitude, pos.coords.longitude];
        if (!liveMarker) {
            liveMarker = L.circleMarker(userLocation, {radius: 10, fillColor: '#ff0000', color: 'white', fillOpacity: 0.9}).addTo(map);
        } else {
            liveMarker.setLatLng(userLocation);
        }
        map.setView(userLocation);
    }, (err) => alert("Please allow GPS access"), {enableHighAccuracy: true});
};

window.cancelLiveLocation = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (liveMarker) map.removeLayer(liveMarker);
    liveMarker = null;
    alert("Live location stopped");
};

// ROUTING
window.startNav = (lat, lng) => {
    if (!userLocation) return alert("Turn on 'Show Live' location first!");
    
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 6 }] },
        createMarker: () => null,
        addWaypoints: false
    }).addTo(map);
};

window.cancelRoute = () => {
    if (routingControl) map.removeControl(routingControl);
};

getLocations();
    
