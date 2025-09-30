const gallery = document.querySelector('.scroll-gallery');
        const template = document.querySelector('#scroll-template');
        let isAnimating = false;
        let isFetchingMore = false;
        let prefetchedFortune = null;

        async function fetchNextFortune() {
            console.log("Attempting to fetch next fortune...");
            try {
                const response = await fetch('https://random-quotes-freeapi.vercel.app/api/random');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                prefetchedFortune = {
                    content: data.quote,
                    author: `- ${data.author}`
                };
                console.log("Successfully prefetched fortune:", prefetchedFortune);
            } catch (error) {
                console.error("Fortune fetch failed:", error);
                prefetchedFortune = {
                    content: 'Could not fetch a fortune. Please try again later.',
                    author: ''
                };
            }
        }

        function createScrolls(num, atStart = false) {
            for (let i = 0; i < num; i++) {
                const scrollClone = template.content.cloneNode(true);
                if (atStart) {
                    gallery.insertBefore(scrollClone, gallery.firstChild);
                } else {
                    gallery.appendChild(scrollClone);
                }
            }
        }

        async function openScroll(container) {
            console.log("Opening scroll. Current prefetchedFortune:", prefetchedFortune);
            // If a fortune isn't ready, wait for one. This handles the edge case of a
            // click happening before the initial fetch completes.
            if (!prefetchedFortune) {
                console.log("No fortune was prefetched, waiting for fetch to complete...");
                await fetchNextFortune();
                console.log("Fetch complete. New prefetchedFortune:", prefetchedFortune);
            }

            const textPlaceholder = container.querySelector('.text-placeholder');
            const authorPlaceholder = container.querySelector('.author-placeholder');

            // Display the prefetched fortune
            textPlaceholder.textContent = prefetchedFortune.content;
            authorPlaceholder.textContent = prefetchedFortune.author;

            // Start fetching the next one in the background for the next click
            fetchNextFortune();

            // Now that the content is in place, start the animation
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

                gallery.classList.remove('gallery-focused');

                // Add a new scroll to the top to replace the one that was used
                createScrolls(1, true);

                isAnimating = false;
            }, { once: true });
        }

        gallery.addEventListener('click', (e) => {
            if (isAnimating) return;

            const clickedContainer = e.target.closest('.scroll-container');
            if (!clickedContainer || clickedContainer.classList.contains('unrolled')) return;

            isAnimating = true;

            const rect = clickedContainer.getBoundingClientRect();

            clickedContainer.classList.add('is-animating');
            clickedContainer.style.transition = 'none';
            clickedContainer.style.display = 'none';
            clickedContainer.style.opacity = '0';


            // Create a clone to animate
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

            // Fade out other scrolls
            gallery.classList.add('gallery-focused');

            // Animate the clone to the center
            requestAnimationFrame(() => {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                clone.style.top = `${centerY - rect.height / 2}px`;
                clone.style.left = `${centerX - rect.width / 2}px`;
            });

            setTimeout(() => {
                // --- Start of fix for the "jump" ---
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

                // 6. In the next frame, trigger the unroll animation.
                requestAnimationFrame(async () => {
                    await openScroll(clickedContainer);
                });
                // --- End of fix ---
            }, 800); // 800ms matches the CSS transition duration
        });

        document.addEventListener('click', (e) => {
            const openContainer = document.querySelector('.scroll-container.unrolled');
            if (openContainer && !openContainer.contains(e.target)) {
                closeScroll(openContainer);
            }
        });

        gallery.addEventListener('scroll', () => {
            if (isFetchingMore) return;

            const { scrollTop, scrollHeight, clientHeight } = gallery;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                isFetchingMore = true;
                createScrolls(5);
                isFetchingMore = false;
            } else if (scrollTop < 100) {
                isFetchingMore = true;
                const oldScrollHeight = gallery.scrollHeight;
                createScrolls(5, true);
                gallery.scrollTop += gallery.scrollHeight - oldScrollHeight;
                isFetchingMore = false;
            }
        });

        // Initial load
        createScrolls(20);
        const scrolls = gallery.querySelectorAll('.scroll-container');
        if (scrolls.length > 0) {
            const middleScroll = scrolls[Math.floor(scrolls.length / 2)];
            middleScroll.scrollIntoView({ block: 'center' });
        }

        // Fetch the first fortune so it's ready
        fetchNextFortune();