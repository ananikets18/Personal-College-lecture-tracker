// =====================
// Sem III Tracker - app.js (Supabase + Dynamic Topics + Checklist Progress)
// =====================

// =====================
// DOM Elements
// =====================
const cardsContainer = document.getElementById("cardsContainer")
const summaryEl = document.getElementById("summary")
const subjectFilter = document.getElementById("subjectFilter")
const statusFilter = document.getElementById("statusFilter")
const searchBox = document.getElementById("searchBox")
const addUnitBtn = document.getElementById("addUnitBtn")

// Modal
const addModal = document.getElementById("addModal")
const modalSubject = document.getElementById("modalSubject")
const modalUnit = document.getElementById("modalUnit")
const modalCovered = document.getElementById("modalCovered")
const modalCancel = document.getElementById("modalCancel")
const modalSave = document.getElementById("modalSave")
const modalTitle = document.getElementById("modalTitle")
const toast = document.getElementById("toast")
const modalTopicsContainer = document.getElementById("modalTopicsContainer")
const addTopicBtn = document.getElementById("addTopicBtn")

// =====================
// Data
// =====================
let trackerData = []
let editId = null // null = add mode, uuid = edit mode

// =====================
// Fetch Data
// =====================
async function fetchData() {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  // Ensure topics are arrays
  trackerData = data.map(item => ({
    ...item,
    topics: Array.isArray(item.topics)
      ? item.topics
      : item.topics
        ? JSON.parse(item.topics)
        : []
  }))

  populateSubjectFilter()
  renderCards()
}

function populateSubjectFilter() {
  subjectFilter.innerHTML = `<option value="All">All Subjects</option>`
  ;[...new Set(trackerData.map(item => item.subject))].forEach(subj => {
    const opt = document.createElement("option")
    opt.value = subj
    opt.textContent = subj
    subjectFilter.appendChild(opt)
  })
}

// =====================
// Rendering Cards
// =====================
function renderCards() {
  cardsContainer.innerHTML = ""

  let filtered = [...trackerData]

  const subj = subjectFilter.value
  if (subj && subj !== "All") filtered = filtered.filter(item => item.subject === subj)

  const status = statusFilter.value
  if (status !== "All") filtered = filtered.filter(item => getStatus(item) === status)

  const query = searchBox.value.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(item =>
      item.unit.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      item.topics.some(t => t.name.toLowerCase().includes(query))
    )
  }

  filtered.forEach(item => {
    const totalTopics = item.topics.length
    const completedTopics = item.topics.filter(t => t.done).length
    item.covered = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100)

    const statusText = getStatus(item)
    const statusColor =
      statusText === "Ahead" ? "text-green-600 dark:text-green-400" :
      statusText === "On Track" ? "text-yellow-600 dark:text-yellow-400" :
      "text-red-600 dark:text-red-400"

    const card = document.createElement("div")
    card.className = "bg-slate-100 dark:bg-slate-800 rounded-lg p-4 shadow-lg space-y-3 transition-colors duration-300"

    // Topic checklist HTML
    const topicsHTML = item.topics.map((t, idx) => `
      <label class="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-sm">
        <input type="checkbox" class="topic-checkbox" data-unit-id="${item.id}" data-topic-idx="${idx}" ${t.done ? "checked" : ""}>
        <span>${t.name}</span>
      </label>
    `).join("")

    card.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-200">${item.subject} — ${item.unit}</h3>
      <div class="space-y-1">${topicsHTML}</div>
      <div>
        <div class="text-xs mb-1 text-slate-600 dark:text-slate-300">Covered: ${item.covered}%</div>
        <div class="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
          <div class="h-2 bg-sky-500 rounded-full" style="width:${item.covered}%"></div>
        </div>
      </div>
      <div class="flex justify-between items-center mt-3">
        <div class="text-xs ${statusColor}">${statusText}</div>
        <div class="space-x-2">
          <button class="edit-btn px-2 py-1 text-xs bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors" data-id="${item.id}">✏ Edit</button>
          <button class="delete-btn px-2 py-1 text-xs bg-red-500 text-white dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 rounded transition-colors" data-id="${item.id}">🗑 Delete</button>
        </div>
      </div>
    `

    cardsContainer.appendChild(card)
  })

  // =====================
  // Optimized Topic Checkbox Update
  // =====================
  document.querySelectorAll(".topic-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", async e => {
      const unitId = e.target.dataset.unitId
      const topicIdx = e.target.dataset.topicIdx
      const unit = trackerData.find(u => u.id === unitId)
      unit.topics[topicIdx].done = e.target.checked

      // Update covered %
      const total = unit.topics.length
      const completed = unit.topics.filter(t => t.done).length
      unit.covered = total === 0 ? 0 : Math.round((completed / total) * 100)

      // Persist to Supabase
      await supabase.from("progress").update({ topics: unit.topics, covered: unit.covered }).eq("id", unitId)

      // Update only this card
      const card = e.target.closest("div.bg-slate-100, div.bg-slate-800")
      if (card) {
        const coveredText = card.querySelector("div.text-xs.mb-1")
        if (coveredText) coveredText.textContent = `Covered: ${unit.covered}%`

        const progressBar = card.querySelector("div.w-full.bg-slate-300 div.bg-sky-500")
        if (progressBar) progressBar.style.width = `${unit.covered}%`

        const statusEl = card.querySelector("div.text-xs.text-green-600, div.text-xs.text-yellow-600, div.text-xs.text-red-600")
        if (statusEl) {
          const statusText = getStatus(unit)
          statusEl.textContent = statusText
          statusEl.className = `text-xs ${
            statusText === "Ahead" ? "text-green-600 dark:text-green-400" :
            statusText === "On Track" ? "text-yellow-600 dark:text-yellow-400" :
            "text-red-600 dark:text-red-400"
          }`
        }
      }

      // Update summary
      updateSummary(trackerData)
    })
  })

  // Edit/Delete buttons
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.id))
  })
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteUnit(btn.dataset.id))
  })

  updateSummary(filtered)
}

// =====================
// Summary
// =====================
function updateSummary(data) {
  if (data.length === 0) {
    summaryEl.textContent = "No units found."
    return
  }
  const avgCovered = (data.reduce((a, b) => a + b.covered, 0) / data.length).toFixed(1)
  summaryEl.textContent = `Avg Covered: ${avgCovered}%`
}

function getStatus(item) {
  if (item.covered >= 80) return "Ahead"
  if (item.covered >= 50) return "On Track"
  return "Behind"
}

// =====================
// Modal Handling
// =====================
function createTopicInput(value = "") {
  const wrapper = document.createElement("div")
  wrapper.className = "flex items-center space-x-2"
  const input = document.createElement("input")
  input.type = "text"
  input.value = value
  input.className = "flex-1 px-3 py-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white transition"
  wrapper.appendChild(input)
  const removeBtn = document.createElement("button")
  removeBtn.type = "button"
  removeBtn.textContent = "🗑"
  removeBtn.className = "px-2 py-1 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition"
  removeBtn.addEventListener("click", () => wrapper.remove())
  wrapper.appendChild(removeBtn)
  modalTopicsContainer.appendChild(wrapper)
}

addTopicBtn.addEventListener("click", () => createTopicInput())

function openModal(id = null) {
  addModal.classList.remove("hidden")
  setTimeout(() => addModal.classList.remove("opacity-0"), 10)

  modalTopicsContainer.innerHTML = ""

  if (id) {
    editId = id
    const item = trackerData.find(t => t.id === id)
    modalSubject.value = item.subject
    modalUnit.value = item.unit
    modalTitle.textContent = "Edit Unit"
    item.topics.forEach(t => createTopicInput(t.name))
  } else {
    editId = null
    modalSubject.value = ""
    modalUnit.value = ""
    modalTitle.textContent = "Add New Unit"
    createTopicInput()
  }

  modalSubject.focus()
}

function closeModal() {
  setTimeout(() => addModal.classList.add("hidden"), 200)
  addModal.classList.add("hidden")
}

modalCancel.addEventListener("click", closeModal)

// =====================
// CRUD Ops
// =====================
modalSave.addEventListener("click", async () => {
  const subject = modalSubject.value.trim()
  const unit = modalUnit.value.trim()

  // Keep old topics' "done" status
  let topics = []

  if (editId) {
    const oldUnit = trackerData.find(u => u.id === editId)
    const oldTopicsMap = {}
    oldUnit.topics.forEach(t => oldTopicsMap[t.name] = t.done)

    topics = Array.from(modalTopicsContainer.querySelectorAll("input"))
      .map(input => ({
        name: input.value.trim(),
        done: oldTopicsMap[input.value.trim()] || false
      }))
      .filter(t => t.name !== "")
  } else {
    topics = Array.from(modalTopicsContainer.querySelectorAll("input"))
      .map(input => ({ name: input.value.trim(), done: false }))
      .filter(t => t.name !== "")
  }

  if (!subject || !unit || topics.length === 0) {
    showToast("⚠ Please fill all fields and add at least one topic.")
    return
  }

  const covered = Math.round((topics.filter(t => t.done).length / topics.length) * 100)

  if (editId) {
    const { error } = await supabase
      .from('progress')
      .update({ subject, unit, topics, covered, updated_at: new Date() })
      .eq('id', editId)
    if (error) console.error(error)
  } else {
    const { error } = await supabase
      .from('progress')
      .insert([{ subject, unit, topics, covered }])
    if (error) console.error(error)
  }

  closeModal()
  fetchData()
})

async function deleteUnit(id) {
  if (!confirm("Are you sure you want to delete this unit?")) return
  const { error } = await supabase.from('progress').delete().eq('id', id)
  if (error) console.error(error)
  fetchData()
}

// =====================
// Toast
// =====================
function showToast(message) {
  toast.textContent = message
  toast.classList.remove("hidden")
  setTimeout(() => toast.classList.add("hidden"), 2000)
}

// =====================
// Event Listeners
// =====================
addUnitBtn.addEventListener("click", () => openModal())
subjectFilter.addEventListener("change", renderCards)
statusFilter.addEventListener("change", renderCards)
searchBox.addEventListener("input", renderCards)

// =====================
// Init
// =====================
fetchData()



// =====================
// Service Worker
// =====================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('✅ SW registered'))
    .catch(err => console.error('❌ SW registration failed', err));
}

// =====================
// Smart Reminder Logic
// =====================

// Request notification permission
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    let permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

function pickReminder(topics) {
  const now = Date.now();
  const reminderGap = 6 * 60 * 60 * 1000; // 6 hours

  const candidates = topics.filter(t => {
    const last = t.last_reminded ? new Date(t.last_reminded).getTime() : 0;
    const notRecentlyReminded = now - last > reminderGap;
    const incomplete = t.covered < 100;
    return notRecentlyReminded && incomplete;
  });

  // Sort by lowest covered % first
  candidates.sort((a, b) => a.covered - b.covered);

  return candidates[0] || null;
}

function generateMessage(topic) {
  if (topic.covered === 0) {
    return `⏳ You haven't started "${topic.unit}" in ${topic.subject} yet. Let's get going!`;
  }
  if (topic.covered < 50) {
    return `📚 Keep pushing on "${topic.unit}" in ${topic.subject} — you're at ${topic.covered}%.`;
  }
  if (topic.covered < 80) {
    return `🚀 You're doing great on "${topic.unit}" in ${topic.subject} — finish strong!`;
  }
  if (topic.covered < 100) {
    return `💪 Almost done! Only ${100 - topic.covered}% left for "${topic.unit}" in ${topic.subject}.`;
  }
  return null;
}

async function sendSmartReminder() {
  const { data: topics, error } = await supabase.from("progress").select("*");
  if (error) {
    console.error("Error fetching reminders:", error);
    return;
  }

  const reminder = pickReminder(topics);
  if (!reminder) return;

  const message = generateMessage(reminder);
  if (!message) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  navigator.serviceWorker.ready.then(async registration => {
    registration.showNotification("Study Reminder 📌", {
      body: message,
      icon: "/icons/reminder.png",
      vibrate: [200, 100, 200],
      requireInteraction: true
    });

    // Update last reminder timestamp in DB
    await supabase.from("progress").update({
      last_reminded: new Date().toISOString()
    }).eq("id", reminder.id);
  });
}

// Check reminders every hour
setInterval(sendSmartReminder, 15 * 60 * 1000);
// Initial check after load
setTimeout(sendSmartReminder, 15 * 1000);