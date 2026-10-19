/**
 * Seed Script — Buat admin default di Supabase Auth
 *
 * Jalankan: node database/init.js
 *
 * Pastikan file .env sudah terisi dengan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
 * Pastikan juga sudah menjalankan migration.sql di Supabase SQL Editor
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('🔄 Memulai seed admin default...\n');

  const adminEmail = 'admin@siantre.app';
  const adminPassword = 'admin123';
  const adminNama = 'Perawat Admin';

  // Cek apakah user sudah ada
  const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers();

  if (listErr) {
    console.error('❌ Gagal mengecek user:', listErr.message);
    process.exit(1);
  }

  const existing = existingUsers.users.find(u => u.email === adminEmail);

  if (existing) {
    console.log('ℹ️  Admin default sudah ada, skip seed.');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   ID: ${existing.id}`);
  } else {
    // Buat user baru via Supabase Auth Admin API
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nama: adminNama }
    });

    if (createErr) {
      console.error('❌ Gagal membuat admin:', createErr.message);
      process.exit(1);
    }

    console.log('✅ Admin default berhasil dibuat:');
    console.log(`   Email   : ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Nama    : ${adminNama}`);
    console.log(`   ID      : ${newUser.user.id}`);
  }

  console.log('\n✅ Seed selesai!');
  console.log('📌 Pastikan Anda sudah menjalankan migration.sql di Supabase SQL Editor.');
}

seed().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

