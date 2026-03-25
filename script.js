document.addEventListener("DOMContentLoaded", async () => {

  /* ================= ROOM DATA ================= */
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
      "Ground Floor": ["DS103", "DS104", "DS105", "DS106", "DS107", "DS108", "HOD (DOS)", "Functional Nanomaterials Lab"],
      "1st Floor": ["DOS Seminar Hall", "SBI ATM", "DS102 (Sec B)", "DS101 (Sec A)", "IOT/CSE Lab", "VLSI Lab", "Maths Scholars Lab", "Language Lab", "Physics Lab"]
    },
    "Central Workshop": {
      "Ground Floor": [
        "Incharge Room", "Precision Manufacturing & Measurement Centre",
        "Quality Inspection & Product Validation Lab", "Computerised Hydraulic Base",
        "Hydraulic Press", "Laser Engraver", "Stir Casting Machine",
        "Drilling and Tapping", "Fitting", "Welding"
      ]
    },
    "Seminar Hall Block": {
      "Ground Floor": ["Cafe"],
      "1st Floor": ["Hundri Seminar Hall", "Krishna Seminar Hall"],
      "2nd Floor": ["Tungabhadra Seminar Hall"],
      "3rd Floor": ["Seminar Hall Complex"]
    },
    "Hill top dining hall (mess)": {
      "Ground Floor": ["Veg Section", "Girls Section"],
      "1st Floor": ["1st Year Section", "Non-Veg Section"]
    },
    "Library": {
      "1st Floor": ["Reading Room", "Digital Library"]
    },
    "KALAM boys Hostel": { "Ground Floor": ["Barber Shop"] },
    "MVHR Boys Hostel": { "Ground Floor": ["Reception", "Common Room"] },
    "Kalpana Chawla girls hostel": { "Ground Floor": ["Warden Office"] },
    "SRK boys hostel": { "Ground Floor": ["Common Hall"] }
  };

  /* ================= CATEGORY CONFIG ================= */
  const categoryConfig = {
    Academic:    { color: "#0ea5e9", bg: "#e0f2fe", emoji: "🏫" },
    Residential: { color: "#8b5cf6", bg: "#ede9fe", emoji: "🏠" },
    Food:        { color: "#f59e0b", bg: "#fef3c7", emoji: "🍽️" },
    Sports:      { color: "#10b981", bg: "#d1fae5", emoji: "⚽" },
    Service:     { color: "#6366f1", bg: "#e0e7ff", emoji: "🏦" },
    Landmark:    { color: "#ef4444", bg: "#fee2e2", emoji: "📍" },
    Medical:     { color: "#ec4899", bg: "#fce7f3", emoji: "🏥" },
    Admin:       { color: "#ef4444", bg: "#fee2e2", emoji: "🏛️" },
    default:     { color: "#64748b", bg: "#f1f5f9", emoji: "📌" }
  };

  function getCatConfig(category) {
    return categoryConfig[category] || categoryConfig.default;
  }

  /* ================= SUPABASE ================= */
  const supabase = window.supabase.createClient(
    "https://iistugxdqonjsrxuvpgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
  );

  /* ================= MAP INIT ================= */
  const map = L.map("map", {
    center: [15.759267, 78.037734],
    zoom: 17,
    minZoom: 15,
    maxZoom: 19,
    zoomControl: true
  });

  map.zoomControl.setPosition("bottomright");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  let locations = [];
  let markers = [];
  let watchId = null;
  let userMarker = null;
  let accuracyCircle = null;
  let routingControl = null;
  let destination = null;

  /* ================= LOAD DATA ================= */
  const { data, error } = await supabase.from("Location").select("*");
  if (error) return console.error("Supabase error:", error);
  locations = data;

  /* ================= CREATE MARKERS ================= */
  locations.forEach(loc => {
    const cat = (loc.Category || "default").trim();
    const cfg = getCatConfig(cat);

    const marker = L.circleMarker([loc.Lat, loc.Lng], {
      radius: 9,
      color: "#ffffff",
      weight: 2.5,
      fillColor: cfg.color,
      fillOpacity: 1
    }).addTo(map);

    marker.bindTooltip(loc.Name, {
      permanent: true,
      direction: "top",
      offset: [0, -12],
      className: "custom-marker-label"
    });

    marker.on("click", () => openPanel(loc));

    markers.push({ location: loc, marker, category: cat });
  });

  /* ================= SIDE PANEL ================= */
  const sidePanel = document.getElementById("sidePanel");
  const panelContent = document.getElementById("panelContent");
  const panelOverlay = document.getElementById("panelOverlay");

  function openPanel(loc) {
    const bName = (loc.Name || "").trim();
    const cat = (loc.Category || "default").trim();
    const cfg = getCatConfig(cat);
    const hasRooms = !!roomData[bName];

    let directoryHtml = "";
    if (hasRooms) {
      directoryHtml = `
        <div class="directory-section">
          <div class="directory-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Building Directory
          </div>
          ${Object.entries(roomData[bName]).map(([floor, rooms]) => `
            <div class="floor-block">
              <div class="floor-label">${floor}</div>
              <div class="room-tags">
                ${rooms.map(r => `<span class="room-tag">${r}</span>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>`;
    }

    panelContent.innerHTML = `
      <div class="panel-header">
        <div style="flex:1">
          <div class="panel-category-badge" style="background:${cfg.bg}; color:${cfg.color};">
            ${cfg.emoji} ${cat}
          </div>
          <div class="panel-name">${loc.Name}</div>
          ${loc.Description ? `<div class="panel-desc">${loc.Description}</div>` : ""}
        </div>
      </div>
      <div class="panel-actions">
        <button class="panel-action-btn nav-btn" onclick="navigateTo(${loc.Lat}, ${loc.Lng})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Navigate
        </button>
        <button class="panel-action-btn dir-btn" onclick="flyTo(${loc.Lat}, ${loc.Lng})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          Zoom In
        </button>
      </div>
      ${directoryHtml}
    `;

    sidePanel.classList.remove("hidden");
    panelOverlay.classList.remove("hidden");
    map.flyTo([loc.Lat, loc.Lng], 18, { animate: true, duration: 0.8 });
  }

  function closePanel() {
    sidePanel.classList.add("hidden");
    panelOverlay.classList.add("hidden");
  }

  document.getElementById("closePanel").onclick = closePanel;
  panelOverlay.onclick = closePanel;

  window.flyTo = (lat, lng) => map.flyTo([lat, lng], 19, { animate: true, duration: 0.6 });

  /* ================= SEARCH ================= */
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const clearBtn = document.getElementById("clearSearch");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = "";
    clearBtn.classList.toggle("visible", q.length > 0);
    if (!q) return;

    const results = [];

    locations.forEach(l => {
      const bName = (l.Name || "").trim();
      const cat = (l.Category || "").trim();
      const cfg = getCatConfig(cat);

      let isMatch = bName.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      let matchedRooms = [];
      let matchedFloors = [];

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

      if (isMatch) results.push({ l, cfg, cat, matchedRooms, matchedFloors });
    });

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="no-result">No results for "<strong>${q}</strong>"</div>`;
      return;
    }

    results.forEach(({ l, cfg, cat, matchedRooms, matchedFloors }) => {
      const div = document.createElement("div");
      div.className = "result-item";

      const roomsHtml = matchedRooms.map((r, i) =>
        `<span class="result-room">📍 ${r} <span style="color:#94a3b8;font-weight:400;">(${matchedFloors[i]})</span></span>`
      ).join("");

      div.innerHTML = `
        <div class="result-icon" style="background:${cfg.bg};">${cfg.emoji}</div>
        <div class="result-text">
          <strong>${l.Name}</strong>
          <span class="result-category">${cat || "Campus Facility"}</span>
          ${roomsHtml}
        </div>`;

      div.onclick = () => {
        openPanel(l);
        searchResults.innerHTML = "";
        searchInput.value = "";
        clearBtn.classList.remove("visible");
      };
      searchResults.appendChild(div);
    });
  });

  clearBtn.onclick = () => {
    searchInput.value = "";
    searchResults.innerHTML = "";
    clearBtn.classList.remove("visible");
    searchInput.focus();
  };

  map.on("click", () => { searchResults.innerHTML = ""; });

  /* ================= FILTER CHIPS ================= */
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.filter;

      markers.forEach(({ marker, category }) => {
        const visible = filter === "all" || category === filter;
        if (visible && !map.hasLayer(marker)) marker.addTo(map);
        else if (!visible && map.hasLayer(marker)) map.removeLayer(marker);
      });
    });
  });

  /* ================= LIVE LOCATION ================= */
  document.getElementById("liveBtn").onclick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    watchId = navigator.geolocation.watchPosition(pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      if (!userMarker) {
        userMarker = L.circleMarker(latlng, {
          radius: 9, color: "#ffffff", weight: 3,
          fillColor: "#3b82f6", fillOpacity: 1
        }).addTo(map);
        accuracyCircle = L.circle(latlng, {
          radius: pos.coords.accuracy,
          color: "#3b82f6", weight: 1,
          fillColor: "#3b82f6", fillOpacity: 0.1
        }).addTo(map);
        map.flyTo(latlng, 18);
      } else {
        userMarker.setLatLng(latlng);
        accuracyCircle.setLatLng(latlng).setRadius(pos.coords.accuracy);
      }
      if (destination) updateRoute(latlng, destination);
    }, err => alert("Enable GPS: " + err.message), { enableHighAccuracy: true });
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (userMarker) { map.removeLayer(userMarker); map.removeLayer(accuracyCircle); }
    userMarker = null; watchId = null;
  };

  /* ================= NAVIGATE ================= */
  window.navigateTo = (lat, lng) => {
    destination = [lat, lng];
    closePanel();
    if (!userMarker) alert("Tap 'My Location' first to enable GPS!");
    else updateRoute(userMarker.getLatLng(), destination);
  };

  function updateRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: [L.latLng(start), L.latLng(end)],
      lineOptions: { styles: [{ color: "#3b82f6", weight: 6, opacity: 0.85 }] },
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true
    }).addTo(map);
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = null; destination = null;
  };
});
