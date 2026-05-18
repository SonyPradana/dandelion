# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
