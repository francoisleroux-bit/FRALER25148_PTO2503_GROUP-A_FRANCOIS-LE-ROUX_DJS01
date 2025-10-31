export function initApp({ podcasts, genres, seasons }) {
  const formatRelative = (dateStr, mode = "card") => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const weeks = Math.floor(days / 7);
    const months = days / 30;
    const years = days / 365;

    if (mode === "card") {
      if (days === 0) return "Updated today";
      if (days === 1) return "Updated 1 day ago";
      if (days < 7) return `Updated ${days} days ago`;
      if (weeks === 1) return "Updated 1 week ago";
      if (weeks < 8) return `Updated ${weeks} weeks ago`;

      if (years < 1) {
        if (months > 1.25 && months < 1.75) {
          return "Updated 1 and a half months ago";
        }
        const m = Math.round(months);
        return `Updated ${m} month${m === 1 ? "" : "s"} ago`;
      }

      if (years > 1.25 && years < 1.75) {
        return "Updated 1 and a half years ago";
      }
      const y = Math.round(years);
      return `Updated ${y} year${y === 1 ? "" : "s"} ago`;
    }

    return (
      "Last updated: " +
      d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  };

  const gFor = (p) =>
    p.genres.map((id) => genres.find((g) => g.id === id)).filter(Boolean);
  const seasonsFor = (id) =>
    (seasons.find((s) => s.id === id) || { seasonDetails: [] }).seasonDetails;

  /* ---------- dom ---------- */
  const genreSelect = document.getElementById("genreSelect");
  const sortSelect = document.getElementById("sortSelect");
  const grid = document.getElementById("podcastGrid");

  const modal = document.getElementById("podcastModal");
  const backdrop = document.getElementById("modalBackdrop");
  const closeBtn = document.getElementById("modalCloseBtn");
  const modalTitle = document.getElementById("modalTitle");

  const modalCoverMobile = document.getElementById("modalCoverMobile");
  const modalDescriptionMobile = document.getElementById(
    "modalDescriptionMobile"
  );
  const modalGenresMobile = document.getElementById("modalGenresMobile");
  const modalUpdatedMobile = document.getElementById("modalUpdatedMobile");
  const modalSeasonsMobile = document.getElementById("modalSeasonsMobile");

  const modalCoverDesktop = document.getElementById("modalCoverDesktop");
  const modalDescriptionDesktop = document.getElementById(
    "modalDescriptionDesktop"
  );
  const modalGenresDesktop = document.getElementById("modalGenresDesktop");
  const modalUpdatedDesktop = document.getElementById("modalUpdatedDesktop");
  const modalSeasonsDesktop = document.getElementById("modalSeasonsDesktop");

  /* ---------- state ---------- */
  let activeGenre = "all";
  let activeSort = "recent";

  /* ---------- dropdowns ---------- */
  const populateGenres = () => {
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All Genres";
    genreSelect.appendChild(all);
    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.title;
      genreSelect.appendChild(opt);
    });
  };

  /* ---------- list shaping ---------- */
  const listForView = () => {
    let list = [...podcasts];
    if (activeGenre !== "all") {
      const id = Number(activeGenre);
      list = list.filter((p) => p.genres.includes(id));
    }
    if (activeSort === "popular") list.sort((a, b) => b.seasons - a.seasons);
    else list.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    return list;
  };

  /* ---------- render cards ---------- */
  const render = () => {
    grid.innerHTML = "";
    listForView().forEach((p) => {
      const card = document.createElement("article");
      card.className = "podcast-card";
      card.tabIndex = 0;

      const cover = document.createElement("div");
      cover.className = "card-cover";

      cover.style.background = "transparent";
      cover.style.border = "none";

      if (p.image) {
        const img = document.createElement("img");
        img.src = p.image;
        img.alt = `${p.title} cover`;

        img.style.display = "block";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.loading = "lazy";
        cover.appendChild(img);
      } else {
      }

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = p.title;

      const meta = document.createElement("div");
      meta.className = "card-row-meta";
      meta.innerHTML = `<span aria-hidden="true">📅</span><span>${
        p.seasons
      } season${p.seasons === 1 ? "" : "s"}</span>`;

      const tags = document.createElement("div");
      tags.className = "tag-row";
      gFor(p).forEach((g) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = g.title;
        tags.appendChild(chip);
      });

      const updated = document.createElement("div");
      updated.className = "card-updated";
      updated.textContent = formatRelative(p.updated, "card");

      card.append(cover, title, meta, tags, updated);
      card.addEventListener("click", () => openModal(p.id));
      card.addEventListener(
        "keypress",
        (e) => e.key === "Enter" && openModal(p.id)
      );
      grid.appendChild(card);
    });
  };

  /* ---------- modal ---------- */
  const fillModalSide = (
    { coverEl, descEl, genresEl, updatedEl, seasonsEl },
    p
  ) => {
    coverEl.innerHTML = "";

    coverEl.style.background = "transparent";
    coverEl.style.border = "none";

    if (p.image) {
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = `${p.title} large cover`;
      img.style.display = "block";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      coverEl.appendChild(img);
    }

    descEl.textContent = p.description;

    genresEl.innerHTML = "";
    gFor(p).forEach((g) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = g.title;
      genresEl.appendChild(chip);
    });

    updatedEl.textContent = formatRelative(p.updated, "modal");

    seasonsEl.innerHTML = "";
    const data = seasonsFor(p.id);
    (data.length ? data : [{ title: "No seasons found", episodes: 0 }]).forEach(
      (s, i) => {
        const li = document.createElement("li");

        const left = document.createElement("div");
        left.className = "season-left";
        const st = document.createElement("span");
        st.textContent = s.title || `Season ${i + 1}`;
        const sd = document.createElement("span");
        sd.className = "season-desc";
        sd.textContent =
          i === 0
            ? "Introduction to the fundamentals"
            : i === 1
            ? "Deep dives into complex subjects"
            : i === 2
            ? "Expert perspectives and case studies"
            : "Episode collection";
        left.append(st, sd);

        const right = document.createElement("div");
        right.className = "season-episodes";
        right.textContent = s.episodes
          ? `${s.episodes} episode${s.episodes === 1 ? "" : "s"}`
          : "";

        li.append(left, right);
        seasonsEl.appendChild(li);
      }
    );
  };

  const openModal = (id) => {
    const p = podcasts.find((x) => x.id === id);
    if (!p) return;
    modalTitle.textContent = p.title;

    fillModalSide(
      {
        coverEl: modalCoverMobile,
        descEl: modalDescriptionMobile,
        genresEl: modalGenresMobile,
        updatedEl: modalUpdatedMobile,
        seasonsEl: modalSeasonsMobile,
      },
      p
    );
    fillModalSide(
      {
        coverEl: modalCoverDesktop,
        descEl: modalDescriptionDesktop,
        genresEl: modalGenresDesktop,
        updatedEl: modalUpdatedDesktop,
        seasonsEl: modalSeasonsDesktop,
      },
      p
    );

    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    backdrop.classList.add("hidden");
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  /* ---------- events ---------- */
  genreSelect.addEventListener("change", (e) => {
    activeGenre = e.target.value;
    render();
  });
  sortSelect.addEventListener("change", (e) => {
    activeSort = e.target.value;
    render();
  });
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  window.addEventListener(
    "keydown",
    (e) =>
      e.key === "Escape" && !modal.classList.contains("hidden") && closeModal()
  );

  /* ---------- boot ---------- */
  populateGenres();
  render();
}
