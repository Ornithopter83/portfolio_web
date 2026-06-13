import { useEffect, useMemo, useState } from 'react';
import { Bell, Github, ImagePlus, Linkedin, Mail, MapPin, MonitorDot, Play, Send, Terminal } from 'lucide-react';
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

type ProjectMeta = {
  category: string;
  year: string;
  tags: string[];
  visual: string;
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

const projectMeta: ProjectMeta[] = [
  { category: 'GAMEPLAY', year: '2026', tags: ['React', 'Vite', 'Web Push'], visual: 'visual-a' },
  { category: 'TOOLS', year: '2025', tags: ['Node', 'Supabase', 'Worker'], visual: 'visual-b' },
  { category: 'ENGINE', year: '2025', tags: ['Three.js', 'GLB', 'Canvas'], visual: 'visual-c' },
  { category: 'STUDY', year: '2024', tags: ['RLS', 'Storage', 'DB'], visual: 'visual-d' }
];

const filterLabels = ['ALL', 'GAMEPLAY', 'ENGINE', 'TOOLS', 'STUDY'];
const skillTags = ['C++', 'C#', 'Unreal Engine', 'Unity', 'Gameplay System', 'AI', 'Networking'];

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
      <MatrixBackdrop />
      <header className="site-header">
        <nav className="main-nav" aria-label="Primary navigation">
          <button type="button" className="brand" onClick={() => setPage('profile')}>&lt;GP_</button>
          <div className="nav-links">
            <button type="button" className={navClass(page === 'profile')} onClick={() => setPage('profile')}>프로필</button>
            <span className="nav-separator">/</span>
            <button type="button" className={navClass(page === 'portfolio')} onClick={() => setPage('portfolio')}>포트폴리오 소개</button>
            <span className="nav-separator">/</span>
            <button type="button" className={navClass(page === 'messages')} onClick={() => setPage('messages')}>메시지 전송</button>
            <span className="nav-separator">/</span>
            <button type="button" className="demo-nav-button" onClick={() => setDemoOpen(true)}>
              <Play size={15} aria-hidden="true" />
              게임 시연
            </button>
          </div>
          <div className="social-links" aria-label="Social links">
            <a href="https://github.com/Ornithopter83" aria-label="GitHub"><Github size={17} /></a>
            <a href="mailto:ornithopter@nate.com" aria-label="Email"><Mail size={17} /></a>
          </div>
        </nav>
      </header>

      <main className="site-main">
        {page === 'profile' && <HomePage heartbeat={heartbeat} onPortfolio={() => setPage('portfolio')} onMessages={() => setPage('messages')} onDemo={() => setDemoOpen(true)} />}
        {page === 'portfolio' && <Portfolio />}
        {page === 'messages' && <Messages />}
      </main>

      <SiteFooter />
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

function HomePage({
  heartbeat,
  onPortfolio,
  onMessages,
  onDemo
}: {
  heartbeat: ServerHeartbeat | null;
  onPortfolio: () => void;
  onMessages: () => void;
  onDemo: () => void;
}) {
  return (
    <>
      <HeroSection heartbeat={heartbeat} onPortfolio={onPortfolio} />
      <SectionShell number="01" title="PROFILE">
        <ProfileSummary />
      </SectionShell>
      <SectionShell number="02" title="PORTFOLIO">
        <PortfolioPreview onPortfolio={onPortfolio} />
      </SectionShell>
      <SectionShell number="03" title="MESSAGE">
        <MessagePreview onMessages={onMessages} />
      </SectionShell>
      <SectionShell number="04" title="GAME DEMO">
        <GameDemoPreview onDemo={onDemo} />
      </SectionShell>
    </>
  );
}

function HeroSection({ heartbeat, onPortfolio }: { heartbeat: ServerHeartbeat | null; onPortfolio: () => void }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">GAME PROGRAMMER</p>
        <h1>CODE.<br />BUILD.<br /><span>PLAY.</span></h1>
        <p className="lead-copy">코드로 시스템을 만들고, 플레이어에게 경험을 전달합니다.</p>
        <button type="button" className="primary-button hero-button" onClick={onPortfolio}>
          더 알아보기
          <span aria-hidden="true">-&gt;</span>
        </button>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="monitor-frame">
          <div className="code-pane">
            <span>void Player::Update(float deltaTime)</span>
            <span>{'{'}</span>
            <span>  HandleInput();</span>
            <span>  UpdateAnimation();</span>
            <span>  SyncNetworkState();</span>
            <span>{'}'}</span>
          </div>
          <div className="viewport-pane">
            <div className="grid-floor" />
            <div className="node-line" />
            <div className="node-line is-second" />
          </div>
        </div>
        <StatusPanel heartbeat={heartbeat} />
        <div className="debug-console">
          <strong>DEBUG CONSOLE</strong>
          <span>[INFO] Player Spawn</span>
          <span>[INFO] Game Started</span>
          <span>[INFO] Systems Go</span>
        </div>
      </div>
    </section>
  );
}

function StatusPanel({ heartbeat }: { heartbeat: ServerHeartbeat | null }) {
  const status = useMemo(() => {
    if (!heartbeat) {
      return { label: 'SERVER WAIT', online: false, time: 'Supabase 연결 대기' };
    }

    const lastSeen = new Date(heartbeat.last_seen_at);
    const online = heartbeat.status === 'online' && Date.now() - lastSeen.getTime() < 90_000;

    return {
      label: online ? 'SERVER ON' : 'SERVER OFF',
      online,
      time: lastSeen.toLocaleString('ko-KR')
    };
  }, [heartbeat]);

  return (
    <aside className="status-panel">
      <div className={`status-dot${status.online ? ' is-online' : ''}`} />
      <MonitorDot size={16} aria-hidden="true" />
      <strong>{status.label}</strong>
      <span>{status.time}</span>
    </aside>
  );
}

function SectionShell({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="section-shell">
      <div className="section-label"><span>{number}</span>{title}</div>
      {children}
    </section>
  );
}

function ProfileSummary() {
  return (
    <div className="profile-summary">
      <div className="avatar-panel" aria-hidden="true">
        <div className="avatar-scan" />
      </div>
      <div className="profile-copy">
        <p className="eyebrow">GAME PROGRAMMER</p>
        <h2>게임 프로그래머</h2>
        <p>플레이어에게 몰입감 있는 경험을 전달하기 위해 논리적인 시스템 설계와 구현에 집중합니다.</p>
        <div className="tag-list">
          {skillTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
      <div className="profile-facts">
        <InfoLine icon={<Terminal size={17} />} label="STACK" value="C++ / C# / UE5 / Unity" />
        <InfoLine icon={<MapPin size={17} />} label="LOCATION" value="Seoul, Korea" />
        <InfoLine icon={<Mail size={17} />} label="EMAIL" value="ornithopter@nate.com" />
      </div>
      <div className="skill-radar" aria-label="Skills overview">
        <span>SKILLS OVERVIEW</span>
        <div className="radar-shape" />
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="info-line">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PortfolioPreview({ onPortfolio }: { onPortfolio: () => void }) {
  return (
    <>
      <div className="preview-grid">
        {projects.map((project, index) => (
          <ProjectCard project={project} index={index} compact key={project.title} />
        ))}
      </div>
      <div className="section-action">
        <button type="button" className="text-link" onClick={onPortfolio}>전체 포트폴리오 보기 -&gt;</button>
      </div>
    </>
  );
}

function Portfolio() {
  return (
    <section className="page-section portfolio-page">
      <PageTitle eyebrow="PORTFOLIO" title="PORTFOLIO" description="지금까지 작업한 프로젝트들입니다." />

      <div className="filter-bar" aria-label="Project categories">
        {filterLabels.map((label, index) => (
          <button type="button" className={index === 0 ? 'is-active' : ''} key={label}>{label}</button>
        ))}
      </div>

      <div className="project-grid">
        {projects.concat(projects.slice(0, 2)).map((project, index) => (
          <ProjectCard project={project} index={index} key={`${project.title}-${index}`} />
        ))}
      </div>

      <div className="pagination" aria-label="Portfolio pages">
        <button type="button" aria-label="Previous page">&lt;</button>
        <button type="button" className="is-active">01</button>
        <button type="button">02</button>
        <button type="button">03</button>
        <button type="button" aria-label="Next page">&gt;</button>
      </div>
    </section>
  );
}

function ProjectCard({ project, index, compact = false }: { project: typeof projects[number]; index: number; compact?: boolean }) {
  const meta = projectMeta[index % projectMeta.length];

  return (
    <article className={`project-card ${compact ? 'is-compact' : ''}`}>
      <div className={`project-thumb ${meta.visual}`} aria-hidden="true">
        <span>{meta.category}</span>
      </div>
      <div className="project-card__body">
        <div className="card-meta">
          <span>{meta.category}</span>
          <time>{meta.year}</time>
        </div>
        <h2>Project : {project.title}</h2>
        <p>{project.summary}</p>
        <div className="tech-tags">
          {meta.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {!compact && <button type="button" className="card-button">VIEW DETAILS -&gt;</button>}
      </div>
    </article>
  );
}

function MessagePreview({ onMessages }: { onMessages: () => void }) {
  return (
    <div className="message-preview">
      <div className="terminal-form" aria-hidden="true">
        <div className="terminal-input">이름</div>
        <div className="terminal-input">이메일</div>
        <div className="terminal-input is-wide">제목</div>
        <div className="terminal-input is-message">메시지를 입력하세요.</div>
        <button type="button" className="primary-button">메시지 전송 <Send size={16} /></button>
      </div>
      <ContactInfoPanel />
      <button type="button" className="text-link mobile-only" onClick={onMessages}>메시지 페이지로 이동 -&gt;</button>
    </div>
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
      }, { onConflict: 'endpoint' });

      if (error) {
        throw new Error(`구독 정보 저장 실패: ${error.message}`);
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
    <section className="page-section message-page">
      <PageTitle eyebrow="GET IN TOUCH" title="GET IN TOUCH" description="협업 제안이나 작업 문의를 보내주세요." />

      <div className="contact-section">
        <ContactInfoPanel />

        <form className="message-form" onSubmit={handleSubmit}>
          <div className="form-pair">
            <label>
              이름
              <input placeholder="이름을 입력하세요" autoComplete="name" />
            </label>
            <label>
              이메일
              <input type="email" placeholder="Email" autoComplete="email" />
            </label>
          </div>
          <label>
            제목
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Subject" />
          </label>
          <label>
            메시지
            <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={8} placeholder="Message" />
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
              SEND MESSAGE
            </button>
          </div>
          {message && <p className="form-message">[OK] {message}</p>}
        </form>
      </div>
    </section>
  );
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-title">
      <p className="eyebrow"># {eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function ContactInfoPanel() {
  return (
    <aside className="contact-panel">
      <h2>연락 방법</h2>
      <p>빠른 확인을 위해 작업 내용을 함께 남겨주세요.</p>
      <InfoLine icon={<Mail size={17} />} label="EMAIL" value="ornithopter@nate.com" />
      <InfoLine icon={<MapPin size={17} />} label="LOCATION" value="Seoul, Korea" />
      <InfoLine icon={<Github size={17} />} label="GITHUB" value="github.com/Ornithopter83" />
      <InfoLine icon={<Linkedin size={17} />} label="LINKEDIN" value="LinkedIn" />
    </aside>
  );
}

function GameDemoPreview({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="game-preview">
      <aside className="demo-panel">
        <h2>DEMO PLAYGROUND</h2>
        <p>직접 플레이해보세요. 포트폴리오용 데모 시연을 실행합니다.</p>
        <button type="button" className="primary-button" onClick={onDemo}>데모 실행 <Play size={16} /></button>
        <small>W A S D 이동 / Enter 액션 / Mouse 시점</small>
      </aside>
      <div className="game-screen" aria-hidden="true">
        <div className="hud-line hp" />
        <div className="hud-line st" />
        <button type="button" className="play-orb" onClick={onDemo} aria-label="게임 시연 실행"><Play size={34} /></button>
        <div className="mini-map" />
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>&gt; Keep Coding, Keep Creating.</span>
      <span>Portfolio Launcher</span>
    </footer>
  );
}

function MatrixBackdrop() {
  return (
    <div className="matrix-backdrop" aria-hidden="true">
      <span>01001101</span>
      <span>10110100</span>
      <span>01101011</span>
      <span>11001010</span>
      <span>00110101</span>
      <span>10101100</span>
    </div>
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
          <h2 id="demo-launcher-title">게임 시연</h2>
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
