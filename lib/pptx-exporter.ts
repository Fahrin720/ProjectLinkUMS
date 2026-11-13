// Pure TypeScript OpenXML (.pptx) Widescreen 16:9 Generator & EIS'26 Pitch Deck Data
// Zero Node.js dependencies — runs 100% in the browser and produces a genuine, editable PowerPoint (.pptx) file.

export interface PitchSlideMetric {
  value: string;
  label: string;
  sublabel: string;
}

export interface PitchSlideSection {
  heading: string;
  bullets: string[];
}

export interface PitchSlideItem {
  id: string;
  indexNumber: string;
  chapterKicker: string;
  timeWindow: string; // Paced for strict EIS'26 5-Minute Presentation
  bellAlert?: 'none' | 'one-bell-warning' | 'two-bell-stop';
  themeMode: 'dark-hero' | 'light-editorial';
  title: string;
  subtitle: string;
  metrics: PitchSlideMetric[];
  leftColumn: PitchSlideSection;
  rightColumn: PitchSlideSection;
  bottomTakeaway: string;
  speakerScript: string;
}

export interface Eis26GuidelineRule {
  number: string;
  title: string;
  summary: string;
  details: string[];
  critical?: boolean;
}

export interface JuryQaItem {
  id: string;
  category: string;
  question: string;
  answerPoint: string;
  evidenceMetric: string;
}

export const EIS26_OFFICIAL_INFO = {
  eventTitle: 'EIS’26 – Online Presentation & Judging Session',
  organizer: 'Career and Entrepreneurship Development Centre (CEDeC)',
  university: 'Universiti Malaysia Sabah (UMS)',
  tagline: 'Show your innovation. Demonstrate its value. Make an impact!',
  scheduleUrl: 'https://tinyurl.com/eispitchingschedule',
  totalMinutes: 15,
  presentationMinutes: 5,
  qaMinutes: 10,
  firstBellMinute: 4, // 4:00 elapsed (1 min remaining)
  secondBellMinute: 5, // 5:00 elapsed (MUST STOP immediately)
};

export const EIS26_GUIDELINE_RULES: Eis26GuidelineRule[] = [
  {
    number: '01',
    title: 'Jadual Pitching & Pautan Sesi Selari',
    summary: 'Semak masa pembentangan & pautan bilik sesi selari rasmi.',
    details: [
      'Pautan rasmi: https://tinyurl.com/eispitchingschedule',
      'Pastikan semua ahli kumpulan menyimpan pautan bilik dan masa giliran masing-masing.',
    ],
  },
  {
    number: '02',
    title: 'Format Pembentangan 15 Minit',
    summary: '5 Minit Pembentangan + 10 Minit Soal Jawab (Q&A) Juri.',
    details: [
      '5 Minit Pertama: Pembentangan inovasi secara padat, bernas & berimpak.',
      '10 Minit Kedua: Sesi soal jawab (Q&A) bersama panel juri.',
    ],
    critical: true,
  },
  {
    number: '03',
    title: 'Isyarat Loceng Masa (Time Signals)',
    summary: 'Minit ke-4 (1 Loceng) & Minit ke-5 (2 Loceng — Wajib Berhenti).',
    details: [
      'Minit ke-4 (04:00): 1 Deringan Loceng — Baki 1 minit lagi untuk menggulung hujah.',
      'Minit ke-5 (05:00): 2 Deringan Loceng — Masa pembentangan TAMAT. Peserta WAJIB berhenti membentang serta-merta.',
    ],
    critical: true,
  },
  {
    number: '04',
    title: 'Keperluan Sesi Dalam Talian',
    summary: 'Masuk 10 minit awal, guna latar maya EIS’26, kamera ON semasa bentang.',
    details: [
      'Sertai bilik sesi selari sekurang-kurangnya 10 minit sebelum slot dijadualkan.',
      'Wajib gunakan Latar Belakang Maya Rasmi EIS’26 (Official EIS’26 Digital Backdrop) sepanjang pembentangan & Q&A.',
      'Pastikan mikrofon dimatikan (Mute) sebaik sahaja memasuki bilik mesyuarat.',
      'Hidupkan kamera (Camera ON) semasa membentang dan sepanjang sesi Q&A.',
      'Sedia berkongsi Slide Pembentangan (PowerPoint/Canva/Web) ATAU Poster Digital A1.',
    ],
    critical: true,
  },
  {
    number: '05',
    title: 'Kehadiran Awal & Pemerhatian',
    summary: 'Boleh masuk awal untuk memerhati dengan mikrofon & kamera dimatikan.',
    details: [
      'Peserta dialu-alukan masuk lebih awal untuk memerhati pembentangan kumpulan lain.',
      'Pastikan mikrofon (Mute) dan kamera (Off) sentiasa dimatikan semasa memerhati kecuali diarahkan.',
    ],
  },
  {
    number: '06',
    title: 'Kehadiran & Etika Profesional',
    summary: 'Patuhi arahan moderator dan jangan keluar bilik tanpa kebenaran.',
    details: [
      'Hadir tepat mengikut slot masa yang ditetapkan (ketidakhadiran tanpa sebab sah boleh menyebabkan penyertaan terbatal).',
      'Kekalkan etika profesional serta patuhi arahan moderator dan pasukan teknikal.',
      'Jangan keluar daripada bilik mesyuarat sehingga dibenarkan oleh moderator atau pasukan teknikal.',
    ],
  },
];

export const EIS26_JURY_QA_BANK: JuryQaItem[] = [
  {
    id: 'qa-1',
    category: 'Unik & Kelebihan Daya Saing',
    question:
      'Apakah perbezaan utama ProjectLink UMS berbanding hebahan di grup WhatsApp, Telegram, atau laman sosial biasa?',
    answerPoint:
      'Grup WhatsApp bersifat tidak berstruktur—poster tenggelam dalam ratusan mesej dan tiada saringan kemahiran atau masa. ProjectLink UMS menggunakan Enjin Padanan Boleh Jelas (40% Kemahiran, 25% Minat, 20% Jadual Mingguan, 15% Matlamat) supaya pelajar terus melihat peratus keserasian sebenar sebelum menghubungi penganjur.',
    evidenceMetric: '40 / 25 / 20 / 15 Explainable Heuristic Engine',
  },
  {
    id: 'qa-2',
    category: 'Keselamatan & Tadbir Urus Kandungan',
    question:
      'Bagaimanakah anda mengelakkan pelajar memasukkan tag atau kata kunci yang tidak sopan / tidak sesuai?',
    answerPoint:
      'Kami menghapuskan semua input teks bebas bagi kemahiran, minat, dan penapis. Sebaliknya, sistem menggunakan Taksonomi Rasmi UMS yang telah ditetapkan (33 Kemahiran dalam 8 bidang, 24 Minat dalam 5 kluster, dan 17 Tag Penapis Rasmi) merangkumi kesemua 10 fakulti UMS.',
    evidenceMetric: '100% Taksonomi Terkawal · 0 Input Tag Bebas',
  },
  {
    id: 'qa-3',
    category: 'Kebolehlaksanaan & Penggunaan Sebenar',
    question:
      'Bagaimanakah jika seorang pelajar atau wakil kelab ingin menyiarkan aktiviti di luar bidang fakultinya sendiri (contohnya diminta oleh pensyarah)?',
    answerPoint:
      'Borang Post Aktiviti direka fleksibel: bahagian Syarat Kemahiran (03) dijadikan pilihan (optional dropdown), dan kami tidak mengehadkan hebahan kepada fakulti pencipta sahaja. Malah, penganjur terus menyertakan nombor WhatsApp rasmi untuk tindakan pantas satu klik.',
    evidenceMetric: 'Syarat Kemahiran Pilihan · Integrasi Terus WhatsApp',
  },
  {
    id: 'qa-4',
    category: 'Nilai Tambah Pelajar & Universiti (SDP)',
    question:
      'Bagaimanakah aplikasi ini menyokong pembangunan holistik pelajar dan rekod kokurikulum UMS?',
    answerPoint:
      'Melalui modul khusus History & Rekod SDP di navigasi sisi, pelajar dapat menjejak sejarah penyertaan mereka (sama ada sebagai Kepimpinan/AJK atau Peserta) berserta jumlah mata MySDP terkumpul sebagai rujukan portfolio kerjaya CEDeC dan JHEP.',
    evidenceMetric: 'Penjejakan Portfolio & Mata SDP Bersepadu',
  },
  {
    id: 'qa-5',
    category: 'Model Kelestarian & Peluang Komersial (CEDeC)',
    question:
      'Apakah potensi pengembangan dan kelestarian inovasi ini untuk ekosistem keusahawanan serta kerjaya kampus?',
    answerPoint:
      'Selain menghubungkan projek akademik dan pertandingan inovasi seperti EIS’26, platform ini boleh disesuaikan oleh CEDeC, JHEP, dan rakan industri Sabah untuk memadankan bakat pelajar UMS dengan projek inkubator pemula (startup), latihan amali mikro, dan geran komuniti.',
    evidenceMetric: 'Skalabiliti 10 Fakulti UMS & Rakan Industri Sabah',
  },
];

// 10-Slide Narrative Paced Strictly for EIS'26 5-Minute Presentation (30s per slide = 300s total)
export const PITCH_DECK_SLIDES: PitchSlideItem[] = [
  {
    id: 'slide-01',
    indexNumber: '01',
    chapterKicker: 'EIS’26 CEDeC UMS · PEMBENTANGAN INOVASI DIGITAL',
    timeWindow: '0:00 – 0:30 (30s)',
    bellAlert: 'none',
    themeMode: 'dark-hero',
    title: 'ProjectLink UMS: Ekosistem Penemuan Aktiviti & Padanan Bakat Rentas Fakulti',
    subtitle:
      'Menghubungkan pelajar, kemahiran, jadual mingguan, dan rekod mata SDP merentasi 10 fakulti Universiti Malaysia Sabah (UMS) secara pintar dan selamat.',
    metrics: [
      {
        value: '10 Fakulti',
        label: 'Liputan Penuh UMS',
        sublabel: 'FKI, FKJ, FPEP, FSSA, FPSK, FSSK, FPP, FSMP, FPL & FKAL',
      },
      {
        value: '40/25/20/15',
        label: 'Enjin Padanan Telus',
        sublabel: 'Kemahiran · Minat · Jadual · Matlamat',
      },
      {
        value: '100% Selamat',
        label: 'Taksonomi Terkawal',
        sublabel: '33 Kemahiran & 24 Minat Rasmi Tanpa Input Bebas',
      },
    ],
    leftColumn: {
      heading: 'Identiti Pasukan & Inovasi',
      bullets: [
        'Inovasi: ProjectLink UMS (Web & Mobile-First Progressive Platform)',
        'Ketua Pembentang & Pentadbir Sistem: Fahrin Muneer (FKI, UMS)',
        'Anjuran Pertandingan: EIS’26 — Career and Entrepreneurship Development Centre (CEDeC), UMS',
      ],
    },
    rightColumn: {
      heading: 'Misi Utama Inovasi',
      bullets: [
        'Memecahkan silo antara fakulti supaya pelajar kejuruteraan, perniagaan, sains marin, perubatan, dan IT dapat membentuk pasukan berimpak tinggi.',
        'Memudahkan hebahan aktiviti kampus, pertandingan inovasi, dan projek komuniti dalam satu hab berpusat.',
      ],
    },
    bottomTakeaway:
      'Show your innovation. Demonstrate its value. Make an impact! — EIS’26 CEDeC UMS',
    speakerScript:
      'Salam sejahtera barisan panel juri EIS’26. Kami membentangkan ProjectLink UMS—sebuah platform penemuan aktiviti dan padanan pasukan rentas fakulti yang dibangunkan khusus untuk menghubungkan bakat pelajar merentasi kesemua 10 fakulti di Universiti Malaysia Sabah.',
  },
  {
    id: 'slide-02',
    indexNumber: '02',
    chapterKicker: 'BAB 02 · PERNYATAAN MASALAH KAMPUS',
    timeWindow: '0:30 – 1:00 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Mengapa Banyak Aktiviti & Pasukan Inovasi Kampus Gagal Mencapai Sasaran?',
    subtitle:
      'Hebahan yang berselerak dan ketiadaan sistem padanan kemahiran menyebabkan pelajar terlepas peluang emas di kampus.',
    metrics: [
      {
        value: 'Silo Fakulti',
        label: 'Kurang Kolaborasi',
        sublabel: 'Pelajar sukar mencari rakan luar fakulti (cth. FKI + FPEP)',
      },
      {
        value: 'Poster Tenggelam',
        label: 'Grup WhatsApp Padat',
        sublabel: 'Maklumat aktiviti hilang tanpa saringan tarikh atau bidang',
      },
      {
        value: 'Konflik Masa',
        label: 'Pertindihan Jadual',
        sublabel: 'Sukar menyemak keserasian waktu mesyuarat mingguan',
      },
    ],
    leftColumn: {
      heading: 'Cabaran Pelajar & Peserta',
      bullets: [
        'Sukar mengetahui aktiviti atau pertandingan yang benar-benar sepadan dengan kemahiran dan minat sendiri.',
        'Bimbang menyertai projek kerana tidak pasti komitmen jam mingguan dan waktu perjumpaan.',
        'Tiada arkib berpusat untuk menjejak sejarah penglibatan dan mata SDP yang telah dikumpul.',
      ],
    },
    rightColumn: {
      heading: 'Cabaran Penganjur, Kelab & Pensyarah',
      bullets: [
        'Hebahan program hanya berlegar dalam kalangan rakan sekelas atau satu fakulti sahaja.',
        'Input tag bebas pada borang biasa terdedah kepada perkataan tidak sesuai atau ejaan tidak seragam.',
        'Proses menyaring ahli pasukan mengambil masa lama tanpa indikator keserasian yang objektif.',
      ],
    },
    bottomTakeaway:
      'Masalah Utama: Ketiadaan platform khusus UMS yang menggabungkan penemuan visual, saringan kemahiran rasmi, dan padanan jadual.',
    speakerScript:
      'Di kampus UMS, kita menghadapi tiga masalah utama: pertama, poster aktiviti cepat tenggelam di dalam grup WhatsApp; kedua, wujud jurang silo antara fakulti apabila pelajar teknikal memerlukan rakan perniagaan atau sains; dan ketiga, tiada saringan keserasian jadual serta kawalan tag yang selamat.',
  },
  {
    id: 'slide-03',
    indexNumber: '03',
    chapterKicker: 'BAB 03 · SOLUSI BERSEPADU PROJECTLINK UMS',
    timeWindow: '1:00 – 1:30 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Solusi Satu Hab: Penemuan Kad Interaktif, Hebahan Terbuka & Tindakan Pantas',
    subtitle:
      'Mengubah cara pelajar UMS meneroka, menyimpan, menyiarkan, dan menyertai aktiviti kampus dalam beberapa saat.',
    metrics: [
      {
        value: 'Swipe & Simpan',
        label: 'Kad Interaktif Home',
        sublabel: 'Swipe kanan untuk simpan & lihat lembaran penuh',
      },
      {
        value: '1-Klik WhatsApp',
        label: 'Hubungi Penganjur',
        sublabel: 'Mesej automatik lengkap nama, matrik & fakulti',
      },
      {
        value: 'Rekod MySDP',
        label: 'Arkib History Sisi',
        sublabel: 'Jejak penyertaan lalu & jumlah mata SDP terkumpul',
      },
    ],
    leftColumn: {
      heading: 'Ciri Utama Untuk Pelajar UMS',
      bullets: [
        'Dek Kad Pintar (Home): Memaparkan aktiviti teratas mengikut skor Matches Potential secara masa nyata.',
        'Halaman Carian Multi-Lapisan: Tapis mengikut 10 fakulti UMS, cip kemahiran rasmi, dan topik minat.',
        'Saved Activities & History: Lembaran editorial bersih untuk menyemak aktiviti tersimpan dan rekod SDP.',
      ],
    },
    rightColumn: {
      heading: 'Ciri Utama Untuk Penganjur & Wakil Pensyarah',
      bullets: [
        'Borang Post Aktiviti Kompak (01–05): Muat naik poster terus dari peranti berserta katalog gambar.',
        'Sokongan Hebahan Rentas Bidang: Syarat kemahiran dijadikan pilihan (optional) supaya sesiapa sahaja boleh membantu hebahan pensyarah/kelab.',
        'Tiada Skor Kendiri Yang Mengelirukan: Fokus 100% kepada ketepatan maklumat logistik, kuota, dan WhatsApp penganjur.',
      ],
    },
    bottomTakeaway:
      'Daripada penemuan poster sehingga mesej WhatsApp kepada penganjur hanya mengambil masa kurang 15 saat.',
    speakerScript:
      'Sebagai solusi, ProjectLink UMS memperkenalkan pengalaman kad interaktif: pelajar boleh swipe untuk menyimpan aktiviti, menapis mengikut 10 fakulti UMS, menyiarkan hebahan kelab atau pensyarah dengan pantas, dan terus menghubungi penganjur melalui pautan WhatsApp automatik.',
  },
  {
    id: 'slide-04',
    indexNumber: '04',
    chapterKicker: 'BAB 04 · INOVASI TERAS & ALGORITMA PADANAN',
    timeWindow: '1:30 – 2:00 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Enjin Padanan Heuristik Boleh Jelas (40% · 25% · 20% · 15%)',
    subtitle:
      'Setiap peratusan Matches Potential dikira secara telus dan boleh dijelaskan kepada pelajar serta penganjur.',
    metrics: [
      {
        value: '40%',
        label: 'Syarat Kemahiran',
        sublabel: 'Pemberat tahap Beginner (0.78), Intermediate (0.90), Advanced (1.0)',
      },
      {
        value: '25%',
        label: 'Bidang Minat (Tags)',
        sublabel: 'Padanan kluster minat pelajar dengan fokus aktiviti',
      },
      {
        value: '20% + 15%',
        label: 'Jadual & Matlamat',
        sublabel: '20% Pertindihan masa mingguan + 15% Kategori & Penapis',
      },
    ],
    leftColumn: {
      heading: 'Bagaimana Skor Dikira Secara Objektif?',
      bullets: [
        '40% Kemahiran (Skills): Membandingkan student_skills dengan project_required_skills serta tahap kepentingan (1/5 hingga 5/5).',
        '25% Minat (Interests): Mengukur pertindihan topik minat rasmi antara profil pelajar dan aktiviti.',
        'Jika aktiviti tiada syarat kemahiran khusus (terbuka), enjin memberikan skor asas mesra pemula secara adil.',
      ],
    },
    rightColumn: {
      heading: 'Kiraan Pertindihan Jadual & Penapis Aktif',
      bullets: [
        '20% Jadual Mingguan: Algoritma mengira minit pertindihan sebenar (Isnin–Ahad) antara waktu lapang pelajar dan slot mesyuarat projek.',
        '15% Matlamat & Penapis: Mengambil kira jenis projek pilihan (Competition, Innovation, Community, Assignment) dan tag penapis Home.',
        'Hasilnya: Pelajar melihat ringkasan jelas seperti "Sepadan 3/4 kemahiran · Jadual: Wed 14:30–17:00".',
      ],
    },
    bottomTakeaway:
      'Bukan sekadar nombor rawak — setiap skor mempunyai pecahan bukti kemahiran, minat, dan jadual yang boleh disemak.',
    speakerScript:
      'Inovasi teras kami ialah Enjin Padanan Heuristik 40-25-20-15. Empat puluh peratus menilai kemahiran mengikut tahap penguasaan, dua puluh lima peratus menilai persamaan minat, dua puluh peratus mengira pertindihan jam jadual mingguan secara matematik, dan lima belas peratus menilai keserasian matlamat.',
  },
  {
    id: 'slide-05',
    indexNumber: '05',
    chapterKicker: 'BAB 05 · KESELAMATAN KANDUNGAN & PIAWAIAN KAMPUS',
    timeWindow: '2:00 – 2:30 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Taksonomi Rasmi UMS: 100% Terkawal Tanpa Input Perkataan Tidak Sesuai',
    subtitle:
      'Menghapuskan risiko tag bebas yang tidak sopan melalui pangkalan katalog rasmi yang merangkumi semua bidang teras UMS.',
    metrics: [
      {
        value: '33 Kemahiran',
        label: '8 Kategori Teras',
        sublabel: 'Merangkumi teknologi, kejuruteraan, marin, perniagaan & kesihatan',
      },
      {
        value: '24 Minat',
        label: '5 Kluster Utama',
        sublabel: 'Inovasi, Kelestarian Marin, Keusahawanan, CSR & Warisan Borneo',
      },
      {
        value: '17 Penapis',
        label: '25 Tag Sorotan Kad',
        sublabel: 'Seragam untuk mod Susun Skor & Tapis Ketat',
      },
    ],
    leftColumn: {
      heading: '8 Bidang Kemahiran Rasmi Merentasi 10 Fakulti',
      bullets: [
        'Tech & AI (FKI) · Engineering & IoT (FKJ)',
        'Science, Marine & Agro (FSSA / FPL) · Business & Finance (FPEP / FKAL)',
        'Health, Food & Psychology (FPSK / FSMP / FPP) · Creative, Media & Arts (FSSK)',
        'Leadership & Operations (JHEP / Kelab) · Academic & Research',
      ],
    },
    rightColumn: {
      heading: 'Mengapa Pendekatan Ini Lebih Selamat & Pintar?',
      bullets: [
        'Sifar Risiko Kata Kesat / Spam: Tiada lagi kotak input teks bebas untuk kemahiran, minat, atau tag kad.',
        'Padanan 100% Tepat: Tiada isu kesilapan ejaan kerana penganjur dan pelajar memilih daripada ID katalog yang sama.',
        'Mesra Pengguna: Dilengkapi bar carian pantas dan penapis kategori di dalam senarai rasmi.',
      ],
    },
    bottomTakeaway:
      'Katalog pra-tetap memastikan ekosistem kampus kekal profesional, beretika, dan tepat dari segi padanan data.',
    speakerScript:
      'Bagi menjamin keselamatan kandungan kampus, kami menghapuskan semua input tag bebas yang berisiko disalahgunakan. Sebaliknya, kami membina Taksonomi Rasmi UMS yang merangkumi 33 kemahiran dalam 8 bidang, 24 topik minat, dan 17 penapis rasmi merentasi kesemua 10 fakulti UMS.',
  },
  {
    id: 'slide-06',
    indexNumber: '06',
    chapterKicker: 'BAB 06 · REKA BENTUK ANTARA MUKA & ALIRAN PENGGUNA',
    timeWindow: '2:30 – 3:00 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Reka Bentuk Mudah Alih Ergonomik & Lembaran Editorial Tanpa Serabut',
    subtitle:
      'Direka khusus untuk skrin telefon pintar pelajar dengan kepadatan maklumat optimum dan navigasi pantas.',
    metrics: [
      {
        value: '01 – 05',
        label: 'Borang Kompak Berbentuk',
        sublabel: 'Seksyen boleh lipat dengan Syarat Kemahiran pilihan',
      },
      {
        value: '2 Mod Tapis',
        label: 'Susun Skor vs Tapis Ketat',
        sublabel: 'Tukar mod saringan di skrin Home secara serta-merta',
      },
      {
        value: 'Editorial Sheet',
        label: 'Saved & History Bersih',
        sublabel: 'Aliran majalah berterusan tanpa kotak berlapis yang sempit',
      },
    ],
    leftColumn: {
      heading: '4 Aliran Utama Di Dalam Aplikasi',
      bullets: [
        '1. Penemuan (Home Deck): Semak kad aktiviti, leret kiri/kanan, dan uji penapis rasmi atau butang Randomize.',
        '2. Carian Pintar (Search Hub): Tapis serentak mengikut kod fakulti (FKI–FKAL), kemahiran, dan minat.',
        '3. Siaran Pantas (Post Activity): Muat naik poster, pilih 3 tag sorotan rasmi, dan terbitkan terus ke feed.',
        '4. Rekod Sisi (History & SDP): Akses eksklusif melalui menu sisi untuk rekod penyertaan dan mata SDP.',
      ],
    },
    rightColumn: {
      heading: 'Prinsip Ergonomik Telefon Pintar',
      bullets: [
        'Saiz teks dan ruang dioptimumkan untuk skrin mudah alih supaya tiada ruang terbuang.',
        'Navigasi bawah terapung (Floating Nav Pill) yang kemas tanpa memotong kandungan halaman.',
        'Pralihat kad langsung semasa mengisi borang aktiviti beserta zum lightbox untuk katalog poster.',
      ],
    },
    bottomTakeaway:
      'Setiap skrin direka untuk kelajuan tindakan pelajar: jelas, padat, dan bebas daripada elemen hiasan yang mengganggu.',
    speakerScript:
      'Dari sudut pengalaman pengguna, antara muka ProjectLink UMS memaksimumkan ruang skrin telefon pintar. Borang Post Aktiviti disusun dalam lima bahagian bernombor yang kompak, manakala halaman Saved Activities dan History menggunakan reka bentuk lembaran editorial yang bersih.',
  },
  {
    id: 'slide-07',
    indexNumber: '07',
    chapterKicker: 'BAB 07 · BUKTI KONSEP & SIMULASI DATA RENTAS FAKULTI',
    timeWindow: '3:00 – 3:30 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: '6 Aktiviti Contoh Rentas Fakulti Sedia Diuji Secara Langsung',
    subtitle:
      'Pangkalan data contoh merangkumi kesemua kluster fakulti UMS untuk membuktikan ketepatan penapisan dan padanan.',
    metrics: [
      {
        value: '6 Projek UMS',
        label: 'Data Rentas Fakulti',
        sublabel: 'Sedia diuji terus pada Home Deck & Search Hub',
      },
      {
        value: '32% – 99%',
        label: 'Julat Skor Dinamik',
        sublabel: 'Berubah secara langsung apabila penapis/profil dikemas kini',
      },
      {
        value: 'Masa Nyata',
        label: 'Kiraan Serta-Merta',
        sublabel: 'Sifar kelewatan semasa menukar penapis fakulti & kemahiran',
      },
    ],
    leftColumn: {
      heading: 'Senarai 6 Aktiviti Contoh Di Dalam Sistem',
      bullets: [
        'FKI · FKJ: Borneo AI & Smart Campus Hackathon 2026 (Competition)',
        'FKJ · FKI: UMS Autonomous Shuttle & Solar IoT Telemetry (Innovation)',
        'FSSA · FPL: Ekspedisi Pemuliharaan Terumbu Karang Sepanggar (Community)',
      ],
    },
    rightColumn: {
      heading: 'Liputan Keusahawanan, Kesihatan & Warisan',
      bullets: [
        'FPEP · FKAL: Kinabalu Social Enterprise & Digital Tamu Pitch (Competition)',
        'FPSK · FSMP · FPP: Kem Kesihatan Komuniti, Gizi & Minda Sejahtera (Community)',
        'FSSK · FKI: Dokumentari Warisan Budaya Borneo & Keselamatan Siber (Assignment)',
      ],
    },
    bottomTakeaway:
      'Cuba klik simulasi aktiviti di bawah untuk melihat bagaimana skor 40/25/20/15 berubah mengikut projek.',
    speakerScript:
      'Untuk membuktikan sistem ini berfungsi sepenuhnya, kami telah memuatkan enam aktiviti rentas fakulti sebenar—daripada Hackathon AI di FKI dan Shuttle Solar di FKJ, sehinggalah Pemuliharaan Terumbu Karang FSSA, Digital Tamu FPEP, Kem Kesihatan FPSK, dan Dokumentari Borneo FSSK.',
  },
  {
    id: 'slide-08',
    indexNumber: '08',
    chapterKicker: 'BAB 08 · KELEBIHAN DAYA SAING & INOVASI',
    timeWindow: '3:30 – 4:00 (30s)',
    bellAlert: 'none',
    themeMode: 'light-editorial',
    title: 'Perbandingan Kompetitif: Mengapa ProjectLink UMS Jauh Lebih Efektif?',
    subtitle:
      'Membandingkan keupayaan ProjectLink UMS dengan kaedah hebahan konvensional di kampus.',
    metrics: [
      {
        value: '4 Dimensi',
        label: 'Padanan Pintar',
        sublabel: 'Kemahiran + Minat + Jadual + Matlamat serentak',
      },
      {
        value: 'Sifar Spam',
        label: 'Katalog Rasmi UMS',
        sublabel: 'Kawalan kualiti tag & keselamatan komuniti pelajar',
      },
      {
        value: 'Rekod SDP',
        label: 'Nilai Jangka Panjang',
        sublabel: 'Bukan sekadar iklan, tetapi pembina portfolio pelajar',
      },
    ],
    leftColumn: {
      heading: 'Kelemahan Kaedah Sedia Ada (WhatsApp / Telegram / Poster)',
      bullets: [
        'Grup Sembang: Tiada penapisan mengikut fakulti, kemahiran, atau ketersediaan jadual mingguan.',
        'Papan Kenyataan Fizikal: Capaian terhad, tiada pautan tindakan segera, dan sukar dikemas kini.',
        'Borang Google Biasa: Penganjur terpaksa menyemak keserasian calon secara manual satu demi satu.',
      ],
    },
    rightColumn: {
      heading: 'Kelebihan Mutlak ProjectLink UMS',
      bullets: [
        'Saringan Dua Hala Automatik: Pelajar terus tahu peratus keserasian sebelum memohon atau menghubungi penganjur.',
        'Taksonomi Terpiawai 10 Fakulti: Memastikan semua bidang daripada Sains Marin hingga Kewangan Labuan diwakili.',
        'Integrasi WhatsApp + Penjejakan SDP: Menggabungkan komunikasi pantas dengan rekod pembangunan pelajar.',
      ],
    },
    bottomTakeaway:
      'ProjectLink UMS menukar proses pencarian ahli pasukan daripada "cuba nasib di grup chat" kepada padanan berasaskan data.',
    speakerScript:
      'Berbanding grup WhatsApp atau papan kenyataan biasa yang pasif, ProjectLink UMS menawarkan empat kelebihan mutlak: saringan padanan automatik 40/25/20/15, taksonomi terkawal sepuluh fakulti, integrasi terus WhatsApp penganjur, serta penjejakan rekod mata SDP.',
  },
  {
    id: 'slide-09',
    indexNumber: '09',
    chapterKicker: 'BAB 09 · IMPAK KAMPUS, SDG & PELAN KELESTARIAN (1 LOCENG - 04:00)',
    timeWindow: '4:00 – 4:30 (30s) · 🔔 1 Loceng',
    bellAlert: 'one-bell-warning',
    themeMode: 'light-editorial',
    title: 'Impak Ekosistem UMS, Sumbangan SDG & Potensi Skalabiliti CEDeC',
    subtitle:
      'Menyokong agenda kebolehpasaran graduan, kolaborasi rentas disiplin, dan Matlamat Pembangunan Mampan (SDG).',
    metrics: [
      {
        value: 'SDG 4 & 17',
        label: 'Pendidikan & Kerjasama',
        sublabel: 'Pembelajaran berasaskan projek & sinergi rentas disiplin',
      },
      {
        value: 'CEDeC & JHEP',
        label: 'Kesediaan Kerjaya',
        sublabel: 'Portfolio aktiviti & kemahiran pelajar yang tersusun',
      },
      {
        value: 'Fasa 1 → 3',
        label: 'Pelan Pengembangan',
        sublabel: 'Kampus KK, Sandakan & Labuan → Rakan Industri Sabah',
      },
    ],
    leftColumn: {
      heading: 'Impak Kepada Pelajar & Universiti',
      bullets: [
        'Meningkatkan kadar penyertaan pelajar dalam pertandingan inovasi (seperti EIS’26), penyelidikan, dan CSR.',
        'Membentuk pasukan permulaan (startup) kampus yang lengkap—menggabungkan pembangun teknologi, pereka, dan pemasar.',
        'Membantu pelajar mengumpul dan mendokumentasikan mata SDP secara sistematik sejak tahun pertama.',
      ],
    },
    rightColumn: {
      heading: 'Fasa Pelaksanaan & Kelestarian',
      bullets: [
        'Fasa 1 (Kini): Prototaip berfungsi penuh dengan Taksonomi Rasmi 10 Fakulti UMS & 6 projek rentas bidang.',
        'Fasa 2: Integrasi pengesahan SSO kampus & pengesahan automatik sijil/mata SDP bersama kelab berdaftar.',
        'Fasa 3: Membuka portal cabaran industri tempatan Sabah bersama CEDeC untuk projek tahun akhir & inkubator.',
      ],
    },
    bottomTakeaway:
      '🔔 Peringatan Minit ke-4 (1 Loceng): Anda mempunyai 1 minit terakhir untuk menggulung pembentangan dengan yakin.',
    speakerScript:
      'Apabila loceng pertama berbunyi pada minit keempat ini, mari kita lihat impaknya: ProjectLink UMS menyokong SDG 4 dan SDG 17 dengan memperkukuh kebolehpasaran graduan melalui kerjasama bersama CEDeC dan JHEP merentasi kampus Kota Kinabalu, Sandakan, dan Labuan.',
  },
  {
    id: 'slide-10',
    indexNumber: '10',
    chapterKicker: 'BAB 10 · RUMUSAN & SESI Q&A JURI (2 LOCENG - 05:00)',
    timeWindow: '4:30 – 5:00 (30s) · 🔔🔔 Tamat 5 Minit',
    bellAlert: 'two-bell-stop',
    themeMode: 'dark-hero',
    title: 'ProjectLink UMS: Menghubungkan Bakat, Memacu Inovasi Kampus',
    subtitle:
      'Terima kasih panel juri EIS’26! Kami kini bersedia untuk sesi Soal Jawab (Q&A) selama 10 minit serta demonstrasi aplikasi langsung.',
    metrics: [
      {
        value: '5 Minit',
        label: 'Pembentangan Selesai',
        sublabel: 'Mematuhi masa rasmi EIS’26 sebelum 2 deringan loceng',
      },
      {
        value: '10 Minit',
        label: 'Sesi Q&A Panel Juri',
        sublabel: 'Bank jawapan & bukti metrik tersedia di bawah',
      },
      {
        value: 'Live Demo',
        label: 'Sedia Diuji Terus',
        sublabel: 'Home Deck, Carian 10 Fakulti, Post Aktiviti & History SDP',
      },
    ],
    leftColumn: {
      heading: '3 Rumusan Utama Untuk Panel Juri',
      bullets: [
        '1. Menyelesaikan Masalah Sebenar: Menggantikan hebahan grup chat yang berselerak dengan hab penemuan berstruktur.',
        '2. Teknologi Padanan Telus & Selamat: Enjin 40/25/20/15 yang dipacu oleh Taksonomi Rasmi 10 Fakulti UMS.',
        '3. Sedia Digunakan: Lengkap dengan aliran WhatsApp penganjur, penapisan pintar, dan rekod History SDP.',
      ],
    },
    rightColumn: {
      heading: 'Persediaan Sesi 10 Minit Q&A',
      bullets: [
        'Tekan butang "Buka Bank Q&A Juri" untuk rujukan pantas jawapan teknikal dan keusahawanan.',
        'Tekan butang "Kembali ke Aplikasi (Live Demo)" untuk menunjukkan fungsi sebenar kepada juri.',
        'Show your innovation. Demonstrate its value. Make an impact!',
      ],
    },
    bottomTakeaway:
      '🔔🔔 Minit ke-5 (2 Loceng): Berhenti membentang serta-merta dan serahkan semula kepada Moderator untuk sesi Q&A 10 minit.',
    speakerScript:
      'Sebagai rumusan, ProjectLink UMS bukan sekadar papan hebahan, tetapi enjin kolaborasi pintar yang selamat dan sedia memacu inovasi pelajar UMS. Sekian pembentangan lima minit kami—kami amat berbesar hati menerima soalan daripada barisan panel juri. Terima kasih!',
  },
];

// ============================================================================
// PURE TYPESCRIPT ZIP + OPENXML (.PPTX) GENERATOR (ZERO EXTERNAL DEPENDENCIES)
// ============================================================================

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Precomputed CRC32 Table for standard ZIP archive headers
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntryInput {
  path: string;
  content: string;
}

function buildZipBlob(entries: ZipEntryInput[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: {
    pathBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  const localChunks: Uint8Array[] = [];

  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0x0800, true); // UTF-8 flag
    view.setUint16(8, 0, true); // Compression method: 0 (STORE)
    view.setUint16(10, 0, true); // Mod time
    view.setUint16(12, 0x596c, true); // Mod date
    view.setUint32(14, crc, true);
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, pathBytes.length, true);
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(pathBytes, 30);

    fileRecords.push({
      pathBytes,
      dataBytes,
      crc,
      offset: currentOffset,
    });

    localChunks.push(localHeader);
    localChunks.push(dataBytes);
    currentOffset += localHeader.length + dataBytes.length;
  }

  const centralChunks: Uint8Array[] = [];
  let centralSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.pathBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0x0800, true); // UTF-8 flag
    view.setUint16(10, 0, true); // Compression: STORE
    view.setUint16(12, 0, true);
    view.setUint16(14, 0x596c, true);
    view.setUint32(16, rec.crc, true);
    view.setUint32(20, rec.dataBytes.length, true);
    view.setUint32(24, rec.dataBytes.length, true);
    view.setUint16(28, rec.pathBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, rec.offset, true);
    cdHeader.set(rec.pathBytes, 46);

    centralChunks.push(cdHeader);
    centralSize += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, fileRecords.length, true);
  eocdView.setUint16(10, fileRecords.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, currentOffset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob([...localChunks, ...centralChunks, eocd] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

// Helper to create a positioned rectangle / card / text box in DrawingML (EMU units: 1 inch = 914400 EMUs)
function makePptxShapeXml(params: {
  id: number;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  fillHex?: string;
  borderHex?: string;
  paragraphs: {
    text: string;
    fontSizePt: number;
    colorHex: string;
    bold?: boolean;
    spaceAfterPt?: number;
  }[];
}): string {
  const {id, name, x, y, cx, cy, fillHex, borderHex, paragraphs} = params;

  const fillXml = fillHex
    ? `<a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>`
    : `<a:noFill/>`;

  const lineXml = borderHex
    ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${borderHex}"/></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;

  const parasXml = paragraphs
    .map((p) => {
      const sz = Math.round(p.fontSizePt * 100);
      const bAttr = p.bold ? ' b="1"' : '';
      const spcAfter = p.spaceAfterPt
        ? `<a:spcAft><a:spcPts val="${Math.round(p.spaceAfterPt * 100)}"/></a:spcAft>`
        : '';
      return `<a:p><a:pPr algn="l">${spcAfter}</a:pPr><a:r><a:rPr lang="ms-MY" sz="${sz}"${bAttr} dirty="0"><a:solidFill><a:srgbClr val="${p.colorHex}"/></a:solidFill><a:latin typeface="Plus Jakarta Sans"/><a:ea typeface="Plus Jakarta Sans"/></a:rPr><a:t>${xmlEscape(
        p.text
      )}</a:t></a:r></a:p>`;
    })
    .join('');

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${xmlEscape(name)}"/>
      <p:cNvSpPr txBox="1"/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      ${fillXml}
      ${lineXml}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="137160" tIns="114300" rIns="137160" bIns="114300" anchor="t"/>
      <a:lstStyle/>
      ${parasXml}
    </p:txBody>
  </p:sp>`;
}

function buildSingleSlideXml(slide: PitchSlideItem): string {
  const isDark = slide.themeMode === 'dark-hero';
  const bgHex = isDark ? '141132' : 'FAF9FF';
  const titleHex = isDark ? 'FFFFFF' : '141132';
  const subHex = isDark ? 'DDD6FE' : '475569';
  const kickerHex = isDark ? 'FDE047' : '5B18E5';
  const cardBgHex = isDark ? '22184F' : 'FFFFFF';
  const cardBorderHex = isDark ? '4C1D95' : 'E2D9FF';
  const cardTitleHex = isDark ? 'FDE047' : '5B18E5';
  const cardBodyHex = isDark ? 'F3E8FF' : '1E293B';

  const shapes: string[] = [];

  // 1. Full-bleed Background Rectangle
  shapes.push(
    makePptxShapeXml({
      id: 2,
      name: 'SlideBackground',
      x: 0,
      y: 0,
      cx: 12192000,
      cy: 6858000,
      fillHex: bgHex,
      paragraphs: [{text: ' ', fontSizePt: 8, colorHex: bgHex}],
    })
  );

  // 2. Top Kicker + Time Window Bar
  shapes.push(
    makePptxShapeXml({
      id: 3,
      name: 'HeaderKicker',
      x: 548640,
      y: 320040,
      cx: 11094720,
      cy: 365760,
      paragraphs: [
        {
          text: `${slide.indexNumber} / ${slide.chapterKicker}   |   MASA: ${slide.timeWindow}`,
          fontSizePt: 10,
          colorHex: kickerHex,
          bold: true,
        },
      ],
    })
  );

  // 3. Main Headline & Subtitle
  shapes.push(
    makePptxShapeXml({
      id: 4,
      name: 'SlideTitleAndSubtitle',
      x: 548640,
      y: 685800,
      cx: 11094720,
      cy: 1371600,
      paragraphs: [
        {
          text: slide.title,
          fontSizePt: 23,
          colorHex: titleHex,
          bold: true,
          spaceAfterPt: 6,
        },
        {
          text: slide.subtitle,
          fontSizePt: 12,
          colorHex: subHex,
          bold: false,
        },
      ],
    })
  );

  // 4. Three Metric Highlight Boxes Row
  const metricWidth = 3535680;
  const metricGap = 243840;
  slide.metrics.slice(0, 3).forEach((m, idx) => {
    const mx = 548640 + idx * (metricWidth + metricGap);
    shapes.push(
      makePptxShapeXml({
        id: 10 + idx,
        name: `MetricBox_${idx + 1}`,
        x: mx,
        y: 2148840,
        cx: metricWidth,
        cy: 1143000,
        fillHex: cardBgHex,
        borderHex: cardBorderHex,
        paragraphs: [
          {
            text: m.value,
            fontSizePt: 19,
            colorHex: cardTitleHex,
            bold: true,
            spaceAfterPt: 2,
          },
          {
            text: m.label,
            fontSizePt: 11,
            colorHex: titleHex,
            bold: true,
            spaceAfterPt: 2,
          },
          {
            text: m.sublabel,
            fontSizePt: 9.5,
            colorHex: subHex,
          },
        ],
      })
    );
  });

  // 5. Left Column Section Box
  const colWidth = 5425440;
  shapes.push(
    makePptxShapeXml({
      id: 20,
      name: 'LeftColumnBox',
      x: 548640,
      y: 3474720,
      cx: colWidth,
      cy: 2377440,
      fillHex: cardBgHex,
      borderHex: cardBorderHex,
      paragraphs: [
        {
          text: slide.leftColumn.heading,
          fontSizePt: 13,
          colorHex: cardTitleHex,
          bold: true,
          spaceAfterPt: 6,
        },
        ...slide.leftColumn.bullets.map((b) => ({
          text: `• ${b}`,
          fontSizePt: 10.5,
          colorHex: cardBodyHex,
          spaceAfterPt: 4,
        })),
      ],
    })
  );

  // 6. Right Column Section Box
  shapes.push(
    makePptxShapeXml({
      id: 21,
      name: 'RightColumnBox',
      x: 548640 + colWidth + 243840,
      y: 3474720,
      cx: colWidth,
      cy: 2377440,
      fillHex: cardBgHex,
      borderHex: cardBorderHex,
      paragraphs: [
        {
          text: slide.rightColumn.heading,
          fontSizePt: 13,
          colorHex: cardTitleHex,
          bold: true,
          spaceAfterPt: 6,
        },
        ...slide.rightColumn.bullets.map((b) => ({
          text: `• ${b}`,
          fontSizePt: 10.5,
          colorHex: cardBodyHex,
          spaceAfterPt: 4,
        })),
      ],
    })
  );

  // 7. Bottom Takeaway & Speaker Script Footer Strip
  shapes.push(
    makePptxShapeXml({
      id: 30,
      name: 'BottomTakeawayStrip',
      x: 548640,
      y: 5989320,
      cx: 11094720,
      cy: 640080,
      fillHex: isDark ? '2E1065' : 'F3EEFF',
      borderHex: cardBorderHex,
      paragraphs: [
        {
          text: `Intipati Utama: ${slide.bottomTakeaway}`,
          fontSizePt: 10,
          colorHex: isDark ? 'FDE047' : '4C1D95',
          bold: true,
          spaceAfterPt: 2,
        },
        {
          text: `Skrip Pembentang: "${slide.speakerScript}"`,
          fontSizePt: 8.5,
          colorHex: isDark ? 'E9D5FF' : '475569',
        },
      ],
    })
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${shapes.join('\n')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

export function downloadProjectLinkPptx(
  slides: PitchSlideItem[] = PITCH_DECK_SLIDES
): void {
  const entries: ZipEntryInput[] = [];

  const slideOverrides = slides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${
          i + 1
        }.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n  ');

  entries.push({
    path: '[Content_Types].xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${slideOverrides}
</Types>`,
  });

  entries.push({
    path: '_rels/.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
  });

  entries.push({
    path: 'docProps/core.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>ProjectLink UMS — Dek Pitching Inovasi EIS'26 CEDeC</dc:title>
  <dc:creator>Fahrin Muneer (ProjectLink UMS)</dc:creator>
  <dc:description>Pembentangan Inovasi 5 Minit EIS'26 Universiti Malaysia Sabah</dc:description>
</cp:coreProperties>`,
  });

  entries.push({
    path: 'docProps/app.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>ProjectLink UMS Studio</Application>
  <PresentationFormat>Widescreen</PresentationFormat>
  <Slides>${slides.length}</Slides>
</Properties>`,
  });

  const sldIdLst = slides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`)
    .join('\n    ');

  entries.push({
    path: 'ppt/presentation.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`,
  });

  const presRels = slides
    .map(
      (_, i) =>
        `<Relationship Id="rId${
          i + 2
        }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${
          i + 1
        }.xml"/>`
    )
    .join('\n  ');

  entries.push({
    path: 'ppt/_rels/presentation.xml.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${presRels}
  <Relationship Id="rId${
    slides.length + 2
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  <Relationship Id="rId${
    slides.length + 3
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>
  <Relationship Id="rId${
    slides.length + 4
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>
  <Relationship Id="rId${
    slides.length + 5
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`,
  });

  entries.push({
    path: 'ppt/presProps.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presProps xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`,
  });

  entries.push({
    path: 'ppt/viewProps.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewProps xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`,
  });

  entries.push({
    path: 'ppt/tableStyles.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`,
  });

  entries.push({
    path: 'ppt/theme/theme1.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="ProjectLinkUMSTheme">
  <a:themeElements>
    <a:clrScheme name="ProjectLinkUMS">
      <a:dk1><a:srgbClr val="141132"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="2E1065"/></a:dk2>
      <a:lt2><a:srgbClr val="FAF9FF"/></a:lt2>
      <a:accent1><a:srgbClr val="5B18E5"/></a:accent1>
      <a:accent2><a:srgbClr val="7C3AED"/></a:accent2>
      <a:accent3><a:srgbClr val="D97706"/></a:accent3>
      <a:accent4><a:srgbClr val="10B981"/></a:accent4>
      <a:accent5><a:srgbClr val="0284C7"/></a:accent5>
      <a:accent6><a:srgbClr val="E11D48"/></a:accent6>
      <a:hlink><a:srgbClr val="5B18E5"/></a:hlink>
      <a:folHlink><a:srgbClr val="4C1D95"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="ProjectLinkFonts">
      <a:majorFont><a:latin typeface="Plus Jakarta Sans"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Plus Jakarta Sans"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="ProjectLinkFmt">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`,
  });

  entries.push({
    path: 'ppt/slideMasters/slideMaster1.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>`,
  });

  entries.push({
    path: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
  });

  entries.push({
    path: 'ppt/slideLayouts/slideLayout1.xml',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`,
  });

  entries.push({
    path: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
  });

  slides.forEach((slide, i) => {
    const num = i + 1;
    entries.push({
      path: `ppt/slides/slide${num}.xml`,
      content: buildSingleSlideXml(slide),
    });
    entries.push({
      path: `ppt/slides/_rels/slide${num}.xml.rels`,
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`,
    });
  });

  const blob = buildZipBlob(entries);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ProjectLink_UMS_EIS26_Pitch_Deck.pptx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
