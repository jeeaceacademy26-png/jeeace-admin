const BASE = 'https://jeeace-backend-production.up.railway.app/api';

function adminPhone() { return localStorage.getItem('adminPhone') || ''; }
function coachingId() { return localStorage.getItem('coachingId') || ''; }

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(path, body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (phone, coachingCode) =>
  post('/coaching/admin/login', { phone, coachingCode });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  get(`/coaching/dashboard/${coachingId()}`);

// ── Batches ───────────────────────────────────────────────────────────────────
export const getBatches = () =>
  get(`/coaching/batches?coachingId=${coachingId()}`);

export const createBatch = (name, batchCode, examId) =>
  post('/coaching/batches', {
    id: `${coachingId()}-${Date.now()}`,
    coachingId: coachingId(), name, batchCode, examId,
  });

// ── Students ──────────────────────────────────────────────────────────────────
export const getStudents = (batchId) =>
  get(`/coaching/students?batchId=${batchId}`);

export const bulkEnroll = (batchId, phones) =>
  post('/coaching/students/bulk', {
    coachingId: coachingId(), batchId, phones, adminPhone: adminPhone(),
  });

export const resetDevice = (phone, batchId) =>
  post('/coaching/device-reset', {
    phone, batchId, adminPhone: adminPhone(),
  });

// ── Announcements ─────────────────────────────────────────────────────────────
export const getAnnouncements = (batchId) =>
  get(`/coaching/announcements?coachingId=${coachingId()}&batchId=${batchId}`);

export const postAnnouncement = (batchId, text, isPinned) =>
  post('/coaching/announcements', {
    coachingId: coachingId(), batchId, text, isPinned,
    postedBy: adminPhone(),
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
export const getTests = (batchId) =>
  get(`/coaching/tests?batchId=${batchId}&phone=${adminPhone()}`);

export const createTest = (batchId, data) =>
  post('/coaching/tests', { coachingId: coachingId(), batchId, ...data });

// ── Schedule ──────────────────────────────────────────────────────────────────
export const getSchedule = (batchId) =>
  get(`/coaching/schedule?batchId=${batchId}`);

export const addSlot = (batchId, slot) =>
  post('/coaching/schedule', { batchId, ...slot });

export const deleteSlot = (slotId) =>
  del(`/coaching/schedule/${slotId}`);

// ── Materials ─────────────────────────────────────────────────────────────────
export const getMaterials = (batchId) =>
  get(`/coaching/materials?batchId=${batchId}`);

export const addMaterial = (batchId, data) =>
  post('/coaching/materials', {
    coachingId: coachingId(), batchId, uploadedBy: adminPhone(), ...data,
  });

export const deleteMaterial = (materialId) =>
  del(`/coaching/materials/${materialId}`);

// ── Syllabus ──────────────────────────────────────────────────────────────────
export const getSyllabus = (batchId) =>
  get(`/coaching/syllabus?batchId=${batchId}`);

export const updateSyllabus = (id, coverage, completed) =>
  put(`/coaching/syllabus/${id}`, { coverage, completed });

// ── Attendance ────────────────────────────────────────────────────────────────
export const getAttendance = (batchId, date) =>
  get(`/coaching/attendance?batchId=${batchId}&date=${date}`);

export const markAttendance = (batchId, date, records) =>
  post('/coaching/attendance', { batchId, date, records });

// ── DPPs ─────────────────────────────────────────────────────────────────────
export const getDpps = (batchId) =>
  get(`/dpp/batch/${batchId}`);

export const createDpp = (batchId, data) =>
  post('/dpp', { coachingId: coachingId(), batchId, createdBy: adminPhone(), ...data });

export const deleteDpp = (dppId) =>
  del(`/dpp/${dppId}`);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getLeaderboard = (batchId) =>
  get(`/coaching/leaderboard?batchId=${batchId}&phone=${adminPhone()}`);

export const getScoreHistory = (batchId) =>
  get(`/coaching/score-history?batchId=${batchId}&phone=${adminPhone()}`);

// ── Fee Management ────────────────────────────────────────────────────────────
export const getFeePlans = (batchId) =>
  get(`/fee/plans?batchId=${batchId}`);

export const createFeePlan = (batchId, data) =>
  post('/fee/plans', { coachingId: coachingId(), batchId, ...data });

export const deleteFeePlan = (id) =>
  del(`/fee/plans/${id}`);

export const assignFeePlan = (phone, batchId, feePlanId) =>
  post('/fee/assign', { phone, batchId, feePlanId });

export const getFeeStatus = (batchId) =>
  get(`/fee/status?batchId=${batchId}`);

export const getFeePayments = (batchId) =>
  get(`/fee/payments?batchId=${batchId}`);

export const confirmPayment = (paymentId, confirmedBy) =>
  post('/fee/confirm', { paymentId, confirmedBy });
