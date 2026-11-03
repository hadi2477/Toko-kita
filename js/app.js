/* =========================================================
   TOKO KITA - js/app.js
   Data produk, filter kategori, pencarian, dan keranjang
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Data produk ---------- */
  // c = kategori (sayur, buah, dapur, minum, rumah)
  // p = harga sekarang, o = harga asli (opsional, untuk diskon)
  var PRODUK = [
    { id: 1,  n: 'Bayam Hijau',         u: '1 ikat',      c: 'sayur', e: '🥬', p: 6000,  o: 8500 },
    { id: 2,  n: 'Brokoli Segar',       u: '500 g',       c: 'sayur', e: '🥦', p: 18000 },
    { id: 3,  n: 'Tomat Merah',         u: '1 kg',        c: 'sayur', e: '🍅', p: 14000, o: 19000 },
    { id: 4,  n: 'Apel Fuji',           u: '1 kg',        c: 'buah',  e: '🍎', p: 38000 },
    { id: 5,  n: 'Pisang Cavendish',    u: '1 sisir',     c: 'buah',  e: '🍌', p: 15000, o: 20000 },
    { id: 6,  n: 'Alpukat Mentega',     u: '500 g',       c: 'buah',  e: '🥑', p: 22000 },
    { id: 7,  n: 'Beras Premium',       u: '5 kg',        c: 'dapur', e: '🍚', p: 72000 },
    { id: 8,  n: 'Telur Ayam',          u: '10 butir',    c: 'dapur', e: '🥚', p: 21000, o: 25000 },
    { id: 9,  n: 'Susu UHT Tawar',      u: '1 liter',     c: 'minum', e: '🥛', p: 19000 },
    { id: 10, n: 'Teh Hijau Celup',     u: '25 kantong',  c: 'minum', e: '🍵', p: 16000 },
    { id: 11, n: 'Sabun Cuci Piring',   u: '800 ml',      c: 'rumah', e: '🧴', p: 17000 },
    { id: 12, n: 'Keranjang Anyaman',   u: '1 buah',      c: 'rumah', e: '🧺', p: 45000, o: 60000 }
  ];

  var NAMA_KATEGORI = {
    all: 'Produk Pilihan',
    sayur: 'Sayur',
    buah: 'Buah',
    dapur: 'Dapur',
    minum: 'Minuman',
    rumah: 'Rumah'
  };

  var KUNCI_SIMPAN = 'tokokita-keranjang';

  /* ---------- State ---------- */
  var kategori = 'all';   // kategori yang sedang aktif
  var kata = '';          // kata kunci pencarian
  var keranjang = {};     // { idProduk: jumlah }

  /* ---------- Elemen halaman ---------- */
  var $ = function (id) { return document.getElementById(id); };

  var elGrid  = $('grid');
  var elCats  = $('cats');
  var elCnt   = $('cnt');
  var elJudul = $('gt');
  var elQ     = $('q');
  var elItems = $('items');
  var elTotal = $('total');
  var elBadge = $('badge');
  var elPay   = $('pay');
  var elSheet = $('sheet');
  var elScrim = $('scrim');
  var elToast = $('toast');

  /* ---------- Fungsi bantu ---------- */
  function rupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function cariProduk(id) {
    for (var i = 0; i < PRODUK.length; i++) {
      if (PRODUK[i].id === Number(id)) return PRODUK[i];
    }
    return null;
  }

  function simpan() {
    try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(keranjang)); } catch (e) {}
  }

  function muat() {
    try {
      var data = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || '{}');
      Object.keys(data).forEach(function (id) {
        // Hanya ambil produk yang masih ada dan jumlahnya valid
        if (cariProduk(id) && data[id] > 0) keranjang[id] = Number(data[id]);
      });
    } catch (e) {
      keranjang = {};
    }
  }

  /* ---------- Kategori ---------- */
  // Tombol kategori sudah ada di index.html. Di sini hanya
  // status aktifnya yang diperbarui (tombol tidak dibuat ulang,
  // sehingga posisi geser tidak melompat).
  function tampilKategori() {
    Array.prototype.forEach.call(elCats.children, function (tombol) {
      tombol.setAttribute('aria-pressed', String(tombol.dataset.c === kategori));
    });
  }

  function pilihKategori(id, geserKeBawah) {
    kategori = id;
    kata = '';        // reset pencarian agar filter tidak bentrok
    elQ.value = '';

    tampilKategori();
    tampilProduk();

    // Animasi singkat agar perubahan terlihat
    elGrid.classList.remove('swap');
    void elGrid.offsetWidth;
    elGrid.classList.add('swap');

    // Geser tombol aktif ke tengah deretan kategori
    var aktif = elCats.querySelector('[data-c="' + id + '"]');
    if (aktif && aktif.scrollIntoView) {
      aktif.scrollIntoView({ inline: 'center', block: 'nearest' });
    }

    if (geserKeBawah) {
      window.scrollTo({ top: elCats.offsetTop - 90, behavior: 'smooth' });
    }
  }

  /* ---------- Daftar produk ---------- */
  function tampilProduk() {
    var daftar = PRODUK.filter(function (x) {
      var cocokKategori = (kategori === 'all' || x.c === kategori);
      var cocokKata = x.n.toLowerCase().indexOf(kata) > -1;
      return cocokKategori && cocokKata;
    });

    elJudul.textContent = NAMA_KATEGORI[kategori] || 'Produk Pilihan';
    elCnt.textContent = daftar.length + ' produk';

    if (!daftar.length) {
      elGrid.innerHTML =
        '<div class="empty">Produk tidak ditemukan. Coba kata kunci lain atau pilih kategori Semua.</div>';
      return;
    }

    elGrid.innerHTML = daftar.map(function (x) {
      var diskon = x.o ? Math.round((1 - x.p / x.o) * 100) : 0;
      return (
        '<article class="card">' +
          '<div class="img">' +
            (diskon ? '<span class="off">-' + diskon + '%</span>' : '') +
            x.e +
          '</div>' +
          '<div class="info">' +
            '<h4>' + x.n + '</h4>' +
            '<small>' + x.u + '</small>' +
            '<div class="row">' +
              '<div class="price">' +
                (x.o ? '<s>' + rupiah(x.o) + '</s>' : '') + rupiah(x.p) +
              '</div>' +
              '<button class="add" type="button" data-a="' + x.id + '" aria-label="Tambah ' + x.n + ' ke keranjang">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  /* ---------- Keranjang ---------- */
  function tampilKeranjang() {
    var ids = Object.keys(keranjang);
    var jumlah = 0;
    var total = 0;

    if (!ids.length) {
      elItems.innerHTML =
        '<div class="empty">Keranjang masih kosong. Tekan tombol + pada produk untuk mulai belanja.</div>';
    } else {
      elItems.innerHTML = ids.map(function (id) {
        var x = cariProduk(id);
        var q = keranjang[id];
        jumlah += q;
        total += q * x.p;
        return (
          '<div class="it">' +
            '<div class="th">' + x.e + '</div>' +
            '<div class="nm">' + x.n + '<small>' + rupiah(x.p) + '</small></div>' +
            '<div class="qty">' +
              '<button type="button" data-m="' + id + '" aria-label="Kurangi ' + x.n + '">−</button>' +
              '<span>' + q + '</span>' +
              '<button type="button" data-p="' + id + '" aria-label="Tambah ' + x.n + '">+</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    elTotal.textContent = rupiah(total);
    elPay.disabled = !ids.length;
    elBadge.hidden = !jumlah;
    elBadge.textContent = jumlah;
    simpan();
  }

  function tambahKeKeranjang(id) {
    keranjang[id] = (keranjang[id] || 0) + 1;
    tampilKeranjang();

    // Animasi badge
    elBadge.classList.remove('pop');
    void elBadge.offsetWidth;
    elBadge.classList.add('pop');

    tampilToast(cariProduk(id).n + ' masuk keranjang');
  }

  function kurangiDariKeranjang(id) {
    keranjang[id]--;
    if (keranjang[id] < 1) delete keranjang[id];
    tampilKeranjang();
  }

  function bukaKeranjang(buka) {
    elSheet.classList.toggle('on', buka);
    elScrim.classList.toggle('on', buka);
    elSheet.setAttribute('aria-hidden', String(!buka));
  }

  function checkout() {
    keranjang = {};
    tampilKeranjang();
    bukaKeranjang(false);
    tampilToast('Pesanan dibuat. Terima kasih!');
  }

  /* ---------- Notifikasi ---------- */
  var timerToast;
  function tampilToast(pesan) {
    elToast.textContent = pesan;
    elToast.classList.add('on');
    clearTimeout(timerToast);
    timerToast = setTimeout(function () {
      elToast.classList.remove('on');
    }, 1600);
  }

  /* ---------- Event ---------- */
  document.addEventListener('click', function (e) {
    var tombol = e.target.closest('button');
    if (!tombol) return;

    if (tombol.dataset.c) {
      pilihKategori(tombol.dataset.c);
    } else if (tombol.dataset.a) {
      tambahKeKeranjang(tombol.dataset.a);
    } else if (tombol.dataset.p) {
      keranjang[tombol.dataset.p]++;
      tampilKeranjang();
    } else if (tombol.dataset.m) {
      kurangiDariKeranjang(tombol.dataset.m);
    } else if (tombol.id === 'promo') {
      pilihKategori('sayur', true);
    } else if (tombol.id === 'pay') {
      checkout();
    }
  });

  $('openCart').addEventListener('click', function () { bukaKeranjang(true); });
  $('close').addEventListener('click', function () { bukaKeranjang(false); });
  elScrim.addEventListener('click', function () { bukaKeranjang(false); });

  // Tombol Esc menutup keranjang
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') bukaKeranjang(false);
  });

  // Pencarian
  elQ.addEventListener('input', function (e) {
    kata = e.target.value.trim().toLowerCase();
    tampilProduk();
  });

  /* ---------- Mulai ---------- */
  muat();
  tampilKategori();
  tampilProduk();
  tampilKeranjang();
})();
