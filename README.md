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
- **Save as PDF:** downloads a text-based PDF of each worksheet for your audit evidence pack. It uses jsPDF, loaded from cdnjs on first use, and falls back to the browser print dialog when offline.
- **Template text:** default policy wording appears as greyed placeholder text. Click into a field to write your own, or use **Use template text** to start from the template.
- **Examples:** each section has a short worked example (using a fictional lender) showing what to write.
- **Calculations:** risk score (L × C) and risk level, live status tallies, and audit summary counts.
- **Light and dark themes:** use the toggle at the bottom left. The palette is soft white `#FFFFF9`, dark gray `#313638` and a lavender accent.
- **Responsive:** usable on a phone, with the worksheet list in a slide-out drawer.

## Hosting

The site is served by GitHub Pages from the `main` branch root (Settings → Pages → Deploy from a branch → `main` / `root`).

## About

This is a personal project built for learning purposes, made using Claude Code. The texts were written by a human through online research, and some have been enhanced and reworked by Claude. It replicates how an auditor would tackle a project, but it is not fully made for enterprise use. The user bares the responsibility if it is used in an enterprise environment.

## Credits

Worksheets structures are based on the free ISO 42001 templates and research found online from but not limited to AuditWorkshop, Sprinto or Drata. ISO/IEC 42001 is a standard published by ISO and IEC. This project isn't affiliated with or endorsed by ISO, IEC or any certification body, and using it doesn't by itself make an organization conform to the standard.
