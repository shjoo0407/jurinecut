-- 주리네컷 사진 저장소 설정
-- 수파베이스 대시보드 → SQL Editor에 통째로 붙여넣고 Run 한 번이면 된다.

-- 1. 'photos' 저장 공간(버킷)
--    public = 주소를 아는 사람은 사진을 볼 수 있다. 주소는 추측할 수 없는 무작위 문자열이다.
--    JPEG만, 한 장에 10MB까지.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg'])
on conflict (id) do nothing;

-- 2. 부스(로그인하지 않은 사용자)는 사진을 올리기만 할 수 있다.
--    목록 보기·덮어쓰기·삭제 권한은 주지 않는다. 그래서 남의 사진을 찾아보거나 지울 수 없다.
create policy "booth can upload photos"
on storage.objects for insert to anon
with check (bucket_id = 'photos');
