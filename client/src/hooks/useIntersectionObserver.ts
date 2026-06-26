import { useEffect, useRef, useState, RefObject } from 'react';

interface Options extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element>(
  options: Options = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (freezeOnceVisible) observer.unobserve(el);
        } else if (!freezeOnceVisible) {
          setIsVisible(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [ref, isVisible];
}
