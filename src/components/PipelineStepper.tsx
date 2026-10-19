import { Check, Circle, LoaderCircle, X, CircleAlert } from 'lucide-react';
import { PipelineStageKey, PipelineStageState } from '../types/api';
import { stageLabels, STATUS } from './StatusText';
export function PipelineStepper({ stages, activeStage, onSelectStage }: { stages: PipelineStageState[]; activeStage: PipelineStageKey; onSelectStage: (stage: PipelineStageKey) => void }) {
  return <nav className="pipeline" aria-label="Run pipeline"><ol>{stages.map((stage, index) => <li key={stage.key}>
    {index > 0 && <span className="pipeline-connector" aria-hidden="true"/>}
    <button className={`pipeline-step ${activeStage === stage.key ? 'selected' : ''} pipeline-${stage.status} ${stage.status === 'processing' ? 'pipeline-running' : ''}`} onClick={() => onSelectStage(stage.key)} aria-current={activeStage === stage.key ? 'step' : undefined} title={`${stageLabels[stage.key]} · ${STATUS[stage.status]?.label}`}>
      {stage.status === 'completed' ? <Check size={12}/> : stage.status === 'failed' ? <X size={12}/> : stage.status === 'review_required' ? <CircleAlert size={12}/> : stage.status === 'processing' ? <LoaderCircle size={12}/> : <Circle size={10}/>}
      <span>{stageLabels[stage.key]}</span><span className="sr-only">: {STATUS[stage.status]?.label}</span>
    </button>
  </li>)}</ol></nav>;
}
