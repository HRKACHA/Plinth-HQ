import { useEffect, useRef, useCallback } from 'react';

/**
 * useScrollReveal – Adds 'scroll-revealed' class to an element when it enters the viewport.
 * 
 * @param {Object} options
 * @param {number} options.threshold - 0 to 1, how much of the element must be visible (default 0.15)
 * @param {string} options.rootMargin - margin around root (default '0px 0px -60px 0px')
 * @param {boolean} options.once - if true, only reveal once (default true)
 */
export function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-revealed');
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove('scroll-revealed');
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}

/**
 * useScrollRevealChildren – Observes a container and staggers 'scroll-revealed' 
 * class on each direct child with the '.scroll-item' class.
 * 
 * @param {Object} options
 * @param {Array} options.deps - Dependency array to trigger re-run of the effect (useful for tabs)
 */
export function useScrollRevealChildren({ threshold = 0.1, rootMargin = '0px 0px -40px 0px', staggerMs = 120, deps = [] } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Reset classes if deps changed
    const items = container.querySelectorAll('.scroll-item');
    items.forEach(item => item.classList.remove('scroll-revealed'));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = container.querySelectorAll('.scroll-item');
          items.forEach((item, idx) => {
            setTimeout(() => {
              item.classList.add('scroll-revealed');
            }, idx * staggerMs);
          });
          observer.unobserve(container);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, staggerMs, ...deps]);

  return ref;
}
