const STORAGE_KEY = "resumeBuilderData";

const EMPTY = {
  template: "canada",
  name: "", title: "", email: "", phone: "", location: "", link: "", personal: "",
  summary: "", skills: "",
  experience: [], projects: [], education: [],
};

const LISTS = {
  experience: [
    ["role", "Role"],
    ["company", "Company"],
    ["dates", "Dates (e.g. 2024 - 2025)"],
    ["details", "Achievements (one per line)", "textarea"],
  ],
  projects: [
    ["name", "Project name"],
    ["link", "Link"],
    ["details", "What you built (one per line)", "textarea"],
  ],
  education: [
    ["degree", "Degree"],
    ["school", "School"],
    ["dates", "Dates"],
  ],
};

let data = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...structuredClone(EMPTY), ...(saved || {}) };
  } catch {
    return structuredClone(EMPTY);
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

/* ---------- small DOM helper ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- form ---------- */
function bindSimpleFields() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = data[input.dataset.field] || "";
    input.addEventListener("input", () => {
      data[input.dataset.field] = input.value;
      save();
      renderPreview();
    });
  });
}

function renderList(key) {
  const container = document.getElementById(`list-${key}`);
  container.replaceChildren(
    ...data[key].map((item, index) => {
      const box = el("div", "entry");

      LISTS[key].forEach(([field, label, type]) => {
        const wrap = el("label", "", label);
        const input = document.createElement(type === "textarea" ? "textarea" : "input");
        if (type === "textarea") input.rows = 3;
        input.value = item[field] || "";
        input.addEventListener("input", () => {
          data[key][index][field] = input.value;
          save();
          renderPreview();
        });
        wrap.append(input);
        box.append(wrap);
      });

      const remove = el("button", "remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        data[key].splice(index, 1);
        save();
        renderList(key);
        renderPreview();
      });
      box.append(remove);
      return box;
    })
  );
}

document.querySelectorAll("[data-add]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const key = btn.dataset.add;
    data[key].push({});
    save();
    renderList(key);
    renderPreview();
  })
);

/* ---------- preview ---------- */
function lines(text) {
  return (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

function bullets(text) {
  const items = lines(text);
  if (!items.length) return null;
  const ul = el("ul");
  items.forEach((t) => ul.append(el("li", "", t)));
  return ul;
}

function section(title, content) {
  if (!content) return null;
  const box = el("div");
  box.append(el("h2", "", title), content);
  return box;
}

function summaryBlock() {
  return data.summary.trim() ? el("p", "", data.summary.trim()) : null;
}

function skillsBlock(asTags) {
  const skills = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (!skills.length) return null;
  if (!asTags) return el("p", "", skills.join(", "));
  const wrap = el("div", "tags");
  skills.forEach((s) => wrap.append(el("span", "", s)));
  return wrap;
}

function itemHead(left, right) {
  const head = el("div", "item-head");
  head.append(el("span", "", left));
  if (right) head.append(el("span", "dates", right));
  return head;
}

function experienceBlock() {
  const list = data.experience.filter((e) => e.role || e.company);
  if (!list.length) return null;
  const wrap = el("div");
  list.forEach((e) => {
    const item = el("div", "item");
    item.append(itemHead(e.role || "", e.dates));
    if (e.company) item.append(el("div", "sub", e.company));
    const ul = bullets(e.details);
    if (ul) item.append(ul);
    wrap.append(item);
  });
  return wrap;
}

function projectsBlock() {
  const list = data.projects.filter((p) => p.name);
  if (!list.length) return null;
  const wrap = el("div");
  list.forEach((p) => {
    const item = el("div", "item");
    item.append(itemHead(p.name, ""));
    if (p.link) item.append(el("div", "sub", p.link));
    const ul = bullets(p.details);
    if (ul) item.append(ul);
    wrap.append(item);
  });
  return wrap;
}

function educationBlock() {
  const list = data.education.filter((e) => e.degree || e.school);
  if (!list.length) return null;
  const wrap = el("div");
  list.forEach((e) => {
    const item = el("div", "item");
    item.append(itemHead(e.degree || "", e.dates));
    if (e.school) item.append(el("div", "sub", e.school));
    wrap.append(item);
  });
  return wrap;
}

function contactParts() {
  return [data.email, data.phone, data.location, data.link].map((s) => s.trim()).filter(Boolean);
}

function appendAll(parent, nodes) {
  nodes.filter(Boolean).forEach((n) => parent.append(n));
}

function renderPreview() {
  const paper = el("div", `paper tpl-${data.template}`);

  const header = el("header");
  const name = el("h1", data.name.trim() ? "" : "placeholder", data.name.trim() || "Your Name");
  header.append(name);
  if (data.title.trim()) header.append(el("div", "role", data.title.trim()));

  const body = el("div", "body");

  if (data.template === "switzerland") {
    const aside = el("aside");
    const parts = contactParts();
    if (parts.length) {
      const c = el("div");
      c.append(el("h2", "", "Contact"));
      parts.forEach((p) => c.append(el("p", "", p)));
      aside.append(c);
    }
    if (data.personal.trim()) {
      const p = el("div");
      p.append(el("h2", "", "Personal details"), el("p", "", data.personal.trim()));
      aside.append(p);
    }
    const sk = section("Skills", skillsBlock(true));
    if (sk) aside.append(sk);

    const main = el("main");
    appendAll(main, [
      section("Profile", summaryBlock()),
      section("Experience", experienceBlock()),
      section("Projects", projectsBlock()),
      section("Education", educationBlock()),
    ]);
    body.append(aside, main);
  } else {
    const parts = contactParts();
    if (parts.length) {
      const c = el("div", "contact");
      parts.forEach((p) => c.append(el("span", "", p)));
      header.append(c);
    }
    appendAll(body, [
      section("Summary", summaryBlock()),
      section("Skills", skillsBlock(false)),
      section("Experience", experienceBlock()),
      section("Projects", projectsBlock()),
      section("Education", educationBlock()),
    ]);
  }

  paper.append(header, body);
  document.getElementById("preview").replaceChildren(paper);
}

/* ---------- controls ---------- */
const templateSelect = document.getElementById("template");
templateSelect.value = data.template;
templateSelect.addEventListener("change", () => {
  data.template = templateSelect.value;
  save();
  renderPreview();
});

document.getElementById("print-btn").addEventListener("click", () => {
  const original = document.title;
  document.title = `${data.name.trim() || "Resume"} - Resume`;
  window.print();
  document.title = original;
});

document.getElementById("clear-btn").addEventListener("click", () => {
  if (!confirm("Delete all resume data from this browser?")) return;
  data = structuredClone(EMPTY);
  save();
  init();
});

const tabEdit = document.getElementById("tab-edit");
const tabPreview = document.getElementById("tab-preview");
function showTab(preview) {
  document.body.classList.toggle("show-preview", preview);
  tabEdit.classList.toggle("active", !preview);
  tabPreview.classList.toggle("active", preview);
  tabEdit.setAttribute("aria-selected", String(!preview));
  tabPreview.setAttribute("aria-selected", String(preview));
  window.scrollTo(0, 0);
}
tabEdit.addEventListener("click", () => showTab(false));
tabPreview.addEventListener("click", () => showTab(true));

function init() {
  bindSimpleFields();
  Object.keys(LISTS).forEach(renderList);
  templateSelect.value = data.template;
  renderPreview();
}

init();