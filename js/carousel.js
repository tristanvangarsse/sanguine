const AUTOPLAY_ENABLED = false;

const gallery = document.querySelector("main");
const slides = [...document.querySelectorAll("main > *")];
const images = document.querySelectorAll("img[data-src]");

images.forEach((image) => {
    image.src = image.dataset.src;
});

const getRootNumber = (property, fallback) => {
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(property)
        .trim();
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

const getAutoplayInterval = () =>
    getRootNumber("--carousel-autoplay-interval", 3000);

const getSlideStep = () => {
    if (!gallery || slides.length < 2) {
        return window.innerWidth * 0.8;
    }

    return slides[1].offsetLeft - slides[0].offsetLeft;
};

const getMaxScroll = () =>
    gallery ? Math.max(gallery.scrollWidth - gallery.clientWidth, 0) : 0;

const scrollByAmount = (amount) => {
    if (!gallery) {
        return;
    }

    gallery.scrollTo({
        left: Math.min(Math.max(gallery.scrollLeft + amount, 0), getMaxScroll()),
        behavior: "smooth",
    });
};

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
        scrollByAmount(getSlideStep());
    }

    if (event.key === "ArrowLeft") {
        scrollByAmount(-getSlideStep());
    }
});

if (AUTOPLAY_ENABLED) {
    window.setInterval(() => {
        if (!gallery) {
            return;
        }

        const maxScroll = getMaxScroll();

        if (gallery.scrollLeft >= maxScroll - 2) {
            gallery.scrollTo({ left: 0, behavior: "smooth" });
            return;
        }

        scrollByAmount(getSlideStep());
    }, getAutoplayInterval());
}
