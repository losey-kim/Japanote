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

기기 간에 같은 학습 상태를 보려면 `Supabase Auth`와 `user_state` 테이블을 설정하면 됩니다. 앱은 `assets/js/supabase-sync.js`에서 학습 상태(`jlpt-compass-state`), 짝 맞추기 상태, 테마를 `user_state` 행에 upsert합니다.

1. `assets/js/supabase-config.example.js`를 복사해 `assets/js/supabase-config.js`를 만들고, 아래 값을 채운 뒤 `enabled`를 `true`로 바꿉니다. (저장소에 실 키를 올리지 않으려면 `supabase-config.js`는 로컬만 두고 커밋에서 제외하면 됩니다.)
   - `url`: Supabase 프로젝트 URL
   - `anonKey`: Supabase anon public key
   - `stateTable`: 상태를 저장할 테이블명. 기본값은 `user_state`
   - `emailRedirectTo`: 로그인 링크 클릭 후 돌아올 URL. 비워두면 현재 페이지 URL을 사용
   - `oauthProviders`: 이메일 대신 **Google / GitHub / Apple** 등으로 로그인하려면 Supabase에서 해당 Provider를 켠 뒤, 여기에 문자열 배열로 넣습니다. 예: `["google"]`, `["google","github"]`
2. Supabase Authentication에서 사용할 로그인 방식을 켭니다.
   - **이메일(매직 링크)**: Email provider 활성화
   - **Google·GitHub·Apple 등**: Authentication → Providers에서 각각 켜고, 클라이언트 ID/Secret을 넣습니다.
3. Authentication의 `Site URL`과 `Redirect URLs`에 실제 서비스 주소를 등록합니다. OAuth는 리다이렉트 URL이 맞지 않으면 로그인 후 돌아오지 못합니다.
4. SQL Editor에서 `supabase/migrations/001_user_state.sql` 내용을 실행합니다.

설정이 끝나면 상단 헤더의 클라우드 버튼에서 **OAuth 버튼** 또는 이메일 로그인 링크를 쓰고, 로그인 후 **클라우드에서 받기** / **클라우드에 올리기**로 수동 동기화할 수 있습니다. 다른 기기에서 같은 계정으로 로그인하면 동일한 학습 상태를 불러옵니다.
