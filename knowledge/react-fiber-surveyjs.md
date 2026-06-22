# React Fiber: Mengakses SurveyJS Model Instance

## Latar Belakang

SkriningForm selama ini mengisi dropdown SurveyJS dengan cara **open dropdown → click option**. Pendekatan ini punya kelemahan: timing issue saat UI belum siap menyebabkan form tidak terisi.

## Penemuan

SurveyJS Form Library (versi React) menyimpan **model instance** di React fiber tree. Dengan menelusuri fiber parent (`fiber.return`), kita bisa menemukan komponen Survey yang memiliki `model` di `pendingProps`-nya.

```javascript
const rootEl = document.querySelector('.sd-root-modern');
const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber$'));
let fiber = rootEl[fiberKey];
while (fiber) {
  const p = fiber.pendingProps;
  if (p?.model?.setValue) return p.model;
  if (p?.survey?.setValue) return p.survey;
  fiber = fiber.return;
}
```

## API SurveyJS yang Dipakai

```javascript
survey.setValue('questionName', 'optionValue');

const question = survey.getQuestionByName('questionName');
question.value = 'optionValue';

survey.data = { questionName: 'optionValue' };
survey.mergeData({ questionName: 'optionValue' });
```

## Cara Kerja di Kode Kita

File: `src/handlers/skriningform/find-survey.js`

Mencari survey instance lewat 3 metode (cascading fallback):

1. **Window global** — `window.survey`
2. **Knockout** — `ko.dataFor('.sd-root-modern')`
3. **React fiber** — parent traversal dari `.sd-root-modern`

Cache di-reset setiap `performFormFill` dipanggil (`clearSurveyCache()`).

## Implementasi Hybrid

```
if survey ditemukan + question + choices cocok:
  → survey.setValue(dataName, match.value)
else:
  → fallback ke open+click (seperti biasa)
```

## Referensi

- [SurveyJS API: Access and Modify Survey Results](https://surveyjs.io/form-library/documentation/access-and-modify-survey-results)
- [SurveyJS API: Question.value](https://surveyjs.io/form-library/documentation/api-reference/question)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
