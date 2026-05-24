/* ==========================================================================
   SKYVOYAGE INDIA - REFACTORED HYBRID ENGINE (JS)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. DYNAMIC CONFIGURATION & FALLBACK ENGINES
  // ==========================================================================

  const API_BASE_URL = "http://localhost:5000/api";
  let serverOnline = false;

  const AIRPORTS_LOCAL = [
    { code: "DEL", city: "Delhi", name: "Indira Gandhi International Airport" },
    { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Airport" },
    { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport" },
    { code: "MAA", city: "Chennai", name: "Chennai International Airport" },
    { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose Airport" },
    { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport" },
    { code: "PNQ", city: "Pune", name: "Pune International Airport" },
    { code: "COK", city: "Kochi", name: "Cochin International Airport" }
  ];

  const AIRLINES = {
    "SG": { name: "SpiceJet", color: "#f59e0b", icon: `<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.8L18.7 19H5.3L12 5.8z"/></svg>` },
    "6E": { name: "IndiGo", color: "#1e3a8a", icon: `<svg viewBox="0 0 24 24"><path d="M2 12h20M12 2v20M5 5l14 14M19 5L5 19"/></svg>` },
    "AI": { name: "Air India", color: "#dc2626", icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>` },
    "QP": { name: "Akasa Air", color: "#7c3aed", icon: `<svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>` }
  };

  const PROMO_CODES = {
    "INDIANFLYER": 0.10,
    "SKYGOLD": 0.15
  };

  // Ping Server to audit API Connection Status on start
  async function auditConnectionStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/ping`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        serverOnline = true;
        console.log("🌐 [SkyVoyage Client] Connected to secure production server API!");
      }
    } catch (err) {
      serverOnline = false;
      console.warn("⚠️ [SkyVoyage Client] Production server offline. Seamlessly loading local in-memory fallback.");
      initializeMockDatabase();
    }
  }

  // Fallback Local Storage Generators (Phase 4 backwards compatibility)
  function initializeMockDatabase() {
    let localFlights = localStorage.getItem("skyvoyage_flights");
    if (!localFlights) {
      const generated = [];
      const airlinesList = Object.keys(AIRLINES);
      
      for (let day = 0; day < 30; day++) {
        const flightDate = new Date();
        flightDate.setDate(flightDate.getDate() + day);
        const dateString = flightDate.toISOString().split("T")[0];

        for (let i = 0; i < AIRPORTS_LOCAL.length; i++) {
          for (let j = 0; j < AIRPORTS_LOCAL.length; j++) {
            if (i === j) continue;
            if (Math.random() > 0.35) continue;

            const fromAir = AIRPORTS_LOCAL[i];
            const toAir = AIRPORTS_LOCAL[j];
            const airlineCode = airlinesList[Math.floor(Math.random() * airlinesList.length)];
            const depHour = Math.floor(Math.random() * 18) + 5;
            const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            const flightDurationMin = Math.floor(Math.random() * 90) + 90;
            const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`;
            
            let arrHour = depHour + Math.floor(flightDurationMin / 60);
            let arrMin = depMin + (flightDurationMin % 60);
            if (arrMin >= 60) {
              arrHour += 1;
              arrMin -= 60;
            }
            const arrTime = `${String(arrHour % 24).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
            const basePrice = Math.floor(Math.random() * 3500) + 3000;

            const occupiedSeats = [];
            for (let s = 1; s <= 90; s++) {
              if (Math.random() < 0.3) occupiedSeats.push(s);
            }

            generated.push({
              id: `${airlineCode}-${dateString.replace(/-/g, "")}-${depTime.replace(/:/g, "")}`,
              airline: airlineCode,
              flight_no: `${airlineCode}-${Math.floor(Math.random() * 800) + 100}`,
              from_code: fromAir.code,
              to_code: toAir.code,
              flight_date: dateString,
              departure: depTime + ":00",
              arrival: arrTime + ":00",
              duration: `${Math.floor(flightDurationMin / 60)}h ${flightDurationMin % 60}m`,
              base_price: basePrice,
              stops: Math.random() > 0.8 ? 1 : 0,
              occupied_seats: JSON.stringify(occupiedSeats),
              total_seats: 90
            });
          }
        }
      }
      localStorage.setItem("skyvoyage_flights", JSON.stringify(generated));
    }
  }

  function getLocalBookings() {
    const list = localStorage.getItem("skyvoyage_bookings");
    return list ? JSON.parse(list) : [];
  }

  function saveLocalBooking(booking) {
    const list = getLocalBookings();
    list.push(booking);
    localStorage.setItem("skyvoyage_bookings", JSON.stringify(list));

    const fls = JSON.parse(localStorage.getItem("skyvoyage_flights"));
    const idx = fls.findIndex(f => f.id === booking.flightId);
    if (idx !== -1) {
      const occ = JSON.parse(fls[idx].occupied_seats);
      occ.push(...booking.seats);
      fls[idx].occupied_seats = JSON.stringify(occ);
      localStorage.setItem("skyvoyage_flights", JSON.stringify(fls));
    }
  }

  function cancelLocalBooking(pnr) {
    const list = getLocalBookings();
    const idx = list.findIndex(b => b.pnr === pnr);
    if (idx !== -1) {
      list[idx].status = "cancelled";
      localStorage.setItem("skyvoyage_bookings", JSON.stringify(list));

      const flId = list[idx].flightId;
      const bSeats = list[idx].seats;
      const fls = JSON.parse(localStorage.getItem("skyvoyage_flights"));
      const fIdx = fls.findIndex(f => f.id === flId);
      if (fIdx !== -1) {
        const occ = JSON.parse(fls[fIdx].occupied_seats);
        fls[fIdx].occupied_seats = JSON.stringify(
          occ.filter(sid => !bSeats.includes(sid))
        );
        localStorage.setItem("skyvoyage_flights", JSON.stringify(fls));
      }
    }
  }

  // ==========================================================================
  // 2. CENTRAL REACTIVE APPLICATION STATE
  // ==========================================================================

  const State = {
    currentUser: {
      name: "Rohan Sharma",
      email: "rohan.sharma@gmail.com",
      phone: "+91 98765 43210",
      miles: 14850,
      tier: "Ashoka Elite Gold"
    },
    query: {
      tripType: "oneway",
      from: "",
      to: "",
      date: "",
      returnDate: "",
      passengers: { adults: 1, children: 0, infants: 0 },
      cabinClass: "economy"
    },
    results: {
      list: [],
      filters: {
        stops: [],
        airlines: [],
        priceMax: 15000,
        times: []
      },
      sort: "cheapest"
    },
    bookingInProgress: {
      flight: null,
      seats: [],
      passengerInfo: null,
      gstInfo: null,
      addons: { baggage: false, meal: false, priority: false, offset: false },
      discountPercent: 0,
      activePromoCode: null
    }
  };

  // ==========================================================================
  // 3. ROUTER & VIEW MANAGEMENT
  // ==========================================================================

  const VIEWS = {
    "home": document.getElementById("home-view"),
    "results": document.getElementById("search-results-view"),
    "seats": document.getElementById("seat-selection-view"),
    "passenger": document.getElementById("passenger-details-view"),
    "checkout": document.getElementById("checkout-view"),
    "ticket": document.getElementById("ticket-view"),
    "dashboard": document.getElementById("dashboard-view"),
    "admin": document.getElementById("admin-view")
  };

  function navigateTo(viewName) {
    Object.keys(VIEWS).forEach(k => {
      if (VIEWS[k]) {
        VIEWS[k].classList.remove("active-view");
        VIEWS[k].style.display = "none";
      }
    });

    const target = VIEWS[viewName];
    if (target) {
      target.style.display = "block";
      setTimeout(() => {
        target.classList.add("active-view");
      }, 50);
    }

    document.querySelectorAll(".nav-link").forEach(lnk => {
      lnk.classList.remove("active");
      if (lnk.getAttribute("data-view") === viewName) {
        lnk.classList.add("active");
      }
    });

    if (viewName === "dashboard") {
      renderDashboard();
    } else if (viewName === "admin") {
      renderAdminDashboard();
    }
    
    window.scrollTo(0, 0);
  }

  document.querySelectorAll(".nav-link[data-view]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(btn.getAttribute("data-view"));
    });
  });

  document.getElementById("header-logo-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("home");
  });

  // ==========================================================================
  // 4. AUTOCOMPLETE & DOMESTIC SEARCH PANEL
  // ==========================================================================

  const fromInput = document.getElementById("search-from");
  const toInput = document.getElementById("search-to");
  const fromResults = document.getElementById("from-autocomplete-results");
  const toResults = document.getElementById("to-autocomplete-results");

  function setupAutocomplete(inputEl, dropdownEl, stateKey) {
    inputEl.addEventListener("input", () => {
      const query = inputEl.value.trim().toLowerCase();
      dropdownEl.innerHTML = "";

      if (!query) {
        dropdownEl.style.display = "none";
        return;
      }

      const matches = AIRPORTS_LOCAL.filter(ap => 
        ap.code.toLowerCase().includes(query) || 
        ap.city.toLowerCase().includes(query) || 
        ap.name.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        dropdownEl.style.display = "none";
        return;
      }

      dropdownEl.style.display = "block";
      matches.forEach(ap => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerHTML = `
          <div>
            <span class="autocomplete-city">${ap.city}</span>
            <span style="font-size: 0.75rem; color: hsl(var(--text-muted)); margin-left: 8px;">${ap.name}</span>
          </div>
          <span class="autocomplete-code">${ap.code}</span>
        `;
        item.addEventListener("click", () => {
          inputEl.value = `${ap.city} (${ap.code})`;
          State.query[stateKey] = ap.code;
          dropdownEl.style.display = "none";
        });
        dropdownEl.appendChild(item);
      });
    });

    document.addEventListener("click", (e) => {
      if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
        dropdownEl.style.display = "none";
      }
    });
  }

  setupAutocomplete(fromInput, fromResults, "from");
  setupAutocomplete(toInput, toResults, "to");

  // Swap route button
  document.getElementById("btn-swap-airports").addEventListener("click", () => {
    const fVal = fromInput.value;
    const tVal = toInput.value;
    const fState = State.query.from;
    const tState = State.query.to;

    fromInput.value = tVal;
    toInput.value = fVal;
    State.query.from = tState;
    State.query.to = fState;
  });

  // Trip Type Toggling
  const tripTabs = document.querySelectorAll(".search-tab-btn");
  const returnFormGroup = document.getElementById("return-date-group");
  
  tripTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tripTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const type = tab.getAttribute("data-type");
      State.query.tripType = type;
      returnFormGroup.style.display = type === "roundtrip" ? "block" : "none";
    });
  });

  // Date limit validations
  const departInput = document.getElementById("search-depart-date");
  const returnInput = document.getElementById("search-return-date");
  const todayString = new Date().toISOString().split("T")[0];
  departInput.min = todayString;
  returnInput.min = todayString;

  departInput.addEventListener("change", () => {
    returnInput.min = departInput.value;
  });

  // Passenger counts dropdown setup
  const passengerBtn = document.getElementById("search-passengers");
  const passengerPicker = document.getElementById("passenger-picker");

  passengerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    passengerPicker.style.display = passengerPicker.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!passengerBtn.contains(e.target) && !passengerPicker.contains(e.target)) {
      passengerPicker.style.display = "none";
    }
  });

  const passengerTypes = ["adults", "children", "infants"];
  passengerTypes.forEach(type => {
    const btnMinus = document.querySelector(`.counter-btn[data-type="${type}"][data-action="minus"]`);
    const btnPlus = document.querySelector(`.counter-btn[data-type="${type}"][data-action="plus"]`);
    const valEl = document.querySelector(`.counter-val[data-type="${type}"]`);

    btnMinus.addEventListener("click", (e) => {
      e.stopPropagation();
      let val = State.query.passengers[type];
      if (type === "adults" && val <= 1) return;
      if (val <= 0) return;
      val -= 1;
      State.query.passengers[type] = val;
      valEl.textContent = val;
      updatePassengerSummaryBtn();
    });

    btnPlus.addEventListener("click", (e) => {
      e.stopPropagation();
      let val = State.query.passengers[type];
      val += 1;
      State.query.passengers[type] = val;
      valEl.textContent = val;
      updatePassengerSummaryBtn();
    });
  });

  function updatePassengerSummaryBtn() {
    const p = State.query.passengers;
    const total = p.adults + p.children + p.infants;
    passengerBtn.value = `${total} Passenger${total > 1 ? 's' : ''}`;
  }

  // ==========================================================================
  // 5. FLIGHT SEARCH & DYNAMIC LISTS ENGINE (HYBRID API FETCHES)
  // ==========================================================================

  document.getElementById("search-flights-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const from = State.query.from;
    const to = State.query.to;
    const date = departInput.value;
    const cabin = document.getElementById("search-cabin-class").value;

    if (!from || !to) {
      alert("Please select valid origin and destination airports using the autocomplete suggestions.");
      return;
    }
    if (!date) {
      alert("Please select departure date.");
      return;
    }

    State.query.date = date;
    State.query.cabinClass = cabin;

    navigateTo("results");
    executeFlightSearch();
  });

  async function executeFlightSearch() {
    const resultsContainer = document.getElementById("flights-list-target");
    const countEl = document.getElementById("results-count-text");

    // Reset filters
    State.results.filters.stops = [];
    State.results.filters.airlines = [];
    State.results.filters.priceMax = 15000;
    State.results.filters.times = [];
    resetFilterSidebarUI();

    resultsContainer.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
    countEl.textContent = "Connecting to Indian carriers...";

    // Dynamic latency shimmer simulation
    setTimeout(async () => {
      try {
        if (serverOnline) {
          const response = await fetch(`${API_BASE_URL}/flights/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromCode: State.query.from,
              toCode: State.query.to,
              date: State.query.date,
              cabinClass: State.query.cabinClass
            })
          });

          if (response.ok) {
            const data = await response.json();
            State.results.list = data;
            applyFiltersAndSort();
            return;
          }
        }
        throw new Error("Server connection lost");
      } catch (err) {
        // Fallback to LocalStorage
        console.warn("[Search API Fallback] Loading results from local client DB...");
        const db = JSON.parse(localStorage.getItem("skyvoyage_flights")) || [];
        const matched = db.filter(fl => 
          fl.from_code === State.query.from && 
          fl.to_code === State.query.to && 
          fl.flight_date === State.query.date
        );
        State.results.list = matched;
        applyFiltersAndSort();
      }
    }, 1000);
  }

  function applyFiltersAndSort() {
    let list = [...State.results.list];
    const f = State.results.filters;

    if (f.stops.length > 0) {
      list = list.filter(fl => f.stops.includes(fl.stops));
    }
    if (f.airlines.length > 0) {
      list = list.filter(fl => f.airlines.includes(fl.airline));
    }
    list = list.filter(fl => calculateCabinFare(fl.base_price, State.query.cabinClass) <= f.priceMax);

    if (f.times.length > 0) {
      list = list.filter(fl => {
        const hour = parseInt(fl.departure.split(":")[0]);
        if (f.times.includes("morning") && hour >= 5 && hour < 12) return true;
        if (f.times.includes("afternoon") && hour >= 12 && hour < 17) return true;
        if (f.times.includes("evening") && hour >= 17 && hour < 21) return true;
        if (f.times.includes("night") && (hour >= 21 || hour < 5)) return true;
        return false;
      });
    }

    if (State.results.sort === "cheapest") {
      list.sort((a, b) => a.base_price - b.base_price);
    } else if (State.results.sort === "fastest") {
      list.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
    } else if (State.results.sort === "best") {
      list.sort((a, b) => {
        const valA = a.base_price + (a.stops * 2000) + (parseDuration(a.duration) * 5);
        const valB = b.base_price + (b.stops * 2000) + (parseDuration(b.duration) * 5);
        return valA - valB;
      });
    }

    renderFlightCards(list);
  }

  function renderFlightCards(list) {
    const resultsContainer = document.getElementById("flights-list-target");
    const countEl = document.getElementById("results-count-text");

    countEl.textContent = `${list.length} Flight${list.length !== 1 ? 's' : ''} found from ${State.query.from} to ${State.query.to}`;

    if (list.length === 0) {
      resultsContainer.innerHTML = `
        <div class="glass-panel" style="text-align: center; padding: 50px 20px;">
          <svg style="width: 60px; height: 60px; fill: hsl(var(--text-muted)); margin-bottom: 16px;" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/></svg>
          <h3 style="margin-bottom: 10px;">No Flights Available</h3>
          <p style="color: hsl(var(--text-muted)); max-width: 420px; margin: 0 auto 20px auto;">We couldn't find flights matching your active filters. Try expanding search options.</p>
          <button class="btn btn-secondary" id="btn-reset-results-filters">Reset Filters</button>
        </div>
      `;
      document.getElementById("btn-reset-results-filters").addEventListener("click", () => {
        State.results.filters.stops = [];
        State.results.filters.airlines = [];
        State.results.filters.priceMax = 15000;
        State.results.filters.times = [];
        resetFilterSidebarUI();
        applyFiltersAndSort();
      });
      return;
    }

    resultsContainer.innerHTML = "";
    list.forEach(fl => {
      const air = AIRLINES[fl.airline];
      const finalPrice = calculateCabinFare(fl.base_price, State.query.cabinClass);
      
      const card = document.createElement("div");
      card.className = "flight-card";
      card.innerHTML = `
        <div class="airline-badge">
          <div class="airline-icon-container" style="border-color: ${air.color}50;">
            <span style="color: ${air.color}; display: flex; align-items: center;">${air.icon}</span>
          </div>
          <div class="airline-name">${air.name}</div>
        </div>
        <div class="flight-route-info">
          <div class="route-node">
            <div class="route-time">${fl.departure.substring(0, 5)}</div>
            <div class="route-airport">${fl.from_code}</div>
          </div>
          <div class="route-timeline">
            <div class="route-duration">${fl.duration}</div>
            <div class="timeline-bar">
              ${fl.stops > 0 ? '<div class="timeline-stop-node"></div>' : ''}
            </div>
            <div class="route-stops ${fl.stops === 0 ? 'non-stop' : 'has-stops'}">
              ${fl.stops === 0 ? 'Non-stop' : `${fl.stops} Stop`}
            </div>
          </div>
          <div class="route-node">
            <div class="route-time">${fl.arrival.substring(0, 5)}</div>
            <div class="route-airport">${fl.to_code}</div>
          </div>
        </div>
        <div class="flight-cabin-class">
          <span class="cabin-badge cabin-${State.query.cabinClass}">${State.query.cabinClass}</span>
        </div>
        <div>
          <div class="route-stops" style="color: hsl(var(--text-muted)); font-weight: 500;">Flight No</div>
          <div style="font-weight: 700; color: #fff; margin-top: 4px;">${fl.flight_no}</div>
        </div>
        <div class="flight-card-pricing">
          <span class="price-label">Starts at</span>
          <span class="price-val">₹${finalPrice.toLocaleString("en-IN")}</span>
          <button class="btn btn-primary btn-select-flight" style="padding: 10px 16px; font-size: 0.8rem; margin-top: 8px;" data-id="${fl.id}">Book Now</button>
        </div>
      `;

      card.querySelector(".btn-select-flight").addEventListener("click", () => {
        selectFlight(fl);
      });

      resultsContainer.appendChild(card);
    });
  }

  function calculateCabinFare(base, cabin) {
    if (cabin === "premium") return Math.round(base * 1.35);
    if (cabin === "business") return Math.round(base * 2.2);
    if (cabin === "first") return Math.round(base * 3.8);
    return base;
  }

  function parseDuration(durStr) {
    const parts = durStr.split(" ");
    const h = parseInt(parts[0].replace("h", "")) || 0;
    const m = parseInt(parts[1].replace("m", "")) || 0;
    return (h * 60) + m;
  }

  // Connect Stops Filters
  document.querySelectorAll(".filter-stop-checkbox").forEach(chk => {
    chk.addEventListener("change", () => {
      const val = parseInt(chk.value);
      if (chk.checked) State.results.filters.stops.push(val);
      else State.results.filters.stops = State.results.filters.stops.filter(s => s !== val);
      applyFiltersAndSort();
    });
  });

  // Connect Airline Filters
  document.querySelectorAll(".filter-airline-checkbox").forEach(chk => {
    chk.addEventListener("change", () => {
      const val = chk.value;
      if (chk.checked) State.results.filters.airlines.push(val);
      else State.results.filters.airlines = State.results.filters.airlines.filter(s => s !== val);
      applyFiltersAndSort();
    });
  });

  // Connect Price Slider
  const priceSlider = document.getElementById("filter-price-slider");
  const priceValText = document.getElementById("filter-price-value");
  priceSlider.addEventListener("input", () => {
    const val = parseInt(priceSlider.value);
    priceValText.textContent = `₹${val.toLocaleString("en-IN")}`;
    State.results.filters.priceMax = val;
    applyFiltersAndSort();
  });

  // Connect Time Filters
  document.querySelectorAll(".filter-time-checkbox").forEach(chk => {
    chk.addEventListener("change", () => {
      const val = chk.value;
      if (chk.checked) State.results.filters.times.push(val);
      else State.results.filters.times = State.results.filters.times.filter(t => t !== val);
      applyFiltersAndSort();
    });
  });

  // Connect Sort Tabs
  document.querySelectorAll(".sort-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sort-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      State.results.sort = btn.getAttribute("data-sort");
      applyFiltersAndSort();
    });
  });

  function resetFilterSidebarUI() {
    document.querySelectorAll(".filter-stop-checkbox, .filter-airline-checkbox, .filter-time-checkbox").forEach(chk => {
      chk.checked = false;
    });
    priceSlider.value = 15000;
    priceValText.textContent = "₹15,000";
  }

  // ==========================================================================
  // 6. INTERACTIVE SEAT SELECTION & API SEATS ENGINES
  // ==========================================================================

  async function selectFlight(flight) {
    State.bookingInProgress.flight = flight;
    State.bookingInProgress.seats = [];
    navigateTo("seats");
    
    // Fetch live occupied seats from server
    let occupied = [];
    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/flights/${flight.id}/seats`);
        if (response.ok) {
          occupied = await response.json();
        }
      } else {
        throw new Error("Offline mode");
      }
    } catch (err) {
      console.warn("Offline fallback loading occupied seats index...");
      const db = JSON.parse(localStorage.getItem("skyvoyage_flights")) || [];
      const flRecord = db.find(f => f.id === flight.id);
      if (flRecord) {
        occupied = JSON.parse(flRecord.occupied_seats);
      }
    }

    // Bind back to active flight copy
    State.bookingInProgress.flight.occupiedSeats = occupied;
    renderSeatMap();
  }

  function renderSeatMap() {
    const flight = State.bookingInProgress.flight;
    const cabinGrid = document.getElementById("seat-map-grid");
    const requiredSeats = State.query.passengers.adults + State.query.passengers.children;

    document.getElementById("seat-flight-title").textContent = `${AIRLINES[flight.airline].name} ${flight.flight_no}`;
    document.getElementById("seat-route-lbl").textContent = `${flight.from_code} ➔ ${flight.to_code} | ${flight.flight_date}`;
    document.getElementById("seat-passenger-count-alert").textContent = `Please select exactly ${requiredSeats} seat${requiredSeats !== 1 ? 's' : ''}`;

    cabinGrid.innerHTML = "";

    // Generate grid: 15 rows of 6 seats (3x3 grid)
    for (let r = 1; r <= 15; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "seat-row";

      const rowNum = document.createElement("div");
      rowNum.className = "seat-row-number";
      rowNum.textContent = r;
      rowDiv.appendChild(rowNum);

      const leftCol = document.createElement("div");
      leftCol.className = "seat-half left-half";
      ['A', 'B', 'C'].forEach(ch => createSeatNode(r, ch, leftCol));
      rowDiv.appendChild(leftCol);

      const rightCol = document.createElement("div");
      rightCol.className = "seat-half right-half";
      ['D', 'E', 'F'].forEach(ch => createSeatNode(r, ch, rightCol));
      rowDiv.appendChild(rightCol);

      cabinGrid.appendChild(rowDiv);
    }

    updateSeatSummary();
  }

  function createSeatNode(row, letter, parentContainer) {
    const flight = State.bookingInProgress.flight;
    const seatId = (row - 1) * 6 + ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(letter) + 1;
    const isOccupied = flight.occupiedSeats.includes(seatId);
    const isExtraLegroom = row <= 3;

    const seat = document.createElement("div");
    seat.className = "seat-node";
    if (isOccupied) seat.classList.add("occupied");
    if (isExtraLegroom) seat.classList.add("extra-legroom");
    
    seat.title = `Seat ${row}${letter} (${isExtraLegroom ? 'Extra Legroom - +₹999' : 'Standard Seat'})`;

    seat.addEventListener("click", () => {
      if (isOccupied) return;

      const requiredSeats = State.query.passengers.adults + State.query.passengers.children;
      const idx = State.bookingInProgress.seats.indexOf(seatId);

      if (idx !== -1) {
        State.bookingInProgress.seats.splice(idx, 1);
        seat.classList.remove("selected");
      } else {
        if (State.bookingInProgress.seats.length >= requiredSeats) {
          const oldestSeatId = State.bookingInProgress.seats.shift();
          const oldSeatEl = document.querySelector(`.seat-node[data-id="${oldestSeatId}"]`);
          if (oldSeatEl) oldSeatEl.classList.remove("selected");
        }
        State.bookingInProgress.seats.push(seatId);
        seat.classList.add("selected");
      }

      updateSeatSummary();
    });

    seat.setAttribute("data-id", seatId);
    parentContainer.appendChild(seat);
  }

  function convertSeatIdToLabel(id) {
    const row = Math.floor((id - 1) / 6) + 1;
    const letter = ['A', 'B', 'C', 'D', 'E', 'F'][(id - 1) % 6];
    return `${row}${letter}`;
  }

  function isSeatExtraLegroom(id) {
    const row = Math.floor((id - 1) / 6) + 1;
    return row <= 3;
  }

  function updateSeatSummary() {
    const flight = State.bookingInProgress.flight;
    const selected = State.bookingInProgress.seats;
    const listEl = document.getElementById("seat-summary-list");
    const btnNext = document.getElementById("btn-seat-confirm");
    
    const baseCabinPrice = calculateCabinFare(flight.base_price, State.query.cabinClass);
    let totalSeatFees = 0;

    listEl.innerHTML = "";

    if (selected.length === 0) {
      listEl.innerHTML = `<div style="color: hsl(var(--text-muted)); font-style: italic; font-size: 0.85rem;">No seats selected</div>`;
      btnNext.disabled = true;
      document.getElementById("seat-total-cost-text").textContent = `₹${baseCabinPrice.toLocaleString("en-IN")}`;
      return;
    }

    selected.forEach(sid => {
      const label = convertSeatIdToLabel(sid);
      const isLegroom = isSeatExtraLegroom(sid);
      const fee = isLegroom ? 999 : 0;
      totalSeatFees += fee;

      const item = document.createElement("div");
      item.className = "summary-row";
      item.innerHTML = `
        <span class="summary-label">Seat ${label} ${isLegroom ? '(Extra Legroom)' : '(Standard)'}</span>
        <span class="summary-val">+₹${fee.toLocaleString("en-IN")}</span>
      `;
      listEl.appendChild(item);
    });

    const finalTotal = baseCabinPrice * State.query.passengers.adults + totalSeatFees;
    document.getElementById("seat-total-cost-text").textContent = `₹${finalTotal.toLocaleString("en-IN")}`;

    const requiredSeats = State.query.passengers.adults + State.query.passengers.children;
    btnNext.disabled = selected.length !== requiredSeats;
  }

  document.getElementById("btn-seat-confirm").addEventListener("click", () => {
    navigateTo("passenger");
    initPassengerForm();
  });

  // ==========================================================================
  // 7. PASSENGER DETAILS & INVOICING
  // ==========================================================================

  function initPassengerForm() {
    const requiredPax = State.query.passengers.adults + State.query.passengers.children;
    const formContainer = document.getElementById("passenger-forms-wrapper");
    formContainer.innerHTML = "";

    for (let i = 1; i <= requiredPax; i++) {
      const isChild = i > State.query.passengers.adults;
      
      const pForm = document.createElement("div");
      pForm.className = "glass-panel passenger-form-section";
      pForm.innerHTML = `
        <div class="section-head">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <h3 style="font-size: 1.15rem;">Passenger ${i} (${isChild ? 'Child' : 'Adult'})</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Full Name (as in Passport/ID)</label>
            <input type="text" class="form-input pax-input-name" required placeholder="Enter full name" style="padding-left: 16px;">
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-input pax-input-gender" style="padding-left: 16px;">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      `;
      formContainer.appendChild(pForm);
    }

    document.getElementById("contact-email").value = State.currentUser.email;
    document.getElementById("contact-phone").value = State.currentUser.phone.replace("+91 ", "");

    const gstChk = document.getElementById("chk-gst-invoice");
    const gstFields = document.getElementById("gst-fields-container");
    const gstCard = document.getElementById("gst-checkbox-card");

    gstChk.addEventListener("change", () => {
      if (gstChk.checked) {
        gstFields.style.display = "grid";
        gstCard.classList.add("active");
      } else {
        gstFields.style.display = "none";
        gstCard.classList.remove("active");
      }
    });

    // Reset addon comforts selection
    document.querySelectorAll(".addon-card").forEach(card => {
      card.classList.remove("selected");
      const type = card.getAttribute("data-addon");
      State.bookingInProgress.addons[type] = false;
    });
  }

  // Bind addon selection click events
  document.querySelectorAll(".addon-card").forEach(card => {
    card.addEventListener("click", () => {
      const type = card.getAttribute("data-addon");
      const isSelected = card.classList.contains("selected");

      if (isSelected) {
        card.classList.remove("selected");
        State.bookingInProgress.addons[type] = false;
      } else {
        card.classList.add("selected");
        State.bookingInProgress.addons[type] = true;
      }
    });
  });

  // Handle passenger confirmation form submission
  document.getElementById("btn-passenger-confirm").addEventListener("click", (e) => {
    e.preventDefault();

    const nameInputs = document.querySelectorAll(".pax-input-name");
    const genderInputs = document.querySelectorAll(".pax-input-gender");
    const paxDetails = [];
    let isValid = true;

    nameInputs.forEach((inp, idx) => {
      const name = inp.value.trim();
      if (!name) {
        isValid = false;
        inp.style.borderColor = "hsl(var(--color-error))";
      } else {
        inp.style.borderColor = "";
        paxDetails.push({ name: name, gender: genderInputs[idx].value });
      }
    });

    const email = document.getElementById("contact-email").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    if (!email || !phone) {
      alert("Please fill in contact parameters.");
      return;
    }

    const gstChk = document.getElementById("chk-gst-invoice");
    let gstInfo = null;
    if (gstChk.checked) {
      const gstin = document.getElementById("gstin-no").value.trim();
      const comp = document.getElementById("gstin-name").value.trim();
      if (!gstin || !comp) {
        alert("Please complete corporate GST fields.");
        return;
      }
      gstInfo = { gstin: gstin, company: comp };
    }

    if (!isValid) {
      alert("Please fill in all Passenger details.");
      return;
    }

    State.bookingInProgress.passengerInfo = {
      list: paxDetails,
      email: email,
      phone: `+91 ${phone}`
    };
    State.bookingInProgress.gstInfo = gstInfo;

    navigateTo("checkout");
    initCheckoutView();
  });

  // ==========================================================================
  // 8. CHECKOUT & SECURE PAYMENT SIMULATOR
  // ==========================================================================

  function initCheckoutView() {
    const flight = State.bookingInProgress.flight;
    const seats = State.bookingInProgress.seats;
    const addons = State.bookingInProgress.addons;
    const air = AIRLINES[flight.airline];
    const baseCabinPrice = calculateCabinFare(flight.base_price, State.query.cabinClass);
    const numPax = State.query.passengers.adults + State.query.passengers.children;

    document.getElementById("checkout-flight-badge").innerHTML = `
      <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; fill: #fff;">
        ${air.icon}
      </div>
      <div>
        <div style="font-weight: 700;">${air.name} ${flight.flight_no}</div>
        <div style="font-size: 0.75rem; color: hsl(var(--text-muted));">${flight.from_code} ➔ ${flight.to_code} | ${flight.flight_date}</div>
      </div>
    `;

    const flightSubtotal = baseCabinPrice * numPax;
    let totalSeatFees = 0;
    seats.forEach(sid => {
      if (isSeatExtraLegroom(sid)) totalSeatFees += 999;
    });

    let addonFees = 0;
    if (addons.baggage) addonFees += 1500 * numPax;
    if (addons.meal) addonFees += 450 * numPax;
    if (addons.priority) addonFees += 350 * numPax;
    if (addons.offset) addonFees += 150 * numPax;

    const baseFareDiscount = Math.round(flightSubtotal * State.bookingInProgress.discountPercent);
    const convenienceFee = 299;
    const taxConvenience = Math.round(convenienceFee * 0.18);
    const netInvoiceTotal = (flightSubtotal - baseFareDiscount) + totalSeatFees + addonFees + convenienceFee + taxConvenience;

    document.getElementById("invoice-flight-sub").textContent = `₹${flightSubtotal.toLocaleString("en-IN")}`;
    document.getElementById("invoice-seat-fees").textContent = `₹${totalSeatFees.toLocaleString("en-IN")}`;
    
    const addonsEl = document.getElementById("invoice-addons-row");
    if (addonFees > 0) {
      addonsEl.style.display = "flex";
      document.getElementById("invoice-addons").textContent = `₹${addonFees.toLocaleString("en-IN")}`;
    } else {
      addonsEl.style.display = "none";
    }

    const discountEl = document.getElementById("invoice-discount-row");
    if (baseFareDiscount > 0) {
      discountEl.style.display = "flex";
      document.getElementById("invoice-discount").textContent = `-₹${baseFareDiscount.toLocaleString("en-IN")}`;
    } else {
      discountEl.style.display = "none";
    }

    document.getElementById("invoice-convenience").textContent = `₹${convenienceFee.toLocaleString("en-IN")}`;
    document.getElementById("invoice-taxes").textContent = `₹${taxConvenience.toLocaleString("en-IN")}`;
    document.getElementById("invoice-grand-total").textContent = `₹${netInvoiceTotal.toLocaleString("en-IN")}`;
    document.getElementById("rp-grand-total-amount").textContent = `₹${netInvoiceTotal.toLocaleString("en-IN")}`;

    // Reset payment fields
    document.getElementById("input-rp-upi-id").value = "";
    document.getElementById("rp-card-num").value = "";
    document.getElementById("rp-card-holder").value = "";
    document.getElementById("rp-card-expiry").value = "";
    document.getElementById("rp-card-cvv").value = "";
    updateInteractiveCardDisplay();
  }

  // Coupon applied codes logic
  const btnApplyPromo = document.getElementById("btn-apply-promo");
  const inputPromo = document.getElementById("input-promo-code");
  const promoStatusTag = document.getElementById("promo-status-alert");

  btnApplyPromo.addEventListener("click", () => {
    const code = inputPromo.value.trim().toUpperCase();
    if (!code) return;

    if (PROMO_CODES[code]) {
      State.bookingInProgress.discountPercent = PROMO_CODES[code];
      State.bookingInProgress.activePromoCode = code;
      
      promoStatusTag.innerHTML = `
        <span>Code <strong>${code}</strong> applied! 10% discount on base flight fare!</span>
        <span id="btn-remove-promo" style="cursor: pointer; font-weight: 800; font-size: 1rem; margin-left: 8px;">&times;</span>
      `;
      promoStatusTag.style.display = "flex";
      
      document.getElementById("btn-remove-promo").addEventListener("click", () => {
        State.bookingInProgress.discountPercent = 0;
        State.bookingInProgress.activePromoCode = null;
        promoStatusTag.style.display = "none";
        inputPromo.value = "";
        initCheckoutView();
      });

      initCheckoutView();
    } else {
      alert("Invalid promo code. Try using 'INDIANFLYER'.");
    }
  });

  // Razorpay Tab Controls
  const rpTabs = document.querySelectorAll(".method-tab");
  const rpViews = document.querySelectorAll(".payment-method-view");
  rpTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      rpTabs.forEach(t => t.classList.remove("active"));
      rpViews.forEach(v => v.classList.remove("active"));

      tab.classList.add("active");
      const targetMode = tab.getAttribute("data-method");
      document.getElementById(`rp-view-${targetMode}`).classList.add("active");
    });
  });

  // 3D Credit card animation events
  const cardOuter = document.querySelector(".credit-card-silhouette");
  const inputCvv = document.getElementById("rp-card-cvv");
  inputCvv.addEventListener("focus", () => cardOuter.classList.add("flip"));
  inputCvv.addEventListener("blur", () => cardOuter.classList.remove("flip"));

  const cardFields = [
    { id: "rp-card-num", target: "d-card-number", def: "•••• •••• •••• ••••" },
    { id: "rp-card-holder", target: "d-card-holder", def: "YOUR FULL NAME" },
    { id: "rp-card-expiry", target: "d-card-expiry", def: "MM/YY" },
    { id: "rp-card-cvv", target: "d-card-cvv", def: "•••" }
  ];

  cardFields.forEach(fld => {
    const input = document.getElementById(fld.id);
    const display = document.getElementById(fld.target);

    input.addEventListener("input", () => {
      let val = input.value;
      if (fld.id === "rp-card-num") {
        val = val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
        input.value = val.substring(0, 19);
        display.textContent = input.value || fld.def;
      } else if (fld.id === "rp-card-expiry") {
        val = val.replace(/\D/g, "");
        if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2, 4);
        input.value = val.substring(0, 5);
        display.textContent = input.value || fld.def;
      } else if (fld.id === "rp-card-cvv") {
        val = val.replace(/\D/g, "");
        input.value = val.substring(0, 3);
        display.textContent = input.value || fld.def;
      } else {
        display.textContent = val.toUpperCase() || fld.def;
      }
    });
  });

  function updateInteractiveCardDisplay() {
    cardFields.forEach(fld => {
      document.getElementById(fld.target).textContent = fld.def;
    });
  }

  // Quick UPI IDs
  document.querySelectorAll(".upi-app-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const vpa = btn.getAttribute("data-vpa");
      document.getElementById("input-rp-upi-id").value = `${State.currentUser.phone.replace(/[^0-9]/g, "")}@${vpa}`;
    });
  });

  // Handle Pay Triggers
  document.getElementById("btn-rp-pay-upi").addEventListener("click", () => {
    const upiVal = document.getElementById("input-rp-upi-id").value.trim();
    if (!upiVal || !upiVal.includes("@")) {
      alert("Please enter a valid UPI VPA ID.");
      return;
    }
    triggerPaymentExecution("upi", upiVal);
  });

  document.getElementById("btn-rp-pay-card").addEventListener("click", () => {
    const num = document.getElementById("rp-card-num").value;
    const hld = document.getElementById("rp-card-holder").value;
    const exp = document.getElementById("rp-card-expiry").value;
    const cvv = document.getElementById("rp-card-cvv").value;

    if (num.length < 19 || hld.length < 3 || exp.length < 5 || cvv.length < 3) {
      alert("Please enter valid card parameters.");
      return;
    }
    triggerPaymentExecution("card", `Card Ending ${num.substring(15)}`);
  });

  document.querySelectorAll(".nb-bank-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      triggerPaymentExecution("netbanking", btn.textContent);
    });
  });

  function triggerPaymentExecution(method, detailString) {
    const overlay = document.getElementById("rp-loader-overlay");
    const statusText = document.getElementById("rp-loader-status");

    overlay.classList.add("active");
    statusText.textContent = "Verifying with Payment Gateway...";

    setTimeout(() => {
      statusText.textContent = `Awaiting authentication on ${method.toUpperCase()} (${detailString})...`;
      
      setTimeout(() => {
        statusText.textContent = "Payment authorized! Syncing database and generating ticket...";
        
        setTimeout(() => {
          overlay.classList.remove("active");
          executeTicketGeneration(method, detailString);
        }, 1200);
      }, 1500);
    }, 1200);
  }

  // ==========================================================================
  // 9. Digital E-ticket Generation & Submissions (HYBRID APIS)
  // ==========================================================================

  async function executeTicketGeneration(payMethod, payDetail) {
    const flight = State.bookingInProgress.flight;
    const seats = State.bookingInProgress.seats;
    const pInfo = State.bookingInProgress.passengerInfo;
    const addons = State.bookingInProgress.addons;
    const baseCabinPrice = calculateCabinFare(flight.base_price, State.query.cabinClass);
    const numPax = pInfo.list.length;

    const flightSubtotal = baseCabinPrice * numPax;
    let seatFees = 0;
    seats.forEach(sid => {
      if (isSeatExtraLegroom(sid)) seatFees += 999;
    });

    let addonFees = 0;
    if (addons.baggage) addonFees += 1500 * numPax;
    if (addons.meal) addonFees += 450 * numPax;
    if (addons.priority) addonFees += 350 * numPax;
    if (addons.offset) addonFees += 150 * numPax;

    const discountAmount = Math.round(flightSubtotal * State.bookingInProgress.discountPercent);
    const netTotal = (flightSubtotal - discountAmount) + seatFees + addonFees + 299 + Math.round(299 * 0.18);

    const seatLabels = seats.map(sid => convertSeatIdToLabel(sid));
    const pNames = pInfo.list.map(p => p.name);
    const refId = "pay_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const bookingRequestData = {
      flightId: flight.id,
      seats: seats,
      seatLabels: seatLabels,
      passengers: pNames,
      contactEmail: pInfo.email,
      contactPhone: pInfo.phone,
      amount: netTotal,
      cabinClass: State.query.cabinClass,
      gst: State.bookingInProgress.gstInfo,
      payment: { method: payMethod, details: payDetail, reference_id: refId }
    };

    let bookingResult = null;

    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingRequestData)
        });

        if (response.ok) {
          bookingResult = await response.json();
        }
      }
      if (!bookingResult) throw new Error("Offline save required");
    } catch (err) {
      console.warn("[Booking API Fallback] Saving ticket to local LocalStorage DB...");
      const pnr = "SV" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const ticketNo = "T" + Math.floor(Math.random() * 899999 + 100000);

      bookingResult = {
        pnr: pnr,
        ticket_number: ticketNo,
        flight_id: flight.id,
        flight_no: flight.flight_no,
        airline: flight.airline,
        from_code: flight.from_code,
        to_code: flight.to_code,
        flight_date: flight.flight_date,
        departure: flight.departure,
        arrival: flight.arrival,
        cabin_class: State.query.cabinClass,
        seats: seats.join(","),
        seat_labels: seatLabels.join(","),
        passengers: pNames.join(","),
        amount: netTotal,
        gst: State.bookingInProgress.gstInfo,
        payment: { method: payMethod, details: payDetail, reference_id: refId },
        status: "active",
        timestamp: new Date().toISOString()
      };

      saveLocalBooking(bookingResult);
    }

    // Populate Boarding Pass View UI
    document.getElementById("ticket-pnr").textContent = bookingResult.pnr;
    document.getElementById("ticket-pax-names").textContent = bookingResult.passengers.replace(/,/g, ", ");
    document.getElementById("ticket-flight-no").textContent = bookingResult.flight_no;
    document.getElementById("ticket-date-str").textContent = new Date(bookingResult.flight_date).toLocaleDateString("en-IN", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    document.getElementById("ticket-origin-code").textContent = bookingResult.from_code;
    document.getElementById("ticket-dest-code").textContent = bookingResult.to_code;
    document.getElementById("ticket-origin-city").textContent = AIRPORTS_LOCAL.find(a => a.code === bookingResult.from_code).city;
    document.getElementById("ticket-dest-city").textContent = AIRPORTS_LOCAL.find(a => a.code === bookingResult.to_code).city;
    document.getElementById("ticket-dep-time").textContent = bookingResult.departure.substring(0, 5);
    document.getElementById("ticket-arr-time").textContent = bookingResult.arrival.substring(0, 5);
    document.getElementById("ticket-cabin-label").textContent = bookingResult.cabin_class;
    document.getElementById("ticket-seats").textContent = bookingResult.seat_labels.replace(/,/g, ", ");
    document.getElementById("ticket-barcode-pnr").textContent = bookingResult.pnr;

    const headerEl = document.getElementById("ticket-pass-header");
    headerEl.className = "ticket-header";
    headerEl.classList.add(`ticket-pass-${bookingResult.cabin_class}`);
    document.getElementById("ticket-class-tag").textContent = bookingResult.cabin_class;

    State.currentUser.miles += 1000 * seats.length;
    navigateTo("ticket");
  }

  // Boarding Pass action buttons
  document.getElementById("btn-print-ticket").addEventListener("click", () => window.print());
  document.getElementById("btn-close-ticket").addEventListener("click", () => navigateTo("dashboard"));

  // ==========================================================================
  // 10. PASSENGER LOYALTY DASHBOARD (HYBRID API FETCHES)
  // ==========================================================================

  async function renderDashboard() {
    const listContainer = document.getElementById("dash-bookings-list");
    let currentMiles = State.currentUser.miles;
    let currentTier = State.currentUser.tier;
    let currentName = State.currentUser.name;
    let bookings = [];

    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/user/dashboard`);
        if (response.ok) {
          const data = await response.json();
          currentMiles = data.user.miles;
          currentTier = data.user.tier;
          currentName = data.user.name;
          bookings = data.bookings;
        }
      } else {
        throw new Error("Offline fetch");
      }
    } catch (err) {
      console.warn("Offline fallback populating customer loyalty dashboard...");
      bookings = getLocalBookings();
    }

    document.getElementById("dash-miles").textContent = currentMiles.toLocaleString();
    document.getElementById("dash-tier").textContent = currentTier;
    document.getElementById("dash-pax-name").textContent = currentName;

    if (bookings.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: hsl(var(--text-muted)); font-style: italic; font-size: 0.9rem;">
          No booking history registered. Search flights to book your first trip!
        </div>
      `;
      return;
    }

    bookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listContainer.innerHTML = "";
    bookings.forEach(bk => {
      const card = document.createElement("div");
      card.className = "history-card";
      
      const isCancelled = bk.status === "cancelled";
      const flightNoStr = bk.flightNo || bk.flight_no;
      const seatLabelsStr = bk.seatLabels || bk.seat_labels;
      const dateStr = bk.date || bk.flight_date;
      
      card.innerHTML = `
        <div>
          <div class="history-route">${bk.from_code || bk.from} ➔ ${bk.to_code || bk.to}</div>
          <div class="history-date">${new Date(dateStr).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })} | Flight ${flightNoStr} | Seats ${seatLabelsStr.replace(/,/g, ", ")}</div>
          <div style="font-size: 0.75rem; color: hsl(var(--text-muted)); margin-top: 4px;">PNR: ${bk.pnr} | Ticket No: ${bk.ticket_number || bk.ticketNumber}</div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <span class="history-status-badge status-${isCancelled ? 'cancelled' : 'active'}">${bk.status}</span>
          <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">₹${parseInt(bk.amount).toLocaleString("en-IN")}</span>
          ${!isCancelled ? `<button class="btn btn-secondary btn-cancel-booking-dash" style="padding: 6px 12px; font-size: 0.7rem; text-transform: uppercase;" data-pnr="${bk.pnr}">Cancel</button>` : ''}
        </div>
      `;

      if (!isCancelled) {
        card.querySelector(".btn-cancel-booking-dash").addEventListener("click", async () => {
          if (confirm(`Are you sure you want to cancel booking ${bk.pnr}? Refund will be processed immediately.`)) {
            await executeBookingCancellation(bk.pnr);
          }
        });
      }

      listContainer.appendChild(card);
    });
  }

  async function executeBookingCancellation(pnr) {
    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/bookings/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pnr: pnr })
        });
        if (response.ok) {
          renderDashboard();
          return;
        }
      }
      throw new Error("Offline cancel");
    } catch (err) {
      console.warn("Offline cancel saving to local storage engine...");
      cancelLocalBooking(pnr);
      renderDashboard();
    }
  }

  // ==========================================================================
  // 11. ADMINISTRATIVE SCHEDULER & DYNAMIC SVG CHART (HYBRID APIS)
  // ==========================================================================

  async function renderAdminDashboard() {
    let totalSales = 0;
    let activeVolume = 0;
    let bookings = [];

    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/admin/metrics`);
        if (response.ok) {
          const data = await response.json();
          totalSales = data.totalRevenue;
          activeVolume = data.passengerVolume;
          bookings = data.bookings;
        }
      } else {
        throw new Error("Offline load");
      }
    } catch (err) {
      console.warn("Offline fallback populating admin panel metrics...");
      bookings = getLocalBookings();
      bookings.forEach(b => {
        if (b.status === "active") {
          totalSales += parseInt(b.amount);
          activeVolume += b.passengers.split(",").length;
        }
      });
    }

    document.getElementById("admin-total-revenue").textContent = `₹${totalSales.toLocaleString("en-IN")}`;
    document.getElementById("admin-total-bookings").textContent = activeVolume;

    // Build SVG Dynamic bars
    const barChart = document.getElementById("admin-svg-bars");
    barChart.innerHTML = "";
    
    const mockSalesData = [
      { lbl: "Mar", val: Math.round(totalSales * 0.25) || 50000 },
      { lbl: "Apr", val: Math.round(totalSales * 0.35) || 85000 },
      { lbl: "May", val: totalSales || 140000 }
    ];

    const maxVal = Math.max(...mockSalesData.map(d => d.val), 1000);
    const height = 150;
    const colWidth = 60;
    const gap = 30;

    mockSalesData.forEach((d, index) => {
      const x = index * (colWidth + gap) + 40;
      const barHeight = (d.val / maxVal) * 110;
      const y = height - barHeight - 20;

      barChart.innerHTML += `
        <rect class="chart-bar" x="${x}" y="${y}" width="${colWidth}" height="${barHeight}" fill="url(#chart-bar-gradient)"/>
        <text class="chart-text" x="${x + colWidth/2}" y="${height}" text-anchor="middle">${d.lbl}</text>
        <text class="chart-text" x="${x + colWidth/2}" y="${y - 6}" text-anchor="middle" fill="#fff" font-weight="700">₹${d.val.toLocaleString("en-IN")}</text>
      `;
    });

    // Populate active manifests database
    const manifestTable = document.getElementById("admin-manifest-rows");
    manifestTable.innerHTML = "";

    if (bookings.length === 0) {
      manifestTable.innerHTML = `<tr><td colspan="7" style="text-align: center; font-style: italic;">No booking records saved.</td></tr>`;
      return;
    }

    bookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    bookings.forEach(b => {
      const isCancelled = b.status === "cancelled";
      const tr = document.createElement("tr");
      
      const seatsStr = b.seatLabels || b.seat_labels;
      const flightNoStr = b.flightNo || b.flight_no;
      const amountVal = b.amount;
      const routeFrom = b.from_code || b.from;
      const routeTo = b.to_code || b.to;
      const cabinStr = b.cabinClass || b.cabin_class;

      tr.innerHTML = `
        <td style="font-weight: 700; color: #fff;">${b.pnr}</td>
        <td>${b.passengers.replace(/,/g, "<br>")}</td>
        <td>${routeFrom} ➔ ${routeTo} ${b.gst ? `<span style="color: hsl(var(--accent-gold)); font-size:0.7rem; font-weight:700;" title="Company GST: ${b.gst.company} (${b.gst.gstin})">GST</span>` : ""}</td>
        <td>Flight ${flightNoStr}<br><span style="font-size:0.75rem;">Class: ${cabinStr}</span></td>
        <td>${seatsStr.replace(/,/g, ", ")}</td>
        <td style="font-weight: 700; color: #fff;">₹${parseInt(amountVal).toLocaleString("en-IN")}</td>
        <td style="text-align: center;">
          ${!isCancelled ? `
            <button class="admin-action-btn btn-cancel" title="Cancel Booking" data-pnr="${b.pnr}">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
            </button>
          ` : `<span style="font-size:0.75rem; color: hsl(var(--color-error)); font-weight:600; text-transform:uppercase;">${b.status}</span>`}
        </td>
      `;

      if (!isCancelled) {
        tr.querySelector(".btn-cancel").addEventListener("click", async () => {
          if (confirm(`Admin Action: Cancel booking ${b.pnr} and release seat indices?`)) {
            await executeBookingCancellation(b.pnr);
            renderAdminDashboard();
          }
        });
      }

      manifestTable.appendChild(tr);
    });
  }

  // Admin New Flight form submission
  document.getElementById("admin-add-flight-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const airline = document.getElementById("admin-fl-airline").value;
    const fNo = document.getElementById("admin-fl-number").value.trim().toUpperCase();
    const origin = document.getElementById("admin-fl-origin").value.toUpperCase();
    const dest = document.getElementById("admin-fl-dest").value.toUpperCase();
    const date = document.getElementById("admin-fl-date").value;
    const dep = document.getElementById("admin-fl-dep").value;
    const arr = document.getElementById("admin-fl-arr").value;
    const dur = document.getElementById("admin-fl-dur").value.trim();
    const price = parseInt(document.getElementById("admin-fl-price").value);

    if (origin === dest) {
      alert("Origin and destination airports cannot match.");
      return;
    }

    const payload = {
      airline: airline,
      flightNo: fNo,
      fromCode: origin,
      toCode: dest,
      date: date,
      departure: dep + ":00",
      arrival: arr + ":00",
      duration: dur || "2h 00m",
      basePrice: price
    };

    try {
      if (serverOnline) {
        const response = await fetch(`${API_BASE_URL}/admin/flights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          alert(`Flight ${airline}-${fNo} successfully added to central database!`);
          document.getElementById("admin-add-flight-form").reset();
          renderAdminDashboard();
          return;
        } else {
          const errData = await response.json();
          alert(`Scheduler failed: ${errData.error}`);
          return;
        }
      }
      throw new Error("Offline save");
    } catch (err) {
      console.warn("Offline scheduler: saving to local LocalStorage DB...");
      const id = `${airline}-${date.replace(/-/g, "")}-${dep.replace(/:/g, "")}`;
      const db = JSON.parse(localStorage.getItem("skyvoyage_flights")) || [];
      
      const newFl = {
        id: id,
        airline: airline,
        flight_no: `${airline}-${fNo}`,
        from_code: origin,
        to_code: dest,
        flight_date: date,
        departure: dep + ":00",
        arrival: arr + ":00",
        duration: dur || "2h 00m",
        base_price: price,
        stops: 0,
        occupied_seats: "[]",
        total_seats: 90
      };

      db.push(newFl);
      localStorage.setItem("skyvoyage_flights", JSON.stringify(db));
      alert(`Flight ${airline}-${fNo} successfully added to local LocalStorage DB!`);
      document.getElementById("admin-add-flight-form").reset();
      renderAdminDashboard();
    }
  });

  // ==========================================================================
  // 12. BOOTSTRAP INITIAL ENGINE LAUNCHERS
  // ==========================================================================

  // Populate default inputs on homepage
  fromInput.value = "Delhi (DEL)";
  State.query.from = "DEL";
  toInput.value = "Mumbai (BOM)";
  State.query.to = "BOM";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  departInput.value = tomorrow.toISOString().split("T")[0];

  updatePassengerSummaryBtn();
  
  // Auditing connection and navigating home view on start
  auditConnectionStatus().finally(() => {
    navigateTo("home");
  });
});
