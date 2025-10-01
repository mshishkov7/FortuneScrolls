document.addEventListener('DOMContentLoaded', () => {
    const scrollGallery = document.querySelector('.scroll-gallery');
    if (!scrollGallery) return;

    const template = document.querySelector('#scroll-template');
    let isAnimating = false;
    let isFetchingMore = false;
    let prefetchedFortune = null;

    async function fetchNextFortune() {
        try {
            const response = await fetch('https://random-quotes-freeapi.vercel.app/api/random');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            prefetchedFortune = { content: data.quote, author: `- ${data.author}` };
        } catch (error) {
            console.error("Fortune fetch failed:", error);
            prefetchedFortune = { content: 'Could not fetch a fortune. Please try again later.', author: '' };
        }
    }

    function createScrolls(num, atStart = false) {
        if (!template) return;
        for (let i = 0; i < num; i++) {
            const scrollClone = template.content.cloneNode(true);
            if (atStart) {
                scrollGallery.insertBefore(scrollClone, scrollGallery.firstChild);
            } else {
                scrollGallery.appendChild(scrollClone);
            }
        }
    }

    async function openScroll(container) {
        if (!prefetchedFortune) {
            await fetchNextFortune();
        }
        const textPlaceholder = container.querySelector('.text-placeholder');
        const authorPlaceholder = container.querySelector('.author-placeholder');
        textPlaceholder.textContent = prefetchedFortune.content;
        authorPlaceholder.textContent = prefetchedFortune.author;
        fetchNextFortune();
        container.classList.add('unrolled');
    }

    function closeScroll(container) {
        isAnimating = true;
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = '0';
        container.addEventListener('transitionend', (e) => {
            if (e.propertyName !== 'opacity') return;
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            scrollGallery.classList.remove('gallery-focused');
            createScrolls(1, true);
            isAnimating = false;
        }, { once: true });
    }

    scrollGallery.addEventListener('click', (e) => {
        if (isAnimating) return;
        const clickedContainer = e.target.closest('.scroll-container');
        if (!clickedContainer || clickedContainer.classList.contains('unrolled')) return;
        isAnimating = true;
        const rect = clickedContainer.getBoundingClientRect();
        clickedContainer.classList.add('is-animating');
        clickedContainer.style.transition = 'none';
        clickedContainer.style.display = 'none';
        clickedContainer.style.opacity = '0';
        const clone = clickedContainer.cloneNode(true);
        clone.style.display = 'flex';
        clone.style.transition = '';
        clone.style.visibility = 'visible';
        clone.style.opacity = '1';
        clone.classList.remove('is-animating');
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '10';
        clone.style.margin = '0';
        document.body.appendChild(clone);
        scrollGallery.classList.add('gallery-focused');
        requestAnimationFrame(() => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            clone.style.top = `${centerY - rect.height / 2}px`;
            clone.style.left = `${centerX - rect.width / 2}px`;
        });
        setTimeout(() => {
            clickedContainer.style.transition = 'none';
            clickedContainer.style.display = '';
            clickedContainer.style.visibility = 'visible';
            clickedContainer.style.opacity = '1';
            clickedContainer.classList.remove('is-animating');
            clickedContainer.classList.add('selected');
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
            }
            void clickedContainer.offsetHeight;
            clickedContainer.style.transition = '';
            requestAnimationFrame(async () => {
                await openScroll(clickedContainer);
            });
        }, 800);
    });

    document.addEventListener('click', (e) => {
        const openContainer = document.querySelector('.scroll-container.unrolled');
        if (openContainer && !openContainer.contains(e.target)) {
            closeScroll(openContainer);
        }
    });

    scrollGallery.addEventListener('scroll', () => {
        if (isFetchingMore) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollGallery;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            isFetchingMore = true;
            createScrolls(5);
            isFetchingMore = false;
        } else if (scrollTop < 100) {
            isFetchingMore = true;
            const oldScrollHeight = scrollGallery.scrollHeight;
            createScrolls(5, true);
            scrollGallery.scrollTop += scrollGallery.scrollHeight - oldScrollHeight;
            isFetchingMore = false;
        }
    });

    // Initial load for fortunes
    createScrolls(20);
    const scrolls = scrollGallery.querySelectorAll('.scroll-container');
    if (scrolls.length > 0) {
        const middleScroll = scrolls[Math.floor(scrolls.length / 2)];
        middleScroll.scrollIntoView({ block: 'center' });
    }
    fetchNextFortune();
});