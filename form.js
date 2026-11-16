// Hw 4 part 3 - JS for form-with-js.html
"use strict";

const form = document.getElementById("contact-form");
const nameField = document.getElementById("name");
const userEmail = document.getElementById("email");
const commentsField = document.getElementById("comments");

const errorArea = document.getElementById("error-area");
const noErr = document.getElementById("no-errors");
const charCount = document.getElementById("char-count");
const charWarn = document.getElementById("char-warning");
const info = document.getElementById("info-area");
const history = document.getElementById("form-errors-field");

const fields = [nameField, userEmail, commentsField];


// Limit character warning
const ALMOST_AT_LIM = 100;

// Errors from failed attempts at submitting
const form_errors = [];

const labels = { name: "Name", email: "Email", comments: "Comments" };

// Fields the user has typed in + error fields shown on page
const editedFields = new Set();
const visibleErrorFields = new Set();

let attemptCount = 0;
let currentAttempt = null;

function formatNumber(n) {
  return n.toLocaleString("en-US");
}

// Checks field's validity state and returns { type, message }, or null if valid
function getErr(field) {
  const label = labels[field.id];
  const v = field.validity;

  if (v.valueMissing) {
    const help = {
      name: "Enter your preferred name.",
      email: "Enter an address like name@example.com.",
      comments: `Write a message of at least ${field.minLength} characters.`,
    };
    return { type: "valueMissing", message: `${label} is required. ${help[field.id]}` };
  }

  if (field.value.trim() === "") {
    return { type: "onlySpaces", message: `${label} contains only spaces. Please type some text.` };
  }

  if (v.typeMismatch) {
    return {
      type: "typeMismatch",
      message: "Email is not a complete address. Include an @ and a domain, like name@example.com.",
    };
  }

  if (v.tooShort) {
    return {
      type: "tooShort",
      message: `${label} must be at least ${formatNumber(field.minLength)} characters. Please add more characters.`,
    };
  }

  if (v.tooLong) {
    return {
      type: "tooLong",
      message: `${label} must be ${formatNumber(field.maxLength)} characters or fewer. Please shorten it.`,
    };
  }

  return null;
}

function checkField(field) {
  field.setCustomValidity("");
  const error = getErr(field);
  field.setCustomValidity(error ? error.message : "");
  return error;
}

// Shows, updates, or removes this field's message in the error area
function showErr(field, error) {
  const errorElem = document.getElementById(`${field.id}-error`);
  const show = error && visibleErrorFields.has(field);
  const message = show ? error.message : "";

  if (errorElem.textContent !== message) {
    errorElem.textContent = message;
  }
  errorElem.hidden = !show;

  const ids = field.dataset.describedby.split(" ");
  if (show) {
    ids.push(errorElem.id);
  }
  field.setAttribute("aria-describedby", ids.join(" "));

  noErr.hidden = fields.some((f) => !document.getElementById(`${f.id}-error`).hidden);
}

function updateCount() {
  const max = commentsField.maxLength;
  const remaining = Math.max(0, max - commentsField.value.length);

  charCount.textContent = `${formatNumber(remaining)} of ${formatNumber(max)} characters remaining.`;

  let state = "ok";
  let warning = "";
  if (remaining === 0) {
    state = "limit";
    warning = `You've reached the ${formatNumber(max)}-character limit. You can no longer type, but you can send your current message.`;
  } else if (remaining <= ALMOST_AT_LIM) {
    state = "warning";
    warning = `Almost at the limit: ${formatNumber(ALMOST_AT_LIM)} or fewer characters left.`;
  }

  info.dataset.state = state;
  if (charWarn.textContent !== warning) {
    charWarn.textContent = warning;
  }
}

function recordError(field, error) {
  if (!currentAttempt) {
    attemptCount += 1;
    currentAttempt = { number: attemptCount, fields: new Set() };
    setTimeout(() => {
      currentAttempt = null;
    }, 0);
  }

  if (currentAttempt.fields.has(field.name)) {
    return;
  }
  currentAttempt.fields.add(field.name);

  form_errors.push({
    attempt: currentAttempt.number,
    field: field.name,
    error: error ? error.type : "invalid",
    message: error ? error.message : field.validationMessage,
    time: new Date().toISOString(),
  });
}

fields.forEach((field) => {
  field.addEventListener("input", () => {
    editedFields.add(field);
    const error = checkField(field);
    showErr(field, error);
    if (field === commentsField) {
      updateCount();
    }
  });

  field.addEventListener("blur", () => {
    if (!editedFields.has(field)) {
      return;
    }
    visibleErrorFields.add(field);
    showErr(field, checkField(field));
  });
});

form.addEventListener(
  "invalid",
  (event) => {
    const field = event.target;
    if (!fields.includes(field)) {
      return;
    }
    const error = checkField(field);
    visibleErrorFields.add(field);
    renderError(field, error);
    recordError(field, error);
  },
  true
);

form.addEventListener("submit", () => {
  history.value = JSON.stringify(form_errors);
});

errorArea.hidden = false;
info.hidden = false;

fields.forEach((field) => {
  field.dataset.describedby = field.getAttribute("aria-describedby");
});
commentsField.dataset.describedby += " char-count char-warning";
commentsField.setAttribute("aria-describedby", commentsField.dataset.describedby);

fields.forEach(checkField);
updateCount();
