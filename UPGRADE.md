# 1.8.0

Released 2026-10-05 · upgrade from `1.7.2` · developer-facing

## What changed

| Area        | Change                                    | Config impact                                |
| ----------- | ----------------------------------------- | -------------------------------------------- |
| Skrining    | Per-question radio answers, exclude list  | adds `skrining.answers`, `skrining.excludes` |
| Not-checked | List is now a skip list, auto-uncheck off | removes 4 delay keys                         |
| Skrining    | Manual fill trigger button                | none                                         |

## Skrining radio answers and excludes (#137)

### Schema

```diff
   "skrining": {
-    "url": ""
+    "url": "",
+    "answers": {},
+    "excludes": ""
   }
```

### Example

```json
"skrining": {
  "url": "https://example.go.id/skrining",
  "answers": { "answer8AA": "B", "answer12AA": "C" },
  "excludes": "answer3AA;answer7AA"
}
```

### Rules

- `answers` is keyed by the **first** radio id of each question group.
- `excludes` is a `;`-separated string and always wins over `answers`.
- Questions with no stored answer keep the previous behaviour.
- `DEFAULT_CONFIG` and `migrateConfig()` in `src/configuration.js` fill the new keys, so existing profiles pick them up automatically.

### New helper module

`src/utils/skriningConfig.js` exports `getAnswers`, `saveAnswers`, `addAnswer`, `removeAnswer`, `isAnswerPinned`, `getSkriningExcludes`, `toggleSkriningExclude`.

### Validation

`skrining.excludes` is now type-checked as a string through `PROFILE_STRING_FIELDS`; `skrining.answers` is a free-form object.

## Not-checked list is now a skip list (#135)

### Removed keys

```diff
   "notChecked": {
     "url": "",
-    "notCheckedList": "",
-    "automationDelay": 2000,
-    "itemDelay": 1000,
-    "reloadDelay": 1000,
-    "domTimeout": 5000
+    "notCheckedList": ""
   },
```

Old configs stay valid: `configValidator` only type-checks known fields and never rejects unknown profile keys, so the removed keys are ignored and disappear on the next `migrateConfig()` run.

### Behaviour

- Rows listed in `notCheckedList` count toward the purchased quota with no click, fill, or reload.
- The monkey button, its automation engine, and the pending/total queue storage are gone.
- `skrining-form-not-checked` is deprecated and now only gates the handler, without the Zen/Zero buttons.

## Manual radio fill trigger (#136)

The `dandelion-skrining-manual` button in the control panel fills once, then stops the observer.

## Other fixes

- #134 — detect the new DOM done state, so finished rows are no longer queued and completion is not claimed early.
- #140 — render the persisted view count on the share page.

## Upgrade checklist

1. `pnpm install && pnpm lint && pnpm format:check && pnpm test`
2. `pnpm build`, then confirm `dist/*/manifest.json` reports `1.8.0`
3. `pnpm verify:firefox`
4. No manual migration needed — `migrateConfig()` handles legacy configs
5. Terms get re-prompted: `src/configuration.js:77` compares `dandelion_terms.version` against the manifest version, so every user is asked to accept the terms again after this bump
6. Optional: strip the four removed `notChecked.*` keys from any hand-maintained config JSON
