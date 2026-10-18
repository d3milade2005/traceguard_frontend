import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Cpu, Github } from 'lucide-react';
import { triggerGitHubSignIn } from '../api/auth';
import { useSession } from '../api/queries';
import { Brand, ThemeControl } from '../components/UI';

interface PipelineStep {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  tag: string;
  agent: string;
  snippet: {
    label: string;
    content: string;
    meta: string;
  };
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 'trace',
    number: '01',
    title: 'Failed trace ingestion',
    shortDesc: 'Captures ordered multi-agent execution events, handoffs, and payload state.',
    tag: 'Step #14 · Failure',
    agent: 'PlannerAgent',
    snippet: {
      label: 'Canonical event #14 (PlannerAgent)',
      meta: 'Offset +520ms · Event: Tool call',
      content: `{\n  "agent": "PlannerAgent",\n  "action": "query_database",\n  "parameters": {\n    "query": "SELECT billing_tier_v2 FROM accounts WHERE id = :id"\n  },\n  "warning": "Column billing_tier_v2 rejected at Step #11 schema sync"\n}`,
    },
  },
  {
    id: 'attribution',
    number: '02',
    title: 'Root cause attribution',
    shortDesc: 'Pins the failure to a responsible agent, decisive sequence, and evidence range.',
    tag: 'Attributed · High confidence',
    agent: 'PlannerAgent',
    snippet: {
      label: 'Attribution outcome',
      meta: 'Decisive step: #14 · Evidence: #11..#14',
      content: `Responsible Agent: PlannerAgent\nDecisive Step:     #14\nConfidence:        High\nDiagnosis:         PlannerAgent generated a query referencing billing_tier_v2,\n                   ignoring the schema correction issued by SchemaRetriever at step #11.`,
    },
  },
  {
    id: 'synthesis',
    number: '03',
    title: 'Regression synthesis',
    shortDesc: 'Compiles an isolated, deterministic PyTest suite targeting the root cause.',
    tag: 'PyTest compiled',
    agent: 'PyTest Compiler',
    snippet: {
      label: 'test_planner_agent_seq_14_regression.py',
      meta: 'SHA-256: 7f81c9a0 · 14 lines',
      content: `def test_planner_agent_seq_14_regression():\n    harness = AgentHarness(schema_version="2026.10")\n    harness.apply_schema_correction(step=11, rejected_fields=["billing_tier_v2"])\n    result = harness.replay_step(agent="PlannerAgent", stimulus={"account_id": 904})\n    assert "billing_tier_v2" not in result.generated_query`,
    },
  },
  {
    id: 'validation',
    number: '04',
    title: 'Isolated validation',
    shortDesc: 'Verifies the test reproduces the failure and passes on corrected code.',
    tag: 'Valid regression',
    agent: 'Docker Sandbox',
    snippet: {
      label: 'Dual execution verdict',
      meta: 'Duration: 412ms · Exit code: 0',
      content: `Faulty implementation:    Failed as expected  [AssertionError]\nCorrected implementation: Passed as expected  [1 passed in 0.18s]\nVerdict:                  Valid regression generated`,
    },
  },
];

export function LandingPage() {
  const { data: session } = useSession();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStepIndex(prev => (prev + 1) % pipelineSteps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeStep = pipelineSteps[activeStepIndex];

  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <nav aria-label="Main navigation">
          <Link className="public-doc-link" to="/docs/introduction">Documentation</Link>
          <ThemeControl />
          <Link className="button button-quiet" to={session ? '/dashboard' : '/login'}>
            {session ? 'Open workspace' : 'Sign in'}
            <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <main id="main-content" className="landing-main">
        {/* Hero Section */}
        <section className="landing-intro">
          <div className="landing-pill">
            <span className="landing-pill-dot" aria-hidden="true" />
            <span>Developer forensics for multi-agent systems</span>
          </div>
          <h1>Find the agent and step that caused a multi-agent failure.</h1>
          <p className="landing-description">
            TraceGuard analyzes execution traces, pinpoints root causes with evidence,
            synthesizes deterministic pytest regressions, and verifies that fixes actually work.
          </p>
          <div className="landing-actions">
            <button className="button button-primary" onClick={() => triggerGitHubSignIn('/dashboard')}>
              <Github size={16} />
              Sign in with GitHub
            </button>
            <Link className="text-link" to="/docs/introduction">
              Read documentation
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Dynamic Interactive Pipeline Explanation */}
        <section className="interactive-showcase" aria-labelledby="pipeline-heading" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="showcase-header">
            <div>
              <h2 id="pipeline-heading">From failed run to verified regression</h2>
              <p>Explore how TraceGuard turns raw agent failures into deterministic tests.</p>
            </div>
            <div className="showcase-status">
              <span className="status-dot status-pulse" aria-hidden="true" />
              <span>Interactive simulation · Select any phase</span>
            </div>
          </div>

          <div className="showcase-grid">
            {/* Step Selection Tabs */}
            <div className="showcase-steps-nav" role="tablist" aria-label="Pipeline stages">
              {pipelineSteps.map((step, idx) => {
                const isCurrent = idx === activeStepIndex;
                return (
                  <button
                    key={step.id}
                    role="tab"
                    id={`tab-${step.id}`}
                    aria-selected={isCurrent}
                    aria-controls={`panel-${step.id}`}
                    className={`showcase-step-btn ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      setIsPaused(true);
                    }}
                  >
                    <div className="step-btn-top">
                      <span className="step-num">{step.number}</span>
                      <span className="step-badge">{step.tag}</span>
                    </div>
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.shortDesc}</div>
                    {isCurrent && <div className="step-active-bar" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {/* Live Forensic Terminal / Code Panel */}
            <div className="showcase-viewport" id={`panel-${activeStep.id}`} role="tabpanel" aria-labelledby={`tab-${activeStep.id}`}>
              <div className="terminal-bar">
                <div className="terminal-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="terminal-title">{activeStep.snippet.label}</div>
                <div className="terminal-meta">{activeStep.snippet.meta}</div>
              </div>
              <div className="terminal-body">
                <pre className="terminal-pre">
                  <code>{activeStep.snippet.content}</code>
                </pre>
              </div>
              <div className="terminal-footer">
                <div className="terminal-agent">
                  <Cpu size={13} className="text-muted" />
                  <span>Subsystem: <strong>{activeStep.agent}</strong></span>
                </div>
                <Link to="/runs/run_9f82a4c1" className="terminal-action">
                  Inspect in workspace
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Product Preview Card */}
        <section className="landing-example" aria-labelledby="example-heading">
          <div className="example-caption">
            <h2 id="example-heading">Forensic clarity in action</h2>
            <span>Example diagnosis: run_9f82a4c1</span>
          </div>
          <div className="example-card">
            <div className="example-main-panel">
              <div className="example-meta-bar">
                <span className="example-pill">Responsible agent</span>
                <span className="muted metadata">Decisive sequence #14</span>
              </div>
              <h3>PlannerAgent</h3>
              <p className="example-summary-text">
                Queried a rejected column after receiving a schema correction from SchemaRetriever.
                TraceGuard isolated the exact step, generated a reproduction test, and confirmed the fix.
              </p>
              <div className="example-actions-row">
                <Link className="button button-quiet" to="/runs/run_9f82a4c1">
                  Inspect full run
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="example-proof-panel">
              <div className="proof-heading">Verification proof</div>
              <div className="proof-item proof-success">
                <Check size={15} />
                <span>Deterministic regression synthesized</span>
              </div>
              <div className="proof-item proof-success">
                <Check size={15} />
                <span>Faulty implementation failed as expected</span>
              </div>
              <div className="proof-item proof-success">
                <Check size={15} />
                <span>Corrected implementation passed cleanly</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <Brand />
        <span>Deterministic regression verification for multi-agent systems.</span>
        <div className="footer-links">
          <Link to="/docs/introduction">Documentation</Link>
          <Link to="/system">System</Link>
        </div>
      </footer>
    </div>
  );
}

