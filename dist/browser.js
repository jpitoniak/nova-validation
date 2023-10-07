(() => {
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
        results[0].element.focus();
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
  function validateElement(el2) {
    let valid = true;
    let form = el2.closest("form");
    if (form && form.hasAttribute("nova-ignore")) {
      return null;
    }
    if (el2.type == "radio") {
      let ancestor = form ? form : document;
      if (ancestor.querySelector("input[type=radio][name=" + el2.name + "][nova-ignore]")) {
        return null;
      }
      let checked = ancestor.querySelector("input[type=radio][name=" + el2.name + "][checked]");
      let required = ancestor.querySelector("input[type=radio][name=" + el2.name + "][required]");
      let errMarker = ancestor.querySelector("input[type=radio][name=" + el2.name + "][aria-errormessage]");
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
        ancestor.querySelector("input[type=radio][name=" + el2.name + "][aria-invalid]").removeAttribute("aria-invalid");
      } else if (required) {
        if (!errEl) {
          let first = ancestor.querySelector("input[type=radio][name=" + el2.name + "]");
          let id = getUniqueId("nova-error-element-");
          let errEl2 = document.createElement("div");
          errEl2.setAttribute("id", id);
          errEl2.setAttribute("class", "nova-errormessage");
          first.parentNode.insertBefore(errEl2);
          first.setAttribute("aria-errormessage", id);
        }
        errDef = ancestor.querySelector("input[type=radio][name=" + el2.name + "][nova-error-valuemissing],input[type=radio][name=" + el2.name + "][nova-error-required],input[type=radio][name=" + el2.name + "][nova-error]");
        errEl.innerText = findErrorMessage(errDef || el2, ["nova-error-valuemissing", "nova-error-required", "nova-error"]);
        errEl.hidden = false;
        required.setAttribute("aria-invalid", "true");
      }
    } else if (el2.tagName !== "BUTTON" && !["button", "submit", "reset", "hidden"].includes(el2.type)) {
      if (el2.hasAttribute("nova-ignore")) {
        return null;
      }
      let attrs = el2.getAttributeNames();
      let errId = null;
      let errEl = null;
      if (attrs.includes("aria-errormessage")) {
        errId = el2.getAttribute("aria-errormessage");
        errEl = document.getElementById(errId);
      }
      el2.dispatchEvent(novaCustomValidationEvent);
      const code = el2.getAttribute("nova-custom-validation");
      if (code) {
        let msg = Function("$element", "return " + code)(el2);
        el2.setCustomValidity(msg);
      }
      if (!el2.checkValidity()) {
        valid = false;
        el2.setAttribute("aria-invalid", "true");
        if (!errId) {
          errId = "nova-error-element-" + Math.floor(Math.random() * 9999999999999).toString(36);
          el2.setAttribute("aria-errormessage", errId);
        }
        if (!errEl) {
          let newEl = document.createElement("div");
          newEl.id = errId;
          newEl.class = "nova-errormessage";
          el2.parentNode.insertAfter(el2);
        }
        let messageAttrs = [];
        if (el2.validity.badInput) {
          messageAttrs = ["nova-error-badinput", "nova-error"];
        } else if (el2.validity.customError) {
          messageAttrs = ["nova-error-customerror", "nova-error"];
        } else if (el2.validity.patternMissmatch) {
          messageAttrs = ["nova-error-patternmismatch", "nova-error"];
        } else if (el2.validity.rangeOverflow) {
          messageAttrs = ["nova-error-rangeoverflow", "nova-error-range", "nova-error"];
        } else if (el2.validity.rangeUnderflow) {
          messageAttrs = ["nova-error-rangeunderflow", "nova-error-range", "nova-error"];
        } else if (el2.validity.stepMismatch) {
          messageAttrs = ["nova-error-stepmismatch", "nova-error"];
        } else if (el2.validity.tooLong) {
          messageAttrs = ["nova-error-toolong", "nova-error-length", "nova-error"];
        } else if (el2.validity.tooShort) {
          messageAttrs = ["nova-error-tooshort", "nova-error-length", "nova-error"];
        } else if (el2.validity.typeMismatch) {
          messageAttrs = ["nova-error-typemismatch", "nova-error"];
        } else if (el2.validity.valueMissing) {
          messageAttrs = ["nova-error-valuemissing", "nova-error-required", "nova-error"];
        }
        errEl.innerText = findErrorMessage(el2, messageAttrs);
        errEl.hidden = false;
      } else {
        el2.removeAttribute("aria-invalid");
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
    for (let i = 0; i < el.elements.length; i++) {
      let status = validateElement(frm.elements[i]);
      if (status === false) {
        invalidFields.push(frm.elements[i]);
      }
    }
    return invalidFields;
  }
  function findErrorMessage(el2, attrList) {
    let attrs = el2.getAttributeNames();
    let min = getNumericAttrributeValue(el2, "min");
    let max = getNumericAttrributeValue(el2, "max");
    let minLen = getNumericAttrributeValue(el2, "minlength");
    let maxLen = getNumericAttrributeValue(el2, "maxlength");
    let step = getNumericAttrributeValue(el2, "step");
    let prevStep = isNaN(step) ? "" : el2.value - el2.value % step;
    let nextStep = isNaN(step) ? "" : el2.value + (step - el2.value % step);
    for (let i = 0; i < attrList.length; i++) {
      if (attrs.includes(attrList[i])) {
        let error = el2.getAttribute(attrList[i]).trim();
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
    return el2.validationMessage;
  }
  function getNumericAttrributeValue(el2, attributeName) {
    attr = el2.getAttribute(attributeName);
    if (isNaN(attr)) {
      return "";
    }
    return attr;
  }
  function getUniqueId(prefix) {
    return prefix + Math.Math.floor(Math.random() * 9999999999999).toString(36);
  }
  var nova_validation_default = init;

  // src/browser.js
  nova_validation_default();
})();
