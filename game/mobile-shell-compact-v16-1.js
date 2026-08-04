const id = "mobileGameShellCompactStylesV161";
if (!document.getElementById(id)) {
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "./mobile-shell-v16-1-compact.css?v=161";
  document.head.appendChild(link);
}
