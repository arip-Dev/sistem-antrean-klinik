const express = require('express');
const router = express.Router();
const authGuard = require('../middleware/auth');

module.exports = function (supabase) {

  // ============================================
  // LOGIN
  // ============================================
  router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { error: null });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('admin/login', { error: 'Email dan password wajib diisi.' });
    }

    try {
      // Login menggunakan Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.render('admin/login', { error: 'Email atau password salah.' });
      }

      // Ambil data profile (nama) dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('nama')
        .eq('id', data.user.id)
        .single();

      req.session.user = {
        id: data.user.id,
        email: data.user.email,
        nama: profile ? profile.nama : 'Admin'
      };

      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      res.render('admin/login', { error: 'Terjadi kesalahan pada server.' });
    }
  });

  // ============================================
  // LOGOUT
  // ============================================
  router.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  });

  // ============================================
  // DASHBOARD
  // ============================================
  router.get('/dashboard', authGuard, (req, res) => {
    res.render('admin/dashboard', { user: req.session.user });
  });

  // ============================================
  // DISPLAY TV
  // ============================================
  router.get('/display', authGuard, (req, res) => {
    res.render('admin/display');
  });

  // ============================================
  // RIWAYAT
  // ============================================
  router.get('/riwayat', authGuard, (req, res) => {
    res.render('admin/riwayat', { user: req.session.user });
  });

  return router;
};
