let _surveyCache = null;

function walkReactFiber(rootFiber) {
  let fiber = rootFiber;
  while (fiber) {
    const p = fiber.pendingProps;
    if (p?.model?.setValue) return p.model;
    if (p?.survey?.setValue) return p.survey;
    fiber = fiber.return;
  }
  return null;
}

function findFiberViaInjectedScript() {
  const rootEl = document.querySelector('.sd-root-modern');
  if (!rootEl) return null;

  const script = document.createElement('script');
  script.textContent = `
    (function(){
      var el=document.querySelector('.sd-root-modern');
      if(!el)return;
      var k=Object.keys(el).find(function(k){return k.startsWith('__reactFiber$')});
      if(!k)return;
      var f=el[k];
      while(f){
        var p=f.pendingProps;
        if(p&&p.model&&p.model.setValue){el.__dandelionSurvey=p.model;return}
        if(p&&p.survey&&p.survey.setValue){el.__dandelionSurvey=p.survey;return}
        f=f.return;
      }
    })();
  `;
  document.body.appendChild(script);
  script.remove();

  return rootEl.__dandelionSurvey || null;
}

function findSurveyInstance() {
  if (_surveyCache !== null) return _surveyCache;

  if (window.survey?.setValue) {
    _surveyCache = window.survey;
    return _surveyCache;
  }

  // Injected script runs in main world and has access to __reactFiber$ properties
  const injected = findFiberViaInjectedScript();
  if (injected) { _surveyCache = injected; return injected; }

  if (typeof window.ko?.dataFor === 'function') {
    const root = document.querySelector('.sd-root-modern');
    if (root) {
      const vm = ko.dataFor(root);
      const s = vm?.survey?.setValue ? vm.survey : vm?.setValue ? vm : null;
      if (s) { _surveyCache = s; return s; }
    }
  }

  if (typeof window.ko?.contextFor === 'function') {
    const el = document.querySelector('.sd-dropdown_chevron-button');
    if (el) {
      const ctx = ko.contextFor(el);
      if (ctx) {
        let s = ctx.$data || ctx.$parent;
        let depth = 0;
        while (s && depth < 10) {
          if (s.setValue) { _surveyCache = s; return s; }
          if (s.survey?.setValue) { _surveyCache = s.survey; return s.survey; }
          s = s.$parent;
          depth++;
        }
      }
    }
  }

  // Direct fiber key discovery — unreliable from content script isolated world
  const rootEl = document.querySelector('.sd-root-modern') || document.querySelector('[data-name]');
  if (rootEl) {
    for (const key in rootEl) {
      if (key.startsWith('__reactFiber$')) {
        const survey = walkReactFiber(rootEl[key]);
        if (survey) { _surveyCache = survey; return survey; }
      }
    }
    const fiberKey = Object.getOwnPropertyNames(rootEl).find((k) => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      const survey = walkReactFiber(rootEl[fiberKey]);
      if (survey) { _surveyCache = survey; return survey; }
    }
  }

  return null;
}

export function getSurvey() {
  return findSurveyInstance();
}

export function clearSurveyCache() {
  _surveyCache = null;
}
