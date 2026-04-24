document.addEventListener('DOMContentLoaded', () => {
    // Burger Menu Elements
    const burgerMenu = document.getElementById('burger-menu');
    const sideNav = document.getElementById('side-nav');
    const closeBtn = document.getElementById('close-btn');

    // Page Content Elements
    const pageTitle = document.querySelector('h1');
    const scrollGallery = document.querySelector('.scroll-gallery');
    const tvContainer = document.getElementById('tv-container');

    // --- Burger Menu Logic ---
    if (burgerMenu && sideNav && closeBtn) {
        burgerMenu.addEventListener('click', () => {
            sideNav.style.width = '250px';
        });

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sideNav.style.width = '0';
        });

        sideNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.dataset.page) {
                e.preventDefault();
                switchPage(e.target.dataset.page);
                sideNav.style.width = '0';
            }
        });
    }

    // --- Page Switching Logic ---
    const pages = {
        fortunes: {
            container: scrollGallery,
            title: 'Choose Your Fortune',
            theme: 'fortunes-theme'
        },
        'movie-quotes': {
            container: tvContainer,
            title: 'Movie Quotes',
            theme: 'tv-theme'
        }
    };

    function switchPage(pageKey) {
        if (!pages[pageKey]) return;

        document.body.className = '';
        document.body.classList.add(pages[pageKey].theme);

        pageTitle.textContent = pages[pageKey].title;

        for (const key in pages) {
            if (pages[key].container) {
                pages[key].container.style.display = 'none';
            }
        }
        if (pages[pageKey].container) {
            pages[pageKey].container.style.display = 'flex';
        }
    }

    // --- Initial Page Load ---
    switchPage('fortunes');
});