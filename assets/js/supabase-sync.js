(function () {
  const studyStateKey = "jlpt-compass-state";
  const matchStateKey = "japanote-match-state";
  const themeStorageKey = "japanote-theme";
  const supportedKeys = new Set([studyStateKey, matchStateKey, themeStorageKey]);
  const defaultConfig = {
    enabled: false,
    url: "",
    anonKey: "",
    stateTable: "user_state",
    emailRedirectTo: ""
  };
  const rawConfig =
    globalThis.japanoteSupabaseConfig && typeof globalThis.japanoteSupabaseConfig === "object"
      ? globalThis.japanoteSupabaseConfig
      : {};
  const config = {
    ...defaultConfig,
    ...rawConfig
  };
  config.enabled = Boolean(config.enabled && config.url && config.anonKey && config.stateTable);

  const localValues = {
    [studyStateKey]: readLocalJson(studyStateKey, {}),
    [matchStateKey]: readLocalJson(matchStateKey, {}),
    [themeStorageKey]: readLocalText(themeStorageKey, "system")
  };

  let client = null;
  let currentSession = null;
  let currentUser = null;
  let authPanelOpen = false;
  let isLoadingRemoteState = false;
  let pendingSaveTimer = null;
  let status = {
    code: config.enabled ? "ready" : "local-only",
    summary: config.enabled ? "클라우드 준비" : "이 기기만 저장",
    detail: config.enabled
      ? "이메일 로그인 후 기기 간으로 학습 상태를 동기화할 수 있어요."
      : "Supabase 설정이 비어 있어서 현재는 이 기기 브라우저에만 저장해요.",
    busy: false
  };

  function clone(value) {
    if (value == null || typeof value !== "object") {
      return value;
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function readLocalJson(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function readLocalText(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return typeof saved === "string" && saved ? saved : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function persistLocalValue(key, value) {
    try {
      if (key === themeStorageKey) {
        localStorage.setItem(key, String(value || "system"));
        return;
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore storage failures so offline/local usage still works.
    }
  }

  function setStatus(code, summary, detail, busy = false) {
    status = { code, summary, detail, busy };
    renderAuthUi();
    dispatchStatusEvent();
  }

  function dispatchStorageUpdate(key, value, source) {
    window.dispatchEvent(
      new CustomEvent("japanote:storage-updated", {
        detail: {
          key,
          value: clone(value),
          source
        }
      })
    );
  }

  function dispatchStatusEvent() {
    window.dispatchEvent(
      new CustomEvent("japanote:sync-status", {
        detail: getPublicState()
      })
    );
  }

  function getPublicState() {
    return {
      enabled: config.enabled,
      session: currentSession,
      user: currentUser,
      status: { ...status }
    };
  }

  function readValue(key, fallback = null) {
    if (!supportedKeys.has(key)) {
      return clone(fallback);
    }

    if (!Object.prototype.hasOwnProperty.call(localValues, key)) {
      return clone(fallback);
    }

    return clone(localValues[key]);
  }

  function writeValue(key, value, options = {}) {
    if (!supportedKeys.has(key)) {
      return;
    }

    const nextValue = clone(value);
    localValues[key] = nextValue;
    persistLocalValue(key, nextValue);
    dispatchStorageUpdate(key, nextValue, options.source || "local");

    if (options.remote !== false) {
      queueRemoteSave();
    }

    renderAuthUi();
  }

  function queueRemoteSave() {
    if (!config.enabled || !currentUser || isLoadingRemoteState) {
      return;
    }

    window.clearTimeout(pendingSaveTimer);
    pendingSaveTimer = window.setTimeout(() => {
      pushRemoteState("변경 내용을 클라우드에 저장하고 있어요.");
    }, 700);
  }

  function buildRemotePayload() {
    return {
      user_id: currentUser.id,
      study_state: readValue(studyStateKey, {}),
      match_state: readValue(matchStateKey, {}),
      theme_mode: typeof localValues[themeStorageKey] === "string" ? localValues[themeStorageKey] : "system",
      updated_at: new Date().toISOString()
    };
  }

  async function fetchRemoteState() {
    if (!client || !currentUser) {
      return { data: null, error: null };
    }

    return client
      .from(config.stateTable)
      .select("study_state, match_state, theme_mode, updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();
  }

  function applyRemoteState(remoteState) {
    if (!remoteState || typeof remoteState !== "object") {
      return;
    }

    if (remoteState.study_state && typeof remoteState.study_state === "object") {
      writeValue(studyStateKey, remoteState.study_state, {
        remote: false,
        source: "remote"
      });
    }

    if (remoteState.match_state && typeof remoteState.match_state === "object") {
      writeValue(matchStateKey, remoteState.match_state, {
        remote: false,
        source: "remote"
      });
    }

    if (typeof remoteState.theme_mode === "string" && remoteState.theme_mode) {
      writeValue(themeStorageKey, remoteState.theme_mode, {
        remote: false,
        source: "remote"
      });
    }
  }

  async function pullRemoteState(detail = "클라우드 데이터를 확인하고 있어요.") {
    if (!config.enabled || !client || !currentUser) {
      return { ok: false };
    }

    isLoadingRemoteState = true;
    setStatus("syncing", "클라우드 동기화", detail, true);

    try {
      const { data, error } = await fetchRemoteState();

      if (error) {
        throw error;
      }

      if (!data) {
        await pushRemoteState("클라우드에 첫 학습 기록을 만들고 있어요.");
        return { ok: true, bootstrapped: true };
      }

      applyRemoteState(data);
      setStatus("synced", "동기화됨", "클라우드에 저장된 최신 학습 상태를 불러왔어요.");
      return { ok: true, data };
    } catch (error) {
      setStatus(
        "error",
        "동기화 오류",
        error?.message || "Supabase에서 데이터를 읽지 못했어요. 설정과 RLS 정책을 확인해 주세요."
      );
      return { ok: false, error };
    } finally {
      isLoadingRemoteState = false;
    }
  }

  async function pushRemoteState(detail = "클라우드에 학습 상태를 저장하고 있어요.") {
    if (!config.enabled || !client || !currentUser) {
      return { ok: false };
    }

    setStatus("syncing", "클라우드 저장", detail, true);

    try {
      const { error } = await client.from(config.stateTable).upsert(buildRemotePayload(), {
        onConflict: "user_id"
      });

      if (error) {
        throw error;
      }

      setStatus("synced", "동기화됨", "현재 기기의 학습 상태를 클라우드에 저장했어요.");
      return { ok: true };
    } catch (error) {
      setStatus(
        "error",
        "저장 실패",
        error?.message || "Supabase에 데이터를 저장하지 못했어요. 테이블 이름과 정책을 확인해 주세요."
      );
      return { ok: false, error };
    }
  }

  async function signInWithEmail(email) {
    if (!config.enabled || !client) {
      return { ok: false };
    }

    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      setStatus("error", "이메일 필요", "로그인 링크를 받을 이메일 주소를 입력해 주세요.");
      return { ok: false };
    }

    setStatus("sending-link", "로그인 링크 전송", "이메일로 매직 링크를 보내는 중이에요.", true);

    const redirectTo = config.emailRedirectTo || window.location.href.split("#")[0];

    try {
      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        throw error;
      }

      setStatus(
        "link-sent",
        "링크 전송됨",
        "받은 편지함에서 Supabase 로그인 링크를 열면 현재 페이지로 다시 돌아와요."
      );
      return { ok: true };
    } catch (error) {
      setStatus(
        "error",
        "링크 전송 실패",
        error?.message || "로그인 링크를 보내지 못했어요. 인증 설정을 확인해 주세요."
      );
      return { ok: false, error };
    }
  }

  async function signOut() {
    if (!client) {
      return;
    }

    try {
      await client.auth.signOut();
      setStatus("ready", "로그아웃됨", "이제 이 기기의 로컬 저장 데이터로 계속 학습해요.");
    } catch (error) {
      setStatus("error", "로그아웃 실패", error?.message || "로그아웃 처리 중 문제가 발생했어요.");
    }
  }

  function getSummaryLabel() {
    if (!config.enabled) {
      return "이 기기만";
    }

    if (currentUser?.email) {
      return "동기화 중";
    }

    if (status.code === "link-sent") {
      return "메일 확인";
    }

    if (status.code === "error") {
      return "동기화 오류";
    }

    return "클라우드 연결";
  }

  function getSummaryIcon() {
    if (!config.enabled) {
      return "cloud_off";
    }

    if (status.code === "error") {
      return "cloud_alert";
    }

    if (currentUser?.email) {
      return status.busy ? "cloud_upload" : "cloud_done";
    }

    if (status.code === "link-sent") {
      return "mark_email_read";
    }

    return "cloud_sync";
  }

  function ensureAuthRoots() {
    document.querySelectorAll(".topbar").forEach((header) => {
      let root = header.querySelector("[data-auth-root]");

      if (!root) {
        root = document.createElement("div");
        root.className = "topbar-auth";
        root.setAttribute("data-auth-root", "");
        root.innerHTML = [
          '<button class="secondary-btn button-with-icon auth-toggle" type="button" data-auth-toggle>',
          '<span class="material-symbols-rounded" data-auth-icon aria-hidden="true">cloud_sync</span>',
          '<span data-auth-summary>클라우드 연결</span>',
          "</button>",
          '<div class="auth-panel" data-auth-panel hidden>',
          '<p class="auth-panel-title">기기 간 동기화</p>',
          '<p class="auth-panel-status" data-auth-status></p>',
          '<p class="auth-panel-copy" data-auth-detail></p>',
          '<form class="auth-form" data-auth-form>',
          '<label class="auth-field" for="auth-email-input">',
          "<span>이메일</span>",
          '<input id="auth-email-input" class="auth-input" type="email" autocomplete="email" placeholder="you@example.com" data-auth-email>',
          "</label>",
          '<button class="secondary-btn auth-submit" type="submit" data-auth-submit>로그인 링크 보내기</button>',
          "</form>",
          '<div class="auth-user" data-auth-user hidden>',
          '<span class="material-symbols-rounded" aria-hidden="true">person</span>',
          '<strong data-auth-user-email></strong>',
          "</div>",
          '<div class="auth-actions" data-auth-actions>',
          '<button class="secondary-btn auth-action-button" type="button" data-auth-refresh>클라우드 불러오기</button>',
          '<button class="secondary-btn auth-action-button" type="button" data-auth-push>지금 동기화</button>',
          '<button class="secondary-btn auth-action-button" type="button" data-auth-signout>로그아웃</button>',
          "</div>",
          '<p class="auth-panel-help" data-auth-help></p>',
          "</div>"
        ].join("");
        header.appendChild(root);
      }

      if (root.dataset.authBound === "true") {
        return;
      }

      const toggle = root.querySelector("[data-auth-toggle]");
      const panel = root.querySelector("[data-auth-panel]");
      const form = root.querySelector("[data-auth-form]");
      const emailInput = root.querySelector("[data-auth-email]");
      const refreshButton = root.querySelector("[data-auth-refresh]");
      const pushButton = root.querySelector("[data-auth-push]");
      const signoutButton = root.querySelector("[data-auth-signout]");

      if (toggle && panel) {
        toggle.addEventListener("click", () => {
          authPanelOpen = !authPanelOpen;
          panel.hidden = !authPanelOpen;
        });
      }

      if (form && emailInput) {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          await signInWithEmail(emailInput.value);
          renderAuthUi();
        });
      }

      if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
          await pullRemoteState("클라우드에 저장된 데이터를 다시 불러오고 있어요.");
        });
      }

      if (pushButton) {
        pushButton.addEventListener("click", async () => {
          await pushRemoteState("현재 화면의 학습 상태를 클라우드에 저장하고 있어요.");
        });
      }

      if (signoutButton) {
        signoutButton.addEventListener("click", async () => {
          await signOut();
        });
      }

      root.dataset.authBound = "true";
    });
  }

  function renderAuthUi() {
    ensureAuthRoots();

    document.querySelectorAll("[data-auth-root]").forEach((root) => {
      const panel = root.querySelector("[data-auth-panel]");
      const icon = root.querySelector("[data-auth-icon]");
      const summary = root.querySelector("[data-auth-summary]");
      const statusNode = root.querySelector("[data-auth-status]");
      const detailNode = root.querySelector("[data-auth-detail]");
      const helpNode = root.querySelector("[data-auth-help]");
      const form = root.querySelector("[data-auth-form]");
      const submitButton = root.querySelector("[data-auth-submit]");
      const refreshButton = root.querySelector("[data-auth-refresh]");
      const pushButton = root.querySelector("[data-auth-push]");
      const signoutButton = root.querySelector("[data-auth-signout]");
      const userNode = root.querySelector("[data-auth-user]");
      const userEmailNode = root.querySelector("[data-auth-user-email]");

      if (panel) {
        panel.hidden = !authPanelOpen;
      }
      if (icon) {
        icon.textContent = getSummaryIcon();
      }
      if (summary) {
        summary.textContent = getSummaryLabel();
      }
      if (statusNode) {
        statusNode.textContent = status.summary;
      }
      if (detailNode) {
        detailNode.textContent = status.detail;
      }
      if (helpNode) {
        helpNode.textContent = config.enabled
          ? "Supabase Auth의 Site URL과 Redirect URL에 현재 사이트 주소를 등록해 두세요."
          : "assets/js/supabase-config.js 에 프로젝트 URL과 anon key를 넣은 뒤 enabled를 true로 바꾸세요.";
      }
      if (form) {
        form.hidden = !config.enabled || Boolean(currentUser?.email);
      }
      if (submitButton) {
        submitButton.disabled = status.busy;
      }
      if (refreshButton) {
        refreshButton.hidden = !Boolean(currentUser?.email);
        refreshButton.disabled = status.busy;
      }
      if (pushButton) {
        pushButton.hidden = !Boolean(currentUser?.email);
        pushButton.disabled = status.busy;
      }
      if (signoutButton) {
        signoutButton.hidden = !Boolean(currentUser?.email);
        signoutButton.disabled = status.busy;
      }
      if (userNode) {
        userNode.hidden = !Boolean(currentUser?.email);
      }
      if (userEmailNode) {
        userEmailNode.textContent = currentUser?.email || "";
      }
    });
  }

  function attachDismissHandler() {
    document.addEventListener("click", (event) => {
      if (!authPanelOpen) {
        return;
      }

      const authRoot = event.target.closest("[data-auth-root]");

      if (authRoot) {
        return;
      }

      authPanelOpen = false;
      renderAuthUi();
    });
  }

  async function initializeSupabase() {
    ensureAuthRoots();
    renderAuthUi();
    attachDismissHandler();

    if (!config.enabled) {
      return;
    }

    if (!globalThis.supabase || typeof globalThis.supabase.createClient !== "function") {
      setStatus("error", "SDK 누락", "Supabase JavaScript SDK를 불러오지 못했어요.");
      return;
    }

    client = globalThis.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "japanote-supabase-auth"
      }
    });

    client.auth.onAuthStateChange(async (event, session) => {
      currentSession = session || null;
      currentUser = session?.user || null;

      if (!currentUser) {
        setStatus("ready", "클라우드 준비", "이메일 로그인 후 같은 데이터를 여러 기기에서 볼 수 있어요.");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await pullRemoteState("클라우드에 저장된 학습 상태를 연결하고 있어요.");
      }

      renderAuthUi();
    });

    const { data, error } = await client.auth.getSession();

    if (error) {
      setStatus("error", "세션 확인 실패", error.message || "Supabase 세션을 확인하지 못했어요.");
      return;
    }

    currentSession = data?.session || null;
    currentUser = currentSession?.user || null;

    if (currentUser) {
      await pullRemoteState("기존 클라우드 상태를 불러오고 있어요.");
      return;
    }

    setStatus("ready", "클라우드 준비", "이메일 로그인 후 같은 데이터를 여러 기기에서 볼 수 있어요.");
  }

  globalThis.japanoteSync = {
    getState: getPublicState,
    readValue,
    writeValue,
    pullRemoteState,
    pushRemoteState,
    signInWithEmail,
    signOut
  };

  initializeSupabase();
})();
