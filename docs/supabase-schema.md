# Supabase Schema Draft

향후 포트폴리오와 시연 로그를 Supabase에 연결하기 위한 초안입니다.

## access_roles

앱 권한 등급의 기준 테이블입니다. Supabase의 `anon`, `authenticated` Postgres role과 별개로 Portfolio Launcher 안에서 사용할 상태를 관리합니다.

| Column | Type | Notes |
| --- | --- | --- |
| code | text | primary key, `admin` 또는 `visitor` |
| display_name | text | `관리자`, `방문객` |
| sort_order | int | 표시 순서 |
| created_at | timestamptz | 생성 시각 |

초기 데이터:

| code | display_name |
| --- | --- |
| admin | 관리자 |
| visitor | 방문객 |

## user_access_roles

Supabase Auth 사용자와 앱 권한 등급을 연결합니다. 신규 사용자는 trigger로 `visitor` 상태가 자동 부여됩니다.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | uuid | primary key, `auth.users(id)` 참조 |
| role_code | text | `access_roles(code)` 참조, 기본값 `visitor` |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

RLS 정책:

- 누구나 `access_roles`를 조회할 수 있습니다.
- 로그인 사용자는 자신의 `user_access_roles` 행을 조회할 수 있습니다.
- `admin` 사용자는 모든 사용자 권한을 조회, 생성, 수정, 삭제할 수 있습니다.
- 첫 관리자는 Supabase SQL Editor에서 직접 `role_code = 'admin'`으로 승격합니다.

마이그레이션 파일: `supabase/migrations/20260608041000_create_access_roles.sql`

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
