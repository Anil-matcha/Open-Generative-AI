
import { CAMERA_MAP, LENS_MAP, FOCAL_PERSPECTIVE, APERTURE_EFFECT } from '../lib/promptUtils.js';

const ASSET_URLS = {
    // CAMERA
    "Modular 8K Digital": "./assets/cinema/modular_8k_digital.webp",
    "Full-Frame Cine Digital": "./assets/cinema/full_frame_cine_digital.webp",
    "Grand Format 70mm Film": "./assets/cinema/grand_format_70mm_film.webp",
    "Studio Digital S35": "./assets/cinema/studio_digital_s35.webp",
    "Classic 16mm Film": "./assets/cinema/classic_16mm_film.webp",
    "Premium Large Format Digital": "./assets/cinema/premium_large_format_digital.webp",

    // LENS
    "Creative Tilt Lens": "./assets/cinema/creative_tilt_lens.webp",
    "Compact Anamorphic": "./assets/cinema/compact_anamorphic.webp",
    "Extreme Macro": "./assets/cinema/extreme_macro.webp",
    "70s Cinema Prime": "./assets/cinema/70s_cinema_prime.webp",
    "Classic Anamorphic": "./assets/cinema/classic_anamorphic.webp",
    "Premium Modern Prime": "./assets/cinema/premium_modern_prime.webp",
    "Warm Cinema Prime": "./assets/cinema/warm_cinema_prime.webp",
    "Swirl Bokeh Portrait": "./assets/cinema/swirl_bokeh_portrait.webp",
    "Vintage Prime": "./assets/cinema/vintage_prime.webp",
    "Halation Diffusion": "./assets/cinema/halation_diffusion.webp",
    "Clinical Sharp Prime": "./assets/cinema/clinical_sharp_prime.webp",

    // APERTURE
    "f/1.4": "./assets/cinema/f_1_4.webp",
    "f/4": "./assets/cinema/f_4.webp",
    "f/11": "./assets/cinema/f_11.webp"
};

export function CameraControls(onChange) {
    const container = document.createElement('div');
    // Added padding-bottom to ensure scrollbar doesn't overlap content if visible
    // Changed justify-center to justify-start md:justify-center to allow left-aligned scrolling on mobile
    container.className = 'w-full flex justify-start md:justify-center gap-3 md:gap-6 py-4 md:py-8 overflow-x-auto no-scrollbar snap-x px-4 md:px-0';

    let state = {
        camera: Object.keys(CAMERA_MAP)[0],
        lens: Object.keys(LENS_MAP)[0],
        focal: 35,
        aperture: "f/1.4"
    };

    const updateState = (key, value) => {
        state[key] = value;
        if (onChange) onChange(state);
    };

    const createColumn = (title, items, key, initialValue) => {
        const colWrapper = document.createElement('div');
        colWrapper.className = 'flex flex-col items-center relative w-[140px] md:w-[160px] shrink-0 snap-center group';

        const viewport = document.createElement('div');
        // Responsive height: h-[50vh] on mobile, h-[320px] on desktop
        viewport.className = 'relative overflow-hidden w-full h-[40vh] md:h-[320px] bg-[#1a1a1a]/80 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02] hover:border-white/10';

        const list = document.createElement('div');
        list.className = 'h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10';

        // Spacer to allow first item to be centered
        const topSpacer = document.createElement('div');
        topSpacer.style.height = 'calc(50% - 50px)'; // Half viewport - half item height
        list.appendChild(topSpacer);

        const topMask = document.createElement('div');
        topMask.className = 'absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent z-20 pointer-events-none rounded-t-[2rem]';
        viewport.appendChild(topMask);

        const bottomMask = document.createElement('div');
        bottomMask.className = 'absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent z-20 pointer-events-none rounded-b-[2rem]';
        viewport.appendChild(bottomMask);

        const glow = document.createElement('div');
        glow.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-[80px] bg-primary/5 blur-xl rounded-full pointer-events-none z-0';
        viewport.appendChild(glow);

        // DRAG TO SCROLL LOGIC
        let isDown = false;
        let startY;
        let scrollTop;

        list.addEventListener('mousedown', (e) => {
            isDown = true;
            list.classList.add('cursor-grabbing');
            list.classList.remove('cursor-pointer', 'snap-y'); // Disable snap while dragging
            startY = e.pageY - list.offsetTop;
            scrollTop = list.scrollTop;
            e.preventDefault(); // Prevent text selection
        });

        list.addEventListener('mouseleave', () => {
            isDown = false;
            list.classList.remove('cursor-grabbing');
            list.classList.add('snap-y');
        });

        list.addEventListener('mouseup', () => {
            isDown = false;
            list.classList.remove('cursor-grabbing');
            list.classList.add('snap-y');
        });

        list.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const y = e.pageY - list.offsetTop;
            const walk = (y - startY) * 1.5; // Scroll speed multiplier
            list.scrollTop = scrollTop - walk;
        });

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `
                h-[100px] flex flex-col items-center justify-center gap-3
                snap-center cursor-pointer transition-all duration-500 ease-out
                text-white p-2 select-none opacity-30 scale-75 blur-[1px]
            `;

            const imageUrl = ASSET_URLS[item];

            // Image Container
            const imgContainer = document.createElement('div');
            imgContainer.className = `w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center transition-all duration-500 shadow-inner group-hover/item:border-primary/30 overflow-hidden relative`;

            if (imageUrl) {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.className = 'w-full h-full object-cover opacity-80';
                imgContainer.appendChild(img);
            } else if (key === 'focal') {
                // For Focal Length (Numbers), use text/simple graphics
                const focalText = document.createElement('span');
                focalText.textContent = item;
                focalText.className = 'text-lg font-bold text-white/50';
                imgContainer.appendChild(focalText);
            } else {
                // Fallback for missing images
                imgContainer.innerHTML = `<div class="w-3 h-3 bg-white/20 rounded-full"></div>`;
            }

            const text = document.createElement('span');
            text.textContent = item;
            text.className = 'text-[9px] md:text-[10px] font-bold uppercase text-center leading-tight max-w-full truncate px-1 tracking-wider';

            itemEl.appendChild(imgContainer);
            itemEl.appendChild(text);

            itemEl.onclick = () => {
                itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            itemEl.dataset.value = item;
            list.appendChild(itemEl);
        });

        // Spacer to allow last item to be centered
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.height = 'calc(50% - 50px)';
        list.appendChild(bottomSpacer);

        viewport.appendChild(list);

        const label = document.createElement('div');
        label.className = 'mb-3 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] text-center';
        label.textContent = title;

        colWrapper.appendChild(label);
        colWrapper.appendChild(viewport);

        // Scroll-based selection logic (Guarantees one active item)
        const handleScroll = () => {
            const centerY = list.scrollTop + (list.clientHeight / 2);
            let closest = null;
            let minDist = Infinity;

            const children = Array.from(list.children).filter(c => c.dataset.value); // Ignore spacers

            // 1. Find closest item first
            children.forEach(child => {
                const childCenter = child.offsetTop + (child.offsetHeight / 2);
                const dist = Math.abs(centerY - childCenter);
                if (dist < minDist) {
                    minDist = dist;
                    closest = child;
                }
            });

            // 2. Apply styles based on closest match
            children.forEach(child => {
                const imgBox = child.querySelector('div');
                const label = child.querySelector('span:last-child');
                const isClosest = child === closest;

                if (isClosest) {
                    // Active Item
                    child.classList.remove('opacity-30', 'scale-75', 'blur-[1px]');
                    child.classList.add('opacity-100', 'scale-100', 'blur-0', 'z-30');

                    imgBox.classList.add('border-primary/50', 'shadow-glow-sm', 'scale-110');
                    imgBox.classList.remove('border-white/10', 'bg-white/5');

                    if (key === 'focal') {
                        const fText = imgBox.querySelector('span');
                        if (fText) fText.classList.add('text-primary');
                    }

                    label.classList.add('text-primary', 'text-shadow-sm');
                } else {
                    // Inactive Items
                    child.classList.add('opacity-30', 'scale-75', 'blur-[1px]');
                    child.classList.remove('opacity-100', 'scale-100', 'blur-0', 'z-30');

                    imgBox.classList.remove('border-primary/50', 'shadow-glow-sm', 'scale-110');
                    imgBox.classList.add('border-white/10', 'bg-white/5');

                    if (key === 'focal') {
                        const fText = imgBox.querySelector('span');
                        if (fText) fText.classList.remove('text-primary');
                    }

                    label.classList.remove('text-primary', 'text-shadow-sm');
                }
            });

            if (closest && closest.dataset.value !== state[key]) {
                updateState(key, closest.dataset.value);
            }
        };

        list.addEventListener('scroll', handleScroll);
        // Initial check
        setTimeout(handleScroll, 150);



        setTimeout(() => {
            const initialItem = Array.from(list.children).find(c => c.dataset.value == initialValue);
            if (initialItem) initialItem.scrollIntoView({ block: 'center' });
        }, 100);

        return colWrapper;
    };

    container.appendChild(createColumn('Camera', Object.keys(CAMERA_MAP), 'camera', state.camera));
    container.appendChild(createColumn('Lens', Object.keys(LENS_MAP), 'lens', state.lens));
    container.appendChild(createColumn('Focal Length', Object.keys(FOCAL_PERSPECTIVE).map(k => parseInt(k)), 'focal', state.focal));
    container.appendChild(createColumn('Aperture', Object.keys(APERTURE_EFFECT), 'aperture', state.aperture));

    return container;
}
