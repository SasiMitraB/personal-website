(function () {
    const MY_NAME_PATTERNS = [
        /\bsasi\b/i,
        /\bbehara\b/i
    ];

    let papers = [];

    document.addEventListener("DOMContentLoaded", initPapersCarousel);

    async function initPapersCarousel() {
        const track = document.getElementById("papers-track");
        const modal = document.getElementById("paper-modal");
        const closeBtn = document.querySelector(".modal-close");
        const prevBtn = document.querySelector(".prev-btn");
        const nextBtn = document.querySelector(".next-btn");

        if (!track) return;

        bindCarouselButtons(track, prevBtn, nextBtn);
        bindModalClose(modal, closeBtn);

        try {
            const response = await fetch("./papers.bib", { cache: "no-store" });
            if (!response.ok) {
                throw new Error("Could not load papers.bib");
            }

            const bibRaw = await response.text();
            papers = parseBibtex(bibRaw);

            if (!papers.length) {
                track.innerHTML = '<div class="carousel-empty">No papers found in papers.bib yet.</div>';
                return;
            }

            track.innerHTML = "";
            papers.forEach((paper, index) => {
                track.appendChild(createPaperCard(paper, index));
            });
        } catch (error) {
            console.error("Failed to load papers carousel:", error);
            track.innerHTML = '<div class="carousel-empty">Unable to load papers right now.</div>';
        }
    }

    function bindCarouselButtons(track, prevBtn, nextBtn) {
        if (!track || !prevBtn || !nextBtn) return;

        const getStep = () => {
            const card = track.querySelector(".paper-card");
            if (!card) return track.clientWidth;
            return card.getBoundingClientRect().width + 24;
        };

        prevBtn.addEventListener("click", function () {
            track.scrollBy({ left: -getStep(), behavior: "smooth" });
        });

        nextBtn.addEventListener("click", function () {
            track.scrollBy({ left: getStep(), behavior: "smooth" });
        });
    }

    function bindModalClose(modal, closeBtn) {
        if (!modal) return;

        if (closeBtn) {
            closeBtn.addEventListener("click", function () {
                modal.classList.remove("show");
                modal.setAttribute("aria-hidden", "true");
            });
        }

        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                modal.classList.remove("show");
                modal.setAttribute("aria-hidden", "true");
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && modal.classList.contains("show")) {
                modal.classList.remove("show");
                modal.setAttribute("aria-hidden", "true");
            }
        });
    }

    function createPaperCard(paper, index) {
        const card = document.createElement("article");
        card.className = "paper-card panel";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");

        const title = cleanBibValue(paper.fields.title || "Untitled");
        const journal = cleanBibValue(paper.fields.journal || "Publication");
        const year = cleanBibValue(paper.fields.year || "");
        const authors = formatAuthors(paper.fields.author || "");

        card.innerHTML = [
            '<div class="paper-meta">' + escapeHtml(journal) + (year ? " &bull; " + escapeHtml(year) : "") + "</div>",
            '<h3 class="paper-title">' + escapeHtml(title) + "</h3>",
            '<p class="paper-authors">' + authors + "</p>",
            '<div class="paper-links">' + createLinksHtml(paper, true) + "</div>"
        ].join("");

        card.addEventListener("click", function () {
            openPaperModal(index);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPaperModal(index);
            }
        });

        card.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.stopPropagation();
            });
        });

        return card;
    }

    function openPaperModal(index) {
        const paper = papers[index];
        if (!paper) return;

        const modal = document.getElementById("paper-modal");
        if (!modal) return;

        const title = cleanBibValue(paper.fields.title || "Untitled");
        const journal = cleanBibValue(paper.fields.journal || "Publication");
        const year = cleanBibValue(paper.fields.year || "");
        const month = cleanBibValue(paper.fields.month || "");
        const authors = formatAuthors(paper.fields.author || "");
        const abstract = cleanBibValue(paper.fields.abstract || "No abstract available.");

        document.getElementById("modal-title").textContent = title;
        document.getElementById("modal-meta").textContent = [journal, month, year].filter(Boolean).join(" - ");
        document.getElementById("modal-authors").innerHTML = authors;
        document.getElementById("modal-abstract").textContent = abstract;
        document.getElementById("modal-links").innerHTML = createLinksHtml(paper, false);

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    }

    function createLinksHtml(paper, compact) {
        const links = [];
        const doi = cleanBibValue(paper.fields.doi || "");
        const eprint = cleanBibValue(paper.fields.eprint || "");
        const archivePrefix = cleanBibValue(
            paper.fields.archiveprefix || paper.fields.archivePrefix || ""
        ).toLowerCase();
        const adsurl = cleanBibValue(paper.fields.adsurl || "");

        if (doi) {
            links.push(
                '<a href="https://doi.org/' + encodeURIComponent(doi) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary card-btn">DOI</a>'
            );
        }

        if (eprint) {
            const preprint = getPreprintLink(eprint, archivePrefix);
            links.push(
                '<a href="' + escapeAttribute(preprint.url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary card-btn">' +
                escapeHtml(preprint.label) +
                "</a>"
            );
        }

        if (!compact && adsurl) {
            links.push(
                '<a href="' + escapeAttribute(adsurl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary card-btn">ADS</a>'
            );
        }

        return links.join("");
    }

    function getPreprintLink(eprint, archivePrefix) {
        if (archivePrefix === "biorxiv") {
            return {
                url: "https://www.biorxiv.org/content/" + encodeURIComponent(eprint),
                label: "bioRxiv"
            };
        }

        return {
            url: "https://arxiv.org/abs/" + encodeURIComponent(eprint),
            label: "arXiv"
        };
    }

    function formatAuthors(authorsRaw) {
        const normalized = cleanBibValue(authorsRaw);
        const authors = normalized
            .split(/\s+and\s+/i)
            .map(function (name) { return name.trim(); })
            .filter(Boolean)
            .map(formatSingleAuthor);

        return authors
            .map(function (name) {
                if (isMyName(name)) {
                    return '<span class="highlight-author">' + escapeHtml(name) + "</span>";
                }
                return escapeHtml(name);
            })
            .join(", ");
    }

    function formatSingleAuthor(name) {
        if (name.includes(",")) {
            const parts = name.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
            if (parts.length >= 2) {
                return parts.slice(1).join(" ") + " " + parts[0];
            }
        }
        return name;
    }

    function isMyName(name) {
        const test = name.toLowerCase();
        return MY_NAME_PATTERNS.every(function (pattern) {
            return pattern.test(test);
        });
    }

    function parseBibtex(text) {
        const entries = splitEntries(text);
        return entries.map(parseEntry).filter(Boolean);
    }

    function splitEntries(text) {
        const result = [];
        let i = 0;
        while (i < text.length) {
            const atPos = text.indexOf("@", i);
            if (atPos === -1) break;

            let startBrace = text.indexOf("{", atPos);
            if (startBrace === -1) break;

            let depth = 1;
            let j = startBrace + 1;
            while (j < text.length && depth > 0) {
                const ch = text[j];
                if (ch === "{") depth += 1;
                if (ch === "}") depth -= 1;
                j += 1;
            }

            if (depth === 0) {
                result.push(text.slice(atPos, j));
                i = j;
            } else {
                break;
            }
        }

        return result;
    }

    function parseEntry(entryText) {
        const match = entryText.match(/^@(\w+)\s*\{\s*([^,]+),([\s\S]*)\}\s*$/);
        if (!match) return null;

        const entryType = (match[1] || "").toLowerCase();
        const citationKey = (match[2] || "").trim();
        const body = match[3] || "";

        return {
            entryType: entryType,
            citationKey: citationKey,
            fields: parseFields(body)
        };
    }

    function parseFields(body) {
        const fields = {};
        let i = 0;

        while (i < body.length) {
            if (body[i] === "%") {
                while (i < body.length && body[i] !== "\n") i += 1;
                continue;
            }

            while (i < body.length && /[\s,]/.test(body[i])) i += 1;
            if (i >= body.length) break;

            if (body[i] === "%") {
                while (i < body.length && body[i] !== "\n") i += 1;
                continue;
            }

            let keyStart = i;
            while (i < body.length && /[A-Za-z0-9_:-]/.test(body[i])) i += 1;
            const key = body.slice(keyStart, i).trim().toLowerCase();
            if (!key) {
                i += 1;
                continue;
            }

            while (i < body.length && /\s/.test(body[i])) i += 1;
            if (body[i] !== "=") {
                while (i < body.length && body[i] !== ",") i += 1;
                continue;
            }
            i += 1;
            while (i < body.length && /\s/.test(body[i])) i += 1;

            let value = "";
            if (body[i] === "{") {
                const parsed = readBracedValue(body, i);
                value = parsed.value;
                i = parsed.nextIndex;
            } else if (body[i] === '"') {
                const parsed = readQuotedValue(body, i);
                value = parsed.value;
                i = parsed.nextIndex;
            } else {
                const start = i;
                while (i < body.length && body[i] !== ",") i += 1;
                value = body.slice(start, i).trim();
            }

            fields[key] = value;

            while (i < body.length && body[i] !== ",") i += 1;
            if (body[i] === ",") i += 1;
        }

        return fields;
    }

    function readBracedValue(text, startIndex) {
        let depth = 0;
        let i = startIndex;
        while (i < text.length) {
            const ch = text[i];
            if (ch === "{") depth += 1;
            if (ch === "}") depth -= 1;
            i += 1;
            if (depth === 0) break;
        }

        return {
            value: text.slice(startIndex + 1, i - 1).trim(),
            nextIndex: i
        };
    }

    function readQuotedValue(text, startIndex) {
        let i = startIndex + 1;
        let escaped = false;

        while (i < text.length) {
            const ch = text[i];
            if (!escaped && ch === "\\") {
                escaped = true;
                i += 1;
                continue;
            }
            if (!escaped && ch === '"') {
                break;
            }
            escaped = false;
            i += 1;
        }

        return {
            value: text.slice(startIndex + 1, i).trim(),
            nextIndex: i + 1
        };
    }

    function cleanBibValue(value) {
        return String(value || "")
            .replace(/[{}]/g, "")
            .replace(/\\[A-Za-z]+/g, "")
            .replace(/~+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
})();
