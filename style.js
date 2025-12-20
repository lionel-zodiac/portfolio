let username = "codewith-lionel";
const excludeRepo = "codewith-lionel";
const RESUME_URL =
  "https://drive.google.com/file/d/1J6PX9RK6P_kymoVIed2hG1uR5tuXAMYB/view?usp=sharing";

async function fetchGithub() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);

    // Check for rate limiting
    if (res.status === 403) {
      const rateLimitRes = await fetch("https://api.github.com/rate_limit");
      const rateLimit = await rateLimitRes.json();
      const resetTime = new Date(rateLimit.rate.reset * 1000);
      throw new Error(
        `GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`
      );
    }

    if (res.status === 404) {
      throw new Error(
        `GitHub user "${username}" not found. Check the username.`
      );
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const user = await res.json();

    // Update UI
    document.getElementById("avatar").src = user.avatar_url;
    document.getElementById("name").textContent = user.name || user.login;

    const resumeEl = document.getElementById("resumeBtn");
    if (resumeEl) {
      resumeEl.href = RESUME_URL || user.blog || user.html_url;
      resumeEl.target = "_blank";
      resumeEl.rel = "noopener noreferrer";
    }

    // Fetch user's own repositories that have stars (repositories they've starred themselves)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`
    );

    if (!reposRes.ok) {
      throw new Error(`Failed to fetch repositories: ${reposRes.status}`);
    }

    const repos = await reposRes.json();

    // Filter: only show repos with at least 1 star, not forks, exclude portfolio repo
    const top6 = repos
      .filter(
        (r) => !r.fork && r.name !== excludeRepo && r.stargazers_count > 0
      )
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);

    document.getElementById("projects-count").textContent = top6.length;
    const grid = document.getElementById("projects-list");
    grid.innerHTML = ""; // Clear previous content

    top6.forEach((repo, index) => {
      const div = document.createElement("div");
      div.className = "project-card";
      div.style.animationDelay = `${index * 0.1}s`;

      // Get language color
      const languageColors = {
        JavaScript: "#f1e05a",
        Python: "#3572A5",
        Java: "#b07219",
        TypeScript: "#2b7489",
        HTML: "#e34c26",
        CSS: "#563d7c",
        PHP: "#4F5D95",
        Ruby: "#701516",
        Go: "#00ADD8",
        Rust: "#dea584",
        "C++": "#f34b7d",
        C: "#555555",
      };
      const langColor = languageColors[repo.language] || "#888";

      div.innerHTML = `
        <div class="project-card-inner">
          <div class="project-card-corner"></div>
          <div class="project-card-header">
            <h3>${repo.name}</h3>
            <i class="fas fa-chevron-down expand-icon"></i>
          </div>
          <p class="project-short-desc">${
            repo.description || "No description available"
          }</p>
          <div class="project-meta">
            ${
              repo.language
                ? `<span class="lang-badge" style="--lang-color: ${langColor}">
              <span class="lang-dot"></span>${repo.language}
            </span>`
                : ""
            }
            <span class="star-count"><i class="fas fa-star"></i> ${
              repo.stargazers_count
            }</span>
            <span class="fork-count"><i class="fas fa-code-branch"></i> ${
              repo.forks_count
            }</span>
          </div>
          <div class="project-details">
            <div class="project-info">
              <p><strong>Repository:</strong> ${repo.owner.login}/${
        repo.name
      }</p>
              <p><strong>Updated:</strong> ${new Date(
                repo.updated_at
              ).toLocaleDateString()}</p>
              <p><strong>Size:</strong> ${(repo.size / 1024).toFixed(2)} MB</p>
              ${
                repo.homepage
                  ? `<p><strong>Demo:</strong> <a href="${repo.homepage}" target="_blank" class="demo-link"><i class="fas fa-external-link-alt"></i> Visit Live Site</a></p>`
                  : ""
              }
              ${
                repo.topics && repo.topics.length > 0
                  ? `
                <div class="topics">
                  ${repo.topics
                    .slice(0, 5)
                    .map((topic) => `<span class="topic-tag">#${topic}</span>`)
                    .join("")}
                </div>
              `
                  : ""
              }
            </div>
          </div>
          <a href="${repo.html_url}" target="_blank" class="repo-link">
            <i class="fab fa-github"></i> View on GitHub
          </a>
        </div>`;

      // Add click event to expand/collapse
      const header = div.querySelector(".project-card-header");
      header.addEventListener("click", (e) => {
        // Prevent expanding when clicking on links
        if (e.target.tagName === "A") return;

        div.classList.toggle("expanded");

        // Add pulse animation
        div.classList.add("pulse-once");
        setTimeout(() => div.classList.remove("pulse-once"), 600);
      });

      grid.appendChild(div);
    });

    // Aggregate topics from all top6 repos for tech stack
    const allTopics = new Set();
    await Promise.all(
      top6.map(async (repo) => {
        const topicsRes = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/topics`,
          {
            headers: { Accept: "application/vnd.github.mercy-preview+json" },
          }
        );
        const topicsData = await topicsRes.json();
        (topicsData.names || []).forEach((topic) => allTopics.add(topic));
      })
    );

    // Display tech stack
    const bar = document.getElementById("skills");
    bar.innerHTML = "";
    Array.from(allTopics)
      .slice(0, 10)
      .forEach((skill) => {
        const span = document.createElement("span");
        span.textContent = skill;
        bar.appendChild(span);
      });
  } catch (err) {
    console.error("GitHub API Error:", err);
    const grid = document.getElementById("projects-list");

    // Check if it's a rate limit error
    const isRateLimit = err.message.includes("rate limit");

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
        <i class="fas fa-${
          isRateLimit ? "clock" : "exclamation-triangle"
        }" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
        <p style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">${
          isRateLimit ? "API Rate Limit Reached" : "Could not load projects"
        }</p>
        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${err.message}</p>
        ${
          isRateLimit
            ? '<p style="font-size: 0.85rem; color: var(--text-secondary);">GitHub API allows 60 requests per hour for unauthenticated requests.</p>'
            : '<p style="font-size: 0.9rem;">Username: <strong>${username}</strong></p>'
        }
        <button onclick="fetchGithub()" class="btn primary" style="margin-top: 1rem; padding: 0.6rem 1.5rem; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem;">
          <i class="fas fa-redo"></i> Try Again
        </button>
        ${
          !isRateLimit
            ? `
          <p style="font-size: 0.85rem; margin-top: 1.5rem; color: var(--text-secondary);">
            <strong>Tip:</strong> Check the browser console (F12) for more details.
          </p>
        `
            : ""
        }
      </div>`;
  }
}

// Function to update username and reload projects
function updateGithub() {
  const input = document.getElementById("github-username");
  username = input.value.trim() || "codewith-lionel";
  fetchGithub();
}

// Initial fetch
fetchGithub();

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;
const themeIcon = themeToggle.querySelector("i");

// Check for saved theme preference or default to 'dark'
const currentTheme = localStorage.getItem("theme") || "dark";
if (currentTheme === "light") {
  htmlElement.setAttribute("data-theme", "light");
  themeIcon.classList.replace("fa-moon", "fa-sun");
}

themeToggle.addEventListener("click", () => {
  const theme = htmlElement.getAttribute("data-theme");
  if (theme === "light") {
    htmlElement.removeAttribute("data-theme");
    themeIcon.classList.replace("fa-sun", "fa-moon");
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.setAttribute("data-theme", "light");
    themeIcon.classList.replace("fa-moon", "fa-sun");
    localStorage.setItem("theme", "light");
  }
});

// Custom cursor removed - using standard cursor for better performance

// Hide cursor when leaving window
document.addEventListener("mouseleave", () => {
  cursor.style.opacity = "0";
  cursorDot.style.opacity = "0";
});

document.addEventListener("mouseenter", () => {
  cursor.style.opacity = "1";
  cursorDot.style.opacity = "1";
});

// Add click effect
document.addEventListener("mousedown", () => {
  cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
  cursorDot.style.transform = "translate(-50%, -50%) scale(1.5)";
});

document.addEventListener("mouseup", () => {
  cursor.style.transform = "translate(-50%, -50%) scale(1)";
  cursorDot.style.transform = "translate(-50%, -50%) scale(1)";
});

// ===== ANIMATED PARTICLE BACKGROUND =====
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 80;

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 110, 58, 0.5)";
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

function connectParticles() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - distance / 100})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  connectParticles();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ===== SCROLL TO TOP BUTTON =====
const scrollTopBtn = document.getElementById("scroll-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 300) {
    scrollTopBtn.classList.add("visible");
  } else {
    scrollTopBtn.classList.remove("visible");
  }
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// ===== PARALLAX EFFECT =====
window.addEventListener("scroll", () => {
  const parallaxElements = document.querySelectorAll("[data-parallax]");
  parallaxElements.forEach((el) => {
    const speed = 0.5;
    const yPos = -(window.pageYOffset * speed);
    el.style.transform = `translateY(${yPos}px)`;
  });
});

// ===== SECTION REVEAL ANIMATION =====

document.querySelectorAll("section").forEach((section) => {
  const reveal = () => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      section.classList.add("visible");
      window.removeEventListener("scroll", reveal);
    }
  };
  window.addEventListener("scroll", reveal);
  reveal();
});

// ===== NAVBAR FUNCTIONALITY =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
const navLinksItems = document.querySelectorAll(".nav-link");
const navbar = document.querySelector(".navbar");

// Toggle mobile menu
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navLinks.classList.toggle("active");
  document.body.style.overflow = navLinks.classList.contains("active")
    ? "hidden"
    : "auto";
});

// Close menu when clicking on a link
navLinksItems.forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
    document.body.style.overflow = "auto";
  });
});

// Active link highlighting on scroll
function setActiveLink() {
  const sections = document.querySelectorAll("section[id]");
  const scrollY = window.pageYOffset;

  sections.forEach((section) => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute("id");
    const correspondingLink = document.querySelector(
      `.nav-link[href="#${sectionId}"]`
    );

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      navLinksItems.forEach((link) => link.classList.remove("active"));
      if (correspondingLink) {
        correspondingLink.classList.add("active");
      }
    }
  });
}

window.addEventListener("scroll", setActiveLink);

// Navbar background on scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
    document.body.style.overflow = "auto";
  }
});

// fallback click handler to ensure resume opens in a new tab
document.addEventListener("click", (e) => {
  const el = e.target.closest("#resumeBtn, #nav-resume");
  if (!el) return;
  const href = el.getAttribute("href");
  if (!href) return;
  // stop other handlers and open explicitly
  e.preventDefault();
  window.open(href, "_blank", "noopener,noreferrer");
});
