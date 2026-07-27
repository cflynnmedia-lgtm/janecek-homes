// ============================================
// JANECEK HOMES - SHARED SCRIPTS
// ============================================

// Nav scroll behavior
const nav = document.querySelector('.nav');
const mobileCta = document.querySelector('.mobile-cta');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav?.classList.add('scrolled');
  } else {
    nav?.classList.remove('scrolled');
  }

  // Show mobile CTA after scrolling past hero
  if (window.scrollY > window.innerHeight * 0.6) {
    mobileCta?.classList.add('visible');
  } else {
    mobileCta?.classList.remove('visible');
  }
});

// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

navToggle?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
  document.body.style.overflow = mobileMenu?.classList.contains('open') ? 'hidden' : '';
});

document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu?.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---- Lightbox: click any content image to open it full-screen; exit button + arrows ---- */
(function () {
  var GROUP_SEL = '.rc-minigallery, .villas-gallery, .rc-panel-map, .jh-craft-mosaic, .jh-portfolio-grid, .jh-team-grid, .gallery-grid, .featured-home-media';
  var EXCLUDE_SEL = 'a, nav, .mobile-menu, .footer, .jh-page-header-bg, .ab-cta-bg, .inline-form-bg, .ab-stat-bg, .jh-feature';

  function eligible(img) {
    return !!img && img.tagName === 'IMG' &&
      !img.classList.contains('lb-img') &&
      !img.closest(EXCLUDE_SEL);
  }

  var ov = document.createElement('div');
  ov.className = 'lb-overlay';
  ov.innerHTML =
    '<button class="lb-btn lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-btn lb-prev" aria-label="Previous">&#8249;</button>' +
    '<figure class="lb-stage"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>' +
    '<button class="lb-btn lb-next" aria-label="Next">&#8250;</button>' +
    '<div class="lb-counter"></div>';
  document.body.appendChild(ov);

  var imgEl = ov.querySelector('.lb-img');
  var capEl = ov.querySelector('.lb-cap');
  var counter = ov.querySelector('.lb-counter');
  var prevBtn = ov.querySelector('.lb-prev');
  var nextBtn = ov.querySelector('.lb-next');
  var group = [], idx = 0;

  function show(i) {
    idx = (i + group.length) % group.length;
    var g = group[idx];
    imgEl.src = g.src; imgEl.alt = g.alt;
    capEl.textContent = g.alt || '';
    capEl.style.display = g.alt ? '' : 'none';
    counter.textContent = (idx + 1) + ' / ' + group.length;
  }
  function open(list, i) {
    group = list; show(i);
    var single = group.length < 2;
    prevBtn.style.display = single ? 'none' : '';
    nextBtn.style.display = single ? 'none' : '';
    counter.style.display = single ? 'none' : '';
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    ov.classList.remove('open');
    document.body.style.overflow = '';
    imgEl.src = '';
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.lb-overlay')) return;
    var img = e.target.closest('img');
    if (!img) {
      var tile = e.target.closest('.jh-craft-tile, .gallery-item, .jh-portfolio-grid > div, figure');
      if (tile) img = tile.querySelector('img');
    }
    if (!eligible(img)) return;

    var container = img.closest(GROUP_SEL);
    var imgs = container
      ? Array.prototype.slice.call(container.querySelectorAll('img')).filter(function (im) { return eligible(im) && im.offsetParent !== null; })
      : [img];
    var i = imgs.indexOf(img);
    if (i < 0) { imgs = [img]; i = 0; }
    open(imgs.map(function (im) {
      return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' };
    }), i);
  });

  ov.querySelector('.lb-close').addEventListener('click', close);
  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.classList.contains('lb-stage')) close(); });
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  var sx = 0;
  ov.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40 && group.length > 1) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ---- Auto-advancing 3-up gallery sliders ---- */
(function () {
  var tracks = document.querySelectorAll('.rc-mini .rc-minigallery');
  if (!tracks.length) return;
  Array.prototype.forEach.call(tracks, function (track) {
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length <= 3) return; // already 3 or fewer, no slider needed
    var wrap = document.createElement('div');
    wrap.className = 'rc-slider';
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
    var n = slides.length;
    for (var i = 0; i < 3; i++) {
      var c = slides[i].cloneNode(true);
      c.classList.add('rc-clone');
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    }
    var idx = 0, timer = null;
    function stepW() {
      var first = track.children[0];
      var cs = getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function place(animate) {
      track.style.transition = animate ? 'transform 0.8s cubic-bezier(0.4,0,0.2,1)' : 'none';
      track.style.transform = 'translateX(' + (-idx * stepW()) + 'px)';
    }
    function advance() {
      if (!wrap.offsetParent) return; // panel hidden
      idx++;
      place(true);
      if (idx >= n) { window.setTimeout(function () { idx = 0; place(false); }, 820); }
    }
    function start() { if (!timer) timer = window.setInterval(advance, 3800); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    place(false);
    start();
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', start);
    window.addEventListener('resize', function () { place(false); });
  });
})();

/* Craftsmanship gallery category filter (fade non-matching tiles) */
(function(){
  var bar = document.querySelector('.jh-craft-filters');
  if (!bar) return;
  var buttons = bar.querySelectorAll('.jh-craft-filter');
  var tiles = document.querySelectorAll('.jh-craft-mosaic .jh-craft-tile');
  if (!buttons.length || !tiles.length) return;
  bar.addEventListener('click', function(e){
    var btn = e.target.closest('.jh-craft-filter');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat') || 'all';
    buttons.forEach(function(b){ b.classList.toggle('active', b === btn); });
    tiles.forEach(function(t){
      var match = (cat === 'all') || (t.getAttribute('data-cat') === cat);
      t.classList.toggle('dimmed', !match);
    });
  });
})();


/* ---- Gallery page: category filter ---- */
(function () {
  var bar = document.querySelector('.lot-filters');
  var grid = document.querySelector('.gallery-grid');
  if (!bar || !grid) return;
  var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
  grid.classList.add('visible'); /* grid is taller than 10x viewport, reveal observer never fires */
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('.lot-filter');
    if (!btn) return;
    bar.querySelectorAll('.lot-filter').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var cat = btn.getAttribute('data-filter') || 'all';
    items.forEach(function (it) {
      var show = cat === 'all' || (it.getAttribute('data-cat') || '') === cat;
      it.classList.toggle('hide', !show);
    });
  });
})();

/* ---- About page: story video player ---- */
(function () {
  var frame = document.querySelector('.ab-video-frame');
  if (!frame) return;
  var poster = frame.querySelector('img.poster');
  var v = frame.getAttribute('data-video') || '';
  /* Auto-fetch the real Vimeo thumbnail so the poster matches the video */
  var vmId = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (poster && vmId) {
    fetch('https://vimeo.com/api/oembed.json?url=https://vimeo.com/' + vmId[1] + '&width=1280')
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.thumbnail_url) poster.src = d.thumbnail_url.replace(/-d_\d+x\d+$/, '-d_1280'); })
      .catch(function () { /* keep fallback poster */ });
  }
  function embedUrl(v) {
    if (!v) return null;
    var yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    var vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return 'https://player.vimeo.com/video/' + vm[1] + '?autoplay=1&title=0&byline=0&portrait=0';
    return null;
  }
  function watchUrl(v) {
    var yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return 'https://www.youtube.com/watch?v=' + yt[1];
    var vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return 'https://vimeo.com/' + vm[1];
    return v;
  }
  function play() {
    if (frame.classList.contains('is-playing')) return;
    var v = frame.getAttribute('data-video');
    if (!v) return; /* no video wired up yet */
    var embed = embedUrl(v);
    var el;
    if (embed) {
      el = document.createElement('iframe');
      el.src = embed;
      el.allow = 'autoplay; fullscreen; picture-in-picture';
      el.setAttribute('allowfullscreen', '');
      /* Fallback: if the embed is blocked (e.g. embedding disabled), open on YouTube */
      el.addEventListener('error', function () { window.open(watchUrl(v), '_blank', 'noopener'); });
    } else {
      el = document.createElement('video');
      el.src = v; el.controls = true; el.autoplay = true; el.playsInline = true;
    }
    frame.appendChild(el);
    frame.classList.add('is-playing');
  }
  frame.addEventListener('click', play);
  frame.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
  });
})();
