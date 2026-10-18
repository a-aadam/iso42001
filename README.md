# ISO/IEC 42001 Project Initiation Workbook

A browser-only workbook for documenting the first steps of an **ISO/IEC 42001:2023** AI management system (AIMS) project.

**Live app:** https://a-aadam.github.io/iso42001/

There's no backend and no sign-up. Everything you type is stored in your own browser and never leaves your device unless you export it.

## What's inside

A **How to use** guide and ten worksheets, each reproducing the fields and tables of a standard template:

| Worksheet | Clause |
|---|---|
| Context and Interested Parties | 4.1 · 4.2 |
| Legal and Compliance Obligations Register | Compliance obligations |
| AI Policy | 5.2 |
| AI System Impact Assessment | 6.1.4 · 8.4 |
| AI Risk Register | 6.1.2 · 8.2 |
| Statement of Applicability (all 38 Annex A controls) | 6.1.3 |
| Objectives and KPI Tracker | 6.2 |
| Gap Analysis (Clauses 4–10 and Annex A) | 4.1–10.2 · Annex A |
| Internal Audit Checklist | 9.2 |
| Certification Readiness Checklist | Stage 1 preparation |

## Features

- **Autosave:** every worksheet saves to `localStorage` as you type.
- **Export / import XML:** save any worksheet as a readable XML file, then load it back on any machine.
- **Print / PDF:** each worksheet prints as a clean paper copy for your audit evidence pack.
- **Examples:** each section has a short worked example (using a fictional lender) showing what to write.
- **Calculations:** risk score (L × C) and risk level, live status tallies, and audit summary counts.
- **Light and dark themes:** use the toggle at the bottom left. The palette is soft white `#FFFFF9`, dark gray `#313638` and a lavender accent.
- **Responsive:** usable on a phone, with the worksheet list in a slide-out drawer.

## Running locally

It's plain HTML, CSS and JavaScript, with no build step and no dependencies. Serve the folder with any static server, for example:

```bash
npx serve .
```

Opening `index.html` directly also works in most browsers.

## Project structure

```
index.html         App shell and the How to use guide
css/styles.css     Design tokens, layout, themes, print styles
js/worksheets.js   Worksheet definitions (every field, column and fixed row)
js/app.js          Rendering, autosave, calculations, XML export/import, theme
```

To change a worksheet, edit its definition in `js/worksheets.js`. Rendering, saving, progress and XML export all derive from it.

## Hosting

The site is served by GitHub Pages from the `main` branch root (Settings → Pages → Deploy from a branch → `main` / `root`).

## Credits

Worksheet structure is based on the free ISO 42001 templates from AuditWorkshop.com. ISO/IEC 42001 is a standard published by ISO and IEC. This project isn't affiliated with or endorsed by ISO, IEC or any certification body, and using it doesn't by itself make an organisation conform to the standard.
