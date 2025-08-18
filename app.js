// =====================
// Sem subject - Production-Ready app.js
// =====================

// =====================
// Constants
// =====================
const STATUS_CLASSES = {
  Ahead: "text-green-600 dark:text-green-400",
  "On Track": "text-yellow-600 dark:text-yellow-400",
  Behind: "text-red-600 dark:text-red-400"
};

const REMINDER_INTERVAL = 15 * 60 * 1000; // 15 min
const REMINDER_GAP = 6 * 60 * 60 * 1000; // 6 hours

// =====================
// DOM Elements
// =====================
const cardsContainer = document.getElementById("cardsContainer");
const summaryEl = document.getElementById("summary");
const subjectFilter = document.getElementById("subjectFilter");
const statusFilter = document.getElementById("statusFilter");
const searchBox = document.getElementById("searchBox");
const addUnitBtn = document.getElementById("addUnitBtn");

const addModal = document.getElementById("addModal");
const modalSubject = document.getElementById("modalSubject");
const modalUnit = document.getElementById("modalUnit");
const modalCancel = document.getElementById("modalCancel");
const modalSave = document.getElementById("modalSave");
const modalTitle = document.getElementById("modalTitle");
const toast = document.getElementById("toast");
const modalTopicsContainer = document.getElementById("modalTopicsContainer");
const addTopicBtn = document.getElementById("addTopicBtn");

// =====================
// State
// =====================
let trackerData = [];
let editId = null;

// =====================
// Utilities
// =====================
function sanitize(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function getStatus(item) {
  if (item.covered >= 80) return "Ahead";
  if (item.covered >= 50) return "On Track";
  return "Behind";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

// =====================
// Fetch & Populate
// =====================
async function fetchData() {
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    trackerData = data.map(item => ({
      ...item,
      topics: Array.isArray(item.topics) ? item.topics : item.topics ? JSON.parse(item.topics) : []
    }));

    populateSubjectFilter();
    renderCards();
  } catch (err) {
    console.error("Fetch error:", err);
    showToast("⚠ Failed to fetch data.");
  }
}

function populateSubjectFilter() {
  subjectFilter.innerHTML = `<option value="All">All Subjects</option>`;
  [...new Set(trackerData.map(item => item.subject))].forEach(subj => {
    const opt = document.createElement("option");
    opt.value = subj;
    opt.textContent = subj;
    subjectFilter.appendChild(opt);
  });
}

// =====================
// Render Cards
// =====================
function renderCards() {
  cardsContainer.innerHTML = "";

  let filtered = trackerData.filter(item => {
    const subj = subjectFilter.value;
    const status = statusFilter.value;
    const query = searchBox.value.trim().toLowerCase();

    let matches = true;
    if (subj !== "All") matches = matches && item.subject === subj;
    if (status !== "All") matches = matches && getStatus(item) === status;
    if (query) {
      matches =
        matches &&
        (item.unit.toLowerCase().includes(query) ||
          item.subject.toLowerCase().includes(query) ||
          item.topics.some(t => t.name.toLowerCase().includes(query)));
    }
    return matches;
  });

  filtered.forEach(item => {
    const totalTopics = item.topics.length;
    const completedTopics = item.topics.filter(t => t.done).length;
    item.covered = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    const statusText = getStatus(item);

    const card = document.createElement("div");
    card.className = "unit-card bg-gray-50 dark:bg-slate-800 rounded-lg p-4 shadow space-y-3 transition-colors duration-300";
    card.dataset.id = item.id;

    const topicsHTML = item.topics
      .map(
        (t, idx) => `
      <label class="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-sm">
        <input type="checkbox" class="topic-checkbox" data-topic-idx="${idx}" ${t.done ? "checked" : ""}>
        <span class="${t.done ? "line-through text-slate-400 dark:text-slate-500" : ""}">
          ${sanitize(t.name)}
        </span>
      </label>`
      )
      .join("");

    card.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-200">${sanitize(item.subject)} — ${sanitize(item.unit)}</h3>
      <div class="space-y-1">${topicsHTML}</div>
      <div>
        <div class="text-xs mb-1 text-slate-600 dark:text-slate-300">Covered: ${item.covered}%</div>
        <div class="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
          <div class="h-2 bg-sky-500 rounded-full" style="width:${item.covered}%"></div>
        </div>
      </div>
      <div class="flex justify-between items-center mt-3">
        <div class="text-xs ${STATUS_CLASSES[statusText]}">${statusText}</div>
        <div class="space-x-2">
          <button class="edit-btn px-2 py-1 text-xs bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors">✏ Edit</button>
          <button class="delete-btn px-2 py-1 text-xs bg-red-500 text-white dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 rounded transition-colors">🗑 Delete</button>
        </div>
      </div>
    `;

    cardsContainer.appendChild(card);
  });

  updateSummary(filtered);
}

// =====================
// Event Delegation
// =====================
cardsContainer.addEventListener("change", async e => {
  if (!e.target.classList.contains("topic-checkbox")) return;

  const card = e.target.closest(".unit-card");
  if (!card) return;

  const unitId = card.dataset.id;
  const topicIdx = e.target.dataset.topicIdx;
  const unit = trackerData.find(u => u.id === unitId);
  if (!unit) return;

  unit.topics[topicIdx].done = e.target.checked;
  const total = unit.topics.length;
  const completed = unit.topics.filter(t => t.done).length;
  unit.covered = total === 0 ? 0 : Math.round((completed / total) * 100);

  try {
    await supabase.from("progress").update({ topics: unit.topics, covered: unit.covered }).eq("id", unitId);

    // Update DOM
    card.querySelector("div.text-xs.mb-1").textContent = `Covered: ${unit.covered}%`;
    card.querySelector("div.w-full div.bg-sky-500").style.width = `${unit.covered}%`;
    const statusText = getStatus(unit);
    const statusEl = card.querySelector("div.flex > div.text-xs");
    statusEl.textContent = statusText;
    statusEl.className = `text-xs ${STATUS_CLASSES[statusText]}`;

    updateSummary(trackerData);
  } catch (err) {
    console.error(err);
    showToast("⚠ Failed to update topic.");
  }
});

cardsContainer.addEventListener("click", e => {
  const card = e.target.closest(".unit-card");
  if (!card) return;
  const unitId = card.dataset.id;

  if (e.target.classList.contains("edit-btn")) openModal(unitId);
  if (e.target.classList.contains("delete-btn")) deleteUnit(unitId);
});
cardsContainer.addEventListener("change", async e => {
  if (!e.target.classList.contains("topic-checkbox")) return;

  const card = e.target.closest(".unit-card");
  const span = e.target.nextElementSibling; // <span> right after the checkbox
  if (e.target.checked) {
    span.classList.add("line-through", "text-slate-400", "dark:text-slate-500");
  } else {
    span.classList.remove("line-through", "text-slate-400", "dark:text-slate-500");
  }
});
// =====================
// Summary
// =====================
function updateSummary(data) {
  if (!data.length) {
    summaryEl.textContent = "No units found.";
    return;
  }
  const avgCovered = (data.reduce((a, b) => a + b.covered, 0) / data.length).toFixed(1);
  summaryEl.textContent = `Avg Covered: ${avgCovered}%`;
}

// =====================
// Modal Logic
// =====================
function createTopicInput(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-center space-x-2";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.className = "flex-1 px-3 py-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white transition";
  wrapper.appendChild(input);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "🗑";
  removeBtn.className = "px-2 py-1 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition";
  removeBtn.addEventListener("click", () => wrapper.remove());
  wrapper.appendChild(removeBtn);

  modalTopicsContainer.appendChild(wrapper);
}

addTopicBtn.addEventListener("click", () => createTopicInput());

function openModal(id = null) {
  addModal.classList.remove("hidden");
  setTimeout(() => addModal.classList.remove("opacity-0"), 10);

  modalTopicsContainer.innerHTML = "";

  if (id) {
    editId = id;
    const item = trackerData.find(t => t.id === id);
    modalSubject.value = item.subject;
    modalUnit.value = item.unit;
    modalTitle.textContent = "Edit Unit";
    item.topics.forEach(t => createTopicInput(t.name));
  } else {
    editId = null;
    modalSubject.value = "";
    modalUnit.value = "";
    modalTitle.textContent = "Add New Unit";
    createTopicInput();
  }

  modalSubject.focus();
}

function closeModal() {
  addModal.classList.add("opacity-0");
  setTimeout(() => addModal.classList.add("hidden"), 200);
}

modalCancel.addEventListener("click", closeModal);

// =====================
// CRUD
// =====================
modalSave.addEventListener("click", async () => {
  const subject = modalSubject.value.trim();
  const unit = modalUnit.value.trim();

  // Gather topics from modal
  let topics = Array.from(modalTopicsContainer.querySelectorAll("input"))
    .map(input => ({ name: input.value.trim(), done: false }))
    .filter(t => t.name !== "");

  if (!subject || !unit || topics.length === 0) {
    showToast("⚠ Please fill all fields and add at least one topic.");
    return;
  }

  if (editId) {
    const oldUnit = trackerData.find(u => u.id === editId);

    // Preserve "done" for existing topics by position
    topics = topics.map((t, idx) => ({
      name: t.name,
      done: oldUnit.topics[idx] ? oldUnit.topics[idx].done : false
    }));
  }

  // Recalculate covered %
  const covered = Math.round((topics.filter(t => t.done).length / topics.length) * 100);

  try {
    if (editId) {
      const { error } = await supabase
        .from("progress")
        .update({ subject, unit, topics, covered, updated_at: new Date() })
        .eq("id", editId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("progress")
        .insert([{ subject, unit, topics, covered }]);
      if (error) throw error;
    }

    closeModal();
    fetchData();
  } catch (err) {
    console.error(err);
    showToast("⚠ Failed to save unit.");
  }
});


async function deleteUnit(id) {
  if (!confirm("Are you sure you want to delete this unit?")) return;
  try {
    const { error } = await supabase.from("progress").delete().eq("id", id);
    if (error) throw error;
    fetchData();
  } catch (err) {
    console.error(err);
    showToast("⚠ Failed to delete unit.");
  }
}

// =====================
// Filters & Search (Debounced)
// =====================
let debounceTimeout;
searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(renderCards, 200);
});
subjectFilter.addEventListener("change", renderCards);
statusFilter.addEventListener("change", renderCards);
addUnitBtn.addEventListener("click", () => openModal());

// =====================
// Init
// =====================
fetchData();

// =====================
// Service Worker
// =====================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("✅ SW registered"))
    .catch(err => console.error("❌ SW registration failed", err));
}

// =====================
// Smart Reminder
// =====================
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }
  return false;
}

function pickReminder(topics) {
  const now = Date.now();
  const candidates = topics.filter(t => {
    const last = t.last_reminded ? new Date(t.last_reminded).getTime() : 0;
    const incomplete = t.covered < 100;
    return now - last > REMINDER_GAP && incomplete;
  });
  candidates.sort((a, b) => a.covered - b.covered);
  return candidates[0] || null;
}

function generateMessage(topic) {
  if (topic.covered === 0) return `⏳ You haven't started "${topic.unit}" in ${topic.subject} yet.`;
  if (topic.covered < 50) return `📚 Keep pushing on "${topic.unit}" — you're at ${topic.covered}%.`;
  if (topic.covered < 80) return `🚀 You're doing great on "${topic.unit}" — finish strong!`;
  if (topic.covered < 100) return `💪 Almost done! Only ${100 - topic.covered}% left for "${topic.unit}".`;
  return null;
}

async function sendSmartReminder() {
  try {
    const { data: topics, error } = await supabase.from("progress").select("*");
    if (error) throw error;
    const reminder = pickReminder(topics);
    if (!reminder) return;
    const message = generateMessage(reminder);
    if (!message) return;
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const registration = await navigator.serviceWorker.ready;
    registration.showNotification("Study Reminder 📌", {
      body: message,
      icon: "/icons/reminder.png",
      vibrate: [200, 100, 200],
      requireInteraction: true
    });

    await supabase.from("progress").update({ last_reminded: new Date().toISOString() }).eq("id", reminder.id);
  } catch (err) {
    console.error("Reminder error:", err);
  }
}

setInterval(sendSmartReminder, REMINDER_INTERVAL);
setTimeout(sendSmartReminder, 15 * 1000);
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;

  if (localStorage.getItem("theme") === "dark") {
    root.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    root.classList.toggle("dark");
    if (root.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      themeToggle.textContent = "☀️"; 
    } else {
      localStorage.setItem("theme", "light");
      themeToggle.textContent = "🌙";
    }
  });
