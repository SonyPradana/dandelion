import { getAgreement, setAgreement } from "../configuration";

document.addEventListener("DOMContentLoaded", () => {
  const agreeCheckbox = document.getElementById("agree-checkbox");

  getAgreement().then((agreed) => {
    agreeCheckbox.checked = agreed;
  });

  agreeCheckbox.addEventListener("change", () => {
    setAgreement(agreeCheckbox.checked);
  });
});