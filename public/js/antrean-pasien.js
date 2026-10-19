document.addEventListener('DOMContentLoaded', () => {
  const konStatus = document.getElementById('koneksi-status');
  const konText = document.getElementById('koneksi-text');
  
  konStatus.classList.replace('bg-red-400', 'bg-green-400');
  konText.textContent = 'Live';

  loadData();
  setInterval(loadData, 3000);
});

async function loadData() {
  try {
    const res = await fetch('/api/antrean');
    if (res.ok) {
      const result = await res.json();
      renderMenunggu(result.data);
      renderDipanggil(result.sedangDipanggil);
    }
  } catch (err) {
    console.error('Gagal fetch data:', err);
  }
}


function renderDipanggil(data) {
  const noEl = document.getElementById('panggilan-nomor');
  const namaEl = document.getElementById('panggilan-nama');
  const prioEl = document.getElementById('panggilan-prioritas');

  if (!data) {
    noEl.textContent = '-';
    namaEl.textContent = 'Belum ada panggilan';
    prioEl.innerHTML = '';
    return;
  }

  noEl.textContent = data.nomor_antrean;
  namaEl.textContent = data.nama_pasien;
  
  // Minimalis badge untuk mobile
  let badgeClass = '';
  let badgeText = '';
  switch(Number(data.prioritas)) {
    case 1: badgeClass = 'bg-green-100 text-green-700'; badgeText = 'Prioritas Hijau'; break;
    case 2: badgeClass = 'bg-yellow-100 text-yellow-700'; badgeText = 'Prioritas Kuning'; break;
    case 3: badgeClass = 'bg-red-100 text-red-700 animate-pulse'; badgeText = 'Prioritas Merah'; break;
  }
  
  prioEl.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-bold ${badgeClass}">${badgeText}</span>`;
}

function renderMenunggu(list) {
  const container = document.getElementById('list-menunggu');
  const menungguList = list.filter(item => item.status === 'menunggu');
  
  document.getElementById('jumlah-menunggu').textContent = `${menungguList.length} Pasien`;

  if (menungguList.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        <span class="text-3xl mb-2">☕</span>
        <p class="text-gray-500 font-medium">Antrean Kosong</p>
        <p class="text-xs text-gray-400 mt-1">Belum ada pasien yang menunggu.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = menungguList.map(item => {
    let dotColor = '';
    switch(Number(item.prioritas)) {
      case 1: dotColor = 'bg-green-500'; break;
      case 2: dotColor = 'bg-yellow-500'; break;
      case 3: dotColor = 'bg-red-500'; break;
    }

    return `
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-800 text-lg border border-gray-100">
            ${item.nomor_antrean}
          </div>
          <div>
            <div class="font-bold text-gray-800">${item.nama_pasien}</div>
            <div class="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
              Prioritas ${item.prioritas == 3 ? 'Merah' : item.prioritas == 2 ? 'Kuning' : 'Hijau'}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
