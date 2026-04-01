// GitHub Pages 배포용. Supabase Authentication → Redirect URLs 에 아래 사이트 주소가 등록돼 있어야 매직 링크가 돌아옵니다.
const SUPABASE_URL = "https://nppaqezqwusbagzdnoqi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcGFxZXpxd3VzYmFnemRub3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTU5MzIsImV4cCI6MjA5MDQzMTkzMn0.cVnznT2P0sOoX6nA9mCLLNtIID5m2I1LW8N36FY9iqA";

window.japanoteSupabaseConfig = window.japanoteSupabaseConfig || {
  enabled: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  stateTable: "user_state",
  emailRedirectTo: "https://losey-kim.github.io/Japanote/"
};
