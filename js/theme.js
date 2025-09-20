const toggle = document.getElementById("theme-toggle");
const body = document.body;
const icon = toggle.querySelector("img");

if (body.classList.contains("dark")) {
  icon.src = "/img/sun.svg";
  icon.alt = "Switch to light theme";
} else {
  icon.src = "/img/moon.svg";
  icon.alt = "Switch to dark theme";
}

toggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  if (body.classList.contains("dark")) {
    icon.src = "/img/sun.svg";
    icon.alt = "Switch to light theme";
  } else {
    icon.src = "/img/moon.svg";
    icon.alt = "Switch to dark theme";
  }
});
