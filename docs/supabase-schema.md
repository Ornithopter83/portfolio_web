# Supabase Schema Draft

향후 포트폴리오와 시연 로그를 Supabase에 연결하기 위한 초안입니다.

## projects

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key, default `gen_random_uuid()` |
| title | text | 프로젝트 이름 |
| summary | text | 카드 요약 |
| category | text | OCR, automation, NAS, Supabase 등 |
| demo_key | text | Demo Launcher 버튼과 연결되는 키 |
| display_order | int | 정렬 순서 |
| is_published | boolean | 공개 여부 |
| created_at | timestamptz | 생성 시각 |

## demo_events

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key, default `gen_random_uuid()` |
| demo_key | text | 실행한 시연 키 |
| event_name | text | opened, selected, launched 등 |
| metadata | jsonb | 브라우저, 화면 크기 등 |
| created_at | timestamptz | 이벤트 시각 |
