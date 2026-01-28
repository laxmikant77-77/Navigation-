const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Setup Map
const map = L.map('map', { zoomControl: false }).setView([15.759257, 78.037734], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let locations = [], userPos = null, routing = null, watchId = null;
let liveMarker = null, accCircle = null;

// Initial Fetch
async function loadCampus() {
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
                    <button onclick="startNav(${loc.Lat}, ${loc.Lng})" style="background:#ff0000; color:white; border:none; padding:10px; width:100%; border-radius:8px; margin-top:10px; font-weight:bold; cursor:pointer">Navigate</button>
                </div>
            `);
        });
    }
}

// HIGH-ACCURACY GPS PROTOCOL
window.toggleLiveLocation = () => {
    const btnText = document.getElementById('live-text');
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        if (liveMarker) map.removeLayer(liveMarker);
        if (accCircle) map.removeLayer(accCircle);
        watchId = null;
        userPos = null;
        btnText.innerText = "Show Live Location";
        document.getElementById('status-bar').classList.add('hidden');
        return;
    }

    btnText.innerText = "Connecting GPS...";

    const geoOptions = {
        enableHighAccuracy: true, 
        maximumAge: 0,
        timeout: 10000
    };

    watchId = navigator.geolocation.watchPosition(
        pos => {
            userPos = [pos.coords.latitude, pos.coords.longitude];
            const acc = pos.coords.accuracy;

            document.getElementById('status-bar').classList.remove('hidden');
            document.getElementById('acc-val').innerText = Math.round(acc);
            btnText.innerText = "Stop Live Location";

            if (!liveMarker) {
                liveMarker = L.circleMarker(userPos, { radius: 10, fillColor: '#ff0000', color: '#fff', weight: 3, fillOpacity: 1 }).addTo(map);
                accCircle = L.circle(userPos, { radius: acc, color: '#ff0000', weight: 1, fillOpacity: 0.15 }).addTo(map);
            } else {
                liveMarker.setLatLng(userPos);
                accCircle.setLatLng(userPos).setRadius(acc);
            }
            map.flyTo(userPos, 18);
        }, 
        err => {
            let msg = "Unknown GPS Error";
            if(err.code === 1) msg = "Permission Denied. Please enable location in browser settings.";
            if(err.code === 2) msg = "Position unavailable. Are you outside?";
            if(err.code === 3) msg = "GPS Timeout. Searching for satellites...";
            alert(msg);
            btnText.innerText = "Show Live Location";
            watchId = null;
        }, 
        geoOptions
    );
};

// NAVIGATION ROUTE
window.startNav = (lat, lng) => {
    if (!userPos) return alert("Please enable 'Show Live Location' first so we know your starting point!");
    
    if (routing) map.removeControl(routing);

    routing = L.Routing.control({
        waypoints: [L.latLng(userPos), L.latLng(lat, lng)],
        lineOptions: { styles: [{ color: '#ff0000', weight: 8, opacity: 0.9 }] },
        createMarker: () => null,
        addWaypoints: false,
        show: false // Keeps the UI clean without the big text-directions box
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

// SEARCH SYSTEM
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

loadCampus();
            
