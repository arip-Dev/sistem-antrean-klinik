const express = require('express');
const router = express.Router();
const authGuard = require('../middleware/auth');

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

  async function getNextNomorAntrean() {
    const tanggal = getTanggalHariIni();
    const { data } = await supabase
      .from('antrean')
      .select('nomor_antrean')
      .eq('tanggal', tanggal)
      .order('nomor_antrean', { ascending: false })
      .limit(1);
    return (data && data.length > 0) ? data[0].nomor_antrean + 1 : 1;
  }

  async function getSedangDipanggil() {
    const tanggal = getTanggalHariIni();
    const { data } = await supabase
      .from('antrean')
      .select('nomor_antrean, nama_pasien, prioritas, waktu_panggil')
      .eq('tanggal', tanggal)
      .eq('status', 'dipanggil')
      .order('waktu_panggil', { ascending: false })
      .limit(1);
    return (data && data.length > 0) ? data[0] : null;
  }

  router.get('/antrean', async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: list, error } = await supabase
        .from('antrean')
        .select('id, nomor_antrean, nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas, status, sumber, waktu_daftar, waktu_panggil')
        .eq('tanggal', tanggal)
        .order('prioritas', { ascending: false })
        .order('waktu_daftar', { ascending: true });
      if (error) throw error;
      const sedangDipanggil = await getSedangDipanggil();
      res.json({ success: true, data: list, sedangDipanggil });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.get('/antrean-saat-ini', async (req, res) => {
    try {
      const data = await getSedangDipanggil();
      res.json({ success: true, data });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.get('/antrean/:id', async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: p, error } = await supabase
        .from('antrean')
        .select('id, nomor_antrean, nama_pasien, prioritas, status')
        .eq('id', req.params.id)
        .eq('tanggal', tanggal)
        .single();
      if (error || !p) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
      const sedangDipanggil = await getSedangDipanggil();
      res.json({ success: true, data: p, sedangDipanggil });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.post('/antrean', authGuard, async (req, res) => {
    try {
      const { nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas } = req.body;
      if (!nama_pasien || !usia || !jenis_kelamin || !no_hp || !keluhan || !prioritas)
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
      if (![1,2,3].includes(Number(prioritas)))
        return res.status(400).json({ success: false, message: 'Prioritas tidak valid.' });
      if (!['Laki-laki','Perempuan'].includes(jenis_kelamin))
        return res.status(400).json({ success: false, message: 'Jenis kelamin tidak valid.' });

      const nomor = await getNextNomorAntrean();
      const tanggal = getTanggalHariIni();

      const { data: inserted, error } = await supabase
        .from('antrean')
        .insert({
          admin_id: req.session.user.id,
          nomor_antrean: nomor,
          nama_pasien: nama_pasien.trim(),
          usia: Number(usia),
          jenis_kelamin,
          no_hp: no_hp.trim(),
          keluhan: keluhan.trim(),
          prioritas: Number(prioritas),
          sumber: 'admin',
          tanggal
        })
        .select('id, nomor_antrean')
        .single();
      if (error) throw error;

      broadcastAntreanUpdate(supabase);
      res.json({ success: true, message: 'Pasien berhasil didaftarkan.', data: { id: inserted.id, nomor_antrean: inserted.nomor_antrean }});
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.post('/antrean/mandiri', async (req, res) => {
    try {
      const { nama_pasien, usia, jenis_kelamin, no_hp, keluhan } = req.body;
      if (!nama_pasien || !usia || !jenis_kelamin || !no_hp || !keluhan)
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
      if (!['Laki-laki','Perempuan'].includes(jenis_kelamin))
        return res.status(400).json({ success: false, message: 'Jenis kelamin tidak valid.' });
      if (nama_pasien.trim().length < 3)
        return res.status(400).json({ success: false, message: 'Nama minimal 3 karakter.' });
      if (isNaN(Number(usia)) || Number(usia) < 0 || Number(usia) > 150)
        return res.status(400).json({ success: false, message: 'Usia tidak valid.' });

      const nomor = await getNextNomorAntrean();
      const tanggal = getTanggalHariIni();

      const { data: inserted, error } = await supabase
        .from('antrean')
        .insert({
          nomor_antrean: nomor,
          nama_pasien: nama_pasien.trim(),
          usia: Number(usia),
          jenis_kelamin,
          no_hp: no_hp.trim(),
          keluhan: keluhan.trim(),
          prioritas: 1,
          sumber: 'mandiri',
          tanggal
        })
        .select('id, nomor_antrean')
        .single();
      if (error) throw error;

      broadcastAntreanUpdate(supabase);
      res.json({ success: true, message: 'Pendaftaran berhasil!', data: { id: inserted.id, nomor_antrean: inserted.nomor_antrean }});
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.patch('/antrean/:id/panggil', authGuard, async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: p, error: fetchErr } = await supabase
        .from('antrean')
        .select('*')
        .eq('id', req.params.id)
        .eq('tanggal', tanggal)
        .single();
      if (fetchErr || !p) return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan.' });
      if (p.status !== 'menunggu') return res.status(400).json({ success: false, message: 'Hanya pasien menunggu yang bisa dipanggil.' });

      const { error: updateErr } = await supabase
        .from('antrean')
        .update({ status: 'dipanggil', waktu_panggil: new Date().toISOString() })
        .eq('id', req.params.id);
      if (updateErr) throw updateErr;

      res.json({ success: true, message: `Pasien nomor ${p.nomor_antrean} dipanggil.` });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.patch('/antrean/:id/skip', authGuard, async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: p, error: fetchErr } = await supabase
        .from('antrean')
        .select('*')
        .eq('id', req.params.id)
        .eq('tanggal', tanggal)
        .single();
      if (fetchErr || !p) return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan.' });
      if (p.status !== 'dipanggil') return res.status(400).json({ success: false, message: 'Hanya pasien dipanggil yang bisa di-skip.' });

      const { error: rpcErr } = await supabase.rpc('skip_antrean', { p_id: Number(req.params.id) });
      if (rpcErr) throw rpcErr;

      res.json({ success: true, message: `Pasien nomor ${p.nomor_antrean} ditandai tidak hadir.` });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.patch('/antrean/:id/selesai', authGuard, async (req, res) => {
    try {
      const tanggal = getTanggalHariIni();
      const { data: p, error: fetchErr } = await supabase
        .from('antrean')
        .select('*')
        .eq('id', req.params.id)
        .eq('tanggal', tanggal)
        .single();
      if (fetchErr || !p) return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan.' });
      if (p.status !== 'dipanggil') return res.status(400).json({ success: false, message: 'Hanya pasien dipanggil yang bisa diselesaikan.' });

      const { error: rpcErr } = await supabase.rpc('selesaikan_antrean', { p_id: Number(req.params.id) });
      if (rpcErr) throw rpcErr;

      res.json({ success: true, message: `Pasien nomor ${p.nomor_antrean} selesai.` });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  router.get('/riwayat', authGuard, async (req, res) => {
    try {
      const tanggal = req.query.tanggal || getTanggalHariIni();
      const { data: list, error } = await supabase
        .from('riwayat')
        .select('*')
        .eq('tanggal', tanggal)
        .order('waktu_selesai', { ascending: false });
      if (error) throw error;
      res.json({ success: true, data: list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });

  return router;
};

