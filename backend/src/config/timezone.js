// The mess runs on Indian Standard Time. Hosts such as Render/Railway run in UTC,
// so pin the process timezone before any date math happens. Without this, a UTC
// host computes "today" as 00:00 UTC while seeded menu rows are stored as IST
// midnight (18:30 UTC the previous day), and exact date lookups such as
// POST /api/student/opt-outs fail with "Meal entry not found."
process.env.TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";
