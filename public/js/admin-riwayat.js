document.addEventListener('DOMContentLoaded', () => {
  // Set default filter to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filter-tanggal').value = today;
  
  loadRiwayat();
});

window.loadRiwayat = async () => {
  const tanggal = document.getElementById('filter-tanggal').value;
  if (!tanggal) return alert('Pilih tanggal terlebih dahulu');

  const tbody = document.getElementById('tabel-riwayat');
  tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-10 text-center text-gray-500">Memuat data...</td></tr>';

  try {
    const res = await fetch(`/api/riwayat?tanggal=${tanggal}`);
    const result = await res.json();
    
    if (res.ok) {
      renderRiwayat(result.data);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-10 text-center text-red-500">${result.message}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-10 text-center text-red-500">Gagal mengambil data</td></tr>';
  }
};

function renderRiwayat(list) {
  const tbody = document.getElementById('tabel-riwayat');

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-10 text-center text-gray-500">Tidak ada riwayat pada tanggal ini</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(item => {
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-5 py-4 text-gray-600">
          <div class="font-semibold">${formatDate(item.waktu_daftar)}</div>
          <div class="text-xs text-gray-400">${formatTime(item.waktu_daftar)}</div>
        </td>
        <td class="px-5 py-4 font-bold text-gray-800">${item.nomor_antrean}</td>
        <td class="px-5 py-4">
          <div class="font-semibold text-gray-800">${item.nama_pasien}</div>
          <div class="text-xs text-gray-500">${item.usia} thn • ${item.jenis_kelamin}</div>
        </td>
        <td class="px-5 py-4 text-gray-600 max-w-xs truncate" title="${item.keluhan}">
          ${item.keluhan}
        </td>
        <td class="px-5 py-4 text-center">
          ${getBadgePrioritas(item.prioritas)}
        </td>
        <td class="px-5 py-4 text-center">
          ${getBadgeStatus(item.status)}
        </td>
      </tr>
    `;
  }).join('');
}

function formatDate(datetimeStr) {
  if (!datetimeStr) return '';
  const d = new Date(datetimeStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(datetimeStr) {
  if (!datetimeStr) return '';
  const d = new Date(datetimeStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getBadgePrioritas(p) {
  switch(Number(p)) {
    case 1: return '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Hijau</span>';
    case 2: return '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Kuning</span>';
    case 3: return '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Merah</span>';
    default: return '-';
  }
}

function getBadgeStatus(s) {
  switch(s) {
    case 'selesai': return '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Selesai</span>';
    case 'tidak_hadir': return '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Tidak Hadir</span>';
    default: return `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">${s}</span>`;
  }
}
