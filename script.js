const SUPABASE_URL = "https://iistugxdqonjsrxuvpgs.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let map;
let locations = [];
let userLocation = null;
let routingControl = null;
let watchId = null;
let liveMarker = null;

document.addEventListener("DOMContentLoaded", () => {

    map = L.map("map").setView([15.759257, 78.037734], 17);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 20 }
    ).addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    }, 300);

    fetchLocations();
});

/* ---------- SUPABASE ---------- */
async function fetchLocations() {
    const { data } = await supabase
        .from("Location")
        .select("*");

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
                    style="background:#ff0000;color:#fff;border:none;padding:6px;width:100%">
                    Go Here
                </button>
            </div>
        `);
    });
}

/* ---------- SEARCH ---------- */
document.getElementById("search-input").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    const results = document.getElementById("search-results");
    results.innerHTML = "";

    if (!term) return;

    locations
        .filter(l => l.name.toLowerCase().includes(term))
        .forEach(l => {
            const div = document.createElement("div");
            div.className = "result-item";
            div.textContent = l.name;
            div.onclick = () => {
                map.flyTo([l.lat, l.lng], 19);
                results.innerHTML = "";
            };
            results.appendChild(div);
        });
});

/* ---------- LIVE LOCATION ---------- */
document.getElementById("btn-live").onclick = () => {
    if (!navigator.geolocation) return;

    document.getElementById("btn-live").classList.add("hidden");
    document.getElementById("btn-stop-live").classList.remove("hidden");

    watchId = navigator.geolocation.watchPosition(pos => {
        userLocation = [pos.coords.latitude, pos.coords.longitude];

        if (!liveMarker) {
            liveMarker = L.circleMarker(userLocation, {
                radius: 8,
                color: "#ff0000",
                fillColor: "#ff0000",
                fillOpacity: 0.8
            }).addTo(map);
        } else {
            liveMarker.setLatLng(userLocation);
        }
        map.panTo(userLocation);
    }, console.error, { enableHighAccuracy: true });
};

document.getElementById("btn-stop-live").onclick = () => {
    navigator.geolocation.clearWatch(watchId);
    if (liveMarker) map.removeLayer(liveMarker);
    liveMarker = null;

    document.getElementById("btn-live").classList.remove("hidden");
    document.getElementById("btn-stop-live").classList.add("hidden");
};

/* ---------- ROUTING ---------- */
window.calculateRoute = (lat, lng) => {
    if (!userLocation) {
        alert("Enable live location first");
        return;
    }

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userLocation),
            L.latLng(lat, lng)
        ],
        addWaypoints: false,
        createMarker: () => null
    }).addTo(map);

    document.getElementById("btn-cancel-route").classList.remove("hidden");
};

document.getElementById("btn-cancel-route").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = null;
    document.getElementById("btn-cancel-route").classList.add("hidden");
};
