let suaraAktif = false;
let lastNomorDipanggil = null;

document.addEventListener('DOMContentLoaded', () => {
  const koneksiStatus = document.getElementById('koneksi-status');
  koneksiStatus.classList.replace('bg-red-500', 'bg-green-500');
  
  loadAntreanSaatIni();
  setInterval(loadAntreanSaatIni, 3000);
  startClock();
});

// Tombol aktifkan suara — trigger interaksi user agar TTS diizinkan browser
window.aktifkanSuara = () => {
  const btn = document.getElementById('btn-suara');

  // Ucapkan kalimat pendek untuk unlock audio policy browser
  const test = new SpeechSynthesisUtterance('Suara aktif.');
  test.lang = 'id-ID';
  test.volume = 0.5;
  test.rate = 1;
  window.speechSynthesis.speak(test);

  suaraAktif = true;

  // Ubah tampilan tombol jadi hijau
  btn.textContent = '🔊 Suara Aktif';
  btn.classList.remove('bg-red-100', 'text-red-700', 'border-red-300', 'hover:bg-red-200', 'animate-pulse');
  btn.classList.add('bg-green-100', 'text-green-700', 'border-green-300', 'hover:bg-green-200');
};

async function loadAntreanSaatIni() {
  try {
    const res = await fetch('/api/antrean');
    const result = await res.json();
    if (res.ok) {
      renderMenunggu(result.data);
      renderDipanggil(result.sedangDipanggil);

      // Cek apakah ada panggilan baru
      if (result.sedangDipanggil && result.sedangDipanggil.nomor_antrean !== lastNomorDipanggil) {
        if (lastNomorDipanggil !== null) {
          // Ada pasien baru dipanggil!
          highlightPanggilan(result.sedangDipanggil);
          if (suaraAktif) {
            playNotification();
          }
        }
        lastNomorDipanggil = result.sedangDipanggil.nomor_antrean;
      } else if (!result.sedangDipanggil) {
        lastNomorDipanggil = null;
      }
    }
  } catch (err) {
    console.error('Gagal fetch antrean:', err);
  }
}


function renderDipanggil(data) {
  const noEl = document.getElementById('dipanggil-nomor');
  const namaEl = document.getElementById('dipanggil-nama');
  const badgeEl = document.getElementById('dipanggil-badge');

  if (!data) {
    noEl.textContent = '-';
    namaEl.textContent = 'Belum ada panggilan';
    badgeEl.innerHTML = '';
    return;
  }

  noEl.textContent = data.nomor_antrean;
  namaEl.textContent = data.nama_pasien;
  badgeEl.innerHTML = getBadgePrioritasDisplay(data.prioritas);
}

function renderMenunggu(list) {
  const tbody = document.getElementById('tabel-menunggu');
  const menungguList = list.filter(item => item.status === 'menunggu').slice(0, 7);

  if (menungguList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="py-12 text-center text-gray-400 text-xl">Tidak ada antrean</td></tr>';
    return;
  }

  tbody.innerHTML = menungguList.map(item => `
    <tr class="transition-all">
      <td class="py-4 font-bold text-gray-800">${item.nomor_antrean}</td>
      <td class="py-4 font-semibold text-gray-600">${item.nama_pasien}</td>
      <td class="py-4 text-center">${getBadgePrioritasDisplay(item.prioritas)}</td>
    </tr>
  `).join('');
}

function highlightPanggilan(data) {
  const box = document.getElementById('dipanggil-box');
  
  renderDipanggil(data);
  
  box.classList.add('scale-110', 'text-blue-600', 'animate-pulse-ring');
  
  setTimeout(() => {
    box.classList.remove('scale-110', 'text-blue-600', 'animate-pulse-ring');
  }, 5000);
}

function playNotification() {
  // Tunggu sedikit agar DOM sudah ter-update sebelum membaca teks
  setTimeout(() => {
    const nomor = document.getElementById('dipanggil-nomor').textContent;
    const nama = document.getElementById('dipanggil-nama').textContent;

    const speech = new SpeechSynthesisUtterance();
    speech.lang = 'id-ID';
    speech.text = `Nomor antrean ${nomor}. Pasien atas nama ${nama}. Silakan menuju ruang pemeriksaan.`;
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  }, 500);
}

function getBadgePrioritasDisplay(p) {
  switch(Number(p)) {
    case 1: return '<span class="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-lg font-bold border-2 border-green-200">🟢 Hijau</span>';
    case 2: return '<span class="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-lg font-bold border-2 border-yellow-200">🟡 Kuning</span>';
    case 3: return '<span class="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-lg font-bold border-2 border-red-200">🔴 Merah (Gawat)</span>';
    default: return '';
  }
}

function startClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID');
    dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, 1000);
}
