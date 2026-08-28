/* =========================================================
   DENTAL CLINIC BOOKING FORM — SCRIPT
   Sections:
   1. CONFIG            — webhook URL
   2. TRANSLATIONS       — FR / AR strings + language toggle
   3. SERVICES DATA       — descriptions & prices (FR/AR)
   4. TIME SLOTS          — dynamic generation (09-13h / 14-17h)
   5. VALIDATION           — required-field checks
   6. SUBMIT HANDLER        — posts booking data to the webhook
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. CONFIG — EDIT THESE TWO VALUES BEFORE DEPLOYMENT
     --------------------------------------------------------- */
  const CONFIG = {
    // Your webhook endpoint (Zapier / Make / n8n / your own backend).
    // The form POSTs the booking data here as JSON on submit.
    WEBHOOK_URL: "https://hook.eu1.make.com/muo5z9msswsl32qwcsy8mvztjkle42ub",
  };

  /* ---------------------------------------------------------
     2. TRANSLATIONS
     --------------------------------------------------------- */
  const translations = {
    fr: {
      clinicName: "Cabinet Dentaire Al Amal",
      clinicTagline: "Votre sourire, notre priorité",
      introText: "Remplissez le formulaire ci-dessous pour réserver votre rendez-vous. Notre équipe vous contactera pour confirmer.",
      sectionContact: "1. Vos coordonnées",
      labelFullName: "Nom complet *",
      placeholderFullName: "Ex : Sara El Amrani",
      errorFullName: "Veuillez saisir votre nom complet.",
      labelPhone: "Téléphone / WhatsApp *",
      placeholderPhone: "Ex : 2120612345678",
      errorPhone: "Veuillez saisir un numéro valide.",
      labelEmail: "Adresse e-mail (optionnel)",
      placeholderEmail: "Ex : sara@email.com",
      errorEmail: "Adresse e-mail invalide.",
      sectionService: "2. Type de soin",
      labelService: "Sélectionnez un service *",
      serviceDefault: "-- Choisir un service / اختر خدمة --",
      errorService: "Veuillez choisir un service.",
      serviceDescLabel: "Description",
      servicePriceLabel: "Prix estimé",
      sectionSchedule: "3. Date et heure",
      labelDate: "Date du rendez-vous *",
      errorDate: "Veuillez choisir une date valide.",
      labelTime: "Créneau horaire *",
      slotMorning: "Matin (09:00 – 13:00)",
      slotBreak: "Pause déjeuner : 13:00 – 14:00 (indisponible)",
      slotAfternoon: "Après-midi (14:00 – 17:00)",
      errorTime: "Veuillez choisir un créneau horaire.",
      submitBtn: "Confirmer le rendez-vous / تأكيد الموعد",
      formNote: "En confirmant, votre demande de rendez-vous sera envoyée directement au cabinet.",
      sendingMsg: "Envoi en cours...",
      successMsg: "Merci ! Votre demande de rendez-vous a bien été envoyée.",
      webhookErrorMsg: "Une erreur est survenue lors de l'envoi. Veuillez réessayer ou nous appeler directement.",
    },
    ar: {
      clinicName: "عيادة الأمل لطب الأسنان",
      clinicTagline: "ابتسامتكم أولويتنا",
      introText: "املأ الاستمارة أدناه لحجز موعدك. سيتواصل معك فريقنا للتأكيد.",
      sectionContact: "1. معلومات الاتصال",
      labelFullName: "الاسم الكامل *",
      placeholderFullName: "مثال: سارة العمراني",
      errorFullName: "يرجى إدخال اسمك الكامل.",
      labelPhone: "الهاتف / واتساب *",
      placeholderPhone: "مثال: 212612345678",
      errorPhone: "يرجى إدخال رقم هاتف صحيح.",
      labelEmail: "البريد الإلكتروني (اختياري)",
      placeholderEmail: "مثال: sara@email.com",
      errorEmail: "البريد الإلكتروني غير صحيح.",
      sectionService: "2. نوع العلاج",
      labelService: "اختر خدمة *",
      serviceDefault: "-- اختر خدمة / Choisir un service --",
      errorService: "يرجى اختيار خدمة.",
      serviceDescLabel: "الوصف",
      servicePriceLabel: "السعر التقديري",
      sectionSchedule: "3. التاريخ والوقت",
      labelDate: "تاريخ الموعد *",
      errorDate: "يرجى اختيار تاريخ صحيح.",
      labelTime: "الوقت المناسب *",
      slotMorning: "صباحاً (09:00 – 13:00)",
      slotBreak: "استراحة الغداء: 13:00 – 14:00 (غير متاح)",
      slotAfternoon: "مساءً (14:00 – 17:00)",
      errorTime: "يرجى اختيار موعد زمني.",
      submitBtn: "تأكيد الموعد / Confirmer le rendez-vous",
      formNote: "بعد التأكيد، سيتم إرسال طلب موعدك مباشرة إلى العيادة.",
      sendingMsg: "جارٍ الإرسال...",
      successMsg: "شكراً لك! تم إرسال طلب موعدك بنجاح.",
      webhookErrorMsg: "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.",
    },
  };

  let currentLang = "fr";

  function applyTranslations(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key] !== undefined) {
        // Preserve nested <span class="req"> markers by rebuilding only text nodes when needed
        if (el.querySelector(".req")) {
          el.innerHTML = translations[lang][key].replace(
            "*",
            '<span class="req">*</span>'
          );
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang][key] !== undefined) {
        el.setAttribute("placeholder", translations[lang][key]);
      }
    });

    document.querySelectorAll(".lang-toggle__option").forEach((el) => {
      el.classList.toggle(
        "lang-toggle__option--active",
        el.getAttribute("data-lang-option") === lang
      );
    });

    // Re-render service info box (if a service is already selected) in the new language
    updateServiceInfoBox();
  }

  document.getElementById("langToggle").addEventListener("click", () => {
    applyTranslations(currentLang === "fr" ? "ar" : "fr");
  });

  /* ---------------------------------------------------------
     3. SERVICES DATA — description (FR/AR) + price range (MAD)
     --------------------------------------------------------- */
  const services = {
    consultation: {
      fr: "Examen complet et diagnostic",
      ar: "فحص شامل وتشخيص",
      price: "200 - 300 MAD",
    },
    detartrage: {
      fr: "Nettoyage professionnel",
      ar: "تنظيف احترافي",
      price: "300 - 500 MAD",
    },
    caries: {
      fr: "Traitement et restauration",
      ar: "علاج وترميم",
      price: "250 - 450 MAD",
    },
    extraction: {
      fr: "Extraction adaptée à votre situation",
      ar: "إزالة السن في ظروف مريحة",
      price: "300 - 600 MAD",
    },
    blanchiment: {
      fr: "Éclaircissement professionnel",
      ar: "تبييض احترافي",
      price: "1500 - 3000 MAD",
    },
    canal: {
      fr: "Traitement des dents infectées",
      ar: "علاج الأسنان المصابة",
      price: "600 - 1200 MAD",
    },
    couronnes: {
      fr: "Protection et restauration",
      ar: "حماية وترميم",
      price: "1500 - 2500 MAD",
    },
    orthodontie: {
      fr: "Solutions pour l'alignement",
      ar: "حلول لتصحيح وتعديل",
      price: "Sur devis / حسب الحالة",
    },
  };

  const serviceSelect = document.getElementById("service");
  const serviceInfoBox = document.getElementById("serviceInfoBox");
  const serviceInfoDesc = document.getElementById("serviceInfoDesc");
  const serviceInfoPrice = document.getElementById("serviceInfoPrice");

  function updateServiceInfoBox() {
    const value = serviceSelect.value;
    const data = services[value];

    if (!data) {
      serviceInfoBox.hidden = true;
      return;
    }

    serviceInfoDesc.textContent =
      currentLang === "ar" ? `${data.ar} — ${data.fr}` : `${data.fr} — ${data.ar}`;
    serviceInfoPrice.textContent = data.price;
    serviceInfoBox.hidden = false;
  }

  serviceSelect.addEventListener("change", updateServiceInfoBox);

  /* ---------------------------------------------------------
     4. TIME SLOTS — 09:00-13:00 & 14:00-17:00, 30-min steps
     --------------------------------------------------------- */
  const slotsMorningEl = document.getElementById("slotsMorning");
  const slotsAfternoonEl = document.getElementById("slotsAfternoon");
  const timeInput = document.getElementById("time");

  function buildSlots(startHour, endHour, container) {
    for (let h = startHour; h < endHour; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = label;
      btn.setAttribute("data-time", label);
      btn.addEventListener("click", () => selectSlot(btn));
      container.appendChild(btn);
    }
  }

  function selectSlot(selectedBtn) {
    document.querySelectorAll(".slot-btn").forEach((btn) =>
      btn.classList.remove("selected")
    );
    selectedBtn.classList.add("selected");
    timeInput.value = selectedBtn.getAttribute("data-time");
    clearFieldError("time");
  }

  // Morning: 09:00 -> 12:30 (last slot before 13:00 break)
  buildSlots(9, 13, slotsMorningEl);
  // Afternoon: 14:00 -> 16:30 (last slot before 17:00 close)
  buildSlots(14, 17, slotsAfternoonEl);

  /* Prevent selecting a past date */
  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

  /* ---------------------------------------------------------
     5. VALIDATION
     --------------------------------------------------------- */
  function setFieldError(fieldId, hasError) {
    const wrapper = document.getElementById(fieldId).closest(".field");
    if (wrapper) wrapper.classList.toggle("invalid", hasError);
  }

  function clearFieldError(fieldId) {
    setFieldError(fieldId, false);
  }

  function isValidPhone(value) {
    // Accepts digits, spaces, +, - ; requires at least 8 digits total
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 8;
  }

  function isValidEmail(value) {
    if (!value) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm() {
    let isValid = true;

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const service = serviceSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;

    setFieldError("fullName", fullName.length < 2);
    if (fullName.length < 2) isValid = false;

    setFieldError("phone", !isValidPhone(phone));
    if (!isValidPhone(phone)) isValid = false;

    setFieldError("email", !isValidEmail(email));
    if (!isValidEmail(email)) isValid = false;

    setFieldError("service", !service);
    if (!service) isValid = false;

    setFieldError("date", !date);
    if (!date) isValid = false;

    setFieldError("time", !time);
    if (!time) isValid = false;

    return isValid;
  }

  /* ---------------------------------------------------------
     6. SUBMIT — POST booking data to the webhook
     --------------------------------------------------------- */
  const form = document.getElementById("bookingForm");
  const statusMsg = document.getElementById("statusMsg");

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status-msg ${type}`;
    statusMsg.hidden = false;
  }

  async function sendToWebhook(data) {
    if (!CONFIG.WEBHOOK_URL) {
      throw new Error("WEBHOOK_URL is not configured.");
    }

    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        service: data.service,
        serviceLabel: `${services[data.service].fr} / ${services[data.service].ar}`,
        estimatedPrice: services[data.service].price,
        date: data.date,
        time: data.time,
        language: currentLang,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateForm()) {
      showStatus(
        currentLang === "ar" ? "يرجى تصحيح الحقول المميزة." : "Veuillez corriger les champs indiqués.",
        "error"
      );
      return;
    }

    const data = {
      fullName: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      service: serviceSelect.value,
      date: dateInput.value,
      time: timeInput.value,
    };

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    showStatus(translations[currentLang].sendingMsg, "success");

    try {
      await sendToWebhook(data);
      showStatus(translations[currentLang].successMsg, "success");
      form.reset();
      document.querySelectorAll(".slot-btn.selected").forEach((b) => b.classList.remove("selected"));
      serviceInfoBox.hidden = true;
    } catch (err) {
      console.warn("Webhook call failed:", err);
      showStatus(translations[currentLang].webhookErrorMsg, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------
     Live-clear errors as the user fixes fields
     --------------------------------------------------------- */
  ["fullName", "phone", "email", "date"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => clearFieldError(id));
  });
  serviceSelect.addEventListener("change", () => clearFieldError("service"));

  /* Initialize UI language on load */
  applyTranslations("fr");
})();
