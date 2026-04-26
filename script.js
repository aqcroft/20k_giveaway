const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxnCvGSPlXvyc6amfr78xL52S4yNhLmV0gdC9x-41q931Gr-2QBr2FdswFnXLYMCfDj/exec",
  savingsBookingUrl: "https://tidycal.com/aqcroft/uwcost",
  incomeBookingUrl: "https://tidycal.com/aqcroft/uwpresent",
};

const form = document.querySelector("#entryForm");
const formMessage = document.querySelector("#formMessage");
const submitButton = document.querySelector("#submitButton");
const successPanel = document.querySelector("#successPanel");
const bookingActions = document.querySelector("#bookingActions");
const closeSuccess = document.querySelector("#closeSuccess");

function showMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.hidden = true;
}

function normalisePostcode(postcode) {
  return postcode.trim().toUpperCase().replace(/\s+/g, " ");
}

function getRadioValue(formData, fieldName) {
  return formData.get(fieldName) || "";
}

function buildPayload() {
  const formData = new FormData(form);

  return {
    submittedAt: new Date().toISOString(),
    name: String(formData.get("name") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    postcode: normalisePostcode(String(formData.get("postcode") || "")),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    savings: getRadioValue(formData, "savings"),
    homeowner: getRadioValue(formData, "homeowner"),
    income: getRadioValue(formData, "income"),
    notes: String(formData.get("notes") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    source: "20k-giveaway",
  };
}

function validatePayload(payload) {
  if (!payload.name || !payload.address || !payload.postcode || !payload.phone || !payload.email) {
    return "Please complete all required prize draw entry fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function renderBookingActions(payload) {
  bookingActions.innerHTML = "";

  if (payload.savings === "yes") {
    bookingActions.insertAdjacentHTML(
      "beforeend",
      `<a class="booking-button" href="${CONFIG.savingsBookingUrl}">Book a savings review</a>`
    );
  }

  if (payload.income === "yes") {
    bookingActions.insertAdjacentHTML(
      "beforeend",
      `<a class="booking-button alt" href="${CONFIG.incomeBookingUrl}">Book an extra income chat</a>`
    );
  }

  if (payload.savings !== "yes" && payload.income !== "yes") {
    bookingActions.insertAdjacentHTML("beforeend", "<span>No appointment needed right now.</span>");
  }
}

async function submitEntry(payload) {
  if (!CONFIG.appsScriptUrl) {
    throw new Error("The form endpoint has not been configured yet.");
  }

  await fetch(CONFIG.appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const payload = buildPayload();
  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    showMessage(validationMessage);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    await submitEntry(payload);
    renderBookingActions(payload);
    successPanel.hidden = false;
    form.reset();
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit entry";
  }
});

closeSuccess.addEventListener("click", () => {
  successPanel.hidden = true;
});
