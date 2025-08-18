# 📘 Personal College Lecture Tracker

A lightweight **Progressive Web App (PWA)** to help you organize, track, and access your college lectures across devices—online or offline.

## 🚀 Live Demo

Access the app online: [lecture-tracker.netlify.app](https://lecture-tracker.netlify.app/)

---

## 📑 Table of Contents

* [Features](#features)
* [Screenshots](#screenshots)
* [Installation](#installation)
* [Usage](#usage)
* [Technologies Used](#technologies-used)
* [PWA Highlights](#pwa-highlights)
* [Setup & Deployment](#setup--deployment)
* [Contributing](#contributing)
* [License](#license)

---

## ✨ Features

* Add, organize, and manage lecture notes by subject
* Schedule and mark lecture progress
* Offline accessibility with PWA support
* Responsive UI works seamlessly on mobile and desktop

---

## 🖼️ Screenshots

<img width="1080" height="735" alt="tracker-ui-small" src="https://github.com/user-attachments/assets/d9314613-75bf-4764-bd99-a19fc82c67e3" />

---

## ⚙️ Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/ananikets18/Personal-College-lecture-tracker.git
   cd Personal-College-lecture-tracker 
   ```

2. Serve locally using a static server, or simply open `index.html` in your browser.

3. (Optional) For offline functionality, enable PWA by serving via HTTPS or a compatible local environment.

---

## 📖 Usage

* Open the app from your browser or home screen (if installed as PWA).
* Add new lectures: choose subject, title, date, notes, etc.
* Mark lectures as completed or pending.
* Navigate through past, current, or upcoming lectures.

---

## 💻 Technologies Used

* **JavaScript** – core logic for lecture management
* **HTML & CSS** – user interface and styling
* **Service Worker (`sw.js`)** – for caching and offline mode
* **PWA Manifest (`manifest.json`)** – app metadata and icon support
* **Supabase (`supabaseClient.js`)** – backend/data service (if applicable)

---

## 📲 PWA Highlights

* **Offline Support** — works even without connectivity
* **Installable** — prompts users to install the app on their devices
* **Fast Loading** — cached assets ensure a smooth experience

---

## 🚢 Setup & Deployment

To deploy your own instance:

1. Fork or clone the repo.
2. Update `manifest.json` (app name, icons, theme colors).
3. Deploy using services like Netlify, Vercel, or GitHub Pages.
4. Set up Supabase credentials (if you're using a database) in `supabaseClient.js`.
5. Test PWA features—install, offline mode, etc.

---

## 🤝 Contributing

Contributions are welcome!
Feel free to open issues or submit PRs to suggest new features, improvements, or fixes.

---

## 📜 License

Distributed under the MIT License.
See `LICENSE` for details.

---

## 🙏 Acknowledgements

* Inspired by productivity and note-taking PWAs
* Thanks to Supabase for the intuitive backend interface (if you're using it)

---
