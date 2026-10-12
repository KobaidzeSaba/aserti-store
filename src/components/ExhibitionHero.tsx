"use client";
import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { editorial } from "@/lib/editorial";

export function ExhibitionHero({ locale }: { locale: Locale }) {
  const [paused, setPaused] = useState(false);
  const t = editorial(locale);
  return (
    <section
      className={`exhibition-hero${paused ? " is-paused" : ""}`}
      aria-label="ASERTI — Order in Chaos"
    >
      <div className="hero-topline micro">
        <span>{t.origin}</span>
        <span>TBILISI — 2026</span>
      </div>
      <h1 className="hero-wordmark">ASERTI</h1>
      <div className="hero-visual">
        <Image
          src="/brand/fusion-cutout.png"
          alt="A rough black stone surface meeting a mirror-polished sculptural form"
          fill
          priority
          sizes="(max-width: 700px) 95vw, 62vw"
          className="hero-object"
        />
      </div>
      <div className="hero-concept">
        <p className="micro">ORDER IN CHAOS</p>
        <span className="hero-101">101</span>
      </div>
      <div className="hero-object-note micro">
        <span>OBJECT STUDY — 01</span>
        <span className="muted">STONE / MIRROR</span>
      </div>
      <div className="hero-bottom micro">
        <a href="#material">
          {t.explore} <span aria-hidden>↓</span>
        </a>
        <button
          onClick={() => setPaused(!paused)}
          aria-label={paused ? t.play : t.pause}
          aria-pressed={paused}
        >
          <span aria-hidden>{paused ? "▷" : "Ⅱ"}</span> {t.movement}
        </button>
        <span className="hero-page-marker">001 — ∞</span>
      </div>
    </section>
  );
}
