export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", t);
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = !root.classList.contains("dark");
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
