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

function findSurveyInstance() {
  if (_surveyCache !== null) return _surveyCache;

  if (window.survey?.setValue) {
    _surveyCache = window.survey;
    return _surveyCache;
  }

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

  const rootEl = document.querySelector('.sd-root-modern') || document.querySelector('[data-name]');
  if (rootEl) {
    const fiberKey = Object.keys(rootEl).find((k) => k.startsWith('__reactFiber$'));
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
