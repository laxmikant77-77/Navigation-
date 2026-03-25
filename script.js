document.addEventListener("DOMContentLoaded", async () => {

  /* ═══════════════════ ROOM DATA ═══════════════════ */
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
    "KALAM boys Hostel":          { "Ground Floor": ["Barber Shop"] },
    "MVHR Boys Hostel":           { "Ground Floor": ["Reception", "Common Room"] },
    "Kalpana Chawla girls hostel":{ "Ground Floor": ["Warden Office"] },
    "SRK boys hostel":            { "Ground Floor": ["Common Hall"] }
  };

  /* ═══════════════════ CATEGORY CONFIG ═══════════════════ */
  const CAT = {
    Academic:    { color: "#0ea5e9", bg: "#e0f2fe", e: "🏫" },
    Residential: { color: "#8b5cf6", bg: "#ede9fe", e: "🏠" },
    Food:        { color: "#f59e0b", bg: "#fef3c7", e: "🍽️" },
    Sports:      { color: "#10b981", bg: "#d1fae5", e: "⚽" },
    Service:     { color: "#6366f1", bg: "#e0e7ff", e: "🏦" },
    Landmark:    { color: "#ef4444", bg: "#fee2e2", e: "📍" },
    Medical:     { color: "#ec4899", bg: "#fce7f3", e: "🏥" },
    Admin:       { color: "#ef4444", bg: "#fee2e2", e: "🏛️" },
  };
  const defCat = { color: "#64748b", bg: "#f1f5f9", e: "📌" };
  const cfg = c => CAT[c] || defCat;

  /* ═══════════════════ SUPABASE ═══════════════════ */
  const supabase = window.supabase.createClient(
    "https://iistugxdqonjsrxuvpgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
  );

  /* ═══════════════════ MAP ═══════════════════ */
  const map = L.map("map", {
    center: [15.759267, 78.037734],
    zoom: 17, minZoom: 15, maxZoom: 19
  });
  map.zoomControl.setPosition("bottomright");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  let locations = [], markers = [];
  let watchId = null, userMarker = null, accCircle = null;
  let routing = null, dest = null;

  /* ═══════════════════ LOAD DATA ═══════════════════ */
  const { data, error } = await supabase.from("Location").select("*");
  if (error) { console.error("Supabase:", error); return; }
  locations = data;

  /* ═══════════════════ PLACE MARKERS ═══════════════════ */
  locations.forEach(loc => {
    const cat = (loc.Category || "").trim();
    const c   = cfg(cat);

    const mk = L.circleMarker([loc.Lat, loc.Lng], {
      radius: 9, color: "#fff", weight: 2.5,
      fillColor: c.color, fillOpacity: 1
    }).addTo(map);

    mk.bindTooltip(loc.Name, {
      permanent: true, direction: "top",
      offset: [0, -13], className: "lbl"
    });

    mk.on("click", () => openPanel(loc));
    markers.push({ loc, mk, cat });
  });

  /* ═══════════════════ PANEL ═══════════════════ */
  const panel   = document.getElementById("panel");
  const overlay = document.getElementById("overlay");
  const panelBody = document.getElementById("panelBody");

  function openPanel(loc) {
    const bName = (loc.Name || "").trim();
    const cat   = (loc.Category || "default").trim();
    const c     = cfg(cat);
    const rooms = roomData[bName];

    let dirHtml = "";
    if (rooms) {
      const floorsHtml = Object.entries(rooms).map(([floor, list]) => `
        <div class="floor-block">
          <div class="floor-lbl">${floor}</div>
          <div class="tags">${list.map(r => `<span class="tag">${r}</span>`).join("")}</div>
        </div>`).join("");

      dirHtml = `
        <div class="p-dir">
          <div class="p-dir-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Building Directory
          </div>
          ${floorsHtml}
        </div>`;
    }

    panelBody.innerHTML = `
      <div class="p-header">
        <div class="p-badge" style="background:${c.bg};color:${c.color}">${c.e} ${cat}</div>
        <div class="p-name">${loc.Name}</div>
        ${loc.Description ? `<div class="p-desc">${loc.Description}</div>` : ""}
      </div>
      <div class="p-actions">
        <button class="p-btn nav" onclick="doNavigate(${loc.Lat},${loc.Lng})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Navigate
        </button>
        <button class="p-btn zoom" onclick="doZoom(${loc.Lat},${loc.Lng})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">
            <circle cx="11" cy="11" r="7.5"/>
            <line x1="21" y1="21" x2="16.5" y2="16.5"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          Zoom In
        </button>
      </div>
      ${dirHtml}`;

    panel.classList.remove("hidden");
    overlay.classList.remove("hidden");
    map.flyTo([loc.Lat, loc.Lng], 18, { duration: .7 });
  }

  function closePanel() {
    panel.classList.add("hidden");
    overlay.classList.add("hidden");
  }

  document.getElementById("panelClose").onclick = closePanel;
  overlay.onclick = closePanel;
  map.on("click", closePanel);

  window.doZoom = (lat, lng) => map.flyTo([lat, lng], 19, { duration: .5 });

  /* ═══════════════════ SEARCH ═══════════════════ */
  const inp  = document.getElementById("searchInput");
  const res  = document.getElementById("searchResults");
  const xBtn = document.getElementById("clearSearch");

  inp.addEventListener("input", () => {
    const q = inp.value.trim().toLowerCase();
    res.innerHTML = "";
    xBtn.classList.toggle("show", q.length > 0);
    if (!q) return;

    const hits = [];
    locations.forEach(l => {
      const bName = (l.Name || "").trim();
      const cat   = (l.Category || "").trim();
      const c     = cfg(cat);
      let match   = bName.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      let mRooms  = [], mFloors = [];

      if (roomData[bName]) {
        for (const [floor, list] of Object.entries(roomData[bName])) {
          list.forEach(r => {
            if (r.toLowerCase().includes(q)) {
              match = true; mRooms.push(r); mFloors.push(floor);
            }
          });
        }
      }
      if (match) hits.push({ l, c, cat, mRooms, mFloors });
    });

    if (!hits.length) {
      res.innerHTML = `<div class="no-res">No results for "<strong>${q}</strong>"</div>`;
      return;
    }

    hits.forEach(({ l, c, cat, mRooms, mFloors }) => {
      const d = document.createElement("div");
      d.className = "r-item";
      d.innerHTML = `
        <div class="r-ico" style="background:${c.bg}">${c.e}</div>
        <div class="r-text">
          <strong>${l.Name}</strong>
          <span class="r-cat">${cat || "Campus"}</span>
          ${mRooms.map((r,i) => `<span class="r-room">📍 ${r} <span style="color:#94a3b8;font-weight:400">(${mFloors[i]})</span></span>`).join("")}
        </div>`;
      d.onclick = () => {
        openPanel(l);
        res.innerHTML = ""; inp.value = ""; xBtn.classList.remove("show");
      };
      res.appendChild(d);
    });
  });

  xBtn.onclick = () => {
    inp.value = ""; res.innerHTML = "";
    xBtn.classList.remove("show"); inp.focus();
  };

  /* ═══════════════════ FILTER CHIPS ═══════════════════ */
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const f = chip.dataset.filter;
      markers.forEach(({ mk, cat }) => {
        const show = f === "all" || cat === f;
        if (show && !map.hasLayer(mk)) mk.addTo(map);
        else if (!show && map.hasLayer(mk)) map.removeLayer(mk);
      });
    });
  });

  /* ═══════════════════ LIVE LOCATION ═══════════════════ */
  document.getElementById("liveBtn").onclick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    watchId = navigator.geolocation.watchPosition(pos => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (!userMarker) {
        userMarker = L.circleMarker(ll, {
          radius: 9, color: "#fff", weight: 3,
          fillColor: "#3b82f6", fillOpacity: 1
        }).addTo(map);
        accCircle = L.circle(ll, {
          radius: pos.coords.accuracy,
          color: "#3b82f6", weight: 1,
          fillColor: "#3b82f6", fillOpacity: 0.1
        }).addTo(map);
        map.flyTo(ll, 18);
      } else {
        userMarker.setLatLng(ll);
        accCircle.setLatLng(ll).setRadius(pos.coords.accuracy);
      }
      if (dest) updateRoute(ll, dest);
    }, err => alert("Enable GPS: " + err.message), { enableHighAccuracy: true });
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (userMarker) { map.removeLayer(userMarker); map.removeLayer(accCircle); }
    userMarker = null; watchId = null;
  };

  /* ═══════════════════ NAVIGATE ═══════════════════ */
  window.doNavigate = (lat, lng) => {
    dest = [lat, lng];
    closePanel();
    if (!userMarker) alert("Tap 'My Location' first to enable GPS!");
    else updateRoute(userMarker.getLatLng(), dest);
  };

  function updateRoute(start, end) {
    if (routing) map.removeControl(routing);
    routing = L.Routing.control({
      waypoints: [L.latLng(start), L.latLng(end)],
      lineOptions: { styles: [{ color: "#3b82f6", weight: 6, opacity: .85 }] },
      addWaypoints: false, show: false, fitSelectedRoutes: true
    }).addTo(map);
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routing) map.removeControl(routing);
    routing = null; dest = null;
  };
});
