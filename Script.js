// 1. Initialize the Map centered on IIITDM Kurnool
// Coordinates: Approx 15.7615° N, 78.0360° E (Jagannathagattu Hill)
const map = L.map('map').setView([15.7615, 78.0360], 16);

// 2. Add OpenStreetMap Tile Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 3. Define Icons
const campusIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Red Pin
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

const userIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/747/747376.png', // Blue User Dot
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

// 4. Add Static Markers for Campus Locations
// Note: You can adjust these coordinates slightly to match the exact building entrances.
const locations = [
    { name: "Admin Block", lat: 15.7615, lng: 78.0360 },
    { name: "Library", lat: 15.7625, lng: 78.0350 },
    { name: "Boys Hostel", lat: 15.7595, lng: 78.0370 },
    { name: "Cafeteria", lat: 15.7605, lng: 78.0380 }
];

locations.forEach(loc => {
    L.marker([loc.lat, loc.lng], {icon: campusIcon})
     .addTo(map)
     .bindPopup(`<b>${loc.name}</b>`);
});

// 5. Live Location System
let userMarker = null;

function locateUser() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    // Use watchPosition to track movement in real-time
    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            // If marker exists, update position. If not, create it.
            if (userMarker) {
                userMarker.setLatLng([lat, lng]);
            } else {
                userMarker = L.marker([lat, lng], {icon: userIcon}).addTo(map)
                    .bindPopup("You are here").openPopup();
            }

            // Center map on user
            map.setView([lat, lng], 18); 
            console.log(`Lat: ${lat}, Lng: ${lng}, Accuracy: ${accuracy}m`);
        },
        (error) => {
            alert("Unable to retrieve your location. Make sure GPS is on.");
        },
        {
            enableHighAccuracy: true, // Uses GPS for better precision
            maximumAge: 10000,
            timeout: 5000
        }
    );
}

// 6. Function to navigate to specific buttons
function goToLocation(lat, lng) {
    map.flyTo([lat, lng], 18);
      }
