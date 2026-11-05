# Nimbo OS 0.14.4 Beta 4 — WhiteSur adaptation

## Applied styling

- Replaced every Nimbo application and mini-app drawing with its mapped WhiteSur SVG asset.
- WhiteSur GTK palette and controls: neutral white/light-gray surfaces, #0860f2 selection blue, 8px control rhythm, subtle separators, rounded header bars, sidebars, fields and focus states; a dark palette follows WhiteSur's #242424/#333333 surfaces and #2e7cf7 accent.
- Original WhiteSur SVGs are embedded into the generated HTML as data URIs, so the preview is self-contained and the PWA remains offline-capable.
- Existing app names, 50 mini-apps, navigation, PWA manifest, update flow and local data remain in the Nimbo package.

## References

- WhiteSur Icon Theme: https://github.com/vinceliuice/WhiteSur-icon-theme
- WhiteSur GTK Theme: https://github.com/vinceliuice/WhiteSur-gtk-theme

The selected icon artwork is copied unchanged from WhiteSur Icon Theme. `public/whitesur/COPYING` carries its GPL-3.0 license text and `public/whitesur/ATTRIBUTION.md` records source and revision. The GTK repository is a visual reference; its GTK-specific files are not copied because Nimbo is a browser app. Its appearance is adapted in `src/whitesur-skin.css`.

## Scope

This is a browser-based visual adaptation. It does not install or activate a GTK theme in the host Linux desktop, and does not change the system icons outside Nimbo OS.
