const username = "codewith-lionel";
const excludedRepo = username;
const projectNames = {
  portfolio: "Portfolio Studio",
  AcademicX: "Academic X",
  Cookify: "Cookify AI",
  "TIME-TABLE-GENERATOR": "Timetable Generator",
  AcademicPerformanceAnalyzer: "Performance Atlas",
  RELEVA: "Releva Clinic"
};

function getProjectName(repositoryName) {
  return projectNames[repositoryName] || repositoryName
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

async function fetchGithub() {
  const projectList = document.getElementById("projects-list");
  try {
    const profileResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!profileResponse.ok) throw new Error(`GitHub profile request failed (${profileResponse.status})`);
    const profile = await profileResponse.json();
    const avatar = document.getElementById("avatar");
    if (profile.avatar_url) avatar.src = profile.avatar_url;
    document.getElementById("follower-count").textContent = profile.followers ?? "0";
    document.getElementById("repo-count").textContent = profile.public_repos ?? "0";
    if (profile.bio) document.getElementById("bio").textContent = profile.bio;

    const repoResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    if (!repoResponse.ok) throw new Error(`Repository request failed (${repoResponse.status})`);
    const repositories = (await repoResponse.json())
      .filter((repo) => !repo.fork && repo.name !== excludedRepo)
      .sort((first, second) => (second.stargazers_count - first.stargazers_count) || (new Date(second.updated_at) - new Date(first.updated_at)))
      .slice(0, 6);

    if (!repositories.length) {
      projectList.innerHTML = `<p class="loading-card">No public projects found yet. <a href="https://github.com/${username}" target="_blank" rel="noreferrer">Visit GitHub ↗</a></p>`;
      return;
    }
    projectList.innerHTML = repositories.map((repo, index) => `
      <article class="project-card">
        <span class="project-number">0${index + 1}</span>
        <h3>${escapeHtml(getProjectName(repo.name))}</h3>
        <p>${escapeHtml(repo.description || "A small experiment in making useful things for the web.")}</p>
        <div class="project-meta">
          ${repo.language ? `<span class="project-lang">${escapeHtml(repo.language)}</span>` : ""}
          <span>${repo.stargazers_count} ★</span>
          <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">Open ↗</a>
        </div>
      </article>`).join("");

    const topics = [...new Set(repositories.flatMap((repo) => repo.topics || []))].slice(0, 6);
    if (topics.length) document.getElementById("skills").innerHTML = [...topics, ...topics].map((topic) => `<span>${escapeHtml(topic)}</span><b>✳</b>`).join("");
  } catch (error) {
    console.error(error);
    projectList.innerHTML = `<p class="loading-card">The live archive is taking a pause. <a href="https://github.com/${username}?tab=repositories" target="_blank" rel="noreferrer">Browse GitHub ↗</a></p>`;
  }
}

const sections = document.querySelectorAll(".zoom-section");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let landedSection = null;
function updateZoom() {
  if (reduceMotion) return;
  const center = window.innerHeight / 2;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
  document.getElementById("scroll-progress-bar").style.height = `${(progress * 100).toFixed(2)}%`;
  sections.forEach((section) => {
    const bounds = section.getBoundingClientRect();
    const offset = (bounds.top + bounds.height / 2 - center) / window.innerHeight;
    const distance = Math.min(1, Math.abs(offset) / 1.2);
    const tilt = Math.max(-4.2, Math.min(4.2, offset * -4.2));
    const incoming = Math.max(0, Math.min(1, offset / 1.15));
    section.style.setProperty("--section-scale", (1 - distance * 0.04).toFixed(3));
    section.style.setProperty("--section-opacity", (1 - distance * 0.16).toFixed(3));
    section.style.setProperty("--section-lift", `${(-incoming * 76).toFixed(1)}px`);
    section.style.setProperty("--section-tilt", `${(tilt + incoming * 11).toFixed(2)}deg`);
    section.style.setProperty("--section-depth", `${(-distance * 42).toFixed(1)}px`);
    section.style.setProperty("--transition-glow", incoming.toFixed(3));
    section.style.setProperty("--transition-scale", (0.35 + incoming * 0.65).toFixed(3));
  });
  let closestSection = null;
  let closestDistance = Infinity;
  sections.forEach((section) => {
    const bounds = section.getBoundingClientRect();
    const distance = Math.abs((bounds.top + bounds.height / 2 - center) / window.innerHeight);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  });
  if (closestSection && closestDistance < 0.12 && closestSection !== landedSection) {
    landedSection?.classList.remove("is-landing");
    closestSection.classList.add("is-landing");
    landedSection = closestSection;
  }
}
window.addEventListener("scroll", updateZoom, { passive: true });
window.addEventListener("resize", updateZoom);
updateZoom();

const portraitFrame = document.querySelector(".portrait-frame");
const orbitScene = document.getElementById("orbit-scene");
const projectList = document.getElementById("projects-list");
function resetTilt(element) {
  element.style.setProperty("--card-x", "0deg");
  element.style.setProperty("--card-y", "0deg");
  element.style.setProperty("--card-z", "0px");
}
function updateTilt(element, event, intensity = 8) {
  const bounds = element.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  element.style.setProperty("--card-x", `${(-y * intensity).toFixed(2)}deg`);
  element.style.setProperty("--card-y", `${(x * intensity).toFixed(2)}deg`);
  element.style.setProperty("--card-z", "12px");
}
if (!reduceMotion) {
  portraitFrame.addEventListener("pointermove", (event) => {
    const bounds = portraitFrame.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    portraitFrame.style.setProperty("--portrait-x", `${(-y * 10).toFixed(2)}deg`);
    portraitFrame.style.setProperty("--portrait-y", `${(x * 10).toFixed(2)}deg`);
  });
  portraitFrame.addEventListener("pointerleave", () => {
    portraitFrame.style.setProperty("--portrait-x", "0deg");
    portraitFrame.style.setProperty("--portrait-y", "0deg");
  });
  orbitScene.addEventListener("pointermove", (event) => {
    const bounds = orbitScene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    orbitScene.style.setProperty("--scene-x", `${(-y * 18).toFixed(2)}deg`);
    orbitScene.style.setProperty("--scene-y", `${(x * 18).toFixed(2)}deg`);
  });
  orbitScene.addEventListener("pointerleave", () => {
    orbitScene.style.setProperty("--scene-x", "0deg");
    orbitScene.style.setProperty("--scene-y", "0deg");
  });
  projectList.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".project-card");
    if (card) updateTilt(card, event, 5);
  });
  projectList.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".project-card");
    if (card && !card.contains(event.relatedTarget)) resetTilt(card);
  });
}

const scrollTop = document.getElementById("scroll-top");
window.addEventListener("scroll", () => scrollTop.classList.toggle("visible", window.scrollY > 500), { passive: true });
scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const footerLinks = [...document.querySelectorAll(".site-footer a[href^='#']")];
const footerSections = [...document.querySelectorAll("main section[id]")];
const footerSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    footerLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { threshold: 0.5 });
footerSections.forEach((section) => footerSectionObserver.observe(section));

document.getElementById("current-year").textContent = new Date().getFullYear();
fetchGithub();
