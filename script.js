const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwO2qiDdBitoUVpHg_IfFEdgm0rVzRDlNipNC_9_PVPD-cGr46uwO8F_poWQR4BOJtE/exec",
  savingsBookingUrl: "https://tidycal.com/aqcroft/uwpresent",
  incomeBookingUrl: "https://tidycal.com/aqcroft/uwcost",
  refresherBookingUrl: "https://tidycal.com/aqcroft/crefresher",
  selfServeUrl: "https://uw.partners/adrian.croft/join",
};

const form = document.querySelector("#entryForm");
const formMessage = document.querySelector("#formMessage");
const submitButton = document.querySelector("#submitButton");
const successPanel = document.querySelector("#successPanel");
const successEyebrow = document.querySelector("#successEyebrow");
const successTitle = document.querySelector("#success-title");
const successBody = document.querySelector("#successBody");
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
    savings: getRadioValue(formData, "savings"),
    residentialStatus: getRadioValue(formData, "residentialStatus"),
    existingCustomer: getRadioValue(formData, "existingCustomer"),
    income: getRadioValue(formData, "income"),
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

  if (!payload.savings) {
    return "Please choose Yes or No for saving on your home services.";
  }

  if (!payload.income) {
    return "Please choose Yes or No for an extra income.";
  }

  if (!payload.residentialStatus) {
    return "Please select your residential status.";
  }

  if (!payload.existingCustomer) {
    return "Please select whether you are already a Utility Warehouse customer.";
  }

  return "";
}

function actionLink(href, label, alt) {
  const cls = alt ? "booking-button alt" : "booking-button";
  return `<a class="${cls}" href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
}

function setSuccess(eyebrow, title, body) {
  if (successEyebrow) successEyebrow.textContent = eyebrow;
  if (successTitle) successTitle.textContent = title;
  if (successBody) successBody.textContent = body;
}

// Tailors the confirmation to who they are and what they asked for.
// Draw eligibility is one axis (existing UW customers are excluded, T&Cs
// clause 2); their tick-box interest is the other. Kept to four outcomes.
function renderOutcome(payload) {
  const existing = payload.existingCustomer === "yes";
  const wantsSavings = payload.savings === "yes";
  const wantsIncome = payload.income === "yes";
  const tickedSomething = wantsSavings || wantsIncome;

  bookingActions.innerHTML = "";

  if (existing) {
    if (wantsIncome) {
      setSuccess(
        "Thank you",
        "Thanks for that",
        "One thing to flag: the \u00A320K Giveaway is open to new customers only, so as an existing UW customer you're not in this draw. But you ticked extra income, and that's a conversation I'd genuinely like to have. Grab a time below whenever suits."
      );
      bookingActions.insertAdjacentHTML("beforeend", actionLink(CONFIG.incomeBookingUrl, "Book an extra income chat", true));
    } else {
      setSuccess(
        "Thank you",
        "Thanks for that",
        "One thing to flag: the \u00A320K Giveaway is open to new customers only, so as an existing UW customer you're not in this draw. No harm done. Since you're already with UW though, I'm always happy to run a quick refresher and make sure you're getting the most from it."
      );
      bookingActions.insertAdjacentHTML("beforeend", actionLink(CONFIG.refresherBookingUrl, "Book a UW refresher", false));
    }
    return;
  }

  if (tickedSomething) {
    setSuccess(
      "Thank you",
      "I'll be in touch",
      "Thanks for entering the \u00A320K Giveaway. I'll get your entry confirmed and come back to you shortly about what you ticked. Or, if you'd rather, grab a time below."
    );
    if (wantsSavings) {
      bookingActions.insertAdjacentHTML("beforeend", actionLink(CONFIG.savingsBookingUrl, "Book a savings review", false));
    }
    if (wantsIncome) {
      bookingActions.insertAdjacentHTML("beforeend", actionLink(CONFIG.incomeBookingUrl, "Book an extra income chat", true));
    }
    return;
  }

  // No / no: entered the draw, nothing ticked. No callback, no lists,
  // just one quiet self-serve door they can ignore.
  setSuccess(
    "Thank you",
    "You're entered",
    "Thanks for entering the \u00A320K Giveaway. I'll get your entry confirmed, and that's it. I won't chase you or add you to any lists. If you're ever curious what your address might qualify for, there's a quiet link below. No call, no commitment."
  );
  bookingActions.insertAdjacentHTML("beforeend", actionLink(CONFIG.selfServeUrl, "Have a look in your own time", false));
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
    renderOutcome(payload);
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

// Floating contact bubble
const profileBubble = document.querySelector("#profileBubble");
const profileBubbleBtn = document.querySelector("#profileBubbleBtn");
const profileBubbleMenu = document.querySelector("#profileBubbleMenu");

if (profileBubble && profileBubbleBtn && profileBubbleMenu) {
  const setBubbleOpen = (open) => {
    profileBubbleMenu.hidden = !open;
    profileBubbleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  profileBubbleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setBubbleOpen(profileBubbleMenu.hidden);
  });

  document.addEventListener("click", (event) => {
    if (!profileBubble.contains(event.target)) setBubbleOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setBubbleOpen(false);
  });
}
