const express = require('express');
const router = express.Router();

module.exports = function (supabase) {

  function getTanggalHariIni() {
    // Gunakan timezone Asia/Jakarta (WIB, UTC+7) agar konsisten
    const now = new Date();
    const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const y = wib.getUTCFullYear();
    const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
    const d = String(wib.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ============================================
  // GET / — Redirect ke halaman pendaftaran mandiri
  // ============================================
  router.get('/', (req, res) => {
    res.redirect('/daftar');
  });

  // ============================================
  // GET /daftar — Halaman pendaftaran mandiri
  // ============================================
  router.get('/daftar', (req, res) => {
    res.render('public/daftar');
  });

  // ============================================
  // GET /antrean — Halaman pantau antrean (umum)
  // ============================================
  router.get('/antrean', (req, res) => {
    res.render('public/antrean', { pasien: null, error: null });
  });

  // ============================================
  // GET /antrean/:id — Halaman status antrean pasien
  // ============================================
  router.get('/antrean/:id', async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: pasien, error } = await supabase
        .from('antrean')
        .select('id, nomor_antrean, nama_pasien, prioritas, status')
        .eq('id', req.params.id)
        .eq('tanggal', tanggal)
        .single();

      if (error || !pasien) {
        return res.render('public/antrean', { pasien: null, error: 'Data antrean tidak ditemukan.' });
      }

      res.render('public/antrean', { pasien, error: null });
    } catch (err) {
      res.render('public/antrean', { pasien: null, error: 'Terjadi kesalahan pada server.' });
    }
  });

  return router;
};
