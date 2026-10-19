-- ============================================
-- SUPABASE MIGRATION — SiAntre
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABEL PROFILES (linked ke auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user bisa baca profile sendiri, service_role bisa semua
CREATE POLICY "Service role full access on profiles"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger: auto-create profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', 'Admin'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. TABEL ANTREAN
-- ============================================
CREATE TABLE IF NOT EXISTS antrean (
  id              BIGSERIAL PRIMARY KEY,
  admin_id        UUID REFERENCES auth.users(id),
  nomor_antrean   INTEGER     NOT NULL,
  nama_pasien     VARCHAR(100) NOT NULL,
  usia            INTEGER     NOT NULL,
  jenis_kelamin   VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  no_hp           VARCHAR(15) NOT NULL,
  keluhan         TEXT        NOT NULL,
  prioritas       INTEGER     NOT NULL CHECK (prioritas IN (1, 2, 3)),
  status          VARCHAR(20) NOT NULL DEFAULT 'menunggu'
                  CHECK (status IN ('menunggu', 'dipanggil', 'tidak_hadir')),
  sumber          VARCHAR(10) NOT NULL DEFAULT 'admin'
                  CHECK (sumber IN ('admin', 'mandiri')),
  waktu_daftar    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_panggil   TIMESTAMPTZ,
  tanggal         DATE        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_antrean_sort
  ON antrean (tanggal, prioritas DESC, waktu_daftar ASC);

CREATE INDEX IF NOT EXISTS idx_antrean_status
  ON antrean (tanggal, status);

ALTER TABLE antrean ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on antrean"
  ON antrean FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. TABEL RIWAYAT
-- ============================================
CREATE TABLE IF NOT EXISTS riwayat (
  id              BIGSERIAL PRIMARY KEY,
  nomor_antrean   INTEGER      NOT NULL,
  nama_pasien     VARCHAR(100) NOT NULL,
  usia            INTEGER      NOT NULL,
  jenis_kelamin   VARCHAR(10)  NOT NULL,
  no_hp           VARCHAR(15)  NOT NULL,
  keluhan         TEXT         NOT NULL,
  prioritas       INTEGER      NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'selesai',
  sumber          VARCHAR(10)  NOT NULL,
  waktu_daftar    TIMESTAMPTZ  NOT NULL,
  waktu_panggil   TIMESTAMPTZ,
  waktu_selesai   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tanggal         DATE         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_riwayat_tanggal
  ON riwayat (tanggal);

ALTER TABLE riwayat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on riwayat"
  ON riwayat FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. RPC: Selesaikan antrean (transaction)
--    Pindahkan data ke riwayat lalu hapus dari antrean
-- ============================================
CREATE OR REPLACE FUNCTION selesaikan_antrean(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO riwayat (nomor_antrean, nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas, status, sumber, waktu_daftar, waktu_panggil, tanggal)
  SELECT nomor_antrean, nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas, 'selesai', sumber, waktu_daftar, waktu_panggil, tanggal
  FROM antrean WHERE id = p_id;

  DELETE FROM antrean WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. RPC: Skip antrean (transaction)
--    Pindahkan data ke riwayat dengan status 'tidak_hadir'
-- ============================================
CREATE OR REPLACE FUNCTION skip_antrean(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO riwayat (nomor_antrean, nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas, status, sumber, waktu_daftar, waktu_panggil, tanggal)
  SELECT nomor_antrean, nama_pasien, usia, jenis_kelamin, no_hp, keluhan, prioritas, 'tidak_hadir', sumber, waktu_daftar, waktu_panggil, tanggal
  FROM antrean WHERE id = p_id;

  DELETE FROM antrean WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
