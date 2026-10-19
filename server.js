require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const supabase = require('./database/supabase');

// ============================================
// EXPRESS APP
// ============================================
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000, // 8 jam
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});
app.use(sessionMiddleware);

// ============================================
// ROUTES
// ============================================
const adminRoutes = require('./routes/admin')(supabase);
const apiRoutes = require('./routes/api')(supabase);
const publicRoutes = require('./routes/public')(supabase);

app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/', publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan.');
});

// ============================================
// START SERVER (local dev) / EXPORT (Vercel)
// ============================================
if (process.env.VERCEL) {
  // Di Vercel, export app sebagai module
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('========================================');
    console.log('  🏥 SiAntre - Sistem Antrean Klinik');
    console.log('========================================');
    console.log(`  Server berjalan di: http://localhost:${PORT}`);
    console.log(`  Pasien (Daftar)   : http://localhost:${PORT}/daftar`);
    console.log(`  Admin  (Login)    : http://localhost:${PORT}/admin/login`);
    console.log(`  Display TV        : http://localhost:${PORT}/admin/display`);
    console.log('========================================');
  });
}

