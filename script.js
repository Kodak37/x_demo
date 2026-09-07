// すべてブラウザ内だけで完結する見た目だけの演出。
// サーバー通信は一切行わないため、F5で更新すると必ず初期状態に戻る。

const timeline = document.getElementById("timeline");
const mainColumn = document.querySelector(".main");

/* ---------------- ブラウザタブのタイトル（未読件数を反映） ---------------- */
const NAV_TITLE_LABELS = {
  home: "ホーム",
  search: "話題を検索",
  notifications: "通知",
  profile: "山田 太郎",
};
let unreadCount = 3;

function updateTabTitle(viewName) {
  const label = NAV_TITLE_LABELS[viewName] || "ホーム";
  document.title = unreadCount > 0 ? `(${unreadCount}) ${label} / Y` : `${label} / Y`;
}

/* ---------------- 画面切り替え（ホーム / 検索 / 通知） ---------------- */
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => {
    v.style.display = v.id === `view-${name}` ? "" : "none";
  });
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === name);
  });
  if (name === "notifications" && unreadCount > 0) {
    unreadCount = 0;
    const badge = document.getElementById("notif-badge");
    if (badge) badge.style.display = "none";
  }
  updateTabTitle(name);
}

updateTabTitle("home");

document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

document.getElementById("open-search-view").addEventListener("click", () => {
  showView("search");
  document.getElementById("search-input").focus();
});

/* ---------------- 投稿フォーム（モーダル） ---------------- */
const overlay = document.getElementById("compose-overlay");
const textarea = document.getElementById("compose-textarea");
const counter = document.getElementById("compose-counter");
const submitBtn = document.getElementById("compose-submit");
const ringProgress = document.getElementById("compose-ring-progress");
const RING_CIRCUMFERENCE = 62.8;
const MAX_CHARS = 280;

function openCompose() {
  overlay.classList.add("open");
  textarea.value = "";
  updateComposeCounter();
  submitBtn.disabled = true;
  setTimeout(() => textarea.focus(), 50);
}
function closeCompose() {
  overlay.classList.remove("open");
}

function updateComposeCounter() {
  const remaining = MAX_CHARS - textarea.value.length;
  const progress = Math.min(textarea.value.length / MAX_CHARS, 1);
  ringProgress.setAttribute("stroke-dashoffset", RING_CIRCUMFERENCE * (1 - progress));
  if (remaining <= 20) {
    counter.textContent = remaining;
    ringProgress.style.stroke = remaining < 0 ? "#f4212e" : "#ffd400";
  } else {
    counter.textContent = "";
    ringProgress.style.stroke = "#1d9bf0";
  }
}

document.getElementById("open-compose").addEventListener("click", openCompose);
document.getElementById("quick-compose").addEventListener("click", openCompose);
document.getElementById("compose-close").addEventListener("click", closeCompose);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeCompose();
});

textarea.addEventListener("input", () => {
  updateComposeCounter();
  submitBtn.disabled = textarea.value.trim().length === 0 || textarea.value.length > MAX_CHARS;
});

submitBtn.addEventListener("click", () => {
  const text = textarea.value.trim();
  if (!text) return;
  timeline.insertAdjacentElement("afterbegin", buildPost("山田 太郎", "@yamada_taro", "images/avatar-default.svg", text));
  closeCompose();
});

/* ---------------- 新規投稿・返信の共通テンプレート ---------------- */
function buildPost(name, handle, avatarSrc, text) {
  const article = document.createElement("article");
  article.className = "post";
  article.innerHTML = `
    <img class="avatar" src="${avatarSrc}" alt="${name}のアイコン">
    <div class="post-body">
      <div class="post-meta">
        <span class="name">${name}</span>
        <span class="handle">${handle}</span>
        <span class="time">· たった今</span>
      </div>
      <div class="post-text"></div>
      <div class="post-actions">
        <div class="post-action reply"><svg><use href="#i-comment"></use></svg><span class="count">0</span></div>
        <div class="post-action repost"><svg><use href="#i-repost"></use></svg><span class="count">0</span></div>
        <div class="post-action like"><svg><use href="#i-heart"></use></svg><span class="count">0</span></div>
        <div class="post-action view"><svg><use href="#i-chart"></use></svg><span class="count">1</span></div>
      </div>
      <div class="reply-box">
        <textarea class="reply-textarea" placeholder="返信をポスト"></textarea>
        <button class="reply-submit-btn">返信する</button>
      </div>
    </div>
  `;
  // テキストはノードとして挿入（HTMLとして解釈させない）
  article.querySelector(".post-text").textContent = text;
  return article;
}

/* ---------------- 投稿の操作（いいね・リポスト・返信）はホーム/プロフィール共通でイベント委任 ---------------- */
mainColumn.addEventListener("click", (e) => {
  const likeBtn = e.target.closest(".post-action.like");
  if (likeBtn) {
    const countEl = likeBtn.querySelector(".count");
    const icon = likeBtn.querySelector("svg");
    const count = parseInt(countEl.textContent.replace(/,/g, ""), 10);
    const liked = likeBtn.classList.toggle("liked");
    countEl.textContent = (liked ? count + 1 : count - 1).toLocaleString("ja-JP");
    if (liked) {
      icon.classList.add("icon-pulse");
      icon.addEventListener("animationend", () => icon.classList.remove("icon-pulse"), { once: true });
    }
    return;
  }

  const repostBtn = e.target.closest(".post-action.repost");
  if (repostBtn) {
    const countEl = repostBtn.querySelector(".count");
    const count = parseInt(countEl.textContent.replace(/,/g, ""), 10);
    const reposted = repostBtn.classList.toggle("reposted");
    countEl.textContent = (reposted ? count + 1 : count - 1).toLocaleString("ja-JP");
    return;
  }

  const replyBtn = e.target.closest(".post-action.reply");
  if (replyBtn) {
    const box = replyBtn.closest(".post-body").querySelector(".reply-box");
    const isOpen = box.style.display === "flex";
    box.style.display = isOpen ? "none" : "flex";
    if (!isOpen) box.querySelector(".reply-textarea").focus();
    return;
  }

  const replySubmit = e.target.closest(".reply-submit-btn");
  if (replySubmit) {
    const box = replySubmit.closest(".reply-box");
    const box_textarea = box.querySelector(".reply-textarea");
    const text = box_textarea.value.trim();
    if (!text) return;
    const currentPost = replySubmit.closest(".post");
    const replyPost = buildPost("山田 太郎", "@yamada_taro", "images/avatar-default.svg", text);
    currentPost.insertAdjacentElement("afterend", replyPost);
    box_textarea.value = "";
    box.style.display = "none";
    return;
  }
});

/* ---------------- ホームタブ切り替え（見た目のみ） ---------------- */
document.querySelectorAll(".home-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".home-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

/* ---------------- プロフィールタブ切り替え（見た目のみ） ---------------- */
document.querySelectorAll("#view-profile .tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#view-profile .tabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

/* ---------------- プロフィール編集フォーム（モーダル） ---------------- */
const editOverlay = document.getElementById("edit-profile-overlay");
const nameInput = document.getElementById("edit-name-input");
const bioInput = document.getElementById("edit-bio-input");
const avatarInput = document.getElementById("edit-avatar-input");
const myNameText = document.getElementById("my-name-text");
const myBio = document.getElementById("my-bio");
const myAvatar = document.getElementById("my-avatar");
const nameTextTargets = [
  document.getElementById("my-name-text"),
  document.getElementById("top-name-text"),
  document.getElementById("chip-name-text"),
];
const avatarTargets = [
  document.getElementById("my-avatar"),
  document.getElementById("chip-avatar"),
  document.getElementById("quick-compose-avatar"),
  document.getElementById("compose-avatar"),
];

function openEditProfile() {
  nameInput.value = myNameText.textContent.trim();
  bioInput.value = myBio.textContent.trim();
  avatarInput.value = myAvatar.getAttribute("src").replace("images/", "");
  editOverlay.classList.add("open");
}
function closeEditProfile() {
  editOverlay.classList.remove("open");
}

document.getElementById("open-edit-profile").addEventListener("click", openEditProfile);
document.getElementById("edit-profile-close").addEventListener("click", closeEditProfile);
editOverlay.addEventListener("click", (e) => {
  if (e.target === editOverlay) closeEditProfile();
});

document.getElementById("edit-profile-save").addEventListener("click", () => {
  if (nameInput.value.trim()) {
    nameTextTargets.forEach((el) => { if (el) el.textContent = nameInput.value.trim(); });
  }
  if (bioInput.value.trim()) myBio.textContent = bioInput.value.trim();
  if (avatarInput.value.trim()) {
    avatarTargets.forEach((el) => { if (el) el.setAttribute("src", "images/" + avatarInput.value.trim()); });
  }
  closeEditProfile();
});

/* ---------------- 通知タブ切り替え（見た目のみ） ---------------- */
document.querySelectorAll(".notif-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".notif-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

/* ---------------- フォローボタンのトグル（複数箇所に存在するためイベント委任） ---------------- */
document.body.addEventListener("click", (e) => {
  const followBtn = e.target.closest(".follow-btn");
  if (!followBtn) return;
  const following = followBtn.classList.toggle("following");
  followBtn.textContent = following ? "フォロー中" : "フォロー";
});
