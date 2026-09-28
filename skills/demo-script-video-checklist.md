---
name: demo-script-video-checklist
description: Prepare a truthful product walkthrough script and screen-recording checklist for the Pravi infrastructure asset inventory. Use whenever asked to plan or record a demo, hackathon video, screen recording, walkthrough, pitch, or feature narration. Tailor the flow to implemented behavior and clearly identify mock or assumed parts.
---

# Demo Script and Video Checklist

## Before writing the script

1. Inspect the running application’s routes, current UI, seed data, and project brief. Do not promise a feature based on a plan or schema alone.
2. Review `Decision.md` and distinguish confirmed decisions from prototype assumptions and open questions.
3. Pick a compact real-world scenario. The initial vertical slice is a road segment, but explain how shared concepts can extend to other fixed public infrastructure only when the implementation supports that claim.
4. Identify which actions are actually interactive, which data are synthetic, and which screens or services are mocked.

## Script structure

Create a concise sequence with:

- Opening: public-sector problem and intended users.
- Scenario: a specific asset and the operational need being demonstrated.
- Walkthrough: asset registration, review/verification, inspection or condition assessment, maintenance/work order, and history only where those steps exist in the app.
- Role context: explain what the current user can do and why, without presenting client-controlled role selection as security.
- Close: value demonstrated, current prototype boundary, and next planned increment.

For every scene, provide the on-screen action, narration, expected result, and estimated duration. Include a fallback if the app or network fails.

## Recording safeguards

- Use synthetic asset names, locations, staff identities, and records. Avoid real citizen, employee, government, or sensitive infrastructure information.
- Keep passwords, API keys, environment variables, account emails, browser autofill, private tabs, and admin consoles out of frame.
- Use a clean browser profile, hide notifications, verify screen dimensions/audio, and rehearse once before capture.
- Do not claim production readiness, government adoption, integrations, security certifications, or deployed functionality without evidence.
- Describe assumptions and limitations plainly; do not conceal incomplete flows with narration that implies they work.

## Deliverable

Provide a timed shot list, spoken script, preflight checklist, and post-recording review checklist. If the user asks only for a script, keep recording operations as a brief checklist. Keep language natural and suitable for a placement/hackathon panel.
