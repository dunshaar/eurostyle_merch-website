/* script.js */
(function () {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // ===== Viewport height fix for mobile/iOS =====
  function setVhVar() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }
  setVhVar();
  window.addEventListener("resize", setVhVar);

  // ===== Smooth scroll + active menu =====
  function bindNav() {
    const links = $$(".nav__link, .mnav__link");
    const topbar = $("#topbar");
    const headerH = () => (topbar?.offsetHeight || 72);

    function closeMobile() {
      const mnav = $("#mnav");
      if (!mnav) return;
      mnav.classList.remove("is-open");
      mnav.setAttribute("aria-hidden", "true");
      const burger = $("#burger");
      burger?.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
    }

    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        closeMobile();

        const top = target.getBoundingClientRect().top + window.scrollY - headerH() + 2;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });

    const sections = $$("section[id]");
    const navLinks = $$(".nav__link").filter((a) => (a.getAttribute("href") || "").startsWith("#"));

    function setActive() {
      const y = window.scrollY + headerH() + 12;
      let currentId = "";
      sections.forEach((s) => {
        if (s.offsetTop <= y) currentId = s.id;
      });
      navLinks.forEach((a) => {
        const on = (a.getAttribute("href") || "") === `#${currentId}`;
        a.classList.toggle("is-active", on);
      });
    }
    setActive();
    window.addEventListener("scroll", setActive, { passive: true });
  }

  // ===== Mobile menu =====
  function bindBurger() {
    const burger = $("#burger");
    const mnav = $("#mnav");
    if (!burger || !mnav) return;

    function toggle() {
      const open = mnav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      mnav.setAttribute("aria-hidden", open ? "false" : "true");
    }

    burger.addEventListener("click", toggle);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        mnav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        mnav.setAttribute("aria-hidden", "true");
      }
    });
  }

  // ===== Lightbox (gallery) =====
  function bindLightbox() {
    const lb = $("#lightbox");
    const lbImg = $("#lbImg");
    const lbCount = $("#lbCount");
    const lbThumbs = $("#lbThumbs");
    if (!lb || !lbImg || !lbCount || !lbThumbs) return;

    const shots = $$("[data-gallery]");
    if (!shots.length) return;

    let items = [];
    let active = 0;

    function collect(gname) {
      items = shots
        .filter((b) => b.getAttribute("data-gallery") === gname)
        .map((b) => ({
          src: b.getAttribute("data-src") || "",
          alt: b.getAttribute("data-alt") || "",
          thumb: b.querySelector("img")?.getAttribute("src") || b.getAttribute("data-src") || "",
        }))
        .filter((x) => x.src);
    }

    function openAt(i) {
      active = Math.max(0, Math.min(i, items.length - 1));
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      render();
      setTimeout(() => lb.classList.add("is-ready"), 0);
    }

    function close() {
      lb.classList.remove("is-ready");
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function render() {
      const it = items[active];
      if (!it) return;

      lbImg.style.opacity = "0";
      lbImg.style.transform = "scale(.985)";

      const img = new Image();
      img.onload = () => {
        lbImg.src = it.src;
        lbImg.alt = it.alt || "";
        lbCount.textContent = `${active + 1} / ${items.length}`;
        renderThumbs();
        requestAnimationFrame(() => {
          lbImg.style.opacity = "1";
          lbImg.style.transform = "scale(1)";
        });
      };
      img.src = it.src;
    }

    function renderThumbs() {
      lbThumbs.innerHTML = "";
      items.forEach((it, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lb__thumb" + (i === active ? " is-active" : "");
        b.innerHTML = `<img src="${it.thumb}" alt="" loading="lazy">`;
        b.addEventListener("click", () => {
          active = i;
          render();
        });
        lbThumbs.appendChild(b);
      });
    }

    function next() {
      active = (active + 1) % items.length;
      render();
    }
    function prev() {
      active = (active - 1 + items.length) % items.length;
      render();
    }

    shots.forEach((b) => {
      b.addEventListener("click", () => {
        const g = b.getAttribute("data-gallery");
        collect(g);
        const src = b.getAttribute("data-src");
        const idx = items.findIndex((x) => x.src === src);
        openAt(idx >= 0 ? idx : 0);
      });
    });

    $$("[data-lb-close]", lb).forEach((el) => el.addEventListener("click", close));
    $("[data-lb-next]", lb)?.addEventListener("click", next);
    $("[data-lb-prev]", lb)?.addEventListener("click", prev);

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });

    let startX = 0;
    let startY = 0;
    lbImg.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      },
      { passive: true }
    );

    lbImg.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > 50 && Math.abs(dy) < 60) {
          dx < 0 ? next() : prev();
        }
      },
      { passive: true }
    );
  }

  // ===== Form (mailto + копирование + подсказки) =====
  function bindForm() {
    const form = $("#leadForm");
    const toast = $("#toast");
    if (!form) return;

    const nameInput = $("#nameInput");
    const contactInput = $("#contactInput");
    const contactHint = $("#contactHint");

    const show = (msg) => {
      if (!toast) return;
      toast.textContent = msg;
    };

    const setFieldState = (el, state) => {
      const field = el?.closest?.(".field");
      if (!field) return;
      field.classList.remove("is-ok", "is-bad");
      if (state) field.classList.add(state);
    };

    const capitalizeFirst = (s) => {
      if (!s) return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    nameInput?.addEventListener("input", () => {
      const pos = nameInput.selectionStart ?? nameInput.value.length;
      nameInput.value = capitalizeFirst(nameInput.value);
      try {
        nameInput.setSelectionRange(pos, pos);
      } catch (_) {}
    });

    const isEmailLike = (v) => /@/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const digitsOnly = (v) => (v || "").replace(/\D/g, "");

    function detectType(value) {
      const v = (value || "").trim();
      if (!v) return "auto";
      if (isEmailLike(v)) return "email";
      const d = digitsOnly(v);
      if (d.length > 0) return "phone";
      return "auto";
    }

    // ---- Phone format helpers (RU) ----
    function normalizeRuDigits(raw) {
      let d = (raw || "").replace(/\D/g, "");

      if (!d) return "";

      // 8xxxxxxxxxx -> 7xxxxxxxxxx
      if (d.startsWith("8")) d = "7" + d.slice(1);

      // 9xxxxxxxxx -> 79xxxxxxxxx
      if (d.length === 10 && d.startsWith("9")) d = "7" + d;

      if (d.length > 11) d = d.slice(0, 11);

      return d;
    }

    function formatRuFromDigits(d) {
      if (!d) return "";

      const cc = d[0] === "7" ? "7" : d[0];
      const p1 = d.slice(1, 4);
      const p2 = d.slice(4, 7);
      const p3 = d.slice(7, 9);
      const p4 = d.slice(9, 11);

      let out = `+${cc}`;
      if (p1.length) out += ` (${p1}`;
      if (p1.length === 3) out += `)`;
      if (p2.length) out += ` ${p2}`;
      if (p3.length) out += `-${p3}`;
      if (p4.length) out += `-${p4}`;
      return out;
    }

    // caret mapping: keep same count of digits before caret
    function digitsBeforeCaret(value, caretPos) {
      const left = value.slice(0, Math.max(0, caretPos));
      return (left.match(/\d/g) || []).length;
    }

    function caretPosForDigitIndex(formatted, digitIndex) {
      if (digitIndex <= 0) return 0;
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen >= digitIndex) return i + 1;
      }
      return formatted.length;
    }

    function applyPhoneMaskWithCaret(inputEl) {
      const old = inputEl.value;
      const caret = inputEl.selectionStart ?? old.length;

      const digitIndex = digitsBeforeCaret(old, caret);
      const d = normalizeRuDigits(old);
      const formatted = formatRuFromDigits(d);

      inputEl.value = formatted;

      const newPos = caretPosForDigitIndex(formatted, digitIndex);
      try {
        inputEl.setSelectionRange(newPos, newPos);
      } catch (_) {}
    }

    function isValidPhone(v) {
      const d = normalizeRuDigits(v);
      return d.length === 11 && d.startsWith("7");
    }

    function updateHint() {
      if (!contactHint) return;
      contactHint.textContent = "Телефон или email — как удобно.";
    }


    // ===== Digit-only deletion (Backspace/Delete remove ONLY digits) =====
    // When we handle deletion ourselves, we should ignore the next input-mask pass.
    let suppressNextMask = false;

    function isPhoneContext() {
      return detectType(contactInput?.value || "") === "phone";
    }

    function getSelection() {
      const v = contactInput.value || "";
      const s = contactInput.selectionStart ?? v.length;
      const e = contactInput.selectionEnd ?? v.length;
      return { v, s, e };
    }

    function setValueAndCaretFromDigits(newDigits, caretDigitIndex) {
      const d = normalizeRuDigits(newDigits);
      const formatted = formatRuFromDigits(d);

      contactInput.value = formatted;

      const pos = caretPosForDigitIndex(formatted, caretDigitIndex);
      try {
        contactInput.setSelectionRange(pos, pos);
      } catch (_) {}
    }

    function handleDigitOnlyDelete(isBackspace) {
      const { v, s, e } = getSelection();
      const digits = digitsOnly(v);

      if (!digits) return false;

      // digit indices in "digits" string
      const a = digitsBeforeCaret(v, Math.min(s, e));
      const b = digitsBeforeCaret(v, Math.max(s, e));

      // selection deletes digits in [a, b)
      if (s !== e) {
        if (a === b) return false;
        const newDigits = digits.slice(0, a) + digits.slice(b);
        suppressNextMask = true;
        setValueAndCaretFromDigits(newDigits, a);
        return true;
      }

      // no selection: delete one digit left/right
      if (isBackspace) {
        const idx = a - 1;
        if (idx < 0) return true; // nothing to delete, but we still suppress native char deletion
        const newDigits = digits.slice(0, idx) + digits.slice(idx + 1);
        suppressNextMask = true;
        setValueAndCaretFromDigits(newDigits, idx);
        return true;
      } else {
        const idx = a; // digit to the right of caret
        if (idx >= digits.length) return true;
        const newDigits = digits.slice(0, idx) + digits.slice(idx + 1);
        suppressNextMask = true;
        setValueAndCaretFromDigits(newDigits, idx);
        return true;
      }
    }

    // Intercept Backspace/Delete
    contactInput?.addEventListener("keydown", (e) => {
      if (!contactInput) return;

      if (e.key !== "Backspace" && e.key !== "Delete") return;
      if (!isPhoneContext()) return;

      // Prevent default deletion of formatting chars
      e.preventDefault();

      const handled = handleDigitOnlyDelete(e.key === "Backspace");
      if (handled) updateHint();
    });

    // Apply mask normally on input (typing/paste), but skip right after our custom delete
    contactInput?.addEventListener("input", () => {
      const type = detectType(contactInput.value);

      if (type === "phone") {
        if (suppressNextMask) {
          suppressNextMask = false;
        } else {
          applyPhoneMaskWithCaret(contactInput);
        }
      }

      updateHint();
    });

    updateHint();

    const get = (name) => (form.elements[name]?.value || "").trim();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = capitalizeFirst(get("name"));
      if (nameInput) nameInput.value = name;

      const contact = get("contact");
      const message = get("message");

      show("");
      setFieldState(nameInput, name ? "is-ok" : "is-bad");
      setFieldState(contactInput, contact ? "is-ok" : "is-bad");
      setFieldState(form.elements["message"], message ? "is-ok" : "is-bad");

      if (!name || !contact || !message) {
        show("Заполните, пожалуйста: имя, контакт и описание заказа.");
        return;
      }

      const type = detectType(contact);

      if (type === "email") {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        setFieldState(contactInput, ok ? "is-ok" : "is-bad");
        if (!ok) {
          show("Похоже, это не email. Проверьте формат.");
          return;
        }
      }

      if (type === "phone") {
        const ok = isValidPhone(contact);
        setFieldState(contactInput, ok ? "is-ok" : "is-bad");
        if (!ok) {
          show("Телефон должен быть в формате +7 (999) 999-99-99.");
          return;
        }
      }

      const subject = encodeURIComponent("Заявка: вязаный мерч");
      const plain =
`Имя: ${name}
Контакт: ${contact}

Запрос:
${message}`;
      const body = encodeURIComponent(plain + "\n\n---");
      const to = ""; // если нужно — вставь email заказчика сюда
      const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

      try { await navigator.clipboard.writeText(plain); } catch (_) {}

      show("Открываю письмо с готовым текстом. (Текст заявки скопирован в буфер.)");
      window.location.href = mailto;
    });
  }

  // ===== Init =====
  bindNav();
  bindBurger();
  bindLightbox();
  bindForm();
})();
