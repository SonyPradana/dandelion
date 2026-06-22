import { detectFieldType } from './fill-pinned-fields';

export function isFieldFilled(questionElement) {
  const field = detectFieldType(questionElement);
  if (!field) return false;
  const value = field.getValue();
  return value !== null && value !== '';
}

export function isRadioFilled(questionElement) {
  return questionElement.querySelector('input[type="radio"]:checked') !== null;
}
