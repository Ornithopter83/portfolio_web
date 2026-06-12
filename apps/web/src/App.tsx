import { useEffect, useMemo, useState } from 'react';
import { Bell, ImagePlus, MonitorDot, Play, Send, UploadCloud } from 'lucide-react';
import { hasPushConfig, hasSupabaseConfig } from './config';
import { supabase } from './lib/supabase';
import { registerServiceWorker, subscribeToPush } from './lib/push';

type PageKey = 'profile' | 'portfolio' | 'messages';

type ServerHeartbeat = {
  server_id: string;
  status: 'online' | 'offline';
  last_seen_at: string;
  note: string | null;
};

type DemoItem = {
  key: string;
  title: string;
  description: string;
};

const demos: DemoItem[] = [
  { key: 'ocr', title: 'OCR 시연', description: '이미지나 문서에서 텍스트를 추출하고 검수 흐름으로 넘기는 OCR 데모 자리입니다.' },
  { key: 'automation', title: '업무 자동화', description: '반복 업무를 수집, 분류, 실행하는 자동화 파이프라인 데모 자리입니다.' },
  { key: 'nas', title: 'NAS 웹서비스', description: 'NAS 정적 호스팅과 Mini PC 서버 연결 흐름을 보여줄 데모 자리입니다.' },
  { key: 'supabase', title: 'Supabase 연동', description: 'Supabase 인증, 데이터 조회, 이벤트 기록을 연결할 데모 자리입니다.' }
];

const projects = [
  { category: 'OCR', title: '문서 OCR 파이프라인', summary: '스캔 문서에서 텍스트를 추출하고 검수 큐로 넘기는 프로젝트 placeholder입니다.' },
  { category: 'Automation', title: '업무 자동화 도구', summary: '반복 업무를 규칙 기반으로 실행하는 자동화 프로젝트 placeholder입니다.' },
  { category: 'Web', title: 'NAS 웹서비스', summary: '정적 React 앱을 NAS에 배포하고 내부 서비스와 연결하는 프로젝트 placeholder입니다.' },
  { category: 'Data', title: 'Supabase 연동', summary: 'Supabase 데이터 모델과 React 클라이언트를 연결하는 프로젝트 placeholder입니다.' }
];

export function App() {
  const [page, setPage] = useState<PageKey>('profile');
  const [demoOpen, setDemoOpen] = useState(false);
  const [heartbeat, setHeartbeat] = useState<ServerHeartbeat | null>(null);

  useEffect(() => {
    registerServiceWorker().catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadHeartbeat().then(setHeartbeat);
    const timer = window.setInterval(() => void loadHeartbeat().then(setHeartbeat), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="main-nav" aria-label="Primary navigation">
          <button type="button" className="brand" onClick={() => setPage('profile')}>Portfolio Launcher</button>
          <div className="nav-links">
            <button type="button" className={navClass(page === 'profile')} onClick={() => setPage('profile')}>프로필</button>
            <button type="button" className={navClass(page === 'portfolio')} onClick={() => setPage('portfolio')}>포트폴리오</button>
            <button type="button" className={navClass(page === 'messages')} onClick={() => setPage('messages')}>메시지</button>
            <button type="button" className="demo-nav-button" onClick={() => setDemoOpen(true)}>
              <Play size={16} aria-hidden="true" />
              시연
            </button>
          </div>
        </nav>
      </header>

      <main className="site-main">
        <StatusStrip heartbeat={heartbeat} />
        {page === 'profile' && <Profile />}
        {page === 'portfolio' && <Portfolio />}
        {page === 'messages' && <Messages />}
      </main>

      {demoOpen && <DemoLauncher onClose={() => setDemoOpen(false)} />}
    </div>
  );
}

function navClass(active: boolean) {
  return `nav-link${active ? ' is-active' : ''}`;
}

async function loadHeartbeat() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from('server_heartbeats')
    .select('server_id,status,last_seen_at,note')
    .eq('server_id', 'mini-pc-push-worker')
    .maybeSingle();

  return data as ServerHeartbeat | null;
}

function StatusStrip({ heartbeat }: { heartbeat: ServerHeartbeat | null }) {
  const status = useMemo(() => {
    if (!heartbeat) {
      return { label: '서버 상태 확인 대기', online: false, time: 'Supabase 연결 후 표시됩니다.' };
    }

    const lastSeen = new Date(heartbeat.last_seen_at);
    const online = heartbeat.status === 'online' && Date.now() - lastSeen.getTime() < 90_000;

    return {
      label: online ? '서버 ON' : '서버 OFF',
      online,
      time: `마지막 갱신: ${lastSeen.toLocaleString('ko-KR')}`
    };
  }, [heartbeat]);

  return (
    <section className="status-strip" aria-label="Server status">
      <div className={`status-dot${status.online ? ' is-online' : ''}`} />
      <MonitorDot size={18} aria-hidden="true" />
      <strong>{status.label}</strong>
      <span>{status.time}</span>
    </section>
  );
}

function Profile() {
  return (
    <section className="page-section profile">
      <p className="eyebrow">Profile</p>
      <h1>프로필</h1>
      <p className="lead-copy">
        React, Supabase, NAS 정적 호스팅, Mini PC Web Push 워커를 연결하는 포트폴리오 런처입니다.
      </p>

      <div className="profile-panel">
        <h2>소개</h2>
        <p>
          OCR, 업무 자동화, NAS 웹서비스, Supabase 연동 데모를 하나의 정적 웹 앱에서 보여주고,
          서버가 켜져 있을 때만 알림 작업을 처리하는 구조로 확장합니다.
        </p>
      </div>
    </section>
  );
}

function Portfolio() {
  return (
    <section className="page-section">
      <p className="eyebrow">Portfolio</p>
      <h1>포트폴리오</h1>
      <p className="lead-copy">프로젝트 카드가 들어갈 placeholder 목록입니다.</p>

      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.title}>
            <span>{project.category}</span>
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Messages() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  async function handleSubscribe() {
    try {
      const subscription = await subscribeToPush();
      if (!supabase) {
        setMessage('구독은 생성됐지만 Supabase 설정이 없어 저장하지 않았습니다.');
        return;
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        subscription,
        user_agent: navigator.userAgent,
        is_active: true,
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      setMessage('알림 구독 정보를 저장했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 구독에 실패했습니다.');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Supabase 환경 변수가 없어 메시지를 저장할 수 없습니다.');
      return;
    }

    const { data: createdMessage, error } = await supabase
      .from('messages')
      .insert({ title, body, status: 'pending' })
      .select('id')
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (file && createdMessage?.id) {
      const path = createAttachmentPath(createdMessage.id, file.name);
      const upload = await supabase.storage.from('message-attachments').upload(path, file);

      if (upload.error) {
        setMessage(upload.error.message);
        return;
      }

      const attachment = await supabase.from('message_attachments').insert({
        message_id: createdMessage.id,
        file_path: path,
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
        size_bytes: file.size
      });

      if (attachment.error) {
        setMessage(attachment.error.message);
        return;
      }
    }

    setTitle('');
    setBody('');
    setFile(null);
    setMessage('메시지를 pending 상태로 저장했습니다. 서버가 켜지면 Web Push를 발송합니다.');
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Messages</p>
      <h1>메시지</h1>
      <p className="lead-copy">알림 내용을 Supabase에 저장하고, Mini PC Node 서버가 켜져 있을 때 Web Push로 발송합니다.</p>

      <div className="message-layout">
        <form className="message-form" onSubmit={handleSubmit}>
          <label>
            제목
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
          </label>
          <label>
            내용
            <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={8} />
          </label>
          <label className="file-drop">
            <ImagePlus size={20} aria-hidden="true" />
            <span>{file ? file.name : '이미지 또는 데이터 첨부'}</span>
            <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={handleSubscribe} disabled={!hasPushConfig}>
              <Bell size={17} aria-hidden="true" />
              알림 구독
            </button>
            <button type="submit" className="primary-button" disabled={!hasSupabaseConfig}>
              <Send size={17} aria-hidden="true" />
              저장
            </button>
          </div>
          {message && <p className="form-message">{message}</p>}
        </form>

        <aside className="message-guide">
          <UploadCloud size={22} aria-hidden="true" />
          <h2>처리 흐름</h2>
          <p>작성된 메시지와 첨부 파일은 Supabase에 저장됩니다. Node 서버는 프론트엔드에 직접 데이터를 제공하지 않고, pending 작업을 읽어 알림만 발송합니다.</p>
        </aside>
      </div>
    </section>
  );
}

function createAttachmentPath(messageId: string, fileName: string) {
  const extension = getSafeFileExtension(fileName);
  const uniqueName = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${messageId}/${uniqueName}${extension}`;
}

function getSafeFileExtension(fileName: string) {
  const match = fileName.match(/\.([A-Za-z0-9]{1,12})$/);
  return match ? `.${match[1].toLowerCase()}` : '';
}

function DemoLauncher({ onClose }: { onClose: () => void }) {
  const [selectedDemo, setSelectedDemo] = useState(demos[0]);

  useEffect(() => {
    let module: typeof import('./demoLauncher3d') | undefined;
    let mounted = true;

    void import('./demoLauncher3d').then(async (loadedModule) => {
      module = loadedModule;
      if (mounted) {
        await module.startDemoLauncher('demo-launcher-canvas');
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      mounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      module?.stopDemoLauncher();
    };
  }, [onClose]);

  async function handleSelect(demo: DemoItem) {
    setSelectedDemo(demo);
    const module = await import('./demoLauncher3d');
    module.playDemoAction(demo.key);
  }

  return (
    <div className="demo-launcher" role="dialog" aria-modal="true" aria-labelledby="demo-launcher-title">
      <div className="demo-launcher__header">
        <div>
          <p className="eyebrow">Interactive demo launcher</p>
          <h2 id="demo-launcher-title">시연</h2>
        </div>
        <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>x</button>
      </div>

      <div className="demo-launcher__body">
        <section className="demo-launcher__stage" aria-label="3D preview">
          <canvas id="demo-launcher-canvas" />
        </section>

        <section className="demo-launcher__controls" aria-label="Demo list">
          {demos.map((demo) => (
            <button
              type="button"
              className={`demo-button${selectedDemo.key === demo.key ? ' is-selected' : ''}`}
              key={demo.key}
              onClick={() => void handleSelect(demo)}
            >
              {demo.title}
            </button>
          ))}
        </section>
      </div>

      <p className="demo-launcher__description">{selectedDemo.description}</p>
    </div>
  );
}
