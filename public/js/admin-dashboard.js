document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status-koneksi');
  
  // Polling interval (3 detik)
  statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Online';
  statusEl.classList.replace('text-gray-400', 'text-green-600');

  loadAntrean();
  setInterval(loadAntrean, 3000);

  const formTambah = document.getElementById('form-tambah');
  const formError = document.getElementById('form-error');

  if (formTambah) {
    formTambah.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.classList.add('hidden');
      const formData = new FormData(formTambah);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/antrean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
          closeModal();
          formTambah.reset();
          document.getElementById('sukses-nomor').textContent = result.data.nomor_antrean;
          document.getElementById('modal-sukses').classList.remove('hidden');
          loadAntrean();
        } else {
          formError.textContent = result.message;
          formError.classList.remove('hidden');
        }
      } catch (err) {
        formError.textContent = 'Terjadi kesalahan sistem. Coba lagi.';
        formError.classList.remove('hidden');
      }
    });
  }
});


window.openModal = () => {
  document.getElementById('modal-tambah').classList.remove('hidden');
  document.getElementById('form-error').classList.add('hidden');
};

window.closeModal = () => {
  document.getElementById('modal-tambah').classList.add('hidden');
  document.getElementById('form-tambah').reset();
};

window.closeSuksesModal = () => {
  document.getElementById('modal-sukses').classList.add('hidden');
};

async function loadAntrean() {
  try {
    const res = await fetch('/api/antrean');
    const result = await res.json();
    if (res.ok) renderAntrean(result.data);
  } catch (err) {
    console.error('Gagal memuat data antrean:', err);
  }
}


function renderAntrean(list) {
  const tbody = document.getElementById('tabel-antrean');
  let total = 0, menunggu = 0, dipanggil = 0, tidakHadir = 0;

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-5 py-10 text-center text-gray-500">Tidak ada antrean hari ini</td></tr>';
    updateStats(0,0,0,0);
    return;
  }

  tbody.innerHTML = list.map((item) => {
    total++;
    if (item.status === 'menunggu') menunggu++;
    else if (item.status === 'dipanggil') dipanggil++;
    else if (item.status === 'tidak_hadir') tidakHadir++;

    return `
      <tr class="hover:bg-gray-50 transition-colors group">
        <td class="px-5 py-4"><div class="font-bold text-gray-800">${item.nomor_antrean}</div></td>
        <td class="px-5 py-4">
          <div class="font-semibold text-gray-800">${item.nama_pasien}</div>
          <div class="text-xs text-gray-500">${item.usia} thn • ${item.jenis_kelamin}</div>
          <div class="text-xs text-gray-500">${item.no_hp}</div>
        </td>
        <td class="px-5 py-4 text-gray-600 max-w-xs truncate" title="${item.keluhan}">${item.keluhan}</td>
        <td class="px-5 py-4 text-center">${getBadgePrioritas(item.prioritas)}</td>
        <td class="px-5 py-4 text-center"><span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">${item.sumber}</span></td>
        <td class="px-5 py-4 text-center">${getBadgeStatus(item.status)}</td>
        <td class="px-5 py-4 text-xs text-gray-500">
          <div>Daftar: ${formatTime(item.waktu_daftar)}</div>
          ${item.waktu_panggil ? `<div>Panggil: ${formatTime(item.waktu_panggil)}</div>` : ''}
        </td>
        <td class="px-5 py-4 text-center">
          <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            ${item.status === 'menunggu' ? `<button onclick="aksiPanggil(${item.id})" class="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors" title="Panggil Pasien">🔊</button>` : ''}
            ${item.status === 'dipanggil' ? `<button onclick="aksiSelesai(${item.id})" class="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors" title="Selesai Diperiksa">✅</button><button onclick="aksiSkip(${item.id})" class="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors" title="Lewati / Tidak Hadir">⏭️</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  updateStats(total, menunggu, dipanggil, tidakHadir);
}

function updateStats(tot, m, p, t) {
  document.getElementById('stat-total').textContent = tot;
  document.getElementById('stat-menunggu').textContent = m;
  document.getElementById('stat-dipanggil').textContent = p;
  document.getElementById('stat-tidakhadir').textContent = t;
}

function getBadgePrioritas(p) {
  switch(Number(p)) {
    case 1: return '<span class="badge-hijau px-3 py-1 rounded-full text-xs font-semibold">Hijau</span>';
    case 2: return '<span class="badge-kuning px-3 py-1 rounded-full text-xs font-semibold">Kuning</span>';
    case 3: return '<span class="badge-merah px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Merah</span>';
    default: return '-';
  }
}

function getBadgeStatus(s) {
  switch(s) {
    case 'menunggu': return '<span class="status-menunggu px-3 py-1 rounded-full text-xs font-semibold">Menunggu</span>';
    case 'dipanggil': return '<span class="status-dipanggil px-3 py-1 rounded-full text-xs font-semibold">Dipanggil</span>';
    case 'tidak_hadir': return '<span class="status-tidak-hadir px-3 py-1 rounded-full text-xs font-semibold">Tidak Hadir</span>';
    default: return s;
  }
}

function formatTime(datetimeStr) {
  if (!datetimeStr) return '';
  const d = new Date(datetimeStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

window.aksiPanggil = async (id) => {
  try {
    const res = await fetch(`/api/antrean/${id}/panggil`, { method: 'PATCH' });
    if(!res.ok) {
      const data = await res.json();
      alert(data.message || 'Gagal memanggil pasien');
    }
  } catch (err) { alert('Terjadi kesalahan jaringan.'); }
};

window.aksiSelesai = async (id) => {
  if(!confirm('Tandai pasien selesai diperiksa?')) return;
  try {
    const res = await fetch(`/api/antrean/${id}/selesai`, { method: 'PATCH' });
    if(!res.ok) {
      const data = await res.json();
      alert(data.message || 'Gagal update status');
    }
  } catch (err) { alert('Terjadi kesalahan jaringan.'); }
};

window.aksiSkip = async (id) => {
  if(!confirm('Lewati pasien ini? (Tidak Hadir)')) return;
  try {
    const res = await fetch(`/api/antrean/${id}/skip`, { method: 'PATCH' });
    if(!res.ok) {
      const data = await res.json();
      alert(data.message || 'Gagal update status');
    }
  } catch (err) { alert('Terjadi kesalahan jaringan.'); }
};
