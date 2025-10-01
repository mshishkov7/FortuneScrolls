/**
 * movie-quotes.js — hardened init for button clicks + fetch fallback
 */
(function () {
    'use strict';

    const els = {
        tvContainer: () => document.getElementById('tv-container'),
        tvStatic: () => document.getElementById('tv-static'),
        quoteBox: () => document.getElementById('quote-content'),
        quoteText: () => document.querySelector('#quote-content .quote-text'),
        quoteAuthor: () => document.querySelector('#quote-content .quote-author'),
        channelKnob: () => document.getElementById('channel-knob'),
        filterBtns: () => Array.from(document.querySelectorAll('.filter-btn')),
        sideNav: () => document.getElementById('side-nav'),
        scrollGallery: () => document.querySelector('.scroll-gallery')
    };

    const state = {
        allQuotes: [],
        filter: 'all',
        ready: false,
        initializing: false
    };

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    async function loadQuotes() {
        if (state.allQuotes.length) return;
        try {
            // IMPORTANT: path is relative to index.html, not this JS file.
            const res = await fetch('./movie_quotes.json', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to load quotes: HTTP ${res.status}`);
            const data = await res.json();

            if (!Array.isArray(data) || !data.length) {
                throw new Error('movie_quotes.json is empty or invalid array');
            }

            state.allQuotes = data
                .filter(q => q && typeof q.quote === 'string')
                .map(q => ({
                    quote: String(q.quote).trim(),
                    movie: q.movie ? String(q.movie).trim() : 'Unknown',
                    type: (q.type || 'movie').toLowerCase(),
                    year: q.year || ''
                }));

        } catch (err) {
            console.error('[movie-quotes] Could not load movie_quotes.json:', err);
            state.allQuotes = [{
                quote: 'No quotes available. If you opened index.html directly from your file system, run a local server so fetch() works.',
                movie: 'System',
                type: 'movie',
                year: ''
            }];
        }
    }

    function poolForFilter(filter) {
        const f = (filter || state.filter || 'all').toLowerCase();
        if (f === 'all') return state.allQuotes;
        const pool = state.allQuotes.filter(q => q.type === f);
        return pool.length ? pool : state.allQuotes;
    }

    function randomQuote(filter) {
        const pool = poolForFilter(filter);
        return pick(pool);
    }

    function renderQuote(q) {
        const textEl = els.quoteText();
        const authorEl = els.quoteAuthor();
        if (!textEl || !authorEl) return;

        textEl.textContent = q.quote || '';
        authorEl.textContent = `— ${q.movie || 'Unknown'}${q.year ? ` (${q.year})` : ''}${q.type ? ` · ${q.type.toUpperCase()}` : ''}`;
    }

    async function showQuoteWithStatic(filter) {
        const box = els.quoteBox();
        const staticEl = els.tvStatic();
        if (!box) return;

        if (staticEl) staticEl.classList.add('active');
        box.classList.add('hidden');

        await sleep(150 + Math.random() * 200);

        const q = randomQuote(filter);
        renderQuote(q);

        if (staticEl) staticEl.classList.remove('active');
        box.classList.remove('hidden');
    }

    function setActiveFilterBtn(active) {
        els.filterBtns().forEach(btn => {
            if (btn.dataset.filter === active) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function wireFilters() {
        els.filterBtns().forEach(btn => {
            // Prevent accidental form submit behavior even if wrapped in a form
            if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const filter = btn.dataset.filter || 'all';
                state.filter = filter;
                setActiveFilterBtn(filter);
                await showQuoteWithStatic(filter);
            }, { passive: true });
        });
    }

    function wireChannelKnob() {
        const knob = els.channelKnob();
        if (!knob) return;
        if (!knob.getAttribute('type')) knob.setAttribute('type', 'button');
        knob.addEventListener('click', () => showQuoteWithStatic(), { passive: true });
        knob.setAttribute('tabindex', '0');
        knob.setAttribute('role', 'button');
        knob.setAttribute('aria-label', 'Next quote');
        knob.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showQuoteWithStatic();
            }
        });
    }

    function wireBasicRouting() {
        document.body.addEventListener('click', async (e) => {
            const a = e.target.closest('a[data-page]');
            if (!a) return;
            const page = a.getAttribute('data-page');
            if (!page) return;
            e.preventDefault();

            if (page === 'movie-quotes') {
                const tv = els.tvContainer();
                const gallery = els.scrollGallery();
                if (tv) tv.style.display = 'block';
                if (gallery) gallery.style.display = 'none';
                await ensureReady();
                await showQuoteWithStatic(state.filter);
            } else if (page === 'fortunes') {
                const tv = els.tvContainer();
                const gallery = els.scrollGallery();
                if (tv) tv.style.display = 'none';
                if (gallery) gallery.style.display = '';
            }
        });
    }

    async function ensureReady() {
        if (state.ready || state.initializing) return;
        state.initializing = true;

        await loadQuotes();
        wireFilters();
        wireChannelKnob();
        setActiveFilterBtn(state.filter);

        state.ready = true;
        state.initializing = false;
    }

    async function boot() {
        await ensureReady();

        // Show an initial quote if the TV is visible
        const tv = els.tvContainer();
        if (tv && getComputedStyle(tv).display !== 'none') {
            await showQuoteWithStatic(state.filter);
        }

        wireBasicRouting();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        // DOM is already parsed (defer/late load)
        boot();
    }
})();
