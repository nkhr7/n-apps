document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  function setOpen(isOpen) {
    menu.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.classList.toggle("is-open", isOpen);
  }

  toggle.addEventListener("click", () => {
    setOpen(menu.hidden);
  });

  document.addEventListener("click", (event) => {
    if (menu.hidden) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false);
  });

  menu.querySelectorAll("a").forEach((link) => {
    if (link.pathname === window.location.pathname) {
      link.classList.add("active");
    }
  });
});
