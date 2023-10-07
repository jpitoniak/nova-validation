# Nova Validation

Nova Validation is a tiny, accessible, soon-to-be extensible form web form validation library that that can integrate seemlessly with nearly any website.

Nova taps in to the browser's built-in validation functionality, extending it to give developers control over error messaging.  It works in all modern browsers, and with both traditional forms sand most AJAX-based forms with no coding needed.


## Installation

The easiest way to use Nova Validation is via CDN.  For most sites, a single JavaScript include is all that's needed:

```<script src="//unpkg.com/nova-validation"></script>```

## Usage

Once Nova is added to the page, it automatically validates each form field on the page whenever the field loses focus or when the form is submitted.  When an error is detected, Nova Validation looks for an aria-errormessage attribute on the field and sets the inner text of the element it references to the appropriate error message.  If no aria-errormessage attribute is found, Nova Validation will insert the error message immediately after the invalid form field.

### Validation Rules

Nova Validation understands all HTML5 constraint validation rules and can flag invalid input based both on field type and additional attributes.  Examples of invalid input that Nova Validation can catch include:

* Required fields that don't contain a value
* Fields of type `url` or `email` that don't contain properly formatted input
* Numbers that don't fall within the specified `min` or `max` limits or that do not match to a proper `step`
* Dates and times that do not fall within a specified rage
* Fields that do not match to a specified regular expression `pattern`
* Values that are shorter than the required `minlength` or longer than the required `maxlength`

More information about [constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) is available on the [Mozilla Developer Network](https://developer.mozilla.org/).

Nova Validation also allows for custom validation rules on a per-field basis.


### Error Messages

To display a custom error message, simply add a `nova-error` attribute to the form field with the desired error message as it's value.

```<input type="text" name="username" required nova-error="Please select a username.">```

When an error is detected, Nova will check the form field for an `aria-errormessage` attribute containing the `id` of the element that will display the error.  If the input does not have an `aria-errormessage` attribute, or the referenced element does not exist, Nova Validation will insert the error message immediately after the field.

The error element should be both empty and hidden when no error is present.

A complete example:

```
<label for="username">Username:</label>
<input type="text"
    name="username"
    aria-errormessage="error-username"
    required
    nova-error="Please select a username.">
<div class="error" id="error-username" hidden></div>
```

If no `nova-error` attribute is found, or if it contains an empty string, the browser's default error message will be displayed.

### Customizing errors

The error message will be parsed and the following keys, if found, will be replaced with appropriate values:

|Key|Description|
|---|-----------|
|`%min%`|The minimum value the field will accept, as specified by the `min` attribute|
|`%max%`|The maximum value the field will accept, as specified by the `max` attribute|
|`%minlength%`|The minimum length that the value is allowed to be, as specified by the `minlength` attribute|
|`%maxlength%`|The maximum length that the value is allowed to be, as specified by the `maxlength` attribute|
|`%step%`|The step value by which valid values must abide, as specified by the `step` attribute|
|`%nextstep%`|The next allowable value, calculated from the current value and the `step` attribute|
|`%previousstep%`|The closest previous allowable value, calculated from the current value and the `step` attribute|

### Multiple validation rules

In the event that a field has more than one validation rule and a different error message is desired for each rule, the following attributes can be used to specify rule-specific errors.  If no rule specific error is found, Nova Validation will default to `nova-error` and then to the browser's default error message.

|Condition|Attribute name|
|---------|--------------|
|The field's value is invalid or incomplete, based on the type of field|`nova-error-badinput`|
|A custom validation process set an error.  This attribute can be used to override the error message it set.|`nova-error-customerror`|
|The field has a `pattern` attribute, but the field's value does not match the specified regular expression|`nova-error-patternmismatch`|
|The field has a `max` value set, and the field's value is greater (for numeric types) or later (for date and time types) than this maximum|`nova-error-rangeoverflow`|
|The field has a `min` value set, and the field's value is less (for numeric types) or earlier (for date and time types) than this minimum|`nova-error-rangeunderflow`|
|The field has a `step` attribute set, but the field's value does not fall in line with this step|`nova-error-stepmismatch`|
|The field has a `maxlenght` attribute set to a numeric value, but the string length of the field's value is greater than this number|`nova-error-toolong`|
|The field has a `minlength` attribute set to a numeric value, but the string length of the field's `value` is less than this number|`nova-error-tooshort`|
|For `email` or `url` fields, when the value is not a valid email address or URL.|`nova-error-typemismatch`|
|The field has the `required` attribute set, but the value is empty|`nova-error-valuemissing`|

In addition to the above attributes, which mirror the browser's ValidityState API, the following additional attributes can be used to provide a single error message for related error states:

|Attribute Name|Details|
|--------------|-------|
|`nova-error-range`|Applies to all range-related validations. Use in place of `nova-error-rangeoverflow` and `nova-range-underflow`|
|`nova-error-length`|Applies to length-related validations. Use in place of `nova-error-toolong` and `nova-error-tooshort`|
|`nova-error-required`|Alias of `nova-error-valuemissing`|

## Working with AJAX

Nova Validation works with traditional forms by intercepting the form's submit event and stopping the submission when one or more validation errors is detected.  Nova does this early in the submission process, before the submit event fires on the `<form>` element.

Nova should work fine with forms that use AJAX, provided that the AJAX routine is called from a `submit` event and the routine checks that `event.defaultPrevented` is not `true` before making the AJAX call.

```
document.querySelector("#myform").addEventListener("submit", event => {
      if(!event.defaultPrevented) {
        // do submission here
      }
  })
```

If the routine can't be called from a submit event (if, for example, it's triggered by a button click), validation can be handled manually (instructions coming soon).

## Ignoring Forms and Fields

Nova will not attempt to validate any fields of a form when the `<form>` tag contains a `nova-ignore` attribute.  Likewise, if the field itself contains a `nova-ignore` attribute, Nova will not validate that field, though other fields within the form will still be validated.

When Nova encounters a `nova-ignore` attribute on a `<form>` tag during initialization, it will *not* set the `novalidate` attribute on that form.

## Custom Validation Routines

Nova Validation has two ways to handle custom validations on fields: via a custom event handler or with a custom attribute.

**Custom validation is not supported on radio buttons at this time.  This will be addressed in a future update.**

### Custom Events

The preferred method of adding custom validation is through a custom event listener.  Nova will trigger a `nova:custom-validation` event each time it validates a field.  An event listener listening for this event should call the `setCustomValidity()` method of the Event object's `srcElement` to set or remove an error message:

```
document.getElemetById("my_form_field").addEventListener("nova:custom-validation", event => {
    let hasError = false

    // add custom validation code here
    
    if(hasError) {
        // validation failed
        event.srcElement.setCustomValidity("Something is wrong.")
    }
    else {
        // validation succeeded
        event.srcElement.setCustomValidity("")
    }
})
```

**NOTE: Remember to call `setCustomValidity()` with an empty string on successful validation to clear out any previously set error message.**

`nova:custom-validation` events will bubble.  In complex forms with multiple custom validation handlers it may be more efficient to set a single event listener to handle validation for all fields instead of adding individual listeners to each field.

### Custom Validation Attribute

The other way to add a custom validation routine is via a `nova-custom-validation` attribute.  The value of this attribute will be interpreted as JavaScript code and should evaluate to a string value consisting of the desired error message or an empty string when the field is valid.  The variable `$element` is available and contains a reference to the field being validated.

```
<label for="delete">Type the word "DELETE" in capital letters 
to confirm you want to delete this item.</label>
<input type="text" name="delete" id="delete" aria-errormessage="delete-error"
    nova-custom-validatation="($element.value != 'DELETE') ? 'Please type the word 'DELETE' (without quotes).' : ''">
<div class="error" id="delete-error" hidden></div>
```

## Radio Buttons and Checkboxes

With built-in validation, radio buttons behave a bit differently than other form elements, and Nova Validation follows this behavior.  The browser automatically groups all radio buttons that share a common name and considers any validation rules placed on any radio button field in that group to apply to all of the fields in the group.  When validating a radio button, Nova will check all of the radio buttons in the group for the following attributes and use the first one in finds, even if they appear on different elements than the one being evaluated:

* `nova-ignore`: if any radio button in the group has this attribute, the Nova will not attempt validation
* `checked`: the selected field, used to determine if the group has a value
* `required`: if present, one field in the group must be selected for the form to be valid.  "Required" is the only constraint supported on radio buttons.
* `aria-errormessage`: a reference to where the error message should be displayed when validation fails.
* `nova-error` or `nova-error-valuemissing`: the error message to display

If no error target is specified with `aria-errormessage`, Nova will display error messages before the first radio button in the group.

```
<fieldset>
  <caption>What makes the best pet?</caption>

  <div class="error" id="pet-error" hidden></div>
  <label><input type="radio" name="pet" value="dog" aria-errormessage="pet-error" required
      nova-error="Select the best type of pet">Dog</label>
  <label><input type="radio" name="pet" value="cat">Cat</label>
  <label><input type="radio" name="pet" value="aligator">Aligator</label>
</fieldset>
```

Checkboxes, on the other hand, *are not* grouped like radio buttons.  When a checkbox has a `required` attribute, the browser will expect *that* checkbox to be checked, regardless of the status of any others that share a common name.

## Next Steps

Nova Validation is currently in an early beta stage.  I encourage you to test it out and submit bug reports, feedback, and feature requests to the issues queue of the [GitHub repository](https://www.github.com/jpitoniak/nova-validation).  I also appreciate patches and contributions via pull requests.

Future developments that I plan to implement:
* Support for custom validation of radio buttons
* Support for checkbox features such as min/max items checked
* A plugin system for adding new global validation rules


