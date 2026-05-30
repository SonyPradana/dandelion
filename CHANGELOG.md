# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-05-30

### Added

- Web-based JWT quota token generator with landing page and standalone TypeScript server (#46)
- PUBLIC_URL environment variable for production deployment behind tunnel (#49)
- Configurable control panel position (4 corners) with interactive settings selector (#52)
- Zen Mode Asist with configurable countdown timer, progress bar, and auto-fill on expiry (#54)
- Chrome nightly build support with date-stamped artifacts (#55)

### Changed

- Increase default daily quota limit (#50)
- Optimize development server with build caching, ETag/304 support, path traversal guard, and static file extension whitelist (#53)

## [1.3.0] - 2026-05-23

### Added

- Device binding for JWT tokens with device ID generation, wildcard version support, and auto-trim on paste (#42)
- Reactive agreement blocker via storage.onChanged with persetujuan configuration tab (#43)

### Changed

- Migrate builds to ESM format with native minification and shared rolldown configuration (#44)

### Fixed

- Support row-FRM id format in addition to rowfrm for structure 2 (#48)

## [1.2.0] - 2026-05-19

### Added

- Offline JWT token system with license routing and PRO UI (#41)
- Recursive form filling with processedKeys for dynamic SurveyJS items (#40)
- Duplicate profile feature in ProfileManager (#39)
- Daily limit enforcement and main.js async/await refactor (#38)

## [1.1.0] - 2026-05-17

### Added

- Weighted productivity system with chain validation, auto-adaptive chart, and popup-to-page navigation (#36)

### Fixed

- Support mobile dropdown overlay selector in fillDropdowns (#37)

### Security

- Migrate queue from localStorage to browser.storage.local (#35)

## [1.0.2] - 2026-05-11

### Added

- Full configuration page with vertical tab navigation and options_ui entry (#34)

### Fixed

- Use static-copy to prevent uncopied components in Firefox build (#33)

## [1.0.1] - 2026-05-11

### Added

- Firefox build pipeline with independent manifest, AMO signing, and cross-platform packaging (#32)

### Changed

- Configuration restructured per-handler with auto-migration from legacy flat format (#31)

## [1.0.0] - 2025-10-31

### Added

- Initial extension release
- Blur UI when task finishes
- Skip form from checklist
- Zen mode for focused entry form
- Collapsible configuration panel
- Debug information panel
- Export/import configuration
- Pinned dropdown and input support
- Scroll to bottom on completed fill form
- Modular configuration by handler
- Notification system
- Firefox support foundation
