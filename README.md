# 주리네컷

주리랑 어우름 창립제(2026.11.14) 포토부스. 아이패드에서 레이아웃을 고르고 찍은 뒤, 찍은 사진을 넣어 보며 프레임을 고르면 QR로 사진을 받아간다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `index.html` | 부스 화면 (아이패드) |
| `photo.html` | 손님이 QR로 여는 사진 저장 페이지 |
| `js/config.js` | 행사 정보, 수파베이스 주소·키, 타이머 숫자 |
| `js/frames.js` | 프레임 디자인 (로고와 포스터 참고) |
| `assets/` | 로고, 홈 화면 아이콘 |
| `js/compose.js` | 레이아웃(2×2, 1장)과 사진 합성 |
| `js/storage.js` | 업로드와 아이패드 백업 |
| `supabase/setup.sql` | 사진 저장소 설정 |

## 맥에서 실행

```sh
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 연다. 카메라 권한을 허용하면 맥 카메라로 동작한다.

## 사진 저장소 연결

1. 수파베이스 SQL Editor에 `supabase/setup.sql`을 붙여넣고 Run
2. Project URL과 Publishable key(`sb_publishable_...`)를 `js/config.js`에 넣는다

`supabaseUrl`이 비어 있으면 테스트 모드로 돈다. 촬영과 QR 화면은 되지만 사진은 어디에도 올라가지 않는다.
