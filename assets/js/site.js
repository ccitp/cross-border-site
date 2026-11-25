/* Xuandui site — list rendering
   Pages embed their data as inline JSON (see the data:...:start/end
   markers). This script renders cards/rows from that data. No fetch,
   so the site also works when opened directly from disk. */

(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readData(id) {
    var el = document.getElementById(id);
    if (!el) return [];
    try {
      var parsed = JSON.parse(el.textContent);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function coverHtml(item) {
    if (item.cover) {
      return '<div class="cover"><img src="' + esc(item.cover) + '" alt="' + esc(item.title) + '" loading="lazy"></div>';
    }
    var letter = (item.title || "X").trim().charAt(0).toUpperCase();
    return '<div class="cover"><span class="cover-ph">' + esc(letter) + '</span></div>';
  }

  function pillsHtml(tags) {
    if (!tags || !tags.length) return "";
    return tags.slice(0, 3).map(function (t) {
      return '<span class="pill">' + esc(t) + '</span>';
    }).join("");
  }

  function productCard(item) {
    return (
      '<a class="card" href="' + esc(item.url) + '">' +
        coverHtml(item) +
        '<h3>' + esc(item.title) + '</h3>' +
        '<p class="excerpt">' + esc(item.tagline || item.excerpt || "") + '</p>' +
        '<div class="meta"><span class="date">' + esc(item.date || "") + '</span>' + pillsHtml(item.tags) + '</div>' +
      '</a>'
    );
  }

  function postRow(item) {
    return (
      '<a class="post-row" href="' + esc(item.url) + '">' +
        '<div class="row-top"><span class="date">' + esc(item.date || "") + '</span>' + pillsHtml(item.tags) + '</div>' +
        '<h3>' + esc(item.title) + '</h3>' +
        '<p class="excerpt">' + esc(item.excerpt || "") + '</p>' +
      '</a>'
    );
  }

  function renderInto(box, items, htmlFn, emptyText) {
    if (!items.length) {
      box.innerHTML = '<div class="empty">' + esc(emptyText) + '</div>';
      return;
    }
    box.innerHTML = items.map(htmlFn).join("");
  }

  function render(containerId, items, htmlFn) {
    var box = document.getElementById(containerId);
    if (!box) return;
    renderInto(box, items, htmlFn, "Nothing published yet — first entry is on its way.");
  }

  /* Homepage: latest first (data is stored newest-first already) */
  render("home-products", readData("products-data"), productCard);
  render("home-posts", readData("posts-data"), postRow);

  /* List pages with tag filters */
  setupFilteredList("all-products", readData("products-data"), productCard, "products-filters",
    "No products match this filter.", "No products published yet.");
  setupFilteredList("all-posts", readData("posts-data"), postRow, "posts-filters",
    "No notes match this filter.", "No notes published yet.");

  function setupFilteredList(boxId, items, htmlFn, filterId, noMatchText, emptyText) {
    var box = document.getElementById(boxId);
    if (!box) return;

    if (!items.length) {
      renderInto(box, items, htmlFn, emptyText);
      return;
    }

    var bar = document.getElementById(filterId);
    var activeTag = "all";

    function apply() {
      var list = activeTag === "all"
        ? items
        : items.filter(function (it) {
            return (it.tags || []).some(function (t) {
              return String(t).toLowerCase() === activeTag.toLowerCase();
            });
          });
      if (!list.length) {
        renderInto(box, list, htmlFn, noMatchText);
      } else {
        renderInto(box, list, htmlFn, emptyText);
      }
    }

    if (bar) {
      /* collect unique tags from real data, capped so the bar stays readable */
      var seen = {};
      var tags = [];
      items.forEach(function (it) {
        (it.tags || []).forEach(function (t) {
          var key = String(t).trim();
          if (!key) return;
          var low = key.toLowerCase();
          if (seen[low]) return;
          seen[low] = true;
          tags.push(key);
        });
      });

      var buttons = [{ label: "All", value: "all" }].concat(
        tags.slice(0, 8).map(function (t) { return { label: t, value: t }; })
      );

      bar.innerHTML = "";
      buttons.forEach(function (b) {
        var el = document.createElement("button");
        el.type = "button";
        el.textContent = b.label;
        el.setAttribute("aria-pressed", b.value === activeTag ? "true" : "false");
        el.addEventListener("click", function () {
          activeTag = b.value;
          Array.prototype.forEach.call(bar.children, function (c) {
            c.setAttribute("aria-pressed", c === el ? "true" : "false");
          });
          apply();
        });
        bar.appendChild(el);
      });
    }

    apply();

    /* Deep link support: blog.html?tag=Engineering etc. */
    var m = /[?&]tag=([^&]+)/.exec(window.location.search || "");
    if (m && bar) {
      var want = decodeURIComponent(m[1]).toLowerCase();
      var hit = Array.prototype.filter.call(bar.children, function (c) {
        return c.textContent.toLowerCase() === want;
      })[0];
      if (hit) hit.click();
    }
  }

  /* Footer year */
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
