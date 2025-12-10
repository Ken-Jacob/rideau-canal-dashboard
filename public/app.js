// app.js

const REFRESH_INTERVAL_MS = 30000;

const LOCATION_CARD_IDS = {
  "Dow's Lake": "card-dows-lake",
  "Fifth Avenue": "card-fifth-avenue",
  NAC: "card-nac",
};

let iceChart = null;
let tempChart = null;

async function fetchLatest() {
  const res = await fetch("/api/latest");
  if (!res.ok) throw new Error("Failed to fetch latest");
  const data = await res.json();
  return data.locations || [];
}

async function fetchHistory() {
  const res = await fetch("/api/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  const data = await res.json();
  return data.points || [];
}

function formatTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function setBadgeClass(el, status) {
  el.classList.remove("badge-neutral", "badge-safe", "badge-caution", "badge-unsafe");

  switch ((status || "").toLowerCase()) {
    case "safe":
      el.classList.add("badge-safe");
      break;
    case "caution":
      el.classList.add("badge-caution");
      break;
    case "unsafe":
      el.classList.add("badge-unsafe");
      break;
    default:
      el.classList.add("badge-neutral");
  }
}

// Update the three cards & overall status
function updateCards(latestArray) {
  let overall = "Unknown";

  // compute overall status priority: Unsafe > Caution > Safe
  const priorities = { unsafe: 3, caution: 2, safe: 1 };
  let maxPriority = 0;

  latestArray.forEach((doc) => {
    const loc = doc.location;
    const cardId = LOCATION_CARD_IDS[loc];
    if (!cardId) return;

    const card = document.getElementById(cardId);
    if (!card) return;

    const iceEl = card.querySelector("[data-role='ice-thickness']");
    const surfEl = card.querySelector("[data-role='surface-temp']");
    const extEl = card.querySelector("[data-role='external-temp']");
    const snowEl = card.querySelector("[data-role='snow']");
    const tsEl = card.querySelector("[data-role='window-end']");
    const badgeEl = card.querySelector("[data-role='status-badge']");

    if (iceEl) iceEl.textContent = doc.avgIceThickness?.toFixed(1) ?? "-";
    if (surfEl) surfEl.textContent = doc.avgSurfaceTemp?.toFixed(1) ?? "-";
    if (extEl) extEl.textContent = doc.avgExternalTemp?.toFixed(1) ?? "-";
    if (snowEl) snowEl.textContent = doc.maxSnowAccumulation?.toFixed(1) ?? "-";
    if (tsEl) tsEl.textContent = formatTime(doc.windowEnd);

    const status = doc.safetyStatus || "Unknown";
    if (badgeEl) {
      badgeEl.textContent = status;
      setBadgeClass(badgeEl, status);
    }

    const p = priorities[status.toLowerCase()] || 0;
    if (p > maxPriority) {
      maxPriority = p;
      overall = status;
    }
  });

  const overallBadge = document.getElementById("overall-badge");
  if (overallBadge) {
    overallBadge.textContent = overall;
    setBadgeClass(overallBadge, overall);
  }
}

// Build / update charts
function updateCharts(historyArray) {
  if (!historyArray || historyArray.length === 0) {
    return;
  }

  // Deduplicate & sort timestamps
  const uniqueTimes = Array.from(
    new Set(historyArray.map((p) => p.windowEnd))
  ).sort();

  const labels = uniqueTimes.map((t) => formatTime(t));

  const locations = ["Dow's Lake", "Fifth Avenue", "NAC"];

  function buildSeries(field) {
    const byLoc = {};
    locations.forEach((loc) => (byLoc[loc] = {}));

    historyArray.forEach((p) => {
      if (!byLoc[p.location]) return;
      byLoc[p.location][p.windowEnd] = p[field];
    });

    return locations.map((loc) => {
      const series = uniqueTimes.map((t) => {
        const val = byLoc[loc][t];
        return typeof val === "number" ? Number(val.toFixed(2)) : null;
      });
      return { label: loc, data: series };
    });
  }

  const iceSeries = buildSeries("avgIceThickness");
  const tempSeries = buildSeries("avgSurfaceTemp");

  const iceCtx = document.getElementById("iceChart").getContext("2d");
  const tempCtx = document.getElementById("tempChart").getContext("2d");

  if (!iceChart) {
    iceChart = new Chart(iceCtx, {
      type: "line",
      data: {
        labels,
        datasets: iceSeries.map((s) => ({
          label: s.label,
          data: s.data,
          spanGaps: true,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Time (last hour)" } },
          y: { title: { display: true, text: "Ice Thickness (cm)" } },
        },
      },
    });
  } else {
    iceChart.data.labels = labels;
    iceChart.data.datasets.forEach((ds, idx) => {
      ds.data = iceSeries[idx].data;
    });
    iceChart.update();
  }

  if (!tempChart) {
    tempChart = new Chart(tempCtx, {
      type: "line",
      data: {
        labels,
        datasets: tempSeries.map((s) => ({
          label: s.label,
          data: s.data,
          spanGaps: true,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Time (last hour)" } },
          y: { title: { display: true, text: "Surface Temperature (°C)" } },
        },
      },
    });
  } else {
    tempChart.data.labels = labels;
    tempChart.data.datasets.forEach((ds, idx) => {
      ds.data = tempSeries[idx].data;
    });
    tempChart.update();
  }
}

async function refreshDashboard() {
  try {
    const [latest, history] = await Promise.all([
      fetchLatest(),
      fetchHistory(),
    ]);
    updateCards(latest);
    updateCharts(history);
    console.log("Dashboard refreshed");
  } catch (err) {
    console.error("Error refreshing dashboard:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshDashboard();
  setInterval(refreshDashboard, REFRESH_INTERVAL_MS);
});
