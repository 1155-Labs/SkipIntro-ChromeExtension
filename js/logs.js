// logs.js – Skip Intro Dev Logs page

let activeFilter = "ALL";
let autoRefresh = true;
let autoRefreshTimer = null;
let allLogs = [];

function formatTime(isoStr) {
    try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString("en-IN", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
    } catch { return isoStr; }
}

function renderLogs() {
    const container = document.getElementById("log-container");
    const countEl = document.getElementById("log-count");

    const filtered = activeFilter === "ALL"
        ? allLogs
        : allLogs.filter((l) => l.cat === activeFilter);

    countEl.textContent = `${filtered.length} / ${allLogs.length} entries`;

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <h2>No ${activeFilter === "ALL" ? "" : activeFilter + " "}logs yet</h2>
        <p>Open YouTube, Prime Video, or Hotstar with Dev Mode enabled to start seeing logs here.</p>
      </div>`;
        return;
    }

    // Render newest first
    const reversed = [...filtered].reverse();
    container.innerHTML = reversed.map((log) => `
    <div class="log-entry" data-cat="${log.cat}">
      <span class="log-ts">${formatTime(log.ts)}</span>
      <span class="log-cat ${log.cat}">${log.cat}</span>
      <span class="log-msg">${escapeHtml(log.msg)}</span>
    </div>
  `).join("");
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function loadLogs() {
    chrome.storage.local.get(["devLogs"], (data) => {
        allLogs = data.devLogs || [];
        renderLogs();
    });
}

function clearLogs() {
    if (!confirm("Clear all dev logs?")) return;
    chrome.storage.local.set({ devLogs: [] }, () => {
        allLogs = [];
        renderLogs();
    });
}

function copyAllLogs() {
    if (allLogs.length === 0) {
        alert("No logs to copy.");
        return;
    }

    const header = [
        "=== Skip Intro Dev Logs ===",
        `Copied at: ${new Date().toISOString()}`,
        `Total entries: ${allLogs.length}`,
        "===========================",
        ""
    ].join("\n");

    // Newest first, full detail
    const lines = [...allLogs].reverse().map((log) => {
        const time = formatTime(log.ts);
        return `[${time}] [${log.cat.padEnd(9)}] ${log.msg}  (${log.url})`;
    }).join("\n");

    navigator.clipboard.writeText(header + lines).then(() => {
        const btn = document.getElementById("btn-copy");
        btn.textContent = "✅ Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
            btn.textContent = "📋 Copy All";
            btn.classList.remove("copied");
        }, 2000);
    }).catch(() => {
        alert("Copy failed — try manually selecting the logs.");
    });
}

function setAutoRefresh(enabled) {
    autoRefresh = enabled;
    const btn = document.getElementById("btn-auto");
    btn.textContent = enabled ? "Auto ✓" : "Auto";
    btn.style.background = enabled ? "var(--accent)" : "transparent";
    btn.style.color = enabled ? "#0d1117" : "var(--text-muted)";

    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (enabled) {
        autoRefreshTimer = setInterval(loadLogs, 1500);
    }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    loadLogs();

    document.getElementById("btn-refresh").addEventListener("click", loadLogs);
    document.getElementById("btn-copy").addEventListener("click", copyAllLogs);
    document.getElementById("btn-clear").addEventListener("click", clearLogs);
    document.getElementById("btn-auto").addEventListener("click", () => setAutoRefresh(!autoRefresh));

    // Filter chips
    document.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.dataset.cat;
            renderLogs();
        });
    });

    // Start auto-refresh
    setAutoRefresh(true);
});
