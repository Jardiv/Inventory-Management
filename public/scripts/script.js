(() => {
    try {
        const theme = localStorage.getItem("theme");
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    } catch (e) {
        console.error("Theme read error:", e);
    }
})();

function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Optional: Add click event
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.querySelector("#theme-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleTheme);
    }
});
