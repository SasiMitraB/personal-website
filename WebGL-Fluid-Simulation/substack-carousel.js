(function () {
    const SUBSTACK_FEED_URL = "https://sasimitra.substack.com/feed";
    const RSS2JSON_URL = "https://api.rss2json.com/v1/api.json?rss_url=";

    document.addEventListener("DOMContentLoaded", initSubstackCarousel);

    async function initSubstackCarousel() {
        const track = document.getElementById("substack-track");
        const prevBtn = document.getElementById("substack-prev-btn");
        const nextBtn = document.getElementById("substack-next-btn");

        if (!track) return;

        bindCarouselButtons(track, prevBtn, nextBtn);

        try {
            const posts = await fetchPosts(SUBSTACK_FEED_URL);

            if (!posts.length) {
                track.innerHTML = '<div class="carousel-empty">No Substack posts found yet.</div>';
                return;
            }

            track.innerHTML = "";
            posts.forEach(function (post) {
                track.appendChild(createPostCard(post));
            });
        } catch (error) {
            console.error("Failed to load Substack feed:", error);
            track.innerHTML = '<div class="carousel-empty">Unable to load Substack posts right now.</div>';
        }
    }

    function bindCarouselButtons(track, prevBtn, nextBtn) {
        if (!track || !prevBtn || !nextBtn) return;

        const getStep = function () {
            const card = track.querySelector(".post-card");
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

    async function fetchPosts(feedUrl) {
        const fetchers = [
            function () { return fetchViaRss2Json(feedUrl); },
            function () { return fetchViaAllOrigins(feedUrl); },
            function () { return fetchViaDirectRss(feedUrl); }
        ];

        let lastError;

        for (const fetcher of fetchers) {
            try {
                const posts = await fetcher();
                if (Array.isArray(posts) && posts.length > 0) {
                    return posts;
                }
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error("Could not load RSS feed");
    }

    async function fetchViaRss2Json(feedUrl) {
        const url = RSS2JSON_URL + encodeURIComponent(feedUrl);
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("RSS2JSON HTTP " + response.status);
        }

        const payload = await response.json();
        if (!payload || payload.status !== "ok" || !Array.isArray(payload.items)) {
            throw new Error("RSS2JSON response was invalid");
        }

        return payload.items
            .map(function (item) {
                return {
                    title: item.title || "Untitled",
                    link: item.link || "#",
                    pubDate: item.pubDate || "",
                    excerpt: toExcerpt(item.description || item.content || ""),
                    thumbnail: normalizeImageUrl(
                        item.thumbnail ||
                        (item.enclosure && item.enclosure.link) ||
                        extractThumbnailFromHtml(item.description || item.content || "")
                    )
                };
            })
            .filter(function (item) {
                return item.link && item.link !== "#";
            });
    }

    async function fetchViaAllOrigins(feedUrl) {
        const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(feedUrl);
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("AllOrigins HTTP " + response.status);
        }

        const text = await response.text();
        return parseRssItems(text);
    }

    async function fetchViaDirectRss(feedUrl) {
        const response = await fetch(feedUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Direct feed HTTP " + response.status);
        }

        const text = await response.text();
        return parseRssItems(text);
    }

    function parseRssItems(rssText) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(rssText, "application/xml");

        if (xml.querySelector("parsererror")) {
            return [];
        }

        const items = Array.from(xml.querySelectorAll("item"));

        return items.map(function (item) {
            const title = getNodeText(item, "title");
            const link = getNodeText(item, "link");
            const pubDate = getNodeText(item, "pubDate");
            const description = getNodeText(item, "description");
            const thumbnail = getRssThumbnail(item, description);

            return {
                title: title || "Untitled",
                link: link || "#",
                pubDate: pubDate,
                excerpt: toExcerpt(description),
                thumbnail: thumbnail
            };
        }).filter(function (item) {
            return item.link && item.link !== "#";
        });
    }

    function getRssThumbnail(item, description) {
        const mediaThumb = item.querySelector("media\\:thumbnail, thumbnail");
        if (mediaThumb && mediaThumb.getAttribute("url")) {
            return normalizeImageUrl(mediaThumb.getAttribute("url"));
        }

        const mediaContent = item.querySelector("media\\:content, content");
        if (mediaContent && mediaContent.getAttribute("url")) {
            return normalizeImageUrl(mediaContent.getAttribute("url"));
        }

        const enclosure = item.querySelector("enclosure");
        if (enclosure && enclosure.getAttribute("url")) {
            return normalizeImageUrl(enclosure.getAttribute("url"));
        }

        return normalizeImageUrl(extractThumbnailFromHtml(description || ""));
    }

    function extractThumbnailFromHtml(htmlText) {
        const div = document.createElement("div");
        div.innerHTML = htmlText || "";
        const img = div.querySelector("img");
        if (!img) return "";
        return img.getAttribute("src") || "";
    }

    function normalizeImageUrl(url) {
        if (!url) return "";

        try {
            const parsed = new URL(url, window.location.href);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return "";
            }
            return parsed.toString();
        } catch (error) {
            return "";
        }
    }

    function getNodeText(parent, selector) {
        const node = parent.querySelector(selector);
        return node && node.textContent ? node.textContent.trim() : "";
    }

    function toExcerpt(htmlText) {
        const div = document.createElement("div");
        div.innerHTML = htmlText || "";

        const text = (div.textContent || div.innerText || "")
            .replace(/\s+/g, " ")
            .trim();

        if (!text) {
            return "Read the full post on Substack.";
        }

        return text.length > 180 ? text.slice(0, 177) + "..." : text;
    }

    function formatDate(rawDate) {
        if (!rawDate) return "";
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function createPostCard(post) {
        const card = document.createElement("article");
        card.className = "post-card panel";

        const title = escapeHtml(post.title);
        const excerpt = escapeHtml(post.excerpt);
        const date = escapeHtml(formatDate(post.pubDate));
        const link = escapeAttribute(post.link);
        const thumbnail = post.thumbnail ? escapeAttribute(post.thumbnail) : "";
        const thumbHtml = thumbnail
            ? '<div class="post-thumb-wrap"><img class="post-thumb" src="' + thumbnail + '" alt="Thumbnail for ' + title + '" loading="lazy" decoding="async"></div>'
            : "";

        if (thumbnail) {
            card.classList.add("has-thumb");
        }

        card.innerHTML = [
            thumbHtml,
            date ? '<div class="post-date">' + date + "</div>" : "",
            '<h3 class="post-title">' + title + "</h3>",
            '<p class="post-excerpt">' + excerpt + "</p>",
            '<div class="post-links"><a href="' + link + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary card-btn">Read on Substack</a></div>'
        ].join("");

        return card;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
})();
