# 주리네컷

주리랑 어우름 창립제(2026.11.14) 포토부스. 아이패드에서 레이아웃을 고르고 찍으면, 검은 바탕에 자수 패치 스티커를 붙인 사진과 촬영 과정 영상을 QR로 받아간다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `index.html` | 부스 화면 (아이패드) |
| `photo.html` | 손님이 QR로 여는 사진·영상 저장 페이지 |
| `js/config.js` | 행사 정보, 수파베이스 주소·키, 타이머 등 숫자 |
| `js/frames.js` | 프레임 디자인 (검은 바탕 + 스티커) |
| `js/compose.js` | 레이아웃(2×2, 1×4 세로)과 사진 합성 |
| `js/video.js` | 컷별 영상 녹화와 영상 합성 |
| `js/sound.js` | 카운트다운·셔터 소리 |
| `js/storage.js` | 업로드와 아이패드 백업 |
| `assets/` | 로고, 홈 화면 아이콘 |
| `supabase/setup.sql` | 사진·영상 저장소 설정 |

## 맥에서 실행

```sh
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 연다. 카메라 권한을 허용하면 맥 카메라로 동작한다.

## 사진 저장소 연결

1. 수파베이스 SQL Editor에 `supabase/setup.sql`을 붙여넣고 Run
2. Project URL과 Publishable key(`sb_publishable_...`)를 `js/config.js`에 넣는다

`supabaseUrl`이 비어 있으면 테스트 모드로 돈다. 촬영과 QR 화면은 되지만 파일은 어디에도 올라가지 않는다.

무료 요금제 프로젝트는 7일 동안 쓰지 않으면 일시정지된다. 대시보드에서 Restore 하면 다시 켜진다.
