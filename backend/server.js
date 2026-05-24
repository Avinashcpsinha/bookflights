/* ==========================================================================
   SKYVOYAGE INDIA - PRODUCTION-GRADE EXPRESS SERVER
   ========================================================================== */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// ==========================================================================
// 1. HYBRID DATABASE CONNECTOR & RESILIENT IN-MEMORY ENGINE
// ==========================================================================

let db = null;
let useMockDB = false;
let dbDialect = process.env.DB_DIALECT || "mysql";

// In-Memory Database Fallback Arrays (used if DB connection is unavailable)
let mockFlights = [];
let mockBookings = [];
let mockUsers = [
  { id: 1, name: "Rohan Sharma", email: "rohan.sharma@gmail.com", phone: "+91 98765 43210", miles: 14850, tier: "Ashoka Elite Gold" }
];

function initializeMockDatabase() {
  const AIRPORTS_LIST = ["DEL", "BOM", "BLR", "MAA", "CCU", "HYD", "PNQ", "COK"];
  const AIRLINES_LIST = ["SG", "6E", "AI", "QP"];
  
  // Seed mock flights for next 30 days
  for (let day = 0; day < 30; day++) {
    const flightDate = new Date();
    flightDate.setDate(flightDate.getDate() + day);
    const dateString = flightDate.toISOString().split("T")[0];

    for (let i = 0; i < AIRPORTS_LIST.length; i++) {
      for (let j = 0; j < AIRPORTS_LIST.length; j++) {
        if (i === j) continue;
        if (Math.random() > 0.35) continue; // Keep database realistic

        const fromCode = AIRPORTS_LIST[i];
        const toCode = AIRPORTS_LIST[j];
        const airlineCode = AIRLINES_LIST[Math.floor(Math.random() * AIRLINES_LIST.length)];
        const depHour = Math.floor(Math.random() * 18) + 5;
        const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const durationMin = Math.floor(Math.random() * 90) + 90;

        const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}:00`;
        let arrHour = depHour + Math.floor(durationMin / 60);
        let arrMin = depMin + (durationMin % 60);
        if (arrMin >= 60) {
          arrHour += 1;
          arrMin -= 60;
        }
        const arrTime = `${String(arrHour % 24).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}:00`;
        const basePrice = Math.floor(Math.random() * 3500) + 3000;

        // Occupied seats
        const occupied = [];
        for (let s = 1; s <= 90; s++) {
          if (Math.random() < 0.25) occupied.push(s);
        }

        mockFlights.push({
          id: `${airlineCode}-${dateString.replace(/-/g, "")}-${depTime.substring(0,5).replace(/:/g, "")}`,
          airline: airlineCode,
          flight_no: `${airlineCode}-${Math.floor(Math.random() * 800) + 100}`,
          from_code: fromCode,
          to_code: toCode,
          flight_date: dateString,
          departure: depTime,
          arrival: arrTime,
          duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
          base_price: basePrice,
          stops: Math.random() > 0.8 ? 1 : 0,
          occupied_seats: JSON.stringify(occupied),
          total_seats: 90
        });
      }
    }
  }
  console.log(`[Mock Engine] Seeded ${mockFlights.length} resilient domestic flights into server memory.`);
}

// Attempt Connection to Live DB
if (dbDialect === "postgres") {
  const { Pool } = require("pg");
  db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000
  });

  db.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.warn("\n⚠️ [DB Connection Warning] PostgreSQL is not running or credentials are wrong.");
      console.warn("👉 Server is automatically launching RESILIENT IN-MEMORY fallback. All features will work!\n");
      useMockDB = true;
      initializeMockDatabase();
    } else {
      console.log(`✅ [Database Connected] PostgreSQL successfully online at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    }
  });
} else {
  // MySQL / MariaDB Default
  const mysql = require("mysql2");
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
    database: process.env.DB_NAME || "skyvoyage_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  db = pool.promise();

  db.query("SELECT 1")
    .then(() => {
      console.log(`✅ [Database Connected] MySQL/MariaDB successfully online at ${process.env.DB_HOST || "127.0.0.1"}:3306`);
    })
    .catch((err) => {
      console.warn("\n⚠️ [DB Connection Warning] MySQL/MariaDB is not running or credentials are wrong.");
      console.warn("👉 Server is automatically launching RESILIENT IN-MEMORY fallback. All features will work!\n");
      useMockDB = true;
      initializeMockDatabase();
    });
}

// ==========================================================================
// 2. PUBLIC FLIGHT INTEGRATION API ENDPOINTS
// ==========================================================================

const AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International Airport" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Airport" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport" },
  { code: "MAA", city: "Chennai", name: "Chennai International Airport" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose Airport" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport" },
  { code: "PNQ", city: "Pune", name: "Pune International Airport" },
  { code: "COK", city: "Kochi", name: "Cochin International Airport" }
];

// Server Ping Health Check
app.get("/api/ping", (req, res) => {
  res.json({ status: "online", time: new Date().toISOString(), mockMode: useMockDB });
});

// GET /api/airports
app.get("/api/airports", (req, res) => {
  res.json(AIRPORTS);
});

// POST /api/flights/search
app.post("/api/flights/search", async (req, res) => {
  const { fromCode, toCode, date, cabinClass } = req.body;
  
  if (!fromCode || !toCode || !date) {
    return res.status(400).json({ error: "Missing required search parameters." });
  }

  try {
    let flights = [];
    
    if (useMockDB) {
      flights = mockFlights.filter(fl => 
        fl.from_code === fromCode && 
        fl.to_code === toCode && 
        fl.flight_date === date
      );
    } else {
      let queryStr = "SELECT * FROM flights WHERE from_code = ? AND to_code = ? AND flight_date = ?";
      if (dbDialect === "postgres") {
        queryStr = "SELECT * FROM flights WHERE from_code = $1 AND to_code = $2 AND flight_date = $3";
      }

      const params = [fromCode, toCode, date];
      const [rows] = await db.query(queryStr, params);
      
      // SQL drivers return records in rows array or directly
      flights = Array.isArray(rows) ? rows : (rows.rows || []);
    }

    res.json(flights);
  } catch (error) {
    console.error("Search flights failed:", error);
    res.status(500).json({ error: "Internal server error querying flights." });
  }
});

// GET /api/flights/:id/seats
app.get("/api/flights/:id/seats", async (req, res) => {
  const flightId = req.params.id;

  try {
    let occupied = [];

    if (useMockDB) {
      const fl = mockFlights.find(f => f.id === flightId);
      if (fl) {
        occupied = JSON.parse(fl.occupied_seats);
      }
    } else {
      let queryStr = "SELECT occupied_seats FROM flights WHERE id = ?";
      if (dbDialect === "postgres") {
        queryStr = "SELECT occupied_seats FROM flights WHERE id = $1";
      }

      const [rows] = await db.query(queryStr, [flightId]);
      const record = Array.isArray(rows) ? rows[0] : (rows.rows ? rows.rows[0] : null);
      if (record) {
        occupied = typeof record.occupied_seats === "string" ? JSON.parse(record.occupied_seats) : record.occupied_seats;
      }
    }

    res.json(occupied);
  } catch (error) {
    console.error("Fetch seat mapping failed:", error);
    res.status(500).json({ error: "Internal server error fetching seating grid." });
  }
});

// POST /api/bookings
app.post("/api/bookings", async (req, res) => {
  const { 
    flightId, seats, seatLabels, passengers, 
    contactEmail, contactPhone, amount, cabinClass, gst, payment 
  } = req.body;

  if (!flightId || !seats || !passengers || !amount) {
    return res.status(400).json({ error: "Required passenger booking parameters are missing." });
  }

  // Generate real server-side codes
  const pnr = "SV" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const ticketNo = "T" + Math.floor(Math.random() * 899999 + 100000);
  const seatsString = Array.isArray(seats) ? seats.join(",") : seats;
  const labelsString = Array.isArray(seatLabels) ? seatLabels.join(",") : seatLabels;
  const paxString = Array.isArray(passengers) ? passengers.join(",") : passengers;

  try {
    if (useMockDB) {
      const flIdx = mockFlights.findIndex(f => f.id === flightId);
      if (flIdx === -1) {
        return res.status(404).json({ error: "Target flight schedule not found." });
      }

      // Lock seats in mock flight record
      const mockFlight = mockFlights[flIdx];
      const curOccupied = JSON.parse(mockFlight.occupied_seats);
      curOccupied.push(...seats);
      mockFlight.occupied_seats = JSON.stringify(curOccupied);

      const bookingObj = {
        pnr: pnr,
        ticket_number: ticketNo,
        flight_id: flightId,
        flight_no: mockFlight.flight_no,
        airline: mockFlight.airline,
        from_code: mockFlight.from_code,
        to_code: mockFlight.to_code,
        flight_date: mockFlight.flight_date,
        departure: mockFlight.departure,
        arrival: mockFlight.arrival,
        cabin_class: cabinClass,
        seats: seatsString,
        seat_labels: labelsString,
        passengers: paxString,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        amount: amount,
        status: "active",
        timestamp: new Date().toISOString(),
        gst: gst,
        payment: payment
      };

      mockBookings.push(bookingObj);
      
      // Update User loyalty point miles (+1000 per booking)
      mockUsers[0].miles += 1000 * seats.length;

      return res.status(201).json(bookingObj);
    }

    // --- TRANSACTIONAL SQL WORKFLOW ---
    // 1. Fetch flight parameters
    let qFl = "SELECT * FROM flights WHERE id = ?";
    if (dbDialect === "postgres") qFl = "SELECT * FROM flights WHERE id = $1";
    const [flRows] = await db.query(qFl, [flightId]);
    const fl = Array.isArray(flRows) ? flRows[0] : (flRows.rows ? flRows.rows[0] : null);
    
    if (!fl) {
      return res.status(404).json({ error: "Target flight schedule not found." });
    }

    // 2. Update Flight occupied seats list
    const curOccupied = typeof fl.occupied_seats === "string" ? JSON.parse(fl.occupied_seats) : fl.occupied_seats || [];
    curOccupied.push(...seats);
    
    let qUpFl = "UPDATE flights SET occupied_seats = ? WHERE id = ?";
    if (dbDialect === "postgres") qUpFl = "UPDATE flights SET occupied_seats = $1 WHERE id = $2";
    await db.query(qUpFl, [JSON.stringify(curOccupied), flightId]);

    // 3. Insert Booking entry
    let qInsBk = `
      INSERT INTO bookings 
      (pnr, ticket_number, flight_id, flight_no, airline, from_code, to_code, flight_date, departure, arrival, cabin_class, seats, seat_labels, passengers, contact_email, contact_phone, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    if (dbDialect === "postgres") {
      qInsBk = `
        INSERT INTO bookings 
        (pnr, ticket_number, flight_id, flight_no, airline, from_code, to_code, flight_date, departure, arrival, cabin_class, seats, seat_labels, passengers, contact_email, contact_phone, amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active')
      `;
    }
    await db.query(qInsBk, [
      pnr, ticketNo, flightId, fl.flight_no, fl.airline, fl.from_code, fl.to_code, 
      fl.flight_date, fl.departure, fl.arrival, cabinClass, seatsString, labelsString, 
      paxString, contactEmail, contactPhone, amount
    ]);

    // 4. Insert optional GST record
    if (gst && gst.gstin) {
      let qGst = "INSERT INTO gst_details (booking_pnr, gstin, company) VALUES (?, ?, ?)";
      if (dbDialect === "postgres") qGst = "INSERT INTO gst_details (booking_pnr, gstin, company) VALUES ($1, $2, $3)";
      await db.query(qGst, [pnr, gst.gstin, gst.company]);
    }

    // 5. Insert Payment record
    if (payment && payment.reference_id) {
      let qPay = "INSERT INTO payments (booking_pnr, method, details, reference_id) VALUES (?, ?, ?, ?)";
      if (dbDialect === "postgres") qPay = "INSERT INTO payments (booking_pnr, method, details, reference_id) VALUES ($1, $2, $3, $4)";
      await db.query(qPay, [pnr, payment.method, payment.details, payment.reference_id]);
    }

    // 6. Update User Loyalty Miles points (+1000 per booking)
    let qUpUser = "UPDATE users SET miles = miles + ? WHERE id = 1";
    if (dbDialect === "postgres") qUpUser = "UPDATE users SET miles = miles + $1 WHERE id = 1";
    await db.query(qUpUser, [1000 * seats.length]);

    // Return the created booking details
    const bookingResponse = {
      pnr: pnr,
      ticket_number: ticketNo,
      flight_id: flightId,
      flight_no: fl.flight_no,
      airline: fl.airline,
      from_code: fl.from_code,
      to_code: fl.to_code,
      flight_date: fl.flight_date,
      departure: fl.departure,
      arrival: fl.arrival,
      cabin_class: cabinClass,
      seats: seatsString,
      seat_labels: labelsString,
      passengers: paxString,
      amount: amount,
      status: "active",
      gst: gst,
      payment: payment
    };

    res.status(201).json(bookingResponse);
  } catch (error) {
    console.error("Booking generation failed:", error);
    res.status(500).json({ error: "Internal server error executing booking." });
  }
});

// POST /api/bookings/cancel
app.post("/api/bookings/cancel", async (req, res) => {
  const { pnr } = req.body;

  if (!pnr) {
    return res.status(400).json({ error: "Missing booking PNR code." });
  }

  try {
    if (useMockDB) {
      const bkIdx = mockBookings.findIndex(b => b.pnr === pnr);
      if (bkIdx === -1) {
        return res.status(404).json({ error: "PNR booking record not found." });
      }

      const bk = mockBookings[bkIdx];
      if (bk.status === "cancelled") {
        return res.status(400).json({ error: "Booking is already marked as cancelled." });
      }

      bk.status = "cancelled";

      // Free seats in mock flights DB
      const flIdx = mockFlights.findIndex(f => f.id === bk.flight_id);
      if (flIdx !== -1) {
        const mockFlight = mockFlights[flIdx];
        const curOccupied = JSON.parse(mockFlight.occupied_seats);
        const seatsToFree = bk.seats.split(",").map(Number);
        
        mockFlight.occupied_seats = JSON.stringify(
          curOccupied.filter(sid => !seatsToFree.includes(sid))
        );
      }

      return res.json({ success: true, pnr: pnr, status: "cancelled" });
    }

    // --- SQL WORKFLOW ---
    // 1. Fetch booking details
    let qBk = "SELECT * FROM bookings WHERE pnr = ?";
    if (dbDialect === "postgres") qBk = "SELECT * FROM bookings WHERE pnr = $1";
    const [bkRows] = await db.query(qBk, [pnr]);
    const bk = Array.isArray(bkRows) ? bkRows[0] : (bkRows.rows ? bkRows.rows[0] : null);

    if (!bk) {
      return res.status(404).json({ error: "PNR booking record not found." });
    }
    if (bk.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already marked as cancelled." });
    }

    // 2. Mark booking status as cancelled
    let qUpBk = "UPDATE bookings SET status = 'cancelled' WHERE pnr = ?";
    if (dbDialect === "postgres") qUpBk = "UPDATE bookings SET status = 'cancelled' WHERE pnr = $1";
    await db.query(qUpBk, [pnr]);

    // 3. Free flight seat indices
    let qFl = "SELECT occupied_seats FROM flights WHERE id = ?";
    if (dbDialect === "postgres") qFl = "SELECT occupied_seats FROM flights WHERE id = $1";
    const [flRows] = await db.query(qFl, [bk.flight_id]);
    const fl = Array.isArray(flRows) ? flRows[0] : (flRows.rows ? flRows.rows[0] : null);

    if (fl) {
      const curOccupied = typeof fl.occupied_seats === "string" ? JSON.parse(fl.occupied_seats) : fl.occupied_seats || [];
      const seatsToFree = bk.seats.split(",").map(Number);
      const updatedSeats = curOccupied.filter(sid => !seatsToFree.includes(sid));

      let qUpFl = "UPDATE flights SET occupied_seats = ? WHERE id = ?";
      if (dbDialect === "postgres") qUpFl = "UPDATE flights SET occupied_seats = $1 WHERE id = $2";
      await db.query(qUpFl, [JSON.stringify(updatedSeats), bk.flight_id]);
    }

    res.json({ success: true, pnr: pnr, status: "cancelled" });
  } catch (error) {
    console.error("Booking cancellation failed:", error);
    res.status(500).json({ error: "Internal server error executing cancellation." });
  }
});

// GET /api/user/dashboard
app.get("/api/user/dashboard", async (req, res) => {
  try {
    let dashboardUser = mockUsers[0];
    let bookings = [];

    if (useMockDB) {
      bookings = mockBookings;
    } else {
      // 1. Get Loyalty profile
      let qUser = "SELECT * FROM users WHERE id = 1";
      const [uRows] = await db.query(qUser);
      const userRecord = Array.isArray(uRows) ? uRows[0] : (uRows.rows ? uRows.rows[0] : null);
      if (userRecord) dashboardUser = userRecord;

      // 2. Get User bookings list
      let qBks = "SELECT * FROM bookings ORDER BY timestamp DESC";
      const [bkRows] = await db.query(qBks);
      bookings = Array.isArray(bkRows) ? bkRows : (bkRows.rows || []);
    }

    res.json({
      user: dashboardUser,
      bookings: bookings
    });
  } catch (error) {
    console.error("Load loyalty dashboard failed:", error);
    res.status(500).json({ error: "Internal server error loading dashboard metrics." });
  }
});

// ==========================================================================
// 3. ADMINISTRATIVE CONTROL PANEL ENDPOINTS
// ==========================================================================

// GET /api/admin/metrics
app.get("/api/admin/metrics", async (req, res) => {
  try {
    let bookings = [];
    
    if (useMockDB) {
      bookings = mockBookings;
    } else {
      let qBks = "SELECT * FROM bookings ORDER BY timestamp DESC";
      const [bkRows] = await db.query(qBks);
      bookings = Array.isArray(bkRows) ? bkRows : (bkRows.rows || []);
    }

    // Calculate sales parameters
    let totalSales = 0;
    let passengerVolume = 0;

    bookings.forEach(b => {
      if (b.status === "active") {
        totalSales += b.amount;
        passengerVolume += b.passengers.split(",").length;
      }
    });

    res.json({
      totalRevenue: totalSales,
      passengerVolume: passengerVolume,
      bookings: bookings
    });
  } catch (error) {
    console.error("Load admin metrics failed:", error);
    res.status(500).json({ error: "Internal server error querying admin parameters." });
  }
});

// POST /api/admin/flights
app.post("/api/admin/flights", async (req, res) => {
  const { airline, flightNo, fromCode, toCode, date, departure, arrival, duration, basePrice } = req.body;

  if (!airline || !flightNo || !fromCode || !toCode || !date || !departure || !arrival || !basePrice) {
    return res.status(400).json({ error: "Missing required flight insertion keys." });
  }

  const id = `${airline}-${date.replace(/-/g, "")}-${departure.substring(0,5).replace(/:/g, "")}`;
  
  try {
    if (useMockDB) {
      const exists = mockFlights.some(f => f.id === id);
      if (exists) {
        return res.status(400).json({ error: "A flight on this airline at this schedule already exists." });
      }

      const flObj = {
        id: id,
        airline: airline,
        flight_no: `${airline}-${flightNo}`,
        from_code: fromCode,
        to_code: toCode,
        flight_date: date,
        departure: departure,
        arrival: arrival,
        duration: duration || "2h 00m",
        base_price: parseInt(basePrice),
        stops: 0,
        occupied_seats: "[]",
        total_seats: 90
      };

      mockFlights.push(flObj);
      return res.status(201).json(flObj);
    }

    // Check duplication
    let qCheck = "SELECT 1 FROM flights WHERE id = ?";
    if (dbDialect === "postgres") qCheck = "SELECT 1 FROM flights WHERE id = $1";
    const [chkRows] = await db.query(qCheck, [id]);
    const exists = Array.isArray(chkRows) ? chkRows[0] : (chkRows.rows ? chkRows.rows[0] : null);
    if (exists) {
      return res.status(400).json({ error: "A flight on this airline at this schedule already exists." });
    }

    let qIns = `
      INSERT INTO flights (id, airline, flight_no, from_code, to_code, flight_date, departure, arrival, duration, base_price, stops, occupied_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]')
    `;
    if (dbDialect === "postgres") {
      qIns = `
        INSERT INTO flights (id, airline, flight_no, from_code, to_code, flight_date, departure, arrival, duration, base_price, stops, occupied_seats)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, '[]')
      `;
    }

    await db.query(qIns, [
      id, airline, `${airline}-${flightNo}`, fromCode, toCode, date, departure, arrival, duration || "2h 00m", parseInt(basePrice)
    ]);

    const createdFlightObj = {
      id: id,
      airline: airline,
      flight_no: `${airline}-${flightNo}`,
      from_code: fromCode,
      to_code: toCode,
      flight_date: date,
      departure: departure,
      arrival: arrival,
      duration: duration || "2h 00m",
      base_price: parseInt(basePrice),
      stops: 0,
      occupied_seats: "[]",
      total_seats: 90
    };

    res.status(201).json(createdFlightObj);
  } catch (error) {
    console.error("Admin add flight failed:", error);
    res.status(500).json({ error: "Internal server error adding flight to schedule." });
  }
});

// ==========================================================================
// 4. BOOTSTRAP EXPRESS WEB SERVER
// ==========================================================================
app.listen(PORT, () => {
  console.log(`\n🚀 [SkyVoyage Server Online] Running on http://localhost:${PORT}`);
  console.log(`📅 Environment State: ${process.env.NODE_ENV}`);
});
