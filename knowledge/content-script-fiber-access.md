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

## Environment Details

The target page is a **Next.js App Router** application with React Server Components (RSC). SurveyJS forms are rendered as client components embedded in the RSC tree. The entire `<body>` is a single React tree.

**Form structure (confirmed from raw HTML):**
- 6 dropdown questions on the page
- Each has `data-name` like `LPM000002|FRM000169|PPM00000706|text`
- SurveyJS popup exists in DOM with `style="display: none"` (not rendered until opened)
- Chevron buttons use `.sd-dropdown_chevron-button` class
- Choices data not visible in HTML — only loaded by SurveyJS when popup opens

## Recommendation for Future

### Priority 1: Verify `findFiberViaInjectedScript()` in browser
The code already exists at `src/handlers/skriningform/find-survey.js`. Test it live:
1. Load page
2. Run in console: inject a script that sets `el.__dandelionSurvey`, then in content script check `el.__dandelionSurvey.setValue`

### Priority 2: React DevTools Hook
`window.__REACT_DEVTOOLS_GLOBAL_HOOK__` may be accessible from content scripts. Check if SurveyJS registers with it. If so, React fiber traversal via DevTools hook is possible without script injection.

### Priority 3: Injected script that performs fill directly (most robust)
Skip the model-passing problem entirely: inject a `<script>` that finds the model and calls `setValue` for all dropdowns in one shot. No communication back to content script needed — the content script only needs to pass the config keywords and data-names as JSON embedded in the script text.

```js
function fillAllViaInjectedScript(config, dataNames) {
  const script = document.createElement('script');
  script.textContent = `(function(){
    var el = document.querySelector('.sd-root-modern');
    var k = Object.keys(el).find(function(k){return k.startsWith('__reactFiber$')});
    if(!k)return;
    var f = el[k];
    var model = null;
    while(f){ 
      if(f.pendingProps && f.pendingProps.model && f.pendingProps.model.setValue){ model = f.pendingProps.model; break; }
      if(f.pendingProps && f.pendingProps.survey && f.pendingProps.survey.setValue){ model = f.pendingProps.survey; break; }
      f = f.return;
    }
    if(!model)return;
    var config = ${JSON.stringify(config)};
    var names = ${JSON.stringify(dataNames)};
    for(var i=0;i<names.length;i++){
      var q = model.getQuestionByName(names[i]);
      if(!q)continue;
      var choices = q.visibleChoices || q.choices || [];
      var match = choices.find(function(c){ return config.indexOf((c.text||c.value||c||'').toString().trim()) !== -1 });
      if(match) model.setValue(names[i], match.value || match);
    }
  })()`;
  document.body.appendChild(script);
  script.remove();
}
```

This bypasses the isolated world entirely — the fill logic runs in the main world where React fiber is fully accessible.

### Alternative: `chrome.scripting.executeScript()`
With `"world": "MAIN"` in MV3, you can execute scripts in the main world. Same principle as injected script but using the extension API instead of DOM injection.
