(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    const root = document.documentElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- THEME (follows device, toggle overrides + saved) ---------- */
    const themeBtn = $('#themeToggle');
    const themeMeta = $('meta[name="theme-color"]');
    const systemDark = matchMedia('(prefers-color-scheme: dark)');

    const savedTheme = () => {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };

    const applyTheme = (t) => {
        root.dataset.theme = t;
        themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        if (themeMeta) themeMeta.content = t === 'dark' ? '#0b0a14' : '#faf8ff';
    };

    applyTheme(savedTheme() || (systemDark.matches ? 'dark' : 'light'));

    systemDark.addEventListener('change', (e) => {
        if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light');
    });

    themeBtn.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('theme', next); } catch (e) {}
        applyTheme(next);
    });

    /* ---------- INTRO LOADER ---------- */
    const loader = $('#loader');
    let introDone = false;

    const finishIntro = () => {
        if (introDone) return;
        introDone = true;
        loader.classList.add('done');
        document.body.classList.add('loaded');
        setTimeout(() => loader.remove(), 900);
    };

    window.addEventListener('load', () => setTimeout(finishIntro, reduceMotion ? 0 : 650));
    setTimeout(finishIntro, 3000); // failsafe

    /* ---------- HEADER: scrolled state, progress bar, mobile menu ---------- */
    const header = $('#header');
    const progress = $('#progress');
    const burger = $('#burger');

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            header.classList.toggle('scrolled', y > 10);
            progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = (open) => {
        header.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    burger.addEventListener('click', () => setMenu(!header.classList.contains('open')));
    $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    /* ---------- ACTIVE NAV ---------- */
    const navLinks = $$('#nav a');
    const sectionEls = ['home', 'about', 'projects', 'skills', 'contact']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if ('IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sectionEls.forEach(s => navObserver.observe(s));
    }

    /* ---------- REVEAL ON SCROLL (staggered) ---------- */
    $$('[data-stagger]').forEach(group => {
        $$('.reveal', group).forEach((el, i) => {
            el.style.transitionDelay = `${i * 90}ms`;
        });
    });

    const reveals = $$('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('show');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(el => revealObserver.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('show'));
    }

    /* ---------- TYPEWRITER ---------- */
    const typedEl = $('#typed');
    const phrases = ['Data Analyst', 'PowerBI Developer', 'HR Analyst'];

    if (typedEl && !reduceMotion) {
        let p = 0, c = 0, deleting = false;

        const tick = () => {
            const word = phrases[p];
            c += deleting ? -1 : 1;
            typedEl.textContent = word.slice(0, c);

            let delay = deleting ? 45 : 90;
            if (!deleting && c === word.length) { deleting = true; delay = 1600; }
            else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 350; }

            setTimeout(tick, delay);
        };

        typedEl.textContent = '';
        setTimeout(tick, 1400); // starts after hero entrance
    }

    /* ---------- COUNTERS ---------- */
    const counters = $$('[data-count]');

    const runCounter = (el) => {
        const target = Number(el.dataset.count);
        if (reduceMotion) { el.textContent = target; return; }
        const duration = 1400;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                runCounter(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(el => countObserver.observe(el));
    } else {
        counters.forEach(el => { el.textContent = el.dataset.count; });
    }

    /* ---------- HOVER EFFECTS (mouse devices only) ---------- */
    if (canHover && !reduceMotion) {

        // Cursor glow
        const glow = $('#cursorGlow');
        let gx = 0, gy = 0, glowQueued = false;

        window.addEventListener('pointermove', (e) => {
            gx = e.clientX; gy = e.clientY;
            glow.classList.add('on');
            if (glowQueued) return;
            glowQueued = true;
            requestAnimationFrame(() => {
                glow.style.transform = `translate3d(${gx - 260}px, ${gy - 260}px, 0)`;
                glowQueued = false;
            });
        }, { passive: true });

        document.addEventListener('pointerleave', () => glow.classList.remove('on'));

        // 3D tilt on project cards
        $$('.tilt').forEach(card => {
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                card.style.transform =
                    `perspective(900px) rotateX(${(0.5 - y) * 9}deg) rotateY(${(x - 0.5) * 11}deg) translateY(-6px)`;
                card.style.setProperty('--mx', `${x * 100}%`);
                card.style.setProperty('--my', `${y * 100}%`);
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });

        // Magnetic buttons
        $$('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
    }

    /* ---------- CONTACT FORM (Formspree) ---------- */
    const form = $('#contactForm');
    const statusEl = $('#formStatus');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = $('button[type="submit"]', form);

            if (form.action.includes('YOUR_FORM_ID')) {
                statusEl.className = 'form-status err';
                statusEl.textContent = 'Form is not connected yet. Email me directly at anand.k100@outlook.com.';
                return;
            }

            submitBtn.disabled = true;
            statusEl.className = 'form-status';
            statusEl.textContent = 'Sending...';

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' }
                });

                if (res.ok) {
                    form.reset();
                    statusEl.className = 'form-status ok';
                    statusEl.textContent = 'Message sent. I will reply soon.';
                } else {
                    throw new Error('Request failed');
                }
            } catch (err) {
                statusEl.className = 'form-status err';
                statusEl.textContent = 'Message not sent. Email me directly at anand.k100@outlook.com.';
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    /* ---------- FOOTER YEAR ---------- */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
