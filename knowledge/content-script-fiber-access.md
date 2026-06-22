# Chrome Extension Content Script vs React Fiber

## Problem

Chrome extension content scripts run in an **isolated world** — they share the DOM but not JavaScript contexts with the page. React attaches `__reactFiber$<hash>` properties directly on DOM elements (e.g., `.sd-root-modern`), but these properties are **invisible** from the content script's `Object.keys()`:

```js
// In main world console (works)
Object.keys(el).find(k => k.startsWith('__reactFiber$'))  // ✅ found

// In content script (fails)
Object.keys(el).find(k => k.startsWith('__reactFiber$'))  // ❌ returns undefined, keys.length === 0
```

This is a Chrome security behavior — expando properties set by page scripts are not enumerable via `Object.keys()` from the isolated world.

## Attempted Solutions

### 1. Alternative property discovery (did not work)
`for...in` and `Object.getOwnPropertyNames()` also failed to find the `__reactFiber$` key from the content script isolated world.

### 2. Script injection (unresolved — works in principle)
Injecting a `<script>` element runs code in the **main world**, which CAN access `__reactFiber$`:

```js
const script = document.createElement('script');
script.textContent = `(function(){
  var el = document.querySelector('.sd-root-modern');
  var k = Object.keys(el).find(function(k){return k.startsWith('__reactFiber$')});
  var f = el[k];
  while(f){
    var p = f.pendingProps;
    if(p&&p.model&&p.model.setValue){ el.__dandelionSurvey = p.model; return }
    f = f.return;
  }
})()`;
document.body.appendChild(script);
script.remove();
```

The survey model is stored as `el.__dandelionSurvey` which the content script can then read via direct property access (`el.__dandelionSurvey`).

**Status**: Code exists in `src/handlers/skriningform/find-survey.js` under `findFiberViaInjectedScript()` but was never verified to work end-to-end in a real browser. The `walkReactFiber` function remains functional.

## Recommendation for Future

- Use `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` if available — it's accessible from content scripts
- Or use `chrome.scripting.executeScript()` with `world: 'MAIN'` (MV3)
- The injected script approach (`<script>` element) should also work in MV3
