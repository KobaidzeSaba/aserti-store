"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ExhibitionMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) {
            target.classList.remove("reveal-pending");
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.08 },
    );
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top > window.innerHeight) {
        target.classList.add("reveal-pending");
        observer.observe(target);
      }
    });
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.classList.remove("reveal-pending"));
    };
  }, [pathname]);
  return null;
}
