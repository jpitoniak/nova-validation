const novaCustomValidationEvent = new Event("nova:custom-validation")

/**
 * Initialize nova-validation
 * Disables built-in validation on all forms and sets window-level handlers for
 * focusout and submit events
 * @return {void}
 */
function init() {
	// Attach an event listener to the window object to catch all 'focusout' events on the page
	window.addEventListener('focusout', e => {
		// validate the element that just lost focus
        validateElement(e.target)
	})

    // Attach an event listener to the window object to catch all 'submit' events on the page
    // The listener uses event capturing instead of bubbling so that it will run early in the event
    // handling process.  This way it can preventDefault() before a form-level submit handler fires
	window.addEventListener('submit', e => {
		// validate the submitted form and get its status
	    let results = validateForm(e.target)

	    if(results.length > 0) {
	    	// results array has something in it so validation failed

	    	// stop the submission
	    	e.preventDefault()

	    	// return focus to first invalid element
	    	results[0].focus()
	    }
	}, true)

    // add novalidate attributes to all forms to prevent default validation on submit
	window.addEventListener("DOMContentLoaded", e => {
        document.querySelectorAll("form").forEach(frm => {
            // skip forms that have a nova-ignore attribute
            if(!frm.hasAttribute("nova-ignore")) {
                frm.setAttribute("novalidate", "")
            }
        })
    })
}

/**
 * Validate a form element
 * Returns boolean true if the element is valid, boolean false if invalid,
 * or null if the element is not validated because it (or it's parent form) contains
 * a nova-ignore attribute.
 * @param {element} The element to validate
 * @return {boolean|null} The result of the validation or null if validation was skipped
 */
function validateElement(el) {
	let valid = true

    // get the form the element is part of
    let form = el.closest("form")

    // skip validation if the form has a nova-ignore attribute
    if(form && form.hasAttribute("nova-ignore")) {
        return null
    }

	if(el.type == "radio") {
		// special handling for radio buttons
		// radio button constraints and status may be set on a different element than the current one

        // make sure only radios that are part of the current form are looked at
        // if the radios are not part of a form, query from the document root
        let ancestor = (form) ? form : document

        // if any element in the radiogroup has a nova-ignore attribute skip validation
        if(ancestor.querySelector("input[type=radio][name=" + el.name + "][nova-ignore]")) {
            return null
        }

        // get the "checked" element (if any) from all in group
        let checked = ancestor.querySelector("input[type=radio][name=" + el.name + "][checked]")
        // get the element with the required atrribute (if any) in the group
        let required = ancestor.querySelector("input[type=radio][name=" + el.name + "][required]")
        // get the element that will display the error message
        let errMarker = ancestor.querySelector("input[type=radio][name=" + el.name + "][aria-errormessage]")
        let errId = null
        let errEl = null
        if(errMarker) {
            errId = errMarker.getAttribute("aria-errormessage")
            errEl = document.getElementById(errId)
        }

        if(checked && required) {
            // field is required AND something is checked (valid state)

            // remove the error and hide the error element (if it exists)
            if(errEl) {
                errEl.innerText = ""
                errEl.hidden = true
            }

            // remove the aria-invalid attribute
            ancestor.querySelector("input[type=radio][name=" + el.name + "][aria-invalid]").removeAttribute("aria-invalid")
        }
        else if(required) {
            // field is required but nothing is checked (invalid state)

            if(!errEl) {
                // no element was found to display the error message

                // find the first radio button in the group
                let first = ancestor.querySelector("input[type=radio][name=" + el.name + "]")

                // insert a div with a random id before that element
                let id = getUniqueId("nova-error-element-")
                let errEl = document.createElement("div")
                errEl.setAttribute("id", id)
                errEl.setAttribute("class", "nova-errormessage")
                first.parentNode.insertBefore(errEl)

                // add the aria-errormessage attribute to the first radio in the group
                first.setAttribute("aria-errormessage", id)

            }

            // find the first element that has an error message defined
            errDef = ancestor.querySelector("input[type=radio][name=" + el.name + "][nova-error-valuemissing]," +
                "input[type=radio][name=" + el.name + "][nova-error-required]," +
                "input[type=radio][name=" + el.name + "][nova-error]"
            )

            // add the error message to the error element
            // pass the element that contains the error message; if none was found, pass the current element
            errEl.innerText = findErrorMessage(errDef || el, ['nova-error-valuemissing', 'nova-error-required', 'nova-error'])
            // display the error element
            errEl.hidden = false
            // indicate that the radio group is invalid
            required.setAttribute("aria-invalid", "true")
        }
	}
	else if(el.tagName !== "BUTTON" && !['button','submit','reset','hidden'].includes(el.type)) {
		// all other elements except buttons and <input type="hidden">

        // skip validation if the element has a nova-ignore attribute
        if(el.hasAttribute("nova-ignore")) {
            return null
        }

		// get a list of all attribute names
		let attrs = el.getAttributeNames()

		// get error message element, if specified
		let errId = null    // id of the element that will display errors, from aria-errormessage
		let errEl = null    // reference to the element that will display errors

		if(attrs.includes("aria-errormessage")) {
			errId = el.getAttribute("aria-errormessage")
			errEl = document.getElementById(errId)
		}

		// dispatch the nova:custom-validation event on the element
		// event handler should call setCustomValidity() to set/unset error
        el.dispatchEvent(novaCustomValidationEvent)

		// call any code in the element's nova-custom-validation attribute
		const code = el.getAttribute("nova-custom-validation")
        if(code) {
        	// attribute found, attempt to execute contents
        	let msg = Function("$element", "return " + code)(el)
        	el.setCustomValidity(msg)
        }

		// validate the element
		if(!el.checkValidity()) {
			// element does not validate
			valid = false;

            // mark element invalid
            el.setAttribute("aria-invalid", "true")

            // see if the field has an element for error messages specified
            if(!errId) {
            	// generate a random string for the error element's id

            	// this expression should generate a random alphanumeric string of about 9 characters
            	// which should be random enough for generating unique ids within a single page
            	errId = "nova-error-element-" + Math.floor(Math.random() * 9999999999999).toString(36)
            	el.setAttribute("aria-errormessage", errId)
            }
            
            if (!errEl) {
            	// element specifies an error message element, but the element does not exist
            	// create the error message element and insert it immediately after the form element
            	let newEl = document.createElement("div")
            	newEl.id = errId
            	newEl.class = "nova-errormessage"

            	el.parentNode.insertAfter(el)
            }
            
            // get the appropriate error message for the type of error

            // pass a list of appropriate error message attribute names for the type of error
            // to findErrorMessage() and the most specific error message defined on the element
            // will be returned.  If no error is defined, the element's default error will be returned.
            let messageAttrs = []
            if(el.validity.badInput) {
                messageAttrs = ['nova-error-badinput', 'nova-error']
            }
            else if(el.validity.customError) {
                messageAttrs = ['nova-error-customerror', 'nova-error']
            }
            else if(el.validity.patternMissmatch) {
                messageAttrs = ['nova-error-patternmismatch', 'nova-error']
            }
            else if(el.validity.rangeOverflow) {
            	messageAttrs = ['nova-error-rangeoverflow', 'nova-error-range', 'nova-error']
            }
            else if(el.validity.rangeUnderflow) {
            	messageAttrs = ['nova-error-rangeunderflow', 'nova-error-range', 'nova-error']
            }
            else if(el.validity.stepMismatch) {
            	messageAttrs = ['nova-error-stepmismatch', 'nova-error']
            }
            else if(el.validity.tooLong) {
            	messageAttrs = ['nova-error-toolong', 'nova-error-length', 'nova-error']
            }
            else if(el.validity.tooShort) {
            	messageAttrs = ['nova-error-tooshort', 'nova-error-length', 'nova-error']
            }
            else if(el.validity.typeMismatch) {
            	messageAttrs = ['nova-error-typemismatch', 'nova-error']
            }
            else if(el.validity.valueMissing) {
            	messageAttrs = ['nova-error-valuemissing', 'nova-error-required', 'nova-error']
            }

            // set the error message
            errEl.innerText = findErrorMessage(el, messageAttrs)

            // make sure the error message is visible
            errEl.hidden = false;
		}
		else {
			// element validates - undo previous error state, if any
			el.removeAttribute("aria-invalid")
			if(errEl) {
				// an element exists to display an error message for this element
				// make sure it is cleared and hidden
				errEl.hidden = true
				errEl.innerText = ""
			}
		}
	}

	return valid
}

/**
 * Validate all elements in a form
 * @param {element} The form to validate
 * @return {array} A collection of all invalid elements, length will be 0 if form is valid
 */
function validateForm(frm) {
    if(frm.hasAttribute("nova-ignore")) {
        // skip validation if the form has a nova-ignore attribute
        return [];
    }

	// collect fields that are invalid
	let invalidFields = []

	for(let i = 0; i < el.elements.length; i++) {
		// loop through the form elements and check each
		// all elements are checked so that errors are show on elements that may not have been touched
		let status = validateElement(frm.elements[i])

		if(status === false) {
			// element is invalid, add it to the collection
			invalidFields.push(frm.elements[i])
		}
	}

    return invalidFields
}

/**
 * Find the most specific error message for the given error from the element's attributes
 * @param {element} The element being validated
 * @param {array} A list of attributes to check for possible error messages with element 0 having highest priority
 * @return {string} The error message to report
 */
function findErrorMessage(el, attrList) {
	let attrs = el.getAttributeNames()

	// define values for substitutions
	let min = getNumericAttrributeValue(el, "min")
	let max = getNumericAttrributeValue(el, "max")
	let minLen = getNumericAttrributeValue(el, "minlength")
	let maxLen = getNumericAttrributeValue(el, "maxlength")
	let step = getNumericAttrributeValue(el, "step")
	let prevStep = (isNaN(step)) ? "" : el.value - (el.value % step)
	let nextStep = (isNaN(step)) ? "" : el.value + (step - (el.value % step))

	for(let i = 0; i < attrList.length; i++) {
		// loop through the list of target attributes, return the contents of the first one found
		if(attrs.includes(attrList[i])) {
			let error = el.getAttribute(attrList[i]).trim()

			// substitute markers with values
			error = error.replace("%min%", min)
			error = error.replace("%max%", max)
			error = error.replace("%minlength%", minLen)
			error = error.replace("%maxlength%", maxLen)
			error = error.replace("%step%", step)
			error = error.replace("%previousstep%", prevStep)
			error = error.replace("%nextstep%", nextStep)

			if(error != "") {
				return error
			}
		}
	}

	// no preferred message was found, return the default
	return el.validationMessage
}

/**
 * Checks an attribute value to see if it contains a number and returns it, or returns an empty string if the value is NaN
 * @param {element} The element containing the attribute
 * @param {string} The name of the attribute to check
 * @return {string} the value of the attribute, if it is a number, or an empty string
 */
function getNumericAttrributeValue(el, attributeName) {
	attr = el.getAttribute(attributeName)
	if(isNaN(attr)) {
		return ""
	}

	return attr
}

/**
 * Returns a random alphanumeric string
 * Returned string length will vary, but will generally be about 9 characters long.
 * This function is only intended for generating unique ids for HTML elements in a page.
 * @param {string} The prefix to include in the generated string
 * @return {string} The generated string, including the prefix
 */
function getUniqueId(prefix) {
    return prefix + Math.Math.floor(Math.random() * 9999999999999).toString(36)
}

export {validateElement, validateForm}
export default init
