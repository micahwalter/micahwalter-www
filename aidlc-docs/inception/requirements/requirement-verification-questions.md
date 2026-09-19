# Photo Map Privacy — Requirement Verification Questions

Answers recorded 2026-09-19 (interactive chat).

---

## Question 1 — How coarse should the public location be?

A) Neighborhood scale (~1 km) — round public coords to **2 decimal places** (~1.1 km)

[Answer]: A

---

## Question 2 — Map UI when coordinates are shown

B) Show an **area** (larger bbox / no pin, or a soft highlight) centered on the public coords — avoid implying an exact spot

[Answer]: B

---

## Question 3 — Existing photos already enriched with ~110 m public coords

A) **Backfill** — re-fuzz (and optionally re-enrich) existing photos so the live site updates for old uploads

[Answer]: A

---

## Question 4 — Scope of this change

A) **Server + UI** — change fuzz algorithm in the enricher (`geo.js`) and adjust map zoom/marker behavior in `PhotoStaticMap` / `photos-api`

[Answer]: A

---

## Question 5 — Security Extensions

[Answer]: B (No — skip)

---

## Question 6 — Resiliency Extensions

[Answer]: B (No — skip)

---

## Question 7 — Property-Based Testing Extension

[Answer]: C (No — skip)
