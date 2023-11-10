// src/nova-validation.js
var novaCustomValidationEvent = new Event("nova:custom-validation");
function init() {
  window.addEventListener("focusout", (e) => {
    validateElement(e.target);
  });
  window.addEventListener("submit", (e) => {
    let results = validateForm(e.target);
    if (results.length > 0) {
      e.preventDefault();
      results[0].focus();
    }
  }, true);
  window.addEventListener("DOMContentLoaded", (e) => {
    document.querySelectorAll("form").forEach((frm) => {
      if (!frm.hasAttribute("nova-ignore")) {
        frm.setAttribute("novalidate", "");
      }
    });
  });
}
function validateElement(el) {
  let valid = true;
  let form = el.closest("form");
  if (form && form.hasAttribute("nova-ignore")) {
    return null;
  }
  if (el.type == "radio") {
    let ancestor = form ? form : document;
    if (ancestor.querySelector("input[type=radio][name=" + el.name + "][nova-ignore]")) {
      return null;
    }
    let checked = ancestor.querySelector("input[type=radio][name=" + el.name + "][checked]");
    let required = ancestor.querySelector("input[type=radio][name=" + el.name + "][required]");
    let errMarker = ancestor.querySelector("input[type=radio][name=" + el.name + "][aria-errormessage]");
    let errId = null;
    let errEl = null;
    if (errMarker) {
      errId = errMarker.getAttribute("aria-errormessage");
      errEl = document.getElementById(errId);
    }
    if (checked && required) {
      if (errEl) {
        errEl.innerText = "";
        errEl.hidden = true;
      }
      ancestor.querySelector("input[type=radio][name=" + el.name + "][aria-invalid]").removeAttribute("aria-invalid");
    } else if (required) {
      if (!errEl) {
        let first = ancestor.querySelector("input[type=radio][name=" + el.name + "]");
        let id = getUniqueId("nova-error-element-");
        let errEl2 = document.createElement("div");
        errEl2.setAttribute("id", id);
        errEl2.setAttribute("class", "nova-errormessage");
        first.before(errEl2);
        first.setAttribute("aria-errormessage", id);
      }
      errDef = ancestor.querySelector("input[type=radio][name=" + el.name + "][nova-error-valuemissing],input[type=radio][name=" + el.name + "][nova-error-required],input[type=radio][name=" + el.name + "][nova-error]");
      errEl.innerText = findErrorMessage(errDef || el, ["nova-error-valuemissing", "nova-error-required", "nova-error"]);
      errEl.hidden = false;
      required.setAttribute("aria-invalid", "true");
    }
  } else if (el.tagName !== "BUTTON" && !["button", "submit", "reset", "hidden"].includes(el.type)) {
    if (el.hasAttribute("nova-ignore")) {
      return null;
    }
    let attrs = el.getAttributeNames();
    let errId = null;
    let errEl = null;
    if (attrs.includes("aria-errormessage")) {
      errId = el.getAttribute("aria-errormessage");
      errEl = document.getElementById(errId);
    }
    el.dispatchEvent(novaCustomValidationEvent);
    const code = el.getAttribute("nova-custom-validation");
    if (code) {
      let msg = Function("$element", "return " + code)(el);
      el.setCustomValidity(msg);
    }
    if (!el.checkValidity()) {
      valid = false;
      el.setAttribute("aria-invalid", "true");
      if (!errId) {
        errId = "nova-error-element-" + Math.floor(Math.random() * 9999999999999).toString(36);
        el.setAttribute("aria-errormessage", errId);
      }
      if (!errEl) {
        errEl = document.createElement("div");
        errEl.id = errId;
        errEl.class = "nova-errormessage";
        el.after(errEl);
      }
      let messageAttrs = [];
      if (el.validity.badInput) {
        messageAttrs = ["nova-error-badinput", "nova-error"];
      } else if (el.validity.customError) {
        messageAttrs = ["nova-error-customerror", "nova-error"];
      } else if (el.validity.patternMissmatch) {
        messageAttrs = ["nova-error-patternmismatch", "nova-error"];
      } else if (el.validity.rangeOverflow) {
        messageAttrs = ["nova-error-rangeoverflow", "nova-error-range", "nova-error"];
      } else if (el.validity.rangeUnderflow) {
        messageAttrs = ["nova-error-rangeunderflow", "nova-error-range", "nova-error"];
      } else if (el.validity.stepMismatch) {
        messageAttrs = ["nova-error-stepmismatch", "nova-error"];
      } else if (el.validity.tooLong) {
        messageAttrs = ["nova-error-toolong", "nova-error-length", "nova-error"];
      } else if (el.validity.tooShort) {
        messageAttrs = ["nova-error-tooshort", "nova-error-length", "nova-error"];
      } else if (el.validity.typeMismatch) {
        messageAttrs = ["nova-error-typemismatch", "nova-error"];
      } else if (el.validity.valueMissing) {
        messageAttrs = ["nova-error-valuemissing", "nova-error-required", "nova-error"];
      }
      errEl.innerText = findErrorMessage(el, messageAttrs);
      errEl.hidden = false;
    } else {
      el.removeAttribute("aria-invalid");
      if (errEl) {
        errEl.hidden = true;
        errEl.innerText = "";
      }
    }
  }
  return valid;
}
function validateForm(frm) {
  if (frm.hasAttribute("nova-ignore")) {
    return [];
  }
  let invalidFields = [];
  for (let i = 0; i < frm.elements.length; i++) {
    let status = validateElement(frm.elements[i]);
    if (status === false) {
      invalidFields.push(frm.elements[i]);
    }
  }
  return invalidFields;
}
function findErrorMessage(el, attrList) {
  let attrs = el.getAttributeNames();
  let min = getNumericAttrributeValue(el, "min");
  let max = getNumericAttrributeValue(el, "max");
  let minLen = getNumericAttrributeValue(el, "minlength");
  let maxLen = getNumericAttrributeValue(el, "maxlength");
  let step = getNumericAttrributeValue(el, "step");
  let prevStep = isNaN(step) ? "" : el.value - el.value % step;
  let nextStep = isNaN(step) ? "" : el.value + (step - el.value % step);
  for (let i = 0; i < attrList.length; i++) {
    if (attrs.includes(attrList[i])) {
      let error = el.getAttribute(attrList[i]).trim();
      error = error.replace("%min%", min);
      error = error.replace("%max%", max);
      error = error.replace("%minlength%", minLen);
      error = error.replace("%maxlength%", maxLen);
      error = error.replace("%step%", step);
      error = error.replace("%previousstep%", prevStep);
      error = error.replace("%nextstep%", nextStep);
      if (error != "") {
        return error;
      }
    }
  }
  return el.validationMessage;
}
function getNumericAttrributeValue(el, attributeName) {
  attr = el.getAttribute(attributeName);
  if (isNaN(attr)) {
    return "";
  }
  return attr;
}
function getUniqueId(prefix) {
  return prefix + Math.Math.floor(Math.random() * 9999999999999).toString(36);
}
var nova_validation_default = init;
export {
  nova_validation_default as default,
  validateElement,
  validateForm
};
