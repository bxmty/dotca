---
title: "Test fixture guide (not real content)"
description: "Fixture lead magnet used by the automated tests for the signed download route. Not a real Boximity resource."
date: "2026-10-17"
published: true
assetFile: test-fixture-guide.pdf
assetLabel: "Download the fixture"
---

This file and `assets/test-fixture-guide.pdf` exist so the lead magnet loader
and the signed download route can be tested end to end against real files on
disk. It is not a real resource. Replace it with the first real lead magnet
(and update `src/tests/api-lead-magnet-download.test.ts`) before any
`/resources` page lists published lead magnets.
