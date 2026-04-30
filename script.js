const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwO2qiDdBitoUVpHg_IfFEdgm0rVzRDlNipNC_9_PVPD-cGr46uwO8F_poWQR4BOJtE/exec",
  savingsBookingUrl: "https://tidycal.com/aqcroft/uwpresent",
  incomeBookingUrl: "https://tidycal.com/aqcroft/uwcost",
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

function getCheckboxValue(formData, fieldName) {
  return formData.get(fieldName) === "yes" ? "yes" : "no";
}

function buildPayload() {
  const formData = new FormData(form);

  const addressLine1 = String(formData.get("addressLine1") || "").trim();
  const addressLine2 = String(formData.get("addressLine2") || "").trim();
  const townCity = String(formData.get("townCity") || "").trim();

  return {
    submittedAt: new Date().toISOString(),
    name: String(formData.get("name") || "").trim(),
    address: [addressLine1, addressLine2, townCity].filter(Boolean).join(", "),
    addressLine1,
    addressLine2,
    townCity,
    postcode: normalisePostcode(String(formData.get("postcode") || "")),
    phone: String(formData.get("tel") || formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    savings: getCheckboxValue(formData, "savings"),
    residentialStatus: getRadioValue(formData, "residentialStatus"),
    existingCustomer: getRadioValue(formData, "existingCustomer"),
    income: getCheckboxValue(formData, "income"),
    website: String(formData.get("website") || "").trim(),
    source: "20k-giveaway",
  };
}

function validatePayload(payload) {
  if (
    !payload.name ||
    !payload.addressLine1 ||
    !payload.townCity ||
    !payload.postcode ||
    !payload.phone ||
    !payload.email
  ) {
    return "Please complete all required prize draw entry fields.";
  }

  const phoneDigits = payload.phone.replace(/\D/g, "");

  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Please enter a valid contact number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please enter a valid email address.";
  }

  if (!payload.residentialStatus) {
    return "Please select your residential status.";
  }

  if (!payload.existingCustomer) {
    return "Please select whether you are already with Utility Warehouse.";
  }

  return "";
}

function renderBookingActions(payload) {
  bookingActions.innerHTML = "";

  if (payload.savings === "yes") {
    bookingActions.insertAdjacentHTML(
      "beforeend",
      `<a class="booking-button" href="${CONFIG.savingsBookingUrl}" target="_blank" rel="noreferrer">Book a savings review</a>`
    );
  }

  if (payload.income === "yes") {
    bookingActions.insertAdjacentHTML(
      "beforeend",
      `<a class="booking-button alt" href="${CONFIG.incomeBookingUrl}" target="_blank" rel="noreferrer">Book an extra income chat</a>`
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
