const username = "codewith-lionel";
const excludedRepo = username;

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
        <h3>${escapeHtml(repo.name.replace(/[-_]/g, " "))}</h3>
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
function updateZoom() {
  if (reduceMotion) return;
  const center = window.innerHeight / 2;
  sections.forEach((section) => {
    const bounds = section.getBoundingClientRect();
    const distance = Math.min(1, Math.abs((bounds.top + bounds.height / 2 - center) / (window.innerHeight * 1.2)));
    section.style.setProperty("--section-scale", (1 - distance * 0.055).toFixed(3));
    section.style.setProperty("--section-opacity", (1 - distance * 0.18).toFixed(3));
  });
}
window.addEventListener("scroll", updateZoom, { passive: true });
window.addEventListener("resize", updateZoom);
updateZoom();

const scrollTop = document.getElementById("scroll-top");
window.addEventListener("scroll", () => scrollTop.classList.toggle("visible", window.scrollY > 500), { passive: true });
scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
document.getElementById("current-year").textContent = new Date().getFullYear();
fetchGithub();
