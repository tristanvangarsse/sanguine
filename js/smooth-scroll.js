(() => {
    const gallery = document.querySelector("main");
    const hoverQuery = window.matchMedia("(hover: hover)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    );

    const MIN_DISTANCE = 1.5;

    let isEnabled = false;
    let animationFrame = 0;
    let current = gallery?.scrollLeft || 0;
    let target = gallery?.scrollLeft || 0;
    let maxScroll = 0;

    function shouldUseSmoothScroll() {
        return (
            Boolean(gallery) &&
            hoverQuery.matches &&
            pointerQuery.matches &&
            navigator.maxTouchPoints === 0 &&
            !reducedMotionQuery.matches
        );
    }

    function getRootNumber(property, fallback) {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(property)
            .trim();
        const parsed = Number.parseFloat(value);

        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getSettings() {
        return {
            damping: getRootNumber("--smooth-scroll-damping", 0.18),
            multiplier: getRootNumber("--smooth-scroll-wheel-multiplier", 0.8),
        };
    }

    function updateMaxScroll() {
        maxScroll = gallery
            ? Math.max(gallery.scrollWidth - gallery.clientWidth, 0)
            : 0;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function syncToNativeScroll() {
        updateMaxScroll();
        current = clamp(gallery?.scrollLeft || 0, 0, maxScroll);
        target = current;
    }

    function setCustomScrollBehavior(isActive) {
        document.documentElement.classList.toggle(
            "is-custom-smooth-scrolling",
            isActive,
        );
    }

    function stopAnimation() {
        if (!animationFrame) {
            setCustomScrollBehavior(false);
            return;
        }

        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        setCustomScrollBehavior(false);
    }

    function normalizeWheelDelta(event) {
        const delta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
                ? event.deltaX
                : event.deltaY;

        if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
            return delta * 16;
        }

        if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            return delta * window.innerHeight;
        }

        return delta;
    }

    function animate() {
        const { damping } = getSettings();
        const distance = target - current;

        if (Math.abs(distance) <= MIN_DISTANCE) {
            current = target;
            animationFrame = 0;
        } else {
            current += distance * clamp(damping, 0.01, 1);
            animationFrame = requestAnimationFrame(animate);
        }

        gallery?.scrollTo({ left: current, top: 0, behavior: "auto" });

        if (!animationFrame) {
            setCustomScrollBehavior(false);
        }
    }

    function startAnimation() {
        if (animationFrame) {
            return;
        }

        setCustomScrollBehavior(true);
        animationFrame = requestAnimationFrame(animate);
    }

    function onWheel(event) {
        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

        event.preventDefault();

        const { multiplier } = getSettings();
        const deltaY = normalizeWheelDelta(event) * multiplier;

        updateMaxScroll();
        current = clamp(gallery?.scrollLeft || 0, 0, maxScroll);
        target = clamp(target + deltaY, 0, maxScroll);

        startAnimation();
    }

    function onScroll() {
        if (animationFrame) {
            return;
        }

        syncToNativeScroll();
    }

    function onNativeScrollIntent() {
        stopAnimation();
        syncToNativeScroll();
    }

    function enableSmoothScroll() {
        if (isEnabled || !gallery) {
            return;
        }

        isEnabled = true;
        syncToNativeScroll();

        window.addEventListener("resize", syncToNativeScroll, {
            passive: true,
        });
        window.addEventListener("hashchange", onNativeScrollIntent);
        window.addEventListener("keydown", onNativeScrollIntent);
        window.addEventListener("pointerdown", onNativeScrollIntent, {
            passive: true,
        });
        window.addEventListener("popstate", onNativeScrollIntent);
        gallery.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("wheel", onWheel, { passive: false });
    }

    function disableSmoothScroll() {
        if (!isEnabled) {
            return;
        }

        isEnabled = false;
        stopAnimation();

        window.removeEventListener("resize", syncToNativeScroll);
        window.removeEventListener("hashchange", onNativeScrollIntent);
        window.removeEventListener("keydown", onNativeScrollIntent);
        window.removeEventListener("pointerdown", onNativeScrollIntent);
        window.removeEventListener("popstate", onNativeScrollIntent);
        gallery?.removeEventListener("scroll", onScroll);
        window.removeEventListener("wheel", onWheel);

        syncToNativeScroll();
    }

    function syncSmoothScrollState() {
        if (shouldUseSmoothScroll()) {
            enableSmoothScroll();
        } else {
            disableSmoothScroll();
        }
    }

    hoverQuery.addEventListener("change", syncSmoothScrollState);
    pointerQuery.addEventListener("change", syncSmoothScrollState);
    reducedMotionQuery.addEventListener("change", syncSmoothScrollState);

    window.destroySmoothScroll = () => {
        disableSmoothScroll();
        hoverQuery.removeEventListener("change", syncSmoothScrollState);
        pointerQuery.removeEventListener("change", syncSmoothScrollState);
        reducedMotionQuery.removeEventListener("change", syncSmoothScrollState);
        delete window.destroySmoothScroll;
    };

    syncSmoothScrollState();
})();
