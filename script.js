document.addEventListener("DOMContentLoaded", async () => {

  /* ================= COMPREHENSIVE ROOM DATA ================= */
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

  /* ================= SUPABASE SETUP ================= */
  const supabase = window.supabase.createClient(
    "https://iistugxdqonjsrxuvpgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
  );

  /* ================= MAP LOGIC ================= */
  const map = L.map("map", {
    center: [15.759267, 78.037734],
    zoom: 17,
    minZoom: 15,
    maxZoom: 19
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  let locations = [];
  let markers = [];
  let watchId = null;
  let userMarker = null;
  let accuracyCircle = null;
  let routingControl = null;
  let destination = null;

  /* ================= LOAD & DISPLAY ================= */
  const { data, error } = await supabase.from("Location").select("*");
  if (error) return console.error("Data error:", error);
  locations = data;

  locations.forEach(loc => {
    const marker = L.circleMarker([loc.Lat, loc.Lng], {
      radius: 8, color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1
    }).addTo(map);

    const bName = (loc.Name || "").trim();
    let roomHtml = "";

    if (roomData[bName]) {
      roomHtml = `<div style="margin-top:10px; max-height:160px; overflow-y:auto; border-top:1px solid #eee; padding-top:8px; font-size: 0.85em;">
        <strong style="color: #dc2626;">Building Directory:</strong><br>`;
      for (const [floor, rooms] of Object.entries(roomData[bName])) {
        roomHtml += `<div style="margin-bottom: 6px;"><strong>${floor}</strong><br><span style="color:#555;">${rooms.join(" • ")}</span></div>`;
      }
      roomHtml += `</div>`;
    }

    marker.bindPopup(`
      <div style="min-width:200px">
        <b style="font-size:1.1em">${loc.Name}</b><br>
        <span style="color:#666; font-size:0.9em;">${loc.Category || "Campus Facility"}</span>
        ${roomHtml}
        <button onclick="navigateTo(${loc.Lat}, ${loc.Lng})"
          style="width:100%; margin-top:10px; padding:10px; background:#dc2626; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">
          🧭 Navigate to Building
        </button>
      </div>
    `, { maxWidth: 280 });

    markers.push({ location: loc, marker: marker });
  });

  /* ================= SEARCH SYSTEM (FIXED) ================= */
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = "";
    if (!q) return;

    locations.forEach(l => {
      const bName = (l.Name || "").trim();

      // Check building name and category match
      let isMatch = bName.toLowerCase().includes(q) ||
                    (l.Category || "").toLowerCase().includes(q);

      // Collect ALL matching rooms across ALL floors (not just the first match)
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

      if (isMatch) {
        const div = document.createElement("div");
        div.className = "result-item";

        // Build matched rooms display
        let matchedHtml = "";
        if (matchedRooms.length > 0) {
          matchedHtml = matchedRooms.map((room, i) =>
            `<small style="color:#dc2626; display:block;">📍 ${room} <span style="color:#999;">(${matchedFloors[i]})</span></small>`
          ).join("");
        }

        div.innerHTML = `<strong>${l.Name}</strong>${matchedHtml}`;
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

    // Show "no results" message if nothing matched
    if (searchResults.children.length === 0) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.style.color = "#999";
      div.style.fontStyle = "italic";
      div.textContent = "No locations or rooms found.";
      searchResults.appendChild(div);
    }
  });

  /* ================= NAVIGATION ================= */
  document.getElementById("liveBtn").onclick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    watchId = navigator.geolocation.watchPosition(pos => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      if (!userMarker) {
        userMarker = L.circleMarker(latlng, {
          radius: 8, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1
        }).addTo(map);
        accuracyCircle = L.circle(latlng, {
          radius: pos.coords.accuracy, color: "#2563eb", weight: 1, fillOpacity: 0.1
        }).addTo(map);
      } else {
        userMarker.setLatLng(latlng);
        accuracyCircle.setLatLng(latlng).setRadius(pos.coords.accuracy);
      }
      if (destination) updateRoute(latlng, destination);
    }, (err) => alert("Please enable GPS: " + err.message));
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (userMarker) {
      map.removeLayer(userMarker);
      map.removeLayer(accuracyCircle);
    }
    userMarker = null;
    watchId = null;
  };

  window.navigateTo = (lat, lng) => {
    destination = [lat, lng];
    if (!userMarker) alert("Click '📍 Show Live' first to see your current position!");
    else updateRoute(userMarker.getLatLng(), destination);
  };

  function updateRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: [start, end],
      lineOptions: { styles: [{ color: "#dc2626", weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true
    }).addTo(map); // FIXED: was split across two lines causing a syntax error
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = null;
    destination = null;
  };
});
