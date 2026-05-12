// ===== Mock API — localStorage-backed fake backend =====
// Replace this file with real API calls when the backend is ready.

const DELAY = 250; // simulated network latency in ms

/* ---------- helpers ---------- */
function delay(ms = DELAY) {
  return new Promise((r) => setTimeout(r, ms));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getUsers() {
  return read("mock_users") || [];
}

function setUsers(users) {
  write("mock_users", users);
}

function getShifts() {
  return read("mock_shifts") || [];
}

function setShifts(shifts) {
  write("mock_shifts", shifts);
}

function getGeofences() {
  return read("mock_geofences") || [];
}

function setGeofences(geofences) {
  write("mock_geofences", geofences);
}

function getCompanies() {
  return read("mock_companies") || [];
}

function setCompanies(companies) {
  write("mock_companies", companies);
}

function isGeofenceEnabled() {
  return read("mock_geofence_enabled") ?? true;
}

function setGeofenceEnabled(enabled) {
  write("mock_geofence_enabled", enabled);
}

/* ---------- seed default data ---------- */
function seedIfEmpty() {
  if (!read("mock_users")) {
    setUsers([
      {
        id: 1,
        username: "admin",
        password_hash: "$2a$10$fakehash_admin123",
        password_plain: "admin123",
        role: "admin",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        username: "intern1",
        password_hash: "$2a$10$fakehash_intern1",
        password_plain: "intern123",
        role: "user",
        created_at: "2026-01-10T00:00:00.000Z",
        updated_at: "2026-01-10T00:00:00.000Z",
      },
    ]);
  }

  if (!read("mock_geofences")) {
    setGeofences([
      {
        id: 1,
        name: "Kantor Pusat",
        latitude: -6.2088,
        longitude: 106.8456,
        radius_meters: 200,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
  }

  if (!read("mock_shifts")) {
    setShifts([]);
  }

  if (!read("mock_companies")) {
    setCompanies([
      {
        id: 1,
        name: "PT Teknologi Indonesia",
        address: "Jl. Sudirman No. 123, Jakarta",
        contact_person: "Budi Santoso",
        contact_email: "budi@techindo.co.id",
        contact_phone: "081234567890",
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
  }
}

seedIfEmpty();

/* ---------- fake JWT ---------- */
function fakeToken(user) {
  return btoa(
    JSON.stringify({ id: user.id, username: user.username, role: user.role, exp: Date.now() + 8 * 3600 * 1000 })
  );
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- geofence distance helper ---------- */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ========== PUBLIC API ========== */

export const mockApi = {
  /* ---- Auth ---- */
  async login(username, password) {
    await delay();
    const users = getUsers();
    const user = users.find((u) => u.username === username);
    if (!user || user.password_plain !== password) {
      throw new Error("Invalid credentials");
    }
    const token = fakeToken(user);
    const { password_hash, password_plain, ...safeUser } = user;
    write("mock_token", token);
    return { token, user: safeUser };
  },

  logout() {
    localStorage.removeItem("mock_token");
  },

  getMe() {
    const token = localStorage.getItem("mock_token");
    if (!token) return null;
    return verifyToken(token);
  },

  /* ---- Users (admin) ---- */
  async getUsers() {
    await delay();
    const users = getUsers().map(({ password_hash, password_plain, ...u }) => u);
    return users;
  },

  async getUser(id) {
    await delay();
    const users = getUsers();
    const user = users.find((u) => u.id == id);
    if (!user) throw new Error("User not found");
    const { password_hash, password_plain, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ username, password, role }) {
    await delay();
    const users = getUsers();
    if (users.find((u) => u.username === username)) {
      throw new Error("Username already exists");
    }
    const newUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      username,
      password_hash: "$2a$10$fake_" + password,
      password_plain: password,
      role: role || "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    setUsers(users);
    const { password_hash, password_plain, ...safeUser } = newUser;
    return safeUser;
  },

  async updateUser(id, data) {
    await delay();
    const users = getUsers();
    const idx = users.findIndex((u) => u.id == id);
    if (idx === -1) throw new Error("User not found");
    if (data.username !== undefined) users[idx].username = data.username;
    if (data.password !== undefined) {
      users[idx].password_hash = "$2a$10$fake_" + data.password;
      users[idx].password_plain = data.password;
    }
    if (data.role !== undefined) users[idx].role = data.role;
    if (data.full_name !== undefined) users[idx].full_name = data.full_name;
    if (data.nim !== undefined) users[idx].nim = data.nim;
    if (data.major !== undefined) users[idx].major = data.major;
    if (data.internship_location !== undefined) users[idx].internship_location = data.internship_location;
    if (data.division !== undefined) users[idx].division = data.division;
    if (data.field_mentor !== undefined) users[idx].field_mentor = data.field_mentor;
    if (data.start_date !== undefined) users[idx].start_date = data.start_date;
    if (data.end_date !== undefined) users[idx].end_date = data.end_date;
    if (data.internship_status !== undefined) users[idx].internship_status = data.internship_status;
    if (data.target_hours !== undefined) users[idx].target_hours = data.target_hours;
    if (data.profile_photo !== undefined) users[idx].profile_photo = data.profile_photo;
    users[idx].updated_at = new Date().toISOString();
    setUsers(users);
    const { password_hash, password_plain, ...safeUser } = users[idx];
    return safeUser;
  },

  async deleteUser(id) {
    await delay();
    const users = getUsers();
    const idx = users.findIndex((u) => u.id == id);
    if (idx === -1) throw new Error("User not found");
    users.splice(idx, 1);
    setUsers(users);
    return { message: "User deleted" };
  },

  /* ---- Geofences (admin) ---- */
  async getGeofences() {
    await delay();
    return getGeofences();
  },

  async getGeofence(id) {
    await delay();
    const gf = getGeofences().find((g) => g.id == id);
    if (!gf) throw new Error("Geofence not found");
    return gf;
  },

  async createGeofence({ name, latitude, longitude, radius_meters }) {
    await delay();
    const all = getGeofences();
    const newGf = {
      id: all.length ? Math.max(...all.map((g) => g.id)) + 1 : 1,
      name,
      latitude,
      longitude,
      radius_meters: radius_meters || 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newGf);
    setGeofences(all);
    return newGf;
  },

  async updateGeofence(id, data) {
    await delay();
    const all = getGeofences();
    const idx = all.findIndex((g) => g.id == id);
    if (idx === -1) throw new Error("Geofence not found");
    if (data.name !== undefined) all[idx].name = data.name;
    if (data.latitude !== undefined) all[idx].latitude = data.latitude;
    if (data.longitude !== undefined) all[idx].longitude = data.longitude;
    if (data.radius_meters !== undefined) all[idx].radius_meters = data.radius_meters;
    all[idx].updated_at = new Date().toISOString();
    setGeofences(all);
    return all[idx];
  },

  async deleteGeofence(id) {
    await delay();
    const all = getGeofences();
    const idx = all.findIndex((g) => g.id == id);
    if (idx === -1) throw new Error("Geofence not found");
    all.splice(idx, 1);
    setGeofences(all);
    return { message: "Geofence deleted" };
  },

  /* ---- Shifts ---- */
  async getActiveShift(userId) {
    await delay();
    const shift = getShifts().find((s) => s.user_id == userId && s.status === "active");
    return shift || null;
  },

  /* ---- Geofence Setting (admin) ---- */
  async getGeofenceSetting() {
    await delay(100);
    return { enabled: isGeofenceEnabled() };
  },

  async updateGeofenceSetting(enabled) {
    await delay(100);
    setGeofenceEnabled(!!enabled);
    return { enabled: !!enabled };
  },

  async startShift(userId, { latitude, longitude }) {
    await delay(200);
    // Validate against geofences — skip if setting is disabled
    let inside = false;
    let matchedGeofence = null;

    if (!isGeofenceEnabled()) {
      // Geofence check disabled — allow anywhere
      inside = true;
    } else {
      const geofences = getGeofences();
      if (geofences.length === 0) {
        // No geofences set — allow anywhere
        inside = true;
      } else {
        for (const gf of geofences) {
          const dist = haversineDistance(latitude, longitude, gf.latitude, gf.longitude);
          if (dist <= gf.radius_meters) {
            inside = true;
            matchedGeofence = gf;
            break;
          }
        }
      }
    }

    if (!inside) {
      throw new Error("You are outside all designated work areas. Please move to a valid location.");
    }

    // Check no existing active shift
    const active = getShifts().find((s) => s.user_id == userId && s.status === "active");
    if (active) {
      throw new Error("You already have an active shift. End it first.");
    }

    const shifts = getShifts();
    const newShift = {
      id: shifts.length ? Math.max(...shifts.map((s) => s.id)) + 1 : 1,
      user_id: userId,
      geofence_id: matchedGeofence ? matchedGeofence.id : null,
      start_time: new Date().toISOString(),
      end_time: null,
      start_lat: latitude,
      start_lng: longitude,
      end_lat: null,
      end_lng: null,
      description: "",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    shifts.push(newShift);
    setShifts(shifts);
    return newShift;
  },

  async endShift(userId, { latitude, longitude }) {
    await delay();
    const shifts = getShifts();
    const idx = shifts.findIndex((s) => s.user_id == userId && s.status === "active");
    if (idx === -1) throw new Error("No active shift found");

    shifts[idx].end_time = new Date().toISOString();
    shifts[idx].end_lat = latitude || null;
    shifts[idx].end_lng = longitude || null;
    shifts[idx].status = "ended";
    shifts[idx].updated_at = new Date().toISOString();
    setShifts(shifts);
    return shifts[idx];
  },

  async getShifts({ userId, status } = {}) {
    await delay();
    let shifts = getShifts();
    if (userId) shifts = shifts.filter((s) => s.user_id == userId);
    if (status) shifts = shifts.filter((s) => s.status === status);
    return shifts.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  },

  async getShift(id) {
    await delay();
    const shift = getShifts().find((s) => s.id == id);
    if (!shift) throw new Error("Shift not found");
    return shift;
  },

  async updateShift(id, data) {
    await delay();
    const shifts = getShifts();
    const idx = shifts.findIndex((s) => s.id == id);
    if (idx === -1) throw new Error("Shift not found");
    if (data.description !== undefined) shifts[idx].description = data.description;
    shifts[idx].updated_at = new Date().toISOString();
    setShifts(shifts);
    return shifts[idx];
  },

  async deleteShift(id) {
    await delay();
    const shifts = getShifts();
    const idx = shifts.findIndex((s) => s.id == id);
    if (idx === -1) throw new Error("Shift not found");
    shifts.splice(idx, 1);
    setShifts(shifts);
    return { message: "Shift deleted" };
  },

  /* ---- Companies (admin) ---- */
  async getCompanies() {
    await delay();
    return getCompanies();
  },

  async getCompany(id) {
    await delay();
    const company = getCompanies().find((c) => c.id == id);
    if (!company) throw new Error("Company not found");
    return company;
  },

  async createCompany(data) {
    await delay();
    const all = getCompanies();
    const newCompany = {
      id: all.length ? Math.max(...all.map((c) => c.id)) + 1 : 1,
      name: data.name,
      address: data.address || null,
      contact_person: data.contact_person || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      status: data.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newCompany);
    setCompanies(all);
    return newCompany;
  },

  async updateCompany(id, data) {
    await delay();
    const all = getCompanies();
    const idx = all.findIndex((c) => c.id == id);
    if (idx === -1) throw new Error("Company not found");
    if (data.name !== undefined) all[idx].name = data.name;
    if (data.address !== undefined) all[idx].address = data.address;
    if (data.contact_person !== undefined) all[idx].contact_person = data.contact_person;
    if (data.contact_email !== undefined) all[idx].contact_email = data.contact_email;
    if (data.contact_phone !== undefined) all[idx].contact_phone = data.contact_phone;
    if (data.status !== undefined) all[idx].status = data.status;
    all[idx].updated_at = new Date().toISOString();
    setCompanies(all);
    return all[idx];
  },

  async deleteCompany(id) {
    await delay();
    const all = getCompanies();
    const idx = all.findIndex((c) => c.id == id);
    if (idx === -1) throw new Error("Company not found");
    all.splice(idx, 1);
    setCompanies(all);
    return { message: "Company deleted" };
  },

  /* ---- Reports (admin) ---- */
  async changePassword(currentPassword, newPassword) {
    await delay();
    const token = localStorage.getItem("mock_token");
    if (!token) throw new Error("Not authenticated");
    const user = verifyToken(token);
    if (!user) throw new Error("Invalid token");

    const users = getUsers();
    const idx = users.findIndex((u) => u.id == user.id);
    if (idx === -1) throw new Error("User not found");

    if (users[idx].password_plain !== currentPassword) {
      throw new Error("Current password is incorrect");
    }

    users[idx].password_hash = "$2a$10$fake_" + newPassword;
    users[idx].password_plain = newPassword;
    users[idx].updated_at = new Date().toISOString();
    setUsers(users);
    return { message: "Password changed successfully" };
  },

  async getAttendanceReport(params = {}) {
    await delay();
    let shifts = getShifts();
    const users = getUsers();

    const shiftsWithUsers = shifts.map((s) => ({
      ...s,
      username: users.find((u) => u.id == s.user_id)?.username || "Unknown",
      full_name: users.find((u) => u.id == s.user_id)?.full_name || null,
    }));

    if (params.startDate) {
      shiftsWithUsers = shiftsWithUsers.filter((s) => s.start_time >= params.startDate);
    }
    if (params.endDate) {
      shiftsWithUsers = shiftsWithUsers.filter((s) => s.start_time <= params.endDate);
    }
    if (params.userId) {
      shiftsWithUsers = shiftsWithUsers.filter((s) => s.user_id == params.userId);
    }

    return shiftsWithUsers.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  },

  async getInternshipProgressReport() {
    await delay();
    const users = getUsers().filter((u) => u.role === "user");
    const shifts = getShifts();

    const usersWithProgress = users.map((user) => {
      const userShifts = shifts.filter(
        (s) => s.user_id == user.id && s.end_time && (s.attendance_type === "hadir" || s.attendance_type === undefined)
      );
      const totalHours = userShifts.reduce((acc, s) => {
        const diff = new Date(s.end_time) - new Date(s.start_time);
        return acc + (diff > 0 ? diff / 3600000 : 0);
      }, 0);

      const targetHours = user.target_hours || 480;
      const progressPercent = targetHours ? Math.min(100, (totalHours / targetHours) * 100) : 0;
      const remainingHours = Math.max(0, targetHours - totalHours);

      return {
        ...user,
        total_shifts: userShifts.length,
        total_hours: totalHours,
        target_hours: targetHours,
        progress_percent: progressPercent,
        remaining_hours: remainingHours,
        internship_status: user.internship_status || "active",
      };
    });

    return usersWithProgress;
  },

  async getSummaryReport() {
    await delay();
    const users = getUsers();
    const shifts = getShifts();
    const today = new Date().toISOString().split("T")[0];
    const todayShifts = shifts.filter((s) => s.start_time.startsWith(today));

    const attendanceByType = {
      hadir: todayShifts.filter((s) => s.attendance_type === "hadir" || s.attendance_type === undefined).length,
      izin: todayShifts.filter((s) => s.attendance_type === "izin").length,
      sakit: todayShifts.filter((s) => s.attendance_type === "sakit").length,
      alpha: todayShifts.filter((s) => s.attendance_type === "alpha").length,
    };

    return {
      totalInterns: users.filter((u) => u.role === "user").length,
      totalShifts: shifts.length,
      todayAttendance: todayShifts.length,
      activeShifts: shifts.filter((s) => s.status === "active").length,
      attendanceByType,
    };
  },
};