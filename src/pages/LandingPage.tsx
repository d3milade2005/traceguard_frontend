import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Check, Github } from 'lucide-react';
import { triggerGitHubSignIn } from '../api/auth';
import { useSession } from '../api/queries';
import { Brand, ThemeControl } from '../components/UI';
const pipeline = [
  ['Trace', 'Start with a failed execution.'],
  ['Find the responsible agent', 'Follow the decisive step and its evidence.'],
  ['Generate a regression', 'Turn the failure into an executable test.'],
  ['Verify the behavior', 'Check the faulty and corrected implementations.'],
];
export function LandingPage() {
  const { data: session } = useSession();
  return <div className="public-page">
    <header className="public-header"><Brand /><nav aria-label="Main navigation"><Link className="public-doc-link" to="/docs/introduction">Documentation</Link><ThemeControl /><Link className="button button-quiet" to={session ? '/dashboard' : '/login'}>{session ? 'Open workspace' : 'Sign in'}<ArrowRight size={14} /></Link></nav></header>
    <main id="main-content" className="landing-main">
      <section className="landing-intro"><p className="landing-eyebrow">Understand the failure. Keep the lesson.</p><h1>Failure attribution and regression synthesis for multi-agent systems.</h1><p className="landing-description">Find the agent and step behind a failed execution. Inspect the evidence, generate a regression test, and verify that it catches the faulty behavior.</p><div className="landing-actions"><button className="button button-primary" onClick={() => triggerGitHubSignIn('/dashboard')}><Github size={16} />Sign in with GitHub</button><Link className="text-link" to="/docs/introduction">Read documentation<ArrowRight size={14} /></Link></div></section>
      <section className="landing-explanation" aria-labelledby="pipeline-heading"><div><h2 id="pipeline-heading">From a failed run to a verified regression.</h2><p>One connected path from what went wrong to a test you can inspect.</p></div><ol>{pipeline.map(([title, description], i) => <li key={title}><div className="pipeline-index">{String(i + 1).padStart(2, '0')}</div><div><h3>{title}</h3><p>{description}</p></div>{i < pipeline.length - 1 && <ArrowDown size={13} className="landing-flow-arrow" aria-hidden="true" />}</li>)}</ol></section>
      <section className="landing-example" aria-labelledby="example-heading"><div className="example-caption"><h2 id="example-heading">A failure, made understandable</h2><span>Example run</span></div><div className="example-content"><div><p className="summary-label">Responsible agent · Step 14</p><h3>PlannerAgent</h3><p>The planner queried a rejected column after receiving a schema correction.</p><Link className="text-link next-action" to="/runs/run_9f82a4c1">Inspect the example<ArrowRight size={14} /></Link></div><div className="example-proof"><span><Check size={15} />Regression test generated</span><span><Check size={15} />Faulty behavior caught</span><span><Check size={15} />Corrected behavior passed</span></div></div></section>
    </main><footer className="public-footer"><Brand /><span>Clarity for complex executions.</span><Link to="/docs/introduction">Documentation</Link></footer>
  </div>;
}

