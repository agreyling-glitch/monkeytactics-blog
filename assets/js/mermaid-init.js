import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "default";
mermaid.initialize({ startOnLoad: true, theme });
