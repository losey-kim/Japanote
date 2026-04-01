// Copy to `supabase-config.js` and fill in values. That file can stay untracked locally.
// See README: Supabase 동기화 설정
window.japanoteSupabaseConfig = window.japanoteSupabaseConfig || {
  enabled: false,
  url: "",
  anonKey: "",
  stateTable: "user_state",
  emailRedirectTo: "",
  // Supabase 대시보드 Authentication → Providers에서 켠 것만 추가. 예: ["google"], ["google","github"]
  oauthProviders: []
};
