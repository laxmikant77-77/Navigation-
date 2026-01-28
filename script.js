
const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const map = L.map('map').setView([15.759257, 78.037734], 17);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let locations = [];
let userLocation = null;
let routingControl = null;
let watchId = null;
let liveMarker = null;

async function fetchLocations() {
    const { data, error } = await supabase
        .from('Location')
        .select('*');
    
    if (data) {
        locations = data;
        renderMarkers();
    }
}

function renderMarkers() {
    locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng]).addTo(map);
        marker.bindPopup(`
            <div style="color:#000">
                <strong style="color:#ff0000">${loc.name}</strong><br>
                ${loc.description}<br><br>
                <button onclick="calculateRoute(${loc.lat}, ${loc.lng})" 
                        style="background:#ff0000; color:#fff; border:none; padding:5px 10px; cursor:pointer; width:100%">
                    Go Here
                </button>
            </div>
        `);
    });
}

document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    if (term.length < 1) return;

    const filtered = locations.filter(l => l.name.toLowerCase().includes(term));
    filtered.forEach(l => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerText = l.name;
        div.onclick = () => {
            map.flyTo([l.lat, l.lng], 19);
            resultsDiv.innerHTML = '';
            document.getElementById('search-input').value = l.name;
        };
        resultsDiv.appendChild(div);
    });
});

document.getElementById('btn-live').onclick = () => {
    if ("geolocation" in navigator) {
        document.getElementById('btn-live').classList.add('hidden');
        document.getElementById('btn-stop-live').classList.remove('hidden');
        
        watchId = navigator.geolocation.watchPosition((pos) => {
            userLocation = [pos.coords.latitude, pos.coords.longitude];
            
            if (!liveMarker) {
                liveMarker = L.circleMarker(userLocation, {
                    color: '#ff0000',
                    fillColor: '#ff0000',
                    fillOpacity: 0.8,
                    radius: 8
                }).addTo(map);
            } else {
                liveMarker.setLatLng(userLocation);
            }
            map.panTo(userLocation);
        }, (err) => console.error(err), { enableHighAccuracy: true });
    }
};

document.getElementById('btn-stop-live').onclick = () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        liveMarker = null;
        watchId = null;
        document.getElementById('btn-live').classList.remove('hidden');
        document.getElementById('btn-stop-live').classList.add('hidden');
    }
};

window.calculateRoute = (destLat, destLng) => {
    if (!userLocation) {
        alert("Please enable live location first");
        return;
    }

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation[0], userLocation[1]),
            L.latLng(destLat, destLng)
        ],
        lineOptions: {
            styles: [{ color: '#ff0000', weight: 6 }]
        },
        createMarker: () => null,
        addWaypoints: false
    }).addTo(map);

    document.getElementById('btn-cancel-route').classList.remove('hidden');
    map.closePopup();
};

document.getElementById('btn-cancel-route').onclick = () => {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
        document.getElementById('btn-cancel-route').classList.add('hidden');
    }
};

fetchLocations();
