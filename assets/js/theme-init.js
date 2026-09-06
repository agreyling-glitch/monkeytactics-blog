try {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
} catch (_) {
  // Keep the stylesheet's default theme when storage is unavailable.
}
