/* =========================================================
   DENTAL CLINIC BOOKING FORM — SCRIPT
   Sections:
   1. CONFIG            — clinic WhatsApp number + webhook URL
   2. TRANSLATIONS       — FR / AR strings + language toggle
   3. SERVICES DATA       — descriptions & prices (FR/AR)
   4. TIME SLOTS          — dynamic generation (09-13h / 14-17h)
   5. VALIDATION           — required-field checks
   6. SUBMIT HANDLER        — builds WhatsApp message + sends webhook
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. CONFIG — EDIT THESE TWO VALUES BEFORE DEPLOYMENT
     --------------------------------------------------------- */
  const CONFIG = {
    // Cabinet's WhatsApp number in international format, no "+" and no spaces
    // Example for Morocco: "212612345678"
    CLINIC_WHATSAPP_NUMBER: "212600000000",

    // Your webhook endpoint (Zapier / Make / n8n / your own backend).
    // Leave as "" to disable the webhook call entirely.
    WEBHOOK_URL: "https://hook.eu1.make.com/2u7x69cioniphw74ma5cqt9op9u78o8g",
  };

  /* ---------------------------------------------------------
     2. TRANSLATIONS
     --------------------------------------------------------- */
  const translations = {
    fr: {
      clinicName: "Cabinet Dentaire Al Amal",
      clinicTagline: "Votre sourire, notre priorité",
      introText: "Remplissez le formulaire ci-dessous pour réserver votre rendez-vous. Nous vous confirmerons via WhatsApp.",
      sectionContact: "1. Vos coordonnées",
      labelFullName: "Nom complet *",
      placeholderFullName: "Ex : Sara El Amrani",
      errorFullName: "Veuillez saisir votre nom complet.",
      labelPhone: "Téléphone / WhatsApp *",
      placeholderPhone: "Ex : 212612345678",
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
      formNote: "En confirmant, un message WhatsApp pré-rempli s'ouvrira pour finaliser votre demande auprès du cabinet.",
      sendingMsg: "Envoi en cours...",
      successMsg: "Merci ! Ouverture de WhatsApp pour confirmer votre rendez-vous.",
      webhookErrorMsg: "Rendez-vous préparé. (Note : l'enregistrement automatique a échoué, mais WhatsApp va s'ouvrir.)",
    },
    ar: {
      clinicName: "عيادة الأمل لطب الأسنان",
      clinicTagline: "ابتسامتكم أولويتنا",
      introText: "املأ الاستمارة أدناه لحجز موعدك. سنؤكد لك عبر واتساب.",
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
      formNote: "بعد التأكيد، ستفتح رسالة واتساب معبأة مسبقاً لإتمام طلبك لدى العيادة.",
      sendingMsg: "جارٍ الإرسال...",
      successMsg: "شكراً لك! سيتم فتح واتساب لتأكيد موعدك.",
      webhookErrorMsg: "تم تجهيز الموعد. (ملاحظة: فشل الحفظ التلقائي، لكن واتساب سيفتح الآن.)",
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
      for (let m = 0; m < 60; m += 60) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const label = `${hh}:${mm}`;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-btn";
        btn.textContent = label;
        btn.setAttribute("data-time", label);
        btn.addEventListener("click", () => selectSlot(btn));
        container.appendChild(btn);
      }
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
     6. SUBMIT — build WhatsApp message + fire webhook
     --------------------------------------------------------- */
  const form = document.getElementById("bookingForm");
  const statusMsg = document.getElementById("statusMsg");

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status-msg ${type}`;
    statusMsg.hidden = false;
  }

  function formatDateForMessage(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function buildWhatsAppMessage(data) {
    const svc = services[data.service];
    const serviceLabel = `${svc.fr} / ${svc.ar}`;

    return (
      `*Nouvelle demande de rendez-vous / طلب حجز موعد جديد*\n\n` +
      `👤 Nom / الاسم : ${data.fullName}\n` +
      `📞 Téléphone / الهاتف : ${data.phone}\n` +
      (data.email ? `✉️ Email : ${data.email}\n` : "") +
      `🦷 Service / الخدمة : ${serviceLabel}\n` +
      `💰 Prix estimé / السعر التقديري : ${svc.price}\n` +
      `📅 Date : ${formatDateForMessage(data.date)}\n` +
      `⏰ Heure / الوقت : ${data.time}\n`
    );
  }

  async function sendToWebhook(data) {
    if (!CONFIG.WEBHOOK_URL) return; // webhook disabled

    try {
      await fetch(CONFIG.WEBHOOK_URL, {
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
    } catch (err) {
      // Non-blocking: the WhatsApp redirect must still happen even if the
      // webhook is unreachable (e.g. offline, misconfigured URL).
      console.warn("Webhook call failed:", err);
      throw err;
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

    let webhookFailed = false;
    try {
      await sendToWebhook(data);
    } catch (e) {
      webhookFailed = true;
    }

    // Build and open the WhatsApp deep link regardless of webhook outcome
    const message = buildWhatsAppMessage(data);
    const waUrl = `https://wa.me/${CONFIG.CLINIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener");

    showStatus(
      webhookFailed
        ? translations[currentLang].webhookErrorMsg
        : translations[currentLang].successMsg,
      webhookFailed ? "error" : "success"
    );

    submitBtn.disabled = false;
    form.reset();
    document.querySelectorAll(".slot-btn.selected").forEach((b) => b.classList.remove("selected"));
    serviceInfoBox.hidden = true;
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
