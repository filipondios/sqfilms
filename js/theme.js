const toggle = document.getElementById("theme-toggle");
const body = document.body;
const icon = toggle.querySelector("img");

function applyTheme(theme) {
  if (theme === "dark") {
    body.classList.add("dark");
    icon.src = "/img/sun.svg";
    icon.alt = "Switch to light theme";
  } else {
    body.classList.remove("dark");
    icon.src = "/img/moon.svg";
    icon.alt = "Switch to dark theme";
  }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

toggle.addEventListener("click", () => {
  const newTheme = body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});
