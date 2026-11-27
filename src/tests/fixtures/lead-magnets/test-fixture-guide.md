---
title: "Test fixture guide (not real content)"
description: "Fixture lead magnet used by the automated tests for the signed download route. Not a real Boximity resource."
date: "2026-10-17"
published: true
assetFile: test-fixture-guide.pdf
assetLabel: "Download the fixture"
---

A test fixture, not a real resource. The tests point the lead magnet loader
here with `LEAD_MAGNET_CONTENT_DIR` (honored only under `NODE_ENV=test`), so
the loader, the signed download route and the `/resources/[slug]` page can be
tested end to end against real files on disk without a fake magnet ever being
published from `content/lead-magnets`.
