document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/components/navbar.html");
    const html = await res.text();

    document.getElementById("navbar").innerHTML = html;

    // wait until DOM updates
    setTimeout(() => {
      const btn = document.getElementById("menuBtn");
      const menu = document.getElementById("navLinks");
      const navbar = document.querySelector(".navbar");

      if (!btn || !menu) {
        console.error("Navbar not loaded properly");
        return;
      }

      // ✅ Mobile toggle
      btn.addEventListener("click", () => {
        menu.classList.toggle("active");
      });

      // ✅ Close on link click
      document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", () => {
          menu.classList.remove("active");
        });
      });

      // ✅ Active page highlight
      const current = window.location.pathname.split("/").pop();

      document.querySelectorAll(".nav-links a").forEach(link => {
        if (link.getAttribute("href") === current) {
          link.classList.add("active-link");
        }
      });

      // ✅ Scroll effect (premium feel)
      window.addEventListener("scroll", () => {
        if (window.scrollY > 20) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });

    }, 50);

  } catch (err) {
    console.error("Navbar load failed:", err);
  }
});