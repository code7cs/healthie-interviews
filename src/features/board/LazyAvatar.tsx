import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  fallbackLabel: string;
  className: string;
  eager?: boolean;
};

function getFallbackLetter(label: string) {
  return label.trim().charAt(0).toUpperCase() || '?';
}

export function LazyAvatar({
  src,
  alt,
  fallbackLabel,
  className,
  eager = false,
}: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [requestedSrc, setRequestedSrc] = useState<string | null>(
    eager ? src : null,
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const supportsIntersectionObserver =
    typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (
      eager ||
      requestedSrc === src ||
      !supportsIntersectionObserver
    ) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRequestedSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [eager, requestedSrc, src, supportsIntersectionObserver]);

  const shouldRenderImage =
    (eager || requestedSrc === src || !supportsIntersectionObserver) &&
    failedSrc !== src;

  return (
    <span
      ref={containerRef}
      className={className}
      aria-hidden={alt.length === 0 ? true : undefined}
    >
      {shouldRenderImage ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        getFallbackLetter(fallbackLabel)
      )}
    </span>
  );
}
