# Supabase Schema

Portfolio Launcher는 Supabase를 Auth, DB, Storage, Web Push 작업 큐 저장소로 사용합니다.

## access_roles

앱 권한 등급의 기준 테이블입니다.

| Column | Type | Notes |
| --- | --- | --- |
| code | text | primary key, `admin` 또는 `visitor` |
| display_name | text | `관리자`, `방문객` |
| sort_order | int | 표시 순서 |
| created_at | timestamptz | 생성 시각 |

마이그레이션 파일: `supabase/migrations/20260608041000_create_access_roles.sql`

## user_access_roles

Supabase Auth 사용자와 앱 권한 등급을 연결합니다. 신규 사용자는 trigger로 `visitor` 상태가 자동 부여됩니다.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | uuid | primary key, `auth.users(id)` 참조 |
| role_code | text | `access_roles(code)` 참조, 기본값 `visitor` |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

## messages

웹사이트에서 작성한 알림 요청입니다. Node 워커가 켜져 있을 때 `pending` 메시지를 처리합니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| title | text | 알림 제목 |
| body | text | 알림 본문 |
| status | text | `pending`, `processing`, `sent`, `failed`, `cancelled` |
| created_by | uuid | Auth 사용자, 없을 수 있음 |
| created_at | timestamptz | 생성 시각 |
| processing_started_at | timestamptz | 워커 처리 시작 시각 |
| processed_at | timestamptz | 처리 완료 시각 |
| error_message | text | 실패 사유 |

## message_attachments

메시지에 연결된 첨부 파일 메타데이터입니다. 실제 파일은 Supabase Storage `message-attachments` bucket에 저장됩니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| message_id | uuid | `messages(id)` 참조 |
| file_path | text | Storage path |
| file_name | text | 원본 파일명 |
| content_type | text | MIME type |
| size_bytes | bigint | 파일 크기 |
| created_at | timestamptz | 생성 시각 |

## push_subscriptions

브라우저 Web Push 구독 정보입니다. endpoint는 비밀에 가까운 capability URL이므로 공개 화면에 노출하지 않습니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| user_id | uuid | Auth 사용자, 없을 수 있음 |
| endpoint | text | unique |
| subscription | jsonb | PushSubscription 전체 JSON |
| user_agent | text | 브라우저 정보 |
| is_active | boolean | 유효 여부 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

## push_deliveries

Node 워커의 Web Push 발송 결과입니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| message_id | uuid | `messages(id)` 참조 |
| push_subscription_id | uuid | `push_subscriptions(id)` 참조 |
| status | text | `sent` 또는 `failed` |
| status_code | int | Push endpoint 응답 코드 |
| error_message | text | 실패 사유 |
| sent_at | timestamptz | 발송 성공 시각 |
| created_at | timestamptz | 생성 시각 |

## server_heartbeats

Mini PC Node 워커 상태 표시용 테이블입니다.

| Column | Type | Notes |
| --- | --- | --- |
| server_id | text | primary key, 예: `mini-pc-push-worker` |
| status | text | `online` 또는 `offline` |
| note | text | 상태 메모 또는 오류 |
| last_seen_at | timestamptz | 마지막 heartbeat |
| updated_at | timestamptz | 수정 시각 |

## Storage

- Bucket: `message-attachments`
- React 앱은 사용자가 첨부한 파일을 이 bucket에 업로드합니다.
- Node 워커는 service role key로 필요한 첨부 정보를 읽을 수 있습니다.

## RLS

현재 MVP는 공개 포트폴리오에서 메시지를 남길 수 있는 흐름을 우선합니다.

- 누구나 메시지를 생성할 수 있습니다.
- 누구나 Push 구독을 생성/갱신할 수 있습니다.
- 누구나 서버 heartbeat를 조회할 수 있습니다.
- Node 워커는 service role key로 RLS를 우회해 pending 메시지를 처리합니다.

운영 전에는 메시지 생성과 첨부 업로드에 인증, CAPTCHA, rate limit, 관리자 승인 상태를 추가하는 것을 권장합니다.

마이그레이션 파일: `supabase/migrations/20260612090000_create_web_push_messages.sql`
