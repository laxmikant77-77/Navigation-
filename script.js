document.addEventListener("DOMContentLoaded", async () => {

  /* ============================================================
     ROOM DIRECTORY DATA
  ============================================================ */
  const roomData = {
    "Administrative Block": {
      "Ground Floor": ["SIC Lab"],
      "1st Floor": ["Associate Deans (LG-07, LG-04)", "Dining Room (LG-05)", "Chairman (LG-06)"],
      "2nd Floor": ["Purchase Section (G04)", "Accounts Section (G05)", "Administration Section (G06)", "Academics Section (G07)"],
      "3rd Floor": ["Store Room (105)", "Communications"]
    },
    "CSE Block": {
      "Ground Floor": ["Project Room"],
      "1st Floor": ["Computing Lab"],
      "2nd Floor": ["Software Design and Product Level"],
      "3rd Floor": ["Analog Circuits Lab"]
    },
    "ECE Block": {
      "Ground Floor": ["DSP Lab", "Electrical Drives & Instrumentation Lab", "Drones Lab", "Embedded Systems & IOT Lab", "Microprocessor & Microcontroller Lab", "VLSI & DSP Lab", "ECE Faculty Cabin"],
      "1st Floor": ["Computational Lab", "High Performance Computing & Research", "EC101", "ME101"],
      "2nd Floor": ["AI & Data Science Lab", "Cyber Physical System Lab", "EC201", "ME201"]
    },
    "Mechanical Engineering block": {
      "Ground Floor": ["Thermal and Fluids Lab", "Material Processing and Tech Lab", "Design and Dynamics Lab"],
      "1st Floor": ["HOD Cabin", "Department Office", "Faculty Cabin of Mechanical", "Robotics Lab", "DREAAMS Lab"]
    },
    "Department of Science": {
      "Ground Floor": ["DS103","DS104","DS105","DS106","DS107","DS108","HOD (DOS)","Functional Nanomaterials Lab"],
      "1st Floor": ["DOS Seminar Hall","SBI ATM","DS102 (Sec B)","DS101 (Sec A)","IOT/CSE Lab","VLSI Lab","Maths Scholars Lab","Language Lab","Physics Lab"]
    },
    "Central Workshop": {
      "Ground Floor": ["Incharge Room","Precision Manufacturing & Measurement Centre","Quality Inspection & Product Validation Lab","Computerised Hydraulic Base","Hydraulic Press","Laser Engraver","Stir Casting Machine","Drilling and Tapping","Fitting","Welding"]
    },
    "Seminar Hall Block": {
      "Ground Floor": ["Cafe"],
      "1st Floor": ["Hundri Seminar Hall","Krishna Seminar Hall"],
      "2nd Floor": ["Tungabhadra Seminar Hall"],
      "3rd Floor": ["Seminar Hall Complex"]
    },
    "Hill top dining hall (mess)": {
      "Ground Floor": ["Veg Section","Girls Section"],
      "1st Floor": ["1st Year Section","Non-Veg Section"]
    },
    "Library": {
      "1st Floor": ["Reading Room","Digital Library"]
    },
    "KALAM boys Hostel": { "Ground Floor": ["Barber Shop"] },
    "MVHR Boys Hostel":  { "Ground Floor": ["Reception","Common Room"] },
    "Kalpana Chawla girls hostel": { "Ground Floor": ["Warden Office"] },
    "SRK boys hostel": { "Ground Floor": ["Common Hall"] }
  };

  /* ============================================================
     CATEGORY → EMOJI MAPPING
  ============================================================ */
  const catEmoji = {
    "Academic":  "🏫",
    "Hostels":   "🛏️",
    "Dining":    "🍔",
    "Labs":      "🔬",
    "Admin":     "🏢",
    "Sports":    "⚽",
    "ATM":       "🏧",
    "Library":   "📚",
    "Workshop":  "🔧",
    "default":   "📍"
  };

  function getEmoji(cat) {
    if (!cat) return catEmoji.default;
    for (const key of Object.keys(catEmoji)) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return catEmoji[key];
    }
    return catEmoji.default;
  }

  /* ============================================================
     THEME TOGGLE
  ============================================================ */
  const themeBtn = document.getElementById("themeToggle");
  let isDark = true;
  themeBtn.addEventListener("click", () => {
    isDark = !isDark;
    document.body.className = isDark ? "dark" : "light";
    themeBtn.textContent = isDark ? "🌙" : "☀️";
    // Swap tile layer
    if (isDark) {
      lightLayer.remove();
      darkLayer.addTo(map);
    } else {
      darkLayer.remove();
      lightLayer.addTo(map);
    }
  });

  /* ============================================================
     MAP SETUP
  ============================================================ */
  const map = L.map("map", {
    center: [15.759267, 78.037734],
    zoom: 17,
    minZoom: 15,
    maxZoom: 19,
    zoomControl: true
  });

  // Move zoom control to bottom-right
  map.zoomControl.setPosition("bottomright");

  const darkLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  const lightLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  });

  /* ============================================================
     SUPABASE
  ============================================================ */
  const supabase = window.supabase.createClient(
    "https://iistugxdqonjsrxuvpgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
  );

  let locations = [];
  let markers  = [];   // { location, marker, markerEl }

  /* ============================================================
     LOAD LOCATIONS
  ============================================================ */
  const { data, error } = await supabase.from("Location").select("*");
  if (error) return console.error("Supabase error:", error);
  locations = data;

  locations.forEach(loc => {
    const cat   = (loc.Category || "").trim();
    const emoji = getEmoji(cat);
    const bName = (loc.Name || "").trim();

    // Create a styled div icon
    const icon = L.divIcon({
      className: "",
      html: `<div class="map-marker ${cat}" title="${bName}">${emoji}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -24]
    });

    const marker = L.marker([loc.Lat, loc.Lng], { icon }).addTo(map);

    // Build room directory HTML
    let roomHtml = "";
    if (roomData[bName]) {
      roomHtml = `<div style="margin-top:10px;max-height:150px;overflow-y:auto;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;font-size:0.82em;">
        <strong style="color:#60a5fa;">📋 Building Directory</strong><br><br>`;
      for (const [floor, rooms] of Object.entries(roomData[bName])) {
        roomHtml += `<div style="margin-bottom:7px;"><strong style="color:#a5b4fc;">${floor}</strong><br>
          <span style="color:#94a3b8;">${rooms.join(" • ")}</span></div>`;
      }
      roomHtml += `</div>`;
    }

    marker.bindPopup(`
      <div style="min-width:210px;font-family:'Outfit',sans-serif;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:1.6rem;">${emoji}</span>
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text,#e8edf7)">${bName}</div>
            <div style="font-size:0.8rem;color:var(--text-muted,#7a8bab);">${cat || "Campus Facility"}</div>
          </div>
        </div>
        ${roomHtml}
        <button class="popup-nav-btn" onclick="window.navigateTo(${loc.Lat}, ${loc.Lng}, '${bName.replace(/'/g,"\\'")}')">
          🧭 Navigate to Building
        </button>
      </div>
    `, { maxWidth: 300 });

    markers.push({ location: loc, marker });
  });

  /* ============================================================
     SEARCH
  ============================================================ */
  const searchInput   = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = "";
    if (!q) return;

    locations.forEach(l => {
      const bName = (l.Name || "").trim();
      let isMatch  = bName.toLowerCase().includes(q) || (l.Category || "").toLowerCase().includes(q);
      let matchedRooms = [], matchedFloors = [];

      if (roomData[bName]) {
        for (const [floor, rooms] of Object.entries(roomData[bName])) {
          rooms.forEach(r => {
            if (r.toLowerCase().includes(q)) {
              isMatch = true;
              matchedRooms.push(r);
              matchedFloors.push(floor);
            }
          });
        }
      }

      if (isMatch) {
        const div = document.createElement("div");
        div.className = "result-item";
        let matchedHtml = matchedRooms.map((room, i) =>
          `<small style="color:#60a5fa;display:block;">📍 ${room} <span style="color:#64748b;">(${matchedFloors[i]})</span></small>`
        ).join("");
        div.innerHTML = `<strong>${getEmoji(l.Category)} ${l.Name}</strong>${matchedHtml}`;
        div.onclick = () => {
          map.flyTo([l.Lat, l.Lng], 18);
          const mObj = markers.find(m => m.location === l);
          if (mObj) mObj.marker.openPopup();
          searchResults.innerHTML = "";
          searchInput.value = "";
        };
        searchResults.appendChild(div);
      }
    });

    if (!searchResults.children.length) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.style.cssText = "color:#64748b;font-style:italic;";
      div.textContent = "No locations or rooms found.";
      searchResults.appendChild(div);
    }
  });

  // Close search on map click
  map.on("click", () => { searchResults.innerHTML = ""; });

  /* ============================================================
     CATEGORY FILTER
  ============================================================ */
  const filterBtns = document.querySelectorAll(".filter-btn");
  let activeFilter = "All";

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.cat;
      applyFilter();
    });
  });

  function applyFilter() {
    markers.forEach(({ location, marker }) => {
      const cat = (location.Category || "").trim();
      const visible = activeFilter === "All" || cat === activeFilter ||
                      cat.toLowerCase().includes(activeFilter.toLowerCase());
      if (visible) map.addLayer(marker);
      else          map.removeLayer(marker);
    });
  }

  /* ============================================================
     LIVE LOCATION
  ============================================================ */
  let watchId        = null;
  let userMarker     = null;
  let accuracyCircle = null;
  let routingControl = null;
  let destination    = null;
  let destName       = "";

  const distPanel  = document.getElementById("distancePanel");
  const distValue  = document.getElementById("distValue");
  const etaValue   = document.getElementById("etaValue");
  const stepsValue = document.getElementById("stepsValue");

  document.getElementById("liveBtn").onclick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported on this device.");
    watchId = navigator.geolocation.watchPosition(pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];

      if (!userMarker) {
        // User dot
        userMarker = L.marker(latlng, {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          }),
          zIndexOffset: 1000
        }).addTo(map);

        accuracyCircle = L.circle(latlng, {
          radius: pos.coords.accuracy,
          color: "#3b82f6", weight: 1.5,
          fillColor: "#3b82f6", fillOpacity: 0.08
        }).addTo(map);

        map.flyTo(latlng, 18);
      } else {
        userMarker.setLatLng(latlng);
        accuracyCircle.setLatLng(latlng).setRadius(pos.coords.accuracy);
      }

      if (destination) {
        updateRoute(latlng, destination);
        updateDistancePanel(latlng, destination);
      }
    }, (err) => alert("Please enable GPS: " + err.message), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000
    });
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    if (userMarker)     { map.removeLayer(userMarker); userMarker = null; }
    if (accuracyCircle) { map.removeLayer(accuracyCircle); accuracyCircle = null; }
    hideDistancePanel();
  };

  /* ============================================================
     NAVIGATE TO
  ============================================================ */
  window.navigateTo = (lat, lng, name) => {
    destination = [lat, lng];
    destName    = name || "Destination";
    if (!userMarker) {
      alert("Tap '📍 Show Live' first to enable GPS tracking!");
      return;
    }
    const userLatLng = userMarker.getLatLng();
    updateRoute([userLatLng.lat, userLatLng.lng], destination);
    updateDistancePanel([userLatLng.lat, userLatLng.lng], destination);
  };

  function updateRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "#3b82f6", weight: 5, opacity: 0.85, dashArray: "10, 8" }]
      },
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" })
    }).addTo(map);
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routingControl) { map.removeControl(routingControl); routingControl = null; }
    destination = null;
    destName    = "";
    hideDistancePanel();
  };

  /* ============================================================
     DISTANCE PANEL LOGIC
  ============================================================ */
  function updateDistancePanel(from, to) {
    const dist = haversineDistance(from[0], from[1], to[0], to[1]);
    const steps = Math.round(dist / 0.75);
    const etaMin = (dist / 83.33).toFixed(1); // avg walk speed ~5km/h = 83.33m/min

    let distDisplay;
    if (dist >= 1000) {
      distDisplay = (dist / 1000).toFixed(2) + " km";
    } else {
      distDisplay = Math.round(dist) + " m";
    }

    distValue.textContent  = distDisplay;
    etaValue.textContent   = etaMin < 1 ? "< 1 min" : etaMin + " min";
    stepsValue.textContent = steps.toLocaleString();
    showDistancePanel();
  }

  function showDistancePanel() {
    distPanel.classList.add("visible");
  }
  function hideDistancePanel() {
    distPanel.classList.remove("visible");
    distValue.textContent  = "— m";
    etaValue.textContent   = "— min";
    stepsValue.textContent = "—";
  }

  /* ============================================================
     HAVERSINE FORMULA (metres)
  ============================================================ */
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

});
