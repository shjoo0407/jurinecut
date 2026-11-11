-- 주리네컷 사진·영상 저장소 설정
-- 수파베이스 대시보드 → SQL Editor에 통째로 붙여넣고 Run 한 번이면 된다. 여러 번 실행해도 괜찮다.

-- 1. 'photos' 저장 공간(버킷)
--    public = 주소를 아는 사람은 파일을 볼 수 있다. 주소는 추측할 수 없는 무작위 문자열이다.
--    사진(JPEG)과 촬영 영상(mp4, webm)만, 한 파일에 50MB까지.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 52428800, array['image/jpeg', 'video/mp4', 'video/webm'])
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit;

-- 2. 부스(로그인하지 않은 사용자)는 파일을 올리기만 할 수 있다.
--    목록 보기·덮어쓰기·삭제 권한은 주지 않는다. 그래서 남의 사진을 찾아보거나 지울 수 없다.
drop policy if exists "booth can upload photos" on storage.objects;
create policy "booth can upload photos"
on storage.objects for insert to anon
with check (bucket_id = 'photos');
