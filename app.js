/* ============================================================
   REWARD CENTER — SHARED APPLICATION SCRIPT
   Multi-page version (index, task, riwayat, wd, akun)
   Includes: Video wallpaper controller + App logic
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     PART 1 — VIDEO WALLPAPER CONTROLLER
     ============================================================ */
  (function initVideoWallpaper() {
    const video = document.getElementById('bgVideo');
    if (!video) return;

    let userInteracted = false;

    /* --------------------------------------------------------
       01. Autoplay guard — beberapa browser mobile
           (iOS low-power mode, Chrome data saver) blokir
           autoplay walau muted.
       -------------------------------------------------------- */
    function tryPlay() {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // Autoplay diblokir → retry pada interaksi pertama
          const resume = function () {
            video.play().catch(function () {});
            removeAllListeners();
          };
          const removeAllListeners = function () {
            document.removeEventListener('touchstart', resume);
            document.removeEventListener('click', resume);
            document.removeEventListener('scroll', resume);
            document.removeEventListener('keydown', resume);
          };
          document.addEventListener('touchstart', resume, { once: true, passive: true });
          document.addEventListener('click', resume, { once: true });
          document.addEventListener('scroll', resume, { once: true, passive: true });
          document.addEventListener('keydown', resume, { once: true });
        });
      }
    }

    /* --------------------------------------------------------
       02. Pause saat tab tidak aktif (hemat baterai)
       -------------------------------------------------------- */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        video.pause();
      } else if (!userInteracted) {
        tryPlay();
      }
    });

    /* --------------------------------------------------------
       03. Fallback kalau video error / tidak ketemu
       -------------------------------------------------------- */
    video.addEventListener('error', function () {
      video.style.display = 'none';
      document.body.style.background =
        'linear-gradient(160deg,#1A1A1F 0%,#0E0E11 100%)';
    });

    /* --------------------------------------------------------
       04. Track interaksi user (biar ga ke-pause terus)
       -------------------------------------------------------- */
    ['touchstart', 'click', 'keydown'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        userInteracted = true;
      }, { once: true, passive: true });
    });

    /* --------------------------------------------------------
       05. Play saat terlihat di viewport, pause saat tidak
       -------------------------------------------------------- */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            tryPlay();
          } else {
            video.pause();
          }
        });
      }, { threshold: 0 });
      io.observe(video);
    }

    /* --------------------------------------------------------
       06. Muat ulang saat balik dari bfcache (back/forward)
       -------------------------------------------------------- */
    window.addEventListener('pageshow', function (evt) {
      if (evt.persisted) {
        video.currentTime = 0;
        tryPlay();
      }
    });

    /* --------------------------------------------------------
       07. Start
       -------------------------------------------------------- */
    tryPlay();
  })();

  /* ============================================================
     PART 2 — APP LOGIC
     ============================================================ */

  /* ----------------------------------------------------------
     01. KONSTANTA
     ---------------------------------------------------------- */
  const STORAGE_KEY = 'rewardcenter_state_v1';
  const MIN_WITHDRAW = 50000;

  const STATUS = {
    AVAILABLE: 'available',
    TAKEN: 'taken',
    REVIEW: 'review',
    DONE: 'done',
    REJECTED: 'rejected'
  };

  const STATUS_LABEL = {
    available: 'Tersedia',
    taken: 'Diambil',
    review: 'Menunggu',
    done: 'Selesai',
    rejected: 'Ditolak'
  };

  const STATUS_CLASS = {
    available: 'badge-neutral',
    taken: 'badge-warn',
    review: 'badge-info',
    done: 'badge-ok',
    rejected: 'badge-err'
  };

  /* ----------------------------------------------------------
     02. DATA MASTER TUGAS
     ---------------------------------------------------------- */
  const MASTER_TASKS = [
    {
      id: 'TK-2401',
      title: 'Video Review Singkat Situs Utama',
      desc: 'Buat video review singkat yang menjelaskan fungsi utama website, apa yang bisa dilakukan pengunjung, dan kesan pertama saat membuka situs.',
      reward: 25000,
      duration: '15–30 detik',
      minViews: 500,
      slots: 200,
      difficulty: 'Mudah',
      tags: ['TikTok', 'Review', 'Video Pendek'],
      rules: [
        'Durasi video antara 15 sampai 30 detik.',
        'Wajib menyebut nama website secara lisan minimal satu kali.',
        'Cantumkan tautan website pada deskripsi video.',
        'Gunakan pencahayaan yang cukup, suara jelas, tanpa musik yang menutupi narasi.',
        'Video harus publik dan dapat dibuka tanpa login.'
      ],
      deadline: '7 hari setelah tugas diambil'
    },
    {
      id: 'TK-2402',
      title: 'Video Tutorial Cara Pakai Fitur',
      desc: 'Rekam layar saat menggunakan salah satu fitur utama website, lalu jelaskan langkah-langkahnya secara runtut dari awal hingga selesai.',
      reward: 40000,
      duration: '30–60 detik',
      minViews: 800,
      slots: 150,
      difficulty: 'Sedang',
      tags: ['TikTok', 'Tutorial', 'Screen Record'],
      rules: [
        'Durasi video antara 30 sampai 60 detik.',
        'Rekaman layar harus tajam dan tidak blur.',
        'Tambahkan teks penjelas pada setiap langkah.',
        'Tautan website wajib ada di deskripsi video.',
        'Dilarang menampilkan data pribadi pada rekaman layar.'
      ],
      deadline: '7 hari setelah tugas diambil'
    },
    {
      id: 'TK-2403',
      title: 'Video Kompilasi Testimoni Pengguna',
      desc: 'Buat video pendek berisi kumpulan testimoni atau tanggapan pengguna website, bisa dari komentar publik atau hasil wawancara singkat.',
      reward: 55000,
      duration: '30–45 detik',
      minViews: 1000,
      slots: 100,
      difficulty: 'Sedang',
      tags: ['TikTok', 'Testimoni', 'Kompilasi'],
      rules: [
        'Durasi video antara 30 sampai 45 detik.',
        'Testimoni harus nyata, bukan rekayasa.',
        'Sertakan izin bila menampilkan wajah atau suara orang lain.',
        'Cantumkan tautan website pada deskripsi video.',
        'Gunakan transisi yang rapi dan tidak berlebihan.'
      ],
      deadline: '10 hari setelah tugas diambil'
    },
    {
      id: 'TK-2404',
      title: 'Video Tren Audio dengan Tautan Website',
      desc: 'Manfaatkan audio yang sedang tren di TikTok untuk membuat video pendek yang mengarahkan penonton membuka website melalui tautan di deskripsi.',
      reward: 30000,
      duration: '10–20 detik',
      minViews: 1500,
      slots: 250,
      difficulty: 'Mudah',
      tags: ['TikTok', 'Tren', 'Audio'],
      rules: [
        'Durasi video antara 10 sampai 20 detik.',
        'Gunakan audio dari pustaka TikTok yang sedang tren saat video dibuat.',
        'Video harus menampilkan visual website atau nama website.',
        'Tautan website wajib ada di deskripsi video atau bio.',
        'Video harus publik selama minimal 14 hari.'
      ],
      deadline: '5 hari setelah tugas diambil'
    },
    {
      id: 'TK-2405',
      title: 'Video Ulasan Mendalam untuk Audiens Kreator',
      desc: 'Buat video yang membahas website dari sudut pandang kreator konten, fokus pada manfaat, kemudahan, dan alasan layak dicoba.',
      reward: 75000,
      duration: '60–90 detik',
      minViews: 2000,
      slots: 80,
      difficulty: 'Sulit',
      tags: ['TikTok', 'Ulasan', 'Kreator'],
      rules: [
        'Durasi video antara 60 sampai 90 detik.',
        'Narasi harus orisinal, bukan dibacakan dari teks otomatis.',
        'Bahasa yang digunakan jelas, tidak berbelit, dan mudah dipahami.',
        'Tautan website wajib ada di deskripsi video.',
        'Video tidak boleh mengandung klaim berlebihan yang tidak dapat dibuktikan.'
      ],
      deadline: '14 hari setelah tugas diambil'
    },
    {
      id: 'TK-2406',
      title: 'Video Before–After Pengalaman Memakai Situs',
      desc: 'Buat video dengan format sebelum dan sesudah, memperlihatkan perubahan pengalaman atau hasil setelah menggunakan website.',
      reward: 48000,
      duration: '20–40 detik',
      minViews: 900,
      slots: 120,
      difficulty: 'Sedang',
      tags: ['TikTok', 'Before After', 'Storytelling'],
      rules: [
        'Durasi video antara 20 sampai 40 detik.',
        'Struktur video harus jelas: bagian sebelum, momen transisi, bagian sesudah.',
        'Tambahkan teks penanda pada kedua bagian.',
        'Tautan website wajib ada di deskripsi video.',
        'Video tidak boleh menyesatkan atau memanipulasi hasil.'
      ],
      deadline: '7 hari setelah tugas diambil'
    },
    {
      id: 'TK-2407',
      title: 'Video Singkat dengan Subtitle Bahasa Indonesia',
      desc: 'Buat video promosi singkat yang seluruh narasinya memakai subtitle bahasa Indonesia, cocok untuk penonton yang menonton tanpa suara.',
      reward: 27000,
      duration: '15–25 detik',
      minViews: 600,
      slots: 180,
      difficulty: 'Mudah',
      tags: ['TikTok', 'Subtitle', 'Bahasa Indonesia'],
      rules: [
        'Durasi video antara 15 sampai 25 detik.',
        'Subtitle harus terbaca jelas dan sinkron dengan narasi.',
        'Gunakan ejaan bahasa Indonesia yang benar.',
        'Tautan website wajib ada di deskripsi video.',
        'Video harus publik dan tidak diprivatkan.'
      ],
      deadline: '5 hari setelah tugas diambil'
    },
    {
      id: 'TK-2408',
      title: 'Video Tantangan 7 Hari Pakai Website',
      desc: 'Dokumentasikan pengalaman memakai website selama beberapa hari dalam satu video rangkuman singkat yang menarik dan jujur.',
      reward: 65000,
      duration: '45–75 detik',
      minViews: 1200,
      slots: 60,
      difficulty: 'Sulit',
      tags: ['TikTok', 'Tantangan', 'Rangkuman'],
      rules: [
        'Durasi video antara 45 sampai 75 detik.',
        'Rekaman harus menunjukkan penggunaan nyata, bukan sekadar tangkapan layar berulang.',
        'Sertakan keterangan hari pada setiap potongan video.',
        'Tautan website wajib ada di deskripsi video.',
        'Video wajib tayang minimal 14 hari setelah diterima.'
      ],
      deadline: '21 hari setelah tugas diambil'
    }
  ];

  /* ----------------------------------------------------------
     03. STATE
     ---------------------------------------------------------- */
  let state = {
    tasks: [],
    submissions: [],
    balance: 0,
    pending: 0,
    total: 0,
    withdraws: []
  };

  let ui = {
    filter: 'all',
    query: '',
    activeTaskId: null,
    submitTaskId: null
  };

  /* ----------------------------------------------------------
     04. UTILITAS
     ---------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function rupiah(n) {
    const num = Number(n) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function rupiahShort(n) {
    const num = Number(n) || 0;
    if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1).replace('.0', '') + 'jt';
    if (num >= 1000) return 'Rp ' + Math.round(num / 1000) + 'rb';
    return 'Rp ' + num;
  }

  function numberID(n) {
    return (Number(n) || 0).toLocaleString('id-ID');
  }

  function uid() {
    return 'SUB-' + Date.now().toString(36).toUpperCase() +
      '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function nowISO() { return new Date().toISOString(); }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                   'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear() +
      ' · ' + String(d.getHours()).padStart(2, '0') +
      ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  function isValidTikTokURL(url) {
    if (!url) return false;
    try {
      const u = new URL(url.trim());
      const host = u.hostname.toLowerCase();
      return (
        (host === 'www.tiktok.com' || host === 'tiktok.com' ||
         host === 'm.tiktok.com' || host === 'vm.tiktok.com') &&
        (u.protocol === 'http:' || u.protocol === 'https:')
      );
    } catch (e) { return false; }
  }

  function isValidUsername(name) {
    if (!name) return false;
    const clean = name.trim().replace(/^@/, '');
    return /^[a-zA-Z0-9._]{2,24}$/.test(clean);
  }

  function difficultyClass(d) {
    if (d === 'Mudah') return 'badge-ok';
    if (d === 'Sedang') return 'badge-warn';
    return 'badge-err';
  }

  /* ----------------------------------------------------------
     05. STORAGE
     ---------------------------------------------------------- */
  function buildInitialTasks() {
    return MASTER_TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      desc: t.desc,
      reward: t.reward,
      duration: t.duration,
      minViews: t.minViews,
      slots: t.slots,
      taken: Math.floor(Math.random() * Math.floor(t.slots * 0.55)),
      difficulty: t.difficulty,
      tags: t.tags.slice(),
      rules: t.rules.slice(),
      deadline: t.deadline,
      status: STATUS.AVAILABLE,
      takenAt: null
    }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state.tasks = buildInitialTasks();
        state.submissions = [];
        state.balance = 0;
        state.pending = 0;
        state.total = 0;
        state.withdraws = [];
        saveState();
        return;
      }
      const p = JSON.parse(raw);
      state.tasks = Array.isArray(p.tasks) && p.tasks.length
        ? p.tasks : buildInitialTasks();
      state.submissions = Array.isArray(p.submissions) ? p.submissions : [];
      state.balance = Number(p.balance) || 0;
      state.pending = Number(p.pending) || 0;
      state.total = Number(p.total) || 0;
      state.withdraws = Array.isArray(p.withdraws) ? p.withdraws : [];
    } catch (e) {
      state.tasks = buildInitialTasks();
      state.submissions = [];
      state.balance = 0;
      state.pending = 0;
      state.total = 0;
      state.withdraws = [];
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ----------------------------------------------------------
     06. TOAST
     ---------------------------------------------------------- */
  const ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 8h.01M12 12v4"/></svg>'
  };

  function toast(title, desc, type) {
    let wrap = $('#toastWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.id = 'toastWrap';
      document.body.appendChild(wrap);
    }
    const kind = type || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML =
      '<span class="ic">' + (ICONS[kind] || ICONS.info) + '</span>' +
      '<span style="min-width:0;flex:1">' +
        '<span class="tt">' + escapeHTML(title) + '</span>' +
        (desc ? '<span class="td">' + escapeHTML(desc) + '</span>' : '') +
      '</span>';
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    }, 3400);
  }

  /* ----------------------------------------------------------
     07. SHEET MANAGEMENT
     ---------------------------------------------------------- */
  function openSheet(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('show');
    document.body.style.overflow = '';
  }

  function closeAllSheets() {
    $$('.overlay').forEach((o) => o.classList.remove('show'));
    document.body.style.overflow = '';
  }

  /* ----------------------------------------------------------
     08. PERHITUNGAN
     ---------------------------------------------------------- */
  function recalcTotals() {
    let pending = 0, total = 0, balance = 0;

    state.submissions.forEach((s) => {
      if (s.status === STATUS.REVIEW) pending += s.reward;
      else if (s.status === STATUS.DONE) { total += s.reward; balance += s.reward; }
    });

    const withdrawn = state.withdraws
      .filter((w) => w.status === 'processed' || w.status === 'pending')
      .reduce((a, b) => a + (Number(b.amount) || 0), 0);

    state.pending = pending;
    state.total = total;
    state.balance = Math.max(0, balance - withdrawn);
  }

  function computeStats() {
    recalcTotals();

    const activeTasks = state.tasks.filter(
      (t) => t.status !== STATUS.DONE && t.status !== STATUS.REJECTED
    ).length;
    const totalRewardPool = state.tasks.reduce((a, t) => a + t.reward, 0);
    const verifiedCount = state.submissions.filter((s) => s.status === STATUS.DONE).length;
    const avgReward = verifiedCount > 0
      ? Math.round(state.total / verifiedCount)
      : Math.round(totalRewardPool / Math.max(1, state.tasks.length));

    const takenCount = state.tasks.filter((t) => t.status === STATUS.TAKEN).length;
    const reviewCount = state.tasks.filter((t) => t.status === STATUS.REVIEW).length;
    const doneCount = state.tasks.filter((t) => t.status === STATUS.DONE).length;
    const rejCount = state.tasks.filter((t) => t.status === STATUS.REJECTED).length;
    const totalSubmitted = doneCount + rejCount;
    const rate = totalSubmitted > 0
      ? Math.round((doneCount / totalSubmitted) * 100) + '%' : '—';

    return {
      activeTasks, totalRewardPool, verifiedCount, avgReward,
      takenCount, reviewCount, doneCount, rejCount, rate
    };
  }

  /* ----------------------------------------------------------
     09. RENDER: TOP BALANCE
     ---------------------------------------------------------- */
  function renderTopBalance() {
    recalcTotals();
    const el = $('#topBalance');
    if (el) el.textContent = rupiahShort(state.balance);
  }

  /* ----------------------------------------------------------
     10. RENDER: NAV BADGES
     ---------------------------------------------------------- */
  function renderNavBadges() {
    const activeCount = state.tasks.filter(
      (t) => t.status === STATUS.TAKEN || t.status === STATUS.REVIEW
    ).length;
    const pendingCount = state.submissions.filter(
      (s) => s.status === STATUS.REVIEW
    ).length;

    const activeDot = $('#taskDot');
    const histDot = $('#histDot');

    if (activeDot) {
      if (activeCount > 0) {
        activeDot.textContent = activeCount > 9 ? '9+' : activeCount;
        activeDot.classList.add('show');
      } else {
        activeDot.classList.remove('show');
      }
    }

    if (histDot) {
      if (pendingCount > 0) {
        histDot.textContent = pendingCount > 9 ? '9+' : pendingCount;
        histDot.classList.add('show');
      } else {
        histDot.classList.remove('show');
      }
    }
  }

  /* ----------------------------------------------------------
     11. RENDER: TASK CARD HTML
     ---------------------------------------------------------- */
  function taskCardHTML(t) {
    const slotsLeft = Math.max(0, t.slots - t.taken);
    const pct = t.slots > 0 ? clamp(Math.round((t.taken / t.slots) * 100), 0, 100) : 0;
    const barClass = pct >= 85 ? 'warn' : (t.status === STATUS.DONE ? 'ok' : '');

    const statusBadge = '<span class="badge ' + STATUS_CLASS[t.status] + '">' +
      '<span class="badge-dot"></span>' + STATUS_LABEL[t.status] + '</span>';

    let primaryBtn = '';
    if (t.status === STATUS.AVAILABLE) {
      primaryBtn = '<button class="btn btn-primary btn-sm" data-action="take" data-id="' + t.id + '">Ambil</button>';
    } else if (t.status === STATUS.TAKEN) {
      primaryBtn = '<button class="btn btn-primary btn-sm" data-action="submit" data-id="' + t.id + '">Kirim Bukti</button>';
    } else if (t.status === STATUS.REVIEW) {
      primaryBtn = '<button class="btn btn-ghost btn-sm" disabled>Review</button>';
    } else if (t.status === STATUS.DONE) {
      primaryBtn = '<button class="btn btn-ghost btn-sm" disabled>Diterima</button>';
    } else if (t.status === STATUS.REJECTED) {
      primaryBtn = '<button class="btn btn-outline btn-sm" data-action="submit" data-id="' + t.id + '">Kirim Ulang</button>';
    }

    return '' +
      '<article class="task st-' + t.status + '" data-task="' + t.id + '">' +
        '<div class="task-top">' +
          '<div class="left">' +
            '<div class="task-id">' + escapeHTML(t.id) + '</div>' +
            '<h3 class="task-title">' + escapeHTML(t.title) + '</h3>' +
          '</div>' +
          statusBadge +
        '</div>' +

        '<p class="task-desc">' + escapeHTML(t.desc) + '</p>' +

        '<div class="task-meta">' +
          '<span class="chip">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
              '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' +
            '</svg>' +
            escapeHTML(t.duration) +
          '</span>' +
          '<span class="chip">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
              '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' +
            '</svg>' +
            'min ' + numberID(t.minViews) +
          '</span>' +
          '<span class="badge ' + difficultyClass(t.difficulty) + '">' +
            escapeHTML(t.difficulty) + '</span>' +
        '</div>' +

        '<div class="progress">' +
          '<div class="pr-top">' +
            '<span>Kuota</span>' +
            '<span class="mono">' + numberID(t.taken) + '/' + numberID(t.slots) + '</span>' +
          '</div>' +
          '<div class="bar ' + barClass + '"><i style="width:' + pct + '%"></i></div>' +
          '<div class="pr-top">' +
            '<span>' + numberID(slotsLeft) + ' slot tersisa</span>' +
            '<span>' + pct + '%</span>' +
          '</div>' +
        '</div>' +

        '<div class="task-reward-row">' +
          '<div>' +
            '<div class="reward-lbl">Reward</div>' +
            '<div class="reward">' +
              '<span class="rp">Rp</span>' +
              '<span class="amt">' + numberID(t.reward) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="row gap-6">' +
            '<button class="btn btn-outline btn-sm" data-action="detail" data-id="' + t.id + '">Detail</button>' +
            primaryBtn +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ----------------------------------------------------------
     12. RENDER: PAGE — HOME
     ---------------------------------------------------------- */
  function renderHome() {
    const s = computeStats();

    const mTasks = $('#mTasks');
    const mReward = $('#mReward');
    const mVerified = $('#mVerified');
    const mAvg = $('#mAvg');

    if (mTasks) mTasks.textContent = numberID(s.activeTasks);
    if (mReward) mReward.textContent = rupiahShort(s.totalRewardPool);
    if (mVerified) mVerified.textContent = numberID(s.verifiedCount);
    if (mAvg) mAvg.textContent = rupiahShort(s.avgReward);

    const listEl = $('#homeTaskList');
    if (!listEl) return;

    const top = state.tasks
      .filter((t) => t.status === STATUS.AVAILABLE)
      .sort((a, b) => b.reward - a.reward)
      .slice(0, 3);

    if (!top.length) {
      listEl.innerHTML =
        '<div class="empty">' +
          '<div class="ic">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
              '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 12v4"/>' +
            '</svg>' +
          '</div>' +
          '<h4>Semua tugas sudah diambil</h4>' +
          '<p>Cek halaman Tugas untuk melihat status pengajuanmu.</p>' +
          '<a href="task.html" class="btn btn-primary btn-sm mt-16">Buka Halaman Tugas</a>' +
        '</div>';
      return;
    }

    listEl.innerHTML = top.map(taskCardHTML).join('');
  }

  /* ----------------------------------------------------------
     13. RENDER: PAGE — TASK
     ---------------------------------------------------------- */
  function filteredTasks() {
    let list = state.tasks.slice();

    if (ui.filter !== 'all') {
      list = list.filter((t) => t.status === ui.filter);
    }

    if (ui.query.trim()) {
      const q = ui.query.trim().toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return list;
  }

  function renderTask() {
    const listEl = $('#taskList');
    const empty = $('#taskEmpty');
    const countEl = $('#taskCount');
    if (!listEl) return;

    const list = filteredTasks();
    if (countEl) countEl.textContent = list.length;

    if (!list.length) {
      listEl.innerHTML = '';
      if (empty) empty.classList.remove('hide');
      return;
    }
    if (empty) empty.classList.add('hide');
    listEl.innerHTML = list.map(taskCardHTML).join('');
  }

  /* ----------------------------------------------------------
     14. RENDER: PAGE — RIWAYAT
     ---------------------------------------------------------- */
  function historyCardHTML(s) {
    const link = s.link
      ? '<a class="sub-link" href="' + escapeHTML(s.link) + '" target="_blank" rel="noopener noreferrer">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/>' +
            '<path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>' +
          '</svg>' +
          '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            escapeHTML(s.link.replace(/^https?:\/\/(www\.)?/, '')) +
          '</span>' +
        '</a>'
      : '<span class="tiny muted">Tautan belum diisi</span>';

    let action = '';
    if (s.status === STATUS.REJECTED) {
      action = '<button class="btn btn-outline btn-sm" data-action="resubmit" data-sub="' + s.id + '">Kirim Ulang</button>';
    } else if (s.status === STATUS.REVIEW) {
      action = '<button class="btn btn-ghost btn-sm" disabled>Diproses</button>';
    } else if (s.status === STATUS.TAKEN) {
      action = '<button class="btn btn-primary btn-sm" data-action="submit" data-id="' + s.taskId + '">Kirim Bukti</button>';
    } else if (s.status === STATUS.DONE) {
      action = '<span class="badge badge-ok"><span class="badge-dot"></span>Reward masuk</span>';
    }

    const rejectNote = (s.status === STATUS.REJECTED && s.rejectReason)
      ? '<div class="sub-note"><strong>Alasan ditolak:</strong> ' + escapeHTML(s.rejectReason) + '</div>'
      : '';

    const username = s.username
      ? '@' + escapeHTML(s.username.replace(/^@/, ''))
      : '—';

    return '' +
      '<div class="sub">' +
        '<div class="sub-top">' +
          '<div class="left">' +
            '<div class="sub-id">' + escapeHTML(s.taskId) + ' · ' + escapeHTML(s.id) + '</div>' +
            '<div class="sub-title">' + escapeHTML(s.taskTitle) + '</div>' +
          '</div>' +
          '<span class="badge ' + STATUS_CLASS[s.status] + '">' +
            '<span class="badge-dot"></span>' + STATUS_LABEL[s.status] +
          '</span>' +
        '</div>' +

        (s.link ? '<div style="margin-top:2px">' + link + '</div>' : '') +

        '<div class="sub-info">' +
          '<div class="kv"><span class="k">Username</span><span class="v">' + username + '</span></div>' +
          '<div class="kv"><span class="k">Views</span><span class="v">' + numberID(s.views || 0) + '</span></div>' +
          '<div class="kv"><span class="k">Reward</span><span class="v" style="color:var(--txt-0);font-weight:800">' + rupiah(s.reward) + '</span></div>' +
          '<div class="kv"><span class="k">Tanggal</span><span class="v">' + fmtDate(s.submittedAt) + '</span></div>' +
        '</div>' +

        rejectNote +

        (action ? '<div style="display:flex;gap:8px;padding-top:4px">' + action + '</div>' : '') +
      '</div>';
  }

  function renderRiwayat() {
    const listEl = $('#historyList');
    const empty = $('#histEmpty');
    if (!listEl) return;

    const rows = state.submissions.slice().sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    if (!rows.length) {
      listEl.innerHTML = '';
      if (empty) empty.classList.remove('hide');
      return;
    }
    if (empty) empty.classList.add('hide');
    listEl.innerHTML = rows.map(historyCardHTML).join('');
  }

  /* ----------------------------------------------------------
     15. RENDER: PAGE — WITHDRAW
     ---------------------------------------------------------- */
  function renderWd() {
    recalcTotals();

    const wb = $('#walletBalance');
    const wp = $('#walletPending');
    const wt = $('#walletTotal');
    const wpc = $('#walletPendingCount');
    const wtc = $('#walletTotalCount');

    if (wb) wb.textContent = rupiah(state.balance);
    if (wp) wp.textContent = rupiahShort(state.pending);
    if (wt) wt.textContent = rupiahShort(state.total);

    const pendingItems = state.submissions.filter((s) => s.status === STATUS.REVIEW).length;
    const doneItems = state.submissions.filter((s) => s.status === STATUS.DONE).length;
    if (wpc) wpc.textContent = pendingItems + ' pengajuan';
    if (wtc) wtc.textContent = doneItems + ' terverifikasi';

    const s = computeStats();
    const sT = $('#sumTaken');
    const sR = $('#sumReview');
    const sD = $('#sumDone');
    const sRj = $('#sumReject');
    const sRate = $('#sumRate');

    if (sT) sT.textContent = numberID(s.takenCount);
    if (sR) sR.textContent = numberID(s.reviewCount);
    if (sD) sD.textContent = numberID(s.doneCount);
    if (sRj) sRj.textContent = numberID(s.rejCount);
    if (sRate) sRate.textContent = s.rate;
  }

  /* ----------------------------------------------------------
     16. RENDER ALL (dispatch by page)
     ---------------------------------------------------------- */
  function renderPage() {
    const page = document.body.getAttribute('data-page');
    renderTopBalance();
    renderNavBadges();

    if (page === 'home') renderHome();
    else if (page === 'task') renderTask();
    else if (page === 'riwayat') renderRiwayat();
    else if (page === 'wd') renderWd();
    else if (page === 'akun') { /* static */ }
  }

  /* ----------------------------------------------------------
     17. AKSI: AMBIL TUGAS
     ---------------------------------------------------------- */
  function takeTask(taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;

    if (t.status !== STATUS.AVAILABLE) {
      toast('Tidak bisa diambil', 'Tugas ini sudah tidak berstatus tersedia.', 'err');
      return;
    }
    if (t.taken >= t.slots) {
      toast('Kuota habis', 'Slot untuk tugas ini sudah penuh.', 'err');
      return;
    }

    t.status = STATUS.TAKEN;
    t.taken = Math.min(t.slots, t.taken + 1);
    t.takenAt = nowISO();

    state.submissions.push({
      id: uid(),
      taskId: t.id,
      taskTitle: t.title,
      reward: t.reward,
      link: '',
      username: '',
      views: 0,
      note: '',
      status: STATUS.TAKEN,
      submittedAt: nowISO(),
      reviewedAt: null,
      rejectReason: ''
    });

    saveState();
    renderPage();
    toast('Tugas diambil', 'Selesaikan video lalu kirim buktinya sebelum tenggat.', 'ok');
    closeAllSheets();
  }

  /* ----------------------------------------------------------
     18. SHEET: DETAIL
     ---------------------------------------------------------- */
  function openDetail(taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;
    ui.activeTaskId = taskId;

    const titleEl = $('#dTitle');
    const idEl = $('#dId');
    const bodyEl = $('#dBody');
    const footEl = $('#dFoot');
    if (!bodyEl) return;

    if (titleEl) titleEl.textContent = t.title;
    if (idEl) idEl.textContent = t.id;

    const slotsLeft = Math.max(0, t.slots - t.taken);

    const rulesHTML = (t.rules || []).map((r) =>
      '<div class="rule"><span class="mk">—</span><span>' + escapeHTML(r) + '</span></div>'
    ).join('');

    const tagsHTML = (t.tags || []).map((tag) =>
      '<span class="chip">' + escapeHTML(tag) + '</span>'
    ).join('');

    bodyEl.innerHTML = '' +
      '<div class="row-between mb-14" style="gap:10px;flex-wrap:wrap">' +
        '<span class="badge ' + STATUS_CLASS[t.status] + '">' +
          '<span class="badge-dot"></span>' + STATUS_LABEL[t.status] +
        '</span>' +
        '<span class="badge ' + difficultyClass(t.difficulty) + '">' +
          escapeHTML(t.difficulty) + '</span>' +
      '</div>' +

      '<p style="font-size:13px;line-height:1.65;color:var(--txt-1)">' +
        escapeHTML(t.desc) + '</p>' +

      '<div class="divider mt-16 mb-12"></div>' +

      '<div class="kv-row"><span class="k">Reward</span><span class="v" style="color:var(--txt-0);font-size:15px">' + rupiah(t.reward) + '</span></div>' +
      '<div class="kv-row"><span class="k">Durasi video</span><span class="v">' + escapeHTML(t.duration) + '</span></div>' +
      '<div class="kv-row"><span class="k">Minimum views</span><span class="v">' + numberID(t.minViews) + '</span></div>' +
      '<div class="kv-row"><span class="k">Slot tersisa</span><span class="v">' + numberID(slotsLeft) + ' / ' + numberID(t.slots) + '</span></div>' +
      '<div class="kv-row"><span class="k">Batas pengerjaan</span><span class="v">' + escapeHTML(t.deadline || '—') + '</span></div>' +

      '<h5 class="mt-20 mb-10" style="font-size:13px">Ketentuan tugas</h5>' +
      '<div class="stack-sm">' + rulesHTML + '</div>' +

      '<h5 class="mt-20 mb-10" style="font-size:13px">Tag terkait</h5>' +
      '<div class="row gap-6" style="flex-wrap:wrap">' + tagsHTML + '</div>' +

      '<div class="note info mt-16">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>' +
        '</svg>' +
        '<span>Video yang tidak memenuhi ketentuan di atas akan ditolak saat verifikasi. Baca dengan teliti sebelum mulai merekam.</span>' +
      '</div>';

    let footHTML = '<button class="btn btn-outline" data-close>Tutup</button>';
    if (t.status === STATUS.AVAILABLE) {
      footHTML += '<button class="btn btn-primary" data-action="take" data-id="' + t.id + '">Ambil Tugas</button>';
    } else if (t.status === STATUS.TAKEN) {
      footHTML += '<button class="btn btn-primary" data-action="submit" data-id="' + t.id + '">Kirim Bukti</button>';
    } else if (t.status === STATUS.REJECTED) {
      footHTML += '<button class="btn btn-primary" data-action="submit" data-id="' + t.id + '">Kirim Ulang</button>';
    }
    if (footEl) footEl.innerHTML = footHTML;

    openSheet('sheetDetail');
  }

  /* ----------------------------------------------------------
     19. SHEET: SUBMIT
     ---------------------------------------------------------- */
  function resetSubmitForm() {
    const els = ['#sUsername', '#sLink', '#sViews'];
    els.forEach((sel) => {
      const el = $(sel);
      if (el) {
        el.value = '';
        el.classList.remove('err');
      }
    });
    const note = $('#sNote');
    if (note) note.value = '';
    const agree = $('#sAgree');
    if (agree) agree.checked = false;
    ['#eUsername', '#eLink', '#eViews', '#eAgree'].forEach((sel) => {
      const el = $(sel);
      if (el) el.classList.remove('show');
    });
  }

  function openSubmit(taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;
    ui.submitTaskId = taskId;

    const idEl = $('#sTaskId');
    const titleEl = $('#sTaskTitle');
    if (idEl) idEl.value = taskId;
    if (titleEl) titleEl.textContent = t.id + ' · ' + t.title;

    const last = state.submissions.slice().reverse().find((s) => s.taskId === taskId);

    resetSubmitForm();

    if (last) {
      const u = $('#sUsername');
      const l = $('#sLink');
      const v = $('#sViews');
      const n = $('#sNote');
      if (u && last.username) u.value = last.username.replace(/^@/, '');
      if (l && last.link) l.value = last.link;
      if (v && last.views) v.value = last.views;
      if (n && last.note) n.value = last.note;
    }

    closeAllSheets();
    openSheet('sheetSubmit');
  }

  function validateSubmit() {
    let valid = true;
    const usernameEl = $('#sUsername');
    const linkEl = $('#sLink');
    const viewsEl = $('#sViews');
    const agreeEl = $('#sAgree');
    if (!usernameEl || !linkEl || !viewsEl || !agreeEl) return false;

    const username = usernameEl.value.trim().replace(/^@/, '');
    const link = linkEl.value.trim();
    const viewsRaw = viewsEl.value.trim();
    const agreed = agreeEl.checked;

    if (!isValidUsername(username)) {
      usernameEl.classList.add('err');
      $('#eUsername').classList.add('show');
      valid = false;
    } else {
      usernameEl.classList.remove('err');
      $('#eUsername').classList.remove('show');
    }

    if (!isValidTikTokURL(link)) {
      linkEl.classList.add('err');
      $('#eLink').classList.add('show');
      valid = false;
    } else {
      linkEl.classList.remove('err');
      $('#eLink').classList.remove('show');
    }

    const viewsNum = Number(viewsRaw);
    if (viewsRaw === '' || isNaN(viewsNum) || viewsNum < 0) {
      viewsEl.classList.add('err');
      $('#eViews').classList.add('show');
      valid = false;
    } else {
      viewsEl.classList.remove('err');
      $('#eViews').classList.remove('show');
    }

    if (!agreed) {
      $('#eAgree').classList.add('show');
      valid = false;
    } else {
      $('#eAgree').classList.remove('show');
    }
    return valid;
  }

  function submitProof() {
    if (!validateSubmit()) {
      toast('Periksa kembali', 'Masih ada isian yang belum sesuai.', 'err');
      return;
    }

    const taskIdEl = $('#sTaskId');
    if (!taskIdEl) return;
    const taskId = taskIdEl.value;
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;

    const username = $('#sUsername').value.trim().replace(/^@/, '');
    const link = $('#sLink').value.trim();
    const views = Number($('#sViews').value.trim()) || 0;
    const note = $('#sNote').value.trim();

    let sub = state.submissions.find(
      (s) => s.taskId === taskId && (s.status === STATUS.TAKEN || s.status === STATUS.REJECTED)
    );

    if (!sub) {
      if (t.status === STATUS.AVAILABLE) {
        t.taken = Math.min(t.slots, t.taken + 1);
      }
      sub = {
        id: uid(),
        taskId: t.id,
        taskTitle: t.title,
        reward: t.reward,
        link: '', username: '', views: 0, note: '',
        status: STATUS.TAKEN,
        submittedAt: nowISO(),
        reviewedAt: null,
        rejectReason: ''
      };
      state.submissions.push(sub);
    }

    sub.username = username;
    sub.link = link;
    sub.views = views;
    sub.note = note;
    sub.status = STATUS.REVIEW;
    sub.submittedAt = nowISO();
    sub.reviewedAt = null;
    sub.rejectReason = '';

    t.status = STATUS.REVIEW;

    saveState();
    renderPage();
    closeAllSheets();
    toast('Pengajuan terkirim', 'Video kamu sedang menunggu verifikasi.', 'ok');

    scheduleDemoReview(sub.id);

    // Redirect ke riwayat setelah submit
    setTimeout(() => {
      if (document.body.getAttribute('data-page') !== 'riwayat') {
        window.location.href = 'riwayat.html';
      }
    }, 700);
  }

  /* ----------------------------------------------------------
     20. SIMULASI REVIEW (DEMO)
     ---------------------------------------------------------- */
  function scheduleDemoReview(subId) {
    const delay = 9000 + Math.floor(Math.random() * 6000);
    setTimeout(() => {
      const sub = state.submissions.find((s) => s.id === subId);
      if (!sub || sub.status !== STATUS.REVIEW) return;

      const t = state.tasks.find((x) => x.id === sub.taskId);
      const accept = Math.random() < 0.75;

      if (accept) {
        sub.status = STATUS.DONE;
        sub.reviewedAt = nowISO();
        if (t) t.status = STATUS.DONE;
        saveState();
        renderPage();
        toast('Pengajuan diterima', rupiah(sub.reward) + ' masuk ke saldo dompet kamu.', 'ok');
      } else {
        const reasons = [
          'Tautan video tidak dapat dibuka saat peninjauan.',
          'Durasi video tidak sesuai ketentuan tugas.',
          'Tautan website tidak ditemukan pada deskripsi video.',
          'Akun TikTok terdeteksi private saat verifikasi.',
          'Video terindikasi hasil repost dari akun lain.'
        ];
        sub.status = STATUS.REJECTED;
        sub.reviewedAt = nowISO();
        sub.rejectReason = reasons[Math.floor(Math.random() * reasons.length)];
        if (t) t.status = STATUS.REJECTED;
        saveState();
        renderPage();
        toast('Pengajuan ditolak', sub.rejectReason, 'err');
      }
    }, delay);
  }

  /* ----------------------------------------------------------
     21. WITHDRAW
     ---------------------------------------------------------- */
  function resetWithdrawForm() {
    ['#wAmount', '#wMethod', '#wAccount', '#wName'].forEach((sel) => {
      const el = $(sel);
      if (el) {
        el.value = '';
        el.classList.remove('err');
      }
    });
    ['#eAmount', '#eMethod', '#eAccount', '#eName'].forEach((sel) => {
      const el = $(sel);
      if (el) el.classList.remove('show');
    });
  }

  function openWithdraw() {
    recalcTotals();
    if (state.balance < MIN_WITHDRAW) {
      toast('Saldo belum cukup',
        'Minimal penarikan ' + rupiah(MIN_WITHDRAW) +
        '. Saldo kamu ' + rupiah(state.balance) + '.', 'err');
      return;
    }
    resetWithdrawForm();
    const wb = $('#wBalance');
    if (wb) wb.textContent = rupiah(state.balance);
    openSheet('sheetWithdraw');
  }

  function validateWithdraw() {
    let valid = true;
    const amountEl = $('#wAmount');
    const methodEl = $('#wMethod');
    const accountEl = $('#wAccount');
    const nameEl = $('#wName');
    if (!amountEl || !methodEl || !accountEl || !nameEl) return false;

    const amount = Number(amountEl.value.trim());
    const method = methodEl.value;
    const account = accountEl.value.trim();
    const name = nameEl.value.trim();

    if (!amount || amount < MIN_WITHDRAW || amount > state.balance) {
      amountEl.classList.add('err');
      $('#eAmount').classList.add('show');
      valid = false;
    } else {
      amountEl.classList.remove('err');
      $('#eAmount').classList.remove('show');
    }

    if (!method) {
      methodEl.classList.add('err');
      $('#eMethod').classList.add('show');
      valid = false;
    } else {
      methodEl.classList.remove('err');
      $('#eMethod').classList.remove('show');
    }

    if (!account || account.replace(/\D/g, '').length < 6) {
      accountEl.classList.add('err');
      $('#eAccount').classList.add('show');
      valid = false;
    } else {
      accountEl.classList.remove('err');
      $('#eAccount').classList.remove('show');
    }

    if (!name || name.length < 3) {
      nameEl.classList.add('err');
      $('#eName').classList.add('show');
      valid = false;
    } else {
      nameEl.classList.remove('err');
      $('#eName').classList.remove('show');
    }
    return valid;
  }

  function doWithdraw() {
    if (!validateWithdraw()) {
      toast('Periksa kembali', 'Data penarikan belum lengkap atau tidak valid.', 'err');
      return;
    }

    const amount = Number($('#wAmount').value.trim());
    const method = $('#wMethod').value;
    const account = $('#wAccount').value.trim();
    const name = $('#wName').value.trim();

    state.withdraws.push({
      id: 'WD-' + Date.now().toString(36).toUpperCase(),
      amount, method, account, name,
      status: 'pending',
      createdAt: nowISO()
    });

    saveState();
    renderPage();
    closeAllSheets();
    toast('Penarikan diajukan',
      rupiah(amount) + ' akan diproses dalam 1×24 jam kerja.', 'ok');
  }

  /* ----------------------------------------------------------
     22. RESET DATA
     ---------------------------------------------------------- */
  function resetData() {
    const ok = window.confirm(
      'Hapus seluruh data lokal? Semua riwayat tugas, pengajuan, dan saldo akan direset ke kondisi awal.'
    );
    if (!ok) return;

    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}

    state.tasks = buildInitialTasks();
    state.submissions = [];
    state.balance = 0;
    state.pending = 0;
    state.total = 0;
    state.withdraws = [];
    saveState();
    renderPage();
    toast('Data direset', 'Seluruh data lokal berhasil dikembalikan.', 'info');
  }

  /* ----------------------------------------------------------
     23. FAQ
     ---------------------------------------------------------- */
  function initFAQ() {
    $$('.faq-item').forEach((item) => {
      const btn = $('.faq-q', item);
      const ans = $('.faq-a', item);
      if (!btn || !ans) return;
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        $$('.faq-item').forEach((other) => {
          other.classList.remove('open');
          const a = $('.faq-a', other);
          if (a) a.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
        }
      });
    });
  }

  /* ----------------------------------------------------------
     24. SWIPE SHEET CLOSE
     ---------------------------------------------------------- */
  function initSheetSwipe() {
    $$('.sheet').forEach((sheet) => {
      let startY = 0, currentY = 0, dragging = false;
      const handle = sheet.querySelector('.sheet-handle');
      if (!handle) return;

      const onStart = (y) => {
        startY = y; currentY = y; dragging = true;
        sheet.style.transition = 'none';
      };
      const onMove = (y) => {
        if (!dragging) return;
        currentY = y;
        const delta = Math.max(0, currentY - startY);
        sheet.style.transform = 'translateY(' + delta + 'px)';
      };
      const onEnd = () => {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        sheet.style.transform = '';
        const delta = currentY - startY;
        if (delta > 90) {
          const ov = sheet.closest('.overlay');
          if (ov) closeSheet(ov.id);
        }
      };

      handle.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
      handle.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY), { passive: true });
      handle.addEventListener('touchend', onEnd);

      handle.addEventListener('mousedown', (e) => onStart(e.clientY));
      document.addEventListener('mousemove', (e) => { if (dragging) onMove(e.clientY); });
      document.addEventListener('mouseup', () => { if (dragging) onEnd(); });
    });
  }

  /* ----------------------------------------------------------
     25. EVENTS
     ---------------------------------------------------------- */
  function initEvents() {
    // Delegasi aksi global
    document.addEventListener('click', (e) => {
      // close button
      const closer = e.target.closest('[data-close]');
      if (closer) {
        const overlay = closer.closest('.overlay');
        if (overlay) closeSheet(overlay.id);
        return;
      }

      // action button
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        const action = actionEl.getAttribute('data-action');
        const id = actionEl.getAttribute('data-id');
        const subId = actionEl.getAttribute('data-sub');

        if (action === 'take') takeTask(id);
        else if (action === 'detail') openDetail(id);
        else if (action === 'submit') openSubmit(id);
        else if (action === 'resubmit') {
          const sub = state.submissions.find((s) => s.id === subId);
          if (sub) openSubmit(sub.taskId);
        }
        return;
      }

      // klik overlay di luar sheet
      if (e.target.classList && e.target.classList.contains('overlay')) {
        closeSheet(e.target.id);
      }
    });

    // ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllSheets();
    });

    // Filter tabs (task page)
    $$('#tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('#tabs .tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        ui.filter = tab.getAttribute('data-filter');
        renderTask();
      });
    });

    // Search (task page)
    const searchInput = $('#searchTask');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        ui.query = searchInput.value;
        renderTask();
      }, 180));
    }

    // Submit proof
    const submitBtn = $('#btnSubmitProof');
    if (submitBtn) submitBtn.addEventListener('click', submitProof);

    const formSubmit = $('#formSubmit');
    if (formSubmit) {
      formSubmit.addEventListener('submit', (e) => {
        e.preventDefault();
        submitProof();
      });
    }

    // Clear errors on input
    ['#sUsername', '#sLink', '#sViews'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('input', () => el.classList.remove('err'));
    });

    const agreeEl = $('#sAgree');
    if (agreeEl) {
      agreeEl.addEventListener('change', () => {
        if (agreeEl.checked) {
          const eAgree = $('#eAgree');
          if (eAgree) eAgree.classList.remove('show');
        }
      });
    }

    // Withdraw
    const wBtn = $('#btnWithdraw');
    if (wBtn) wBtn.addEventListener('click', openWithdraw);

    const wDoBtn = $('#btnDoWithdraw');
    if (wDoBtn) wDoBtn.addEventListener('click', doWithdraw);

    ['#wAmount', '#wMethod', '#wAccount', '#wName'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      const evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => el.classList.remove('err'));
    });

    // Reset data
    const rBtn = $('#btnResetData');
    if (rBtn) rBtn.addEventListener('click', resetData);

    // Refresh history
    const rHistBtn = $('#btnRefreshHist');
    if (rHistBtn) {
      rHistBtn.addEventListener('click', () => {
        renderRiwayat();
        toast('Riwayat dimuat ulang', 'Data terbaru berhasil ditampilkan.', 'info');
      });
    }

    // Sheet swipe
    initSheetSwipe();
  }

  /* ----------------------------------------------------------
     26. INIT
     ---------------------------------------------------------- */
  function init() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    loadState();
    renderPage();
    initFAQ();
    initEvents();

    // Auto refresh ringkasan tiap 30 detik
    setInterval(() => {
      const reviewCount = state.submissions.filter((s) => s.status === STATUS.REVIEW).length;
      if (reviewCount > 0) {
        recalcTotals();
        renderPage();
      }
    }, 30000);

    console.log('%cReward Center', 'color:#FFF8DD;font-weight:800;font-size:14px');
    console.log('%cMulti-page build + video wallpaper aktif.', 'color:rgba(255,248,221,.55);font-size:12px');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();