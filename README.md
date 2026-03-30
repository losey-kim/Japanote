# Japanote

JLPT 시험 공부를 위한 정적 학습 사이트입니다.

## 실행 방법

1. `C:\Users\admin\Documents\jlpt\index.html` 파일을 브라우저에서 엽니다.
2. 상단 네비게이션 또는 홈의 카드에서 원하는 학습 페이지로 이동합니다.
3. 또는 현재 폴더에서 간단한 정적 서버를 띄워 확인합니다.

## 페이지 구성

- `index.html`: 홈 대시보드, 로드맵, 주간 루틴
- `starter.html`: 초급 시작 체크리스트 + 기초 훈련
- `vocab.html`: 단어 플래시카드
- `grammar.html`: 문법 체크리스트 + 문법 드릴
- `reading.html`: 독해 문제 풀이
- `quiz.html`: 짧은 모의 퀴즈

## 포함 기능

- N5~N1 레벨별 학습 로드맵
- 기초 체크리스트와 문자·단어·조사·한자·문장 훈련
- 플래시카드 단어 학습
- 문법 체크리스트와 문법 드릴
- 독해 문제 풀이와 짧은 모의 퀴즈
- 로컬 스토리지 기반 학습 진척도 저장

## Supabase 동기화 설정

기기 간에 같은 학습 상태를 보려면 `Supabase Auth`와 `user_state` 테이블을 설정하면 됩니다.

1. `assets/js/supabase-config.js`에서 아래 값을 채우고 `enabled`를 `true`로 바꿉니다.
   - `url`: Supabase 프로젝트 URL
   - `anonKey`: Supabase anon public key
   - `stateTable`: 상태를 저장할 테이블명. 기본값은 `user_state`
   - `emailRedirectTo`: 로그인 링크 클릭 후 돌아올 URL. 비워두면 현재 페이지 URL을 사용
2. Supabase Authentication에서 Email 로그인을 켭니다.
3. Authentication의 `Site URL`과 `Redirect URLs`에 실제 서비스 주소를 등록합니다.
4. SQL Editor에서 아래 SQL을 실행합니다.

```sql
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  study_state jsonb not null default '{}'::jsonb,
  match_state jsonb not null default '{}'::jsonb,
  theme_mode text not null default 'system',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_state enable row level security;

create policy "user_state_select_own"
on public.user_state
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

create policy "user_state_insert_own"
on public.user_state
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

create policy "user_state_update_own"
on public.user_state
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);
```

설정이 끝나면 상단 헤더의 클라우드 버튼에서 이메일 로그인 링크를 보내고, 같은 이메일로 다른 기기에서도 로그인하면 동일한 학습 상태를 불러옵니다.
