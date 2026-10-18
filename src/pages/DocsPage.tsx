import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { useSession } from '../api/queries';
import { Brand, CodeBlock, ThemeControl } from '../components/UI';

const unavailable: Record<string, string> = {
  runs: 'Runs', 'canonical-traces': 'Canonical traces', 'analysis-context': 'Analysis context',
  attribution: 'Attribution', 'regression-spec': 'Regression specification', 'generated-tests': 'Generated tests',
  validation: 'Validation', 'trace-ingestion': 'Trace ingestion', normalization: 'Normalization',
  'context-management': 'Context management', 'failure-attribution': 'Failure attribution',
  'regression-synthesis': 'Regression synthesis', 'pytest-compilation': 'Pytest compilation',
  'isolated-validation': 'Isolated validation', 'api-runs': 'Runs API', 'api-attribution': 'Attribution API',
  'api-validation': 'Validations API', 'who-and-when': 'Who & when attribution', 'docker-sandbox': 'Docker sandbox isolation',
};
const navigation = [{ slug: 'introduction', title: 'Introduction' }, { slug: 'quick-start', title: 'Quick start' }];
const introductionToc = [{ id: 'overview', label: 'Overview' }, { id: 'execution-pipeline', label: 'Execution pipeline' }, { id: 'design-guarantees', label: 'Design guarantees' }];
const quickStartToc = [{ id: 'ingest-trace', label: 'Ingest a failed trace' }, { id: 'inspect-attribution', label: 'Inspect attribution' }, { id: 'verify-pytest', label: 'Verify the regression' }];
function Introduction() {
  return <><section id="overview"><h2>Overview</h2><p>Multi-agent systems fail through cascading state mutations, schema drift across agent handoffs, and ignored tool diagnostics. TraceGuard turns raw failed multi-agent traces into attributed root causes and verified pytest regression tests.</p></section>
    <section id="execution-pipeline"><h2>Execution pipeline</h2><p>Each run follows seven stages, from the original trace to a checked regression.</p><div className="docs-pipeline">Trace <span>→</span> Normalize <span>→</span> Context <span>→</span> Attribution <span>→</span> Regression <span>→</span> Test <span>→</span> Validation</div>
      <ul><li><strong>Canonical normalization.</strong> Converts framework-specific events into a strictly ordered sequence ledger (<code>#01..#N</code>).</li><li><strong>Context preparation.</strong> Prepares a bounded analysis window with explicit UTF-8 byte truncation and omission tracking.</li><li><strong>Failure attribution.</strong> Identifies the responsible agent, a single <code>decisive_sequence</code>, confidence (<code>low | medium | high</code>), and supporting evidence ranges.</li><li><strong>Regression synthesis.</strong> Describes the scenario and assertions, then compiles an executable pytest test.</li><li><strong>Isolated validation.</strong> Checks that the test fails on the faulty replay and passes on the corrected replay.</li></ul>
    </section><section id="design-guarantees"><h2>Design guarantees</h2><p>TraceGuard keeps the original trace, canonical sequence, context omissions, attribution evidence, generated source, and validation outcomes available for inspection.</p><p>Private model chain-of-thought, secret credentials, and unbounded sandbox environment dumps are never exposed in the workspace.</p></section><Link className="docs-next" to="/docs/quick-start"><span>Next<span>Quick start</span></span><ArrowRight size={18} /></Link></>;
}
function QuickStart() {
  return <><section id="ingest-trace"><h2>1. Ingest a failed trace</h2><p>Submit a failed execution trace payload to the TraceGuard ingestion endpoint:</p><CodeBlock label="Trace ingestion command" source={`curl -X POST http://localhost:8000/api/v1/runs \\
  -H "Content-Type: application/json" \\
  -d @failed_multi_agent_trace.json`} /></section>
    <section id="inspect-attribution"><h2>2. Inspect attribution and context</h2><p>Open <code>/runs/:runId</code>. Start with the responsible agent and explanation, then follow the decisive step into the trace.</p><p>Use the evidence links to inspect supporting steps. Select Context in the pipeline to review the model's analysis window, omitted ranges, and exact byte sizes.</p></section>
    <section id="verify-pytest"><h2>3. Verify the regression</h2><p>Open Validation and confirm that the run has a <strong>Valid regression</strong>: the faulty implementation failed as expected, and the corrected implementation passed.</p><p>Inspect the execution details when either result needs review. Open Generated test to copy or download the source for your repository's test suite.</p><p>The raw backend verdict remains <code>validated</code>; the workspace presents a human-readable label.</p></section></>;
}
export function DocsPage() {
  const { slug = 'introduction' } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => setMobileNavOpen(false), [slug]);
  const available = slug === 'introduction' || slug === 'quick-start';
  const toc = slug === 'introduction' ? introductionToc : quickStartToc;
  const title = slug === 'introduction' ? 'Introduction to TraceGuard' : slug === 'quick-start' ? 'Quick start' : unavailable[slug] ?? 'Documentation';
  const nav = <nav aria-label="Documentation"><p className="docs-nav-label">Getting started</p>{navigation.map(item => <NavLink key={item.slug} to={`/docs/${item.slug}`} onClick={() => setMobileNavOpen(false)}>{item.title}</NavLink>)}</nav>;
  return <div className="docs-page"><a href="#main-content" className="skip-link">Skip to article</a><header className="docs-header"><div><button className="icon-button mobile-menu-button" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Toggle documentation menu" aria-expanded={mobileNavOpen}>{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}</button><Brand /><span className="docs-header-label">/ &nbsp; Documentation</span></div><nav aria-label="Workspace"><Link className="text-link" to={session ? '/dashboard' : '/login'}><ArrowLeft size={14} /><span>{session ? 'Workspace' : 'Sign in'}</span></Link><ThemeControl /></nav></header>
    {mobileNavOpen && <div className="docs-mobile-navigation">{nav}</div>}
    <div className="docs-layout"><aside className="docs-sidebar">{nav}</aside><main id="main-content" className="docs-main" tabIndex={-1}><article className="doc-article"><header><p className="docs-category">Getting started</p><h1>{title}</h1><p>{slug === 'introduction' ? 'Understand failed multi-agent runs and turn their failures into verified regression tests.' : slug === 'quick-start' ? 'Follow a failed trace from ingestion to a checked regression.' : 'This article is not available yet.'}</p></header>
      {available ? slug === 'introduction' ? <Introduction /> : <QuickStart /> : <p>Continue with the <Link to="/docs/introduction">introduction</Link> or <Link to="/docs/quick-start">quick start</Link>.</p>}
    </article></main><aside className="docs-toc">{available && <nav aria-label="On this page"><p>On this page</p>{toc.map(item => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>}</aside></div>
  </div>;
}

