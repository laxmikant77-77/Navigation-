const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Setup Map with Dark Vibe
const map = L.map('map', { zoomControl: false }).setView([15.759257, 78.037734], 17);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let locations = [], userLocation = null, routingControl = null, watchId = null;
let liveMarker = null, accuracyCircle = null;

// Load Campus Data
async function loadCampusData() {
    const { data, error } = await _supabase.from('Location').select('*');
    if (data) {
        locations = data;
        data.forEach(loc => {
            // Red Pin Markers
            const marker = L.circleMarker([loc.Lat, loc.Lng], {
                radius: 8, fillColor: "#ff0000", color: "#fff", weight: 2, fillOpacity: 0.9
            }).addTo(map);

            marker.bindPopup(`
                <div style="text-align:center;">
                    <strong style="color:#ff0000; font-size:16px;">${loc.Name}</strong>
                    <p style="margin:5px 0; color:#ddd;">${loc.Description}</p>
                    <button onclick="startNavigation(${loc.Lat}, ${loc.Lng})" style="background:#ff0000; color:white; border:none; padding:8px 15px; border-radius:15px; width:100%; cursor:pointer;">Directions</button>
                </div>
            `);
        });
    }
}

// TOGGLE LIVE LOCATION (Reduced Error Logic)
window.toggleLiveLocation = () => {
    const btnText = document.getElementById('btn-text');
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        watchId = null;
        btnText.innerText = "Show Live";
        document.getElementById('gps-status').classList.add('hidden');
        return;
    }

    btnText.innerText = "Locating...";

    // High Accuracy Options
    const geoOptions = {
        enableHighAccuracy: true, // Use GPS instead of Wi-Fi
        maximumAge: 0,            // Force fresh data
        timeout: 15000            // Don't wait forever
    };

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        userLocation = [latitude, longitude];

        // Update Accuracy UI
        document.getElementById('gps-status').classList.remove('hidden');
        document.getElementById('accuracy-val').innerText = Math.round(accuracy);
        btnText.innerText = "Live Active";

        // Draw Live Point & Red Accuracy Circle
        if (!liveMarker) {
            liveMarker = L.circleMarker(userLocation, { radius: 10, fillColor: '#ff0000', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
            accuracyCircle = L.circle(userLocation, { radius: accuracy, color: '#ff0000', weight: 1, fillOpacity: 0.1, dashArray: '5, 5' }).addTo(map);
        } else {
            liveMarker.setLatLng(userLocation);
            accuracyCircle.setLatLng(userLocation).setRadius(accuracy);
        }
        
        map.flyTo(userLocation, 18);
    }, err => alert("Please enable GPS in settings."), geoOptions);
};

// NAVIGATION
window.startNavigation = (lat, lng) => {
    if (!userLocation) return alert("Enable 'Live Location' first!");
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 6, opacity: 0.8 }] },
        createMarker: () => null,
        addWaypoints: false
    }).addTo(map);

    document.getElementById('cancel-route').classList.remove('hidden');
    map.closePopup();
};

window.cancelRoute = () => {
    if (routingControl) {
        map.removeControl(routingControl);
        document.getElementById('cancel-route').classList.add('hidden');
    }
};

// SEARCH
document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const resBox = document.getElementById('search-results');
    resBox.innerHTML = '';
    
    if (term.length > 0) {
        resBox.classList.remove('hidden');
        const matches = locations.filter(l => l.Name.toLowerCase().includes(term));
        matches.forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerText = m.Name;
            div.onclick = () => {
                map.flyTo([m.Lat, m.Lng], 19);
                resBox.classList.add('hidden');
            };
            resBox.appendChild(div);
        });
    } else {
        resBox.classList.add('hidden');
    }
});

loadCampusData();
            
