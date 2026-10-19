document.addEventListener('DOMContentLoaded', () => {
  const formDaftar = document.getElementById('form-daftar');
  const formError = document.getElementById('form-error');

  formDaftar.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset error
    formError.classList.add('hidden');
    formError.textContent = '';
    
    // Ambil tombol submit untuk state loading
    const submitBtn = formDaftar.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(formDaftar);
      const data = Object.fromEntries(formData.entries());
      
      // Default untuk pendaftaran mandiri
      data.prioritas = '1';
      data.sumber = 'mandiri';

      const res = await fetch('/api/antrean/mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        tampilkanSukses(result.data.nomor_antrean);
      } else {
        tampilkanError(result.message || 'Terjadi kesalahan saat mendaftar');
      }
    } catch (err) {
      tampilkanError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});

function tampilkanError(msg) {
  const formError = document.getElementById('form-error');
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function tampilkanSukses(nomor) {
  document.getElementById('page-daftar').classList.add('hidden');
  document.getElementById('page-sukses').classList.remove('hidden');
  document.getElementById('sukses-nomor').textContent = nomor;
}

window.resetDaftar = () => {
  document.getElementById('form-daftar').reset();
  document.getElementById('page-sukses').classList.add('hidden');
  document.getElementById('page-daftar').classList.remove('hidden');
};
