document.addEventListener("DOMContentLoaded", async () => {

  /* ================= ROOM DATA MAPPING ================= */
  // Keys must match the exact 'Name' column in your CSV/Supabase
  const roomData = {
    "Administrative Block": {
      "Ground Floor": ["SIC Lab"],
      "1st Floor": ["All Associate Deans (LG-07, LG-04)", "Dining Room (LG-05)", "Chairman (LG-06)"],
      "2nd Floor": ["Purchase Section (G04)", "Accounts Section (G05)", "Administration Section (G06)", "Academics Section (G07)"],
      "3rd Floor": ["Store Room (105)", "Communications"]
    },
    "CSE Block": {
      "Ground Floor": ["Project Room"],
      "1st Floor": ["Computing Lab"],
      "2nd Floor": ["Software Design and Product Level"],
      "3rd Floor": ["Analog Circuits Lab"]
    },
    "KALAM boys Hostel": {
      "Ground Floor": ["Barber"]
    },
    "Seminar Hall Block": {
      "Ground Floor": ["Cafe"],
      "1st Floor": ["Hundri Seminar Hall", "Krishna Seminar Hall"],
      "2nd Floor": ["Tungabhadra Seminar Hall"],
      "3rd Floor": ["Seminar Hall Complex"]
    },
    "Mechanical Engineering block": {
      "Ground Floor": ["Thermal and Fluids Lab", "Material Processing and Tech Lab", "Design and Dynamics Lab"],
      "1st Floor": ["HOD Cabin", "Department Office", "Faculty Cabin of Mechanical", "Robotics Lab", "DREAAMS Lab"]
    },
    "ECE Block": {
      "Ground Floor": ["DSP Lab", "Electrical Drives and instrumentation Lab", "Drones Lab", "Embedded Systems and IOT Lab", "Microprocessor and Microcontroller Lab", "VLSI and DSP Lab", "ECE Faculty Cabin"],
      "1st Floor": ["Computational Lab", "High Performance Computing and Research", "EC101", "ME101"],
      "2nd Floor": ["Artificial Intelligence and Data Science Lab", "Cyber Physical System Lab", "EC201", "ME201"],
      "3rd Floor": ["..."]
    },
    "Hill top dining hall (mess)": {
      "Ground Floor": ["Veg Section", "Girls Section"],
      "1st Floor": ["1st Year", "Non-Veg Section"]
    },
    "Department of Science": {
      "Ground Floor": ["Physics Lab", "Chemistry Lab"],
      "1st Floor": ["Info coming soon"]
    },
    "Library": {
      "Ground Floor": ["..."],
      "1st Floor": ["Reading Room", "Digital Library"],
      "2nd Floor": ["..."]
    },
    "Central Workshop": {
      "Ground Floor": [
        "Incharge Room", 
        "Precision Manufacturing & Measurement Centre", 
        "Quality Inspection and Product Validation Lab", 
        "Computerised Hydraulic Base", 
        "Hydraulic Press", 
        "Laser Engraver", 
        "Stir Casting Machine", 
        "Drilling and Tapping", 
        "Fitting", 
        "Welding"
      ]
    },
    "MVHR Boys Hostel": {
      "Ground Floor": ["..."],
      "1st Floor": ["..."],
      "2nd Floor": ["..."]
    },
    "Kalpana Chawla girls hostel": {
      "Ground Floor": ["..."],
      "1st Floor": ["..."],
      "2nd Floor": ["..."]
    },
    "SRK boys hostel": {
      "Ground Floor": ["..."],
      "1st Floor": ["..."],
      "2nd Floor": ["..."]
    }
  };

  /* ================= SUPABASE ================= */
  const supabase = window.supabase.createClient(
    "https://iistugxdqonjsrxuvpgs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3R1Z3hkcW9uanNyeHV2cGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE5MzAsImV4cCI6MjA4Mjg1NzkzMH0.QFZKAZnFc-6jrCaOUs0ghAW227OXN1Y2XevOC3BUVX4"
  );

  /* ================= MAP ================= */
  const map = L.map("map", {
    center: [15.759267, 78.037734],
    zoom: 17,
    minZoom: 15,
    maxZoom: 19
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  /* ================= GLOBALS ================= */
  let locations = [];
  let markers = [];
  let watchId = null;
  let userMarker = null;
  let accuracyCircle = null;
  let routingControl = null;
  let destination = null;

  /* ================= LOAD LOCATIONS ================= */
  const { data, error } = await supabase.from("Location").select("*");

  if (error) {
    console.error("Supabase error:", error);
    alert("Error loading locations: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.warn("No locations found in database");
    alert("No locations found in the database");
    return;
  }

  console.log("Loaded locations:", data);
  locations = data;

  locations.forEach(loc => {
    const marker = L.circleMarker([loc.Lat, loc.Lng], {
      radius: 8,
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 1
    }).addTo(map);

    // .trim() prevents issues if your database has trailing spaces like "ECE Block "
    const buildingName = (loc.Name || "").trim();

    // Build the HTML for rooms if this building has rooms registered
    let roomHtml = "";
    if (roomData[buildingName]) {
      roomHtml = `<div style="margin-top:10px; max-height:140px; overflow-y:auto; border-top:1px solid #ccc; padding-top:5px; font-size: 0.9em;">
        <strong style="color: #dc2626;">Facilities/Rooms:</strong><br>`;
      
      for (const [floor, rooms] of Object.entries(roomData[buildingName])) {
        roomHtml += `<div style="margin-bottom: 4px;"><strong>${floor}:</strong> <span style="color:#444;">${rooms.join(", ")}</span></div>`;
      }
      roomHtml += `</div>`;
    }

    marker.bindPopup(`
      <b>${loc.Name}</b><br>
      ${loc.Category || ""}<br>
      ${loc.Description || ""}<br>
      ${roomHtml}<br>
      <button onclick="navigateTo(${loc.Lat}, ${loc.Lng})"
        style="padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:8px; cursor:pointer; margin-top:5px;">
        🧭 Show Route
      </button>
    `, { maxHeight: 320 });

    markers.push({ location: loc, marker: marker });
  });

  console.log("Markers created:", markers.length);

  /* ================= SEARCH & ROOM MATCHING ================= */
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = "";

    if (!q) return;

    locations.forEach(l => {
      let matchedRoom = null;
      const buildingName = (l.Name || "").trim();
      
      // 1. Check if query matches building Name, Category, or Description
      let isMatch = buildingName.toLowerCase().includes(q) ||
                    (l.Category || "").toLowerCase().includes(q) ||
                    (l.Description || "").toLowerCase().includes(q);
                    
      // 2. Check if query matches a room inside the building
      if (roomData[buildingName]) {
        for (const [floor, rooms] of Object.entries(roomData[buildingName])) {
          for (const room of rooms) {
            if (room.toLowerCase().includes(q)) {
              isMatch = true;
              matchedRoom = room; 
              break;
            }
          }
          if (matchedRoom) break; // Break outer loop if room found
        }
      }

      // 3. Render the match in search dropdown
      if (isMatch) {
        const div = document.createElement("div");
        div.className = "result-item";
        
        // Show room hint if matched by room instead of building name
        let content = `<strong>${l.Name}</strong>`;
        if (matchedRoom) {
          content += `<br><small style="color:#777; font-size:12px; display:block; margin-top:2px;">Contains: <b>${matchedRoom}</b></small>`;
        }
        
        div.innerHTML = content;
        div.onclick = () => {
          map.flyTo([l.Lat, l.Lng], 18);
          const markerObj = markers.find(m => m.location === l);
          if (markerObj) {
            markerObj.marker.openPopup();
          }
          // Clear search text & hide results visually
          searchInput.value = "";
          searchResults.innerHTML = "";
        };
        searchResults.appendChild(div);
      }
    });
  });

  /* ================= LIVE LOCATION ================= */
  document.getElementById("liveBtn").onclick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      pos => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];

        if (!userMarker) {
          userMarker = L.circleMarker(latlng, {
            radius: 8,
            color: "#991b1b",
            fillColor: "#fecaca",
            fillOpacity: 1
          }).addTo(map);

          accuracyCircle = L.circle(latlng, {
            radius: pos.coords.accuracy,
            color: "#fecaca",
            fillOpacity: 0.2
          }).addTo(map);
        } else {
          userMarker.setLatLng(latlng);
          accuracyCircle.setLatLng(latlng);
          accuracyCircle.setRadius(pos.coords.accuracy);
        }

        if (destination) updateRoute(latlng, destination);
      },
      error => {
        console.error("Geolocation error:", error);
        alert("Error getting location: " + error.message);
      }
    );
  };

  document.getElementById("stopLiveBtn").onclick = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;

    if (userMarker) map.removeLayer(userMarker);
    if (accuracyCircle) map.removeLayer(accuracyCircle);

    userMarker = null;
    accuracyCircle = null;
  };

  /* ================= ROUTING ================= */
  window.navigateTo = (lat, lng) => {
    destination = [lat, lng];
    if (!userMarker) return;
    updateRoute(userMarker.getLatLng(), destination);
  };

  function updateRoute(start, end) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: [start, end],
      lineOptions: {
        styles: [{ color: "#dc2626", weight: 6 }]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false
    }).addTo(map);
  }

  document.getElementById("cancelRouteBtn").onclick = () => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = null;
    destination = null;
  };

});
      
