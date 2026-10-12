"use client";
import Image from "next/image";
import { useRef } from "react";
import type { Locale } from "@/i18n/config";
import { editorial } from "@/lib/editorial";

export function MaterialStudy({ locale }: { locale: Locale }) {
  const rail = useRef<HTMLDivElement>(null);
  const t = editorial(locale);
  return (
    <section
      className="material-section exhibition-section"
      id="material"
      aria-labelledby="material-title"
    >
      <div className="section-heading" data-reveal>
        <div>
          <p className="micro section-index">01 / RESEARCH</p>
          <h2 id="material-title">{t.materialStudy}</h2>
        </div>
        <div className="rail-controls">
          <button
            aria-label="Previous material"
            onClick={() =>
              rail.current?.scrollBy({
                left: -rail.current.clientWidth * 0.7,
                behavior: "smooth",
              })
            }
          >
            ←
          </button>
          <button
            aria-label="Next material"
            onClick={() =>
              rail.current?.scrollBy({
                left: rail.current.clientWidth * 0.7,
                behavior: "smooth",
              })
            }
          >
            →
          </button>
        </div>
      </div>
      <div
        className="material-rail"
        ref={rail}
        tabIndex={0}
        aria-label={t.materialStudy}
      >
        <figure className="material-frame material-frame-stone" data-reveal>
          <div className="study-image">
            <Image
              src="/brand/raw-stone.jpg"
              alt="Fractured stone, veins and sharp edges in macro detail"
              fill
              sizes="(max-width: 700px) 85vw, 43vw"
            />
          </div>
          <figcaption className="micro">
            <span>01 — {t.stone}</span>
            <span>SURFACE / RAW</span>
          </figcaption>
        </figure>
        <figure className="material-frame material-frame-wax" data-reveal>
          <div className="study-image">
            <Image
              src="/brand/material-study.png"
              alt="An artistic material study of wax, reflective metal and rough stone"
              fill
              sizes="(max-width: 700px) 85vw, 48vw"
            />
          </div>
          <figcaption className="micro">
            <span>02 — WAX / METAL</span>
            <span>FORM / TRACE</span>
          </figcaption>
        </figure>
        <figure className="material-frame material-frame-mirror">
          <div className="study-image">
            <Image
              src="/brand/fusion.jpg"
              alt="Polished reflective surface of the stone and mirror study"
              fill
              sizes="(max-width: 700px) 85vw, 36vw"
            />
          </div>
          <figcaption className="micro">
            <span>03 — {t.mirror}</span>
            <span>LIGHT / REFLECTION</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
