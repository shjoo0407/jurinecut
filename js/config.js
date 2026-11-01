// 행사 전에 바꿀 수 있는 값을 모아둔 곳
export const CONFIG = {
  eventTitle: '어우름 창립제',
  eventSubtitle: '41st Homecoming Day',
  eventDate: '2026.11.14',

  // 수파베이스 프로젝트 주소와 공개용 키(sb_publishable_...). 비어 있으면 테스트 모드로 돈다.
  // 공개용 키는 브라우저에 노출되도록 만들어진 키라 여기 적어도 된다. 비밀 키(sb_secret_...)는 절대 넣지 않는다.
  supabaseUrl: 'https://wnxlbziolxpwrebzhvbb.supabase.co',
  supabaseKey: 'sb_publishable_fWqyQpbu-C96Jg4feBgAuA_4k7hDupO',
  bucket: 'photos',

  countdownSeconds: 5,      // 컷마다 카운트다운
  qrScreenSeconds: 60,      // QR 화면이 떠 있는 시간
  idleResetSeconds: 90,     // 아무도 안 만지면 처음 화면으로
  uploadTimeoutSeconds: 20, // 업로드를 기다리는 최대 시간
  mirror: true,             // 거울처럼 좌우 반전해서 보여주고 저장
  jpegQuality: 0.9,
};
