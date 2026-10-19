"""Build HTTP fixtures using actual backend schemas; no provider calls or DB writes."""
import copy
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "traceguard"))
from app.schemas.analyses import AnalysisRecord
from app.schemas.attributions import AttributionRecord
from app.schemas.generated_tests import GeneratedTestRecord
from app.schemas.regression_specs import RegressionRecord
from app.schemas.runs import RunSummary, RunLedgerItem, RunPage, DashboardSummary
from app.schemas.system import SystemInfo
from app.schemas.traces import CanonicalTrace
from app.schemas.validations import ValidationRecord

NOW = "2026-10-19T12:00:00Z"
def uid(n): return f"00000000-0000-0000-0000-{n:012d}"
META = dict(provider="openai", model="fixture-model", reasoning_effort="medium", prompt_version="attribution-v1",
    response_id=None, response_model=None, input_tokens=100, output_tokens=50, reasoning_tokens=10, latency_ms=120,
    input_sha256="a"*64, output_diagnostics=None, failure_code=None, failed_at=None, completed_at=NOW, created_at=NOW, updated_at=NOW)
def checked(schema, value): return schema.model_validate_json(json.dumps(value)).model_dump(mode="json")
trace = checked(CanonicalTrace, dict(source="controlled.calculator", task="Add two numbers", steps=[
    dict(sequence=0, agent_id="coordinator", event_type="agent_message", input="Add 2 and 3"),
    dict(sequence=1, agent_id="calculator", event_type="tool_call", input={"a":2,"b":3}, output=6, tool_name="add", tool_arguments={"a":2,"b":3}, tool_result=6, status="failed", occurred_at=NOW),
    dict(sequence=2, agent_id="coordinator", event_type="agent_message", output="6"),
]))
manifest = dict(visible_sequences=[0,1,2], truncated_sequences=[], omitted_ranges=[], statistics=dict(
    size_unit="utf8_bytes", budget=48000, reserved_headroom=4000, effective_budget=44000, original_step_count=3,
    selected_step_count=3, estimated_original_size=900, estimated_selected_size=900, pruning_occurred=False))
attribution = checked(AttributionRecord, dict(META, id=uid(3), run_id=uid(1), status="completed", decision="attributed",
    responsible_agent="calculator", decisive_sequence=1, failure_category="incorrect_result", explanation="The calculator returned an incorrect sum.",
    confidence="high", abstention_reason=None, evidence=[dict(start_sequence=1,end_sequence=1,reason="The result is inconsistent with the input.",contains_truncated=False)], context_manifest=manifest))
citation = dict(sequence=1, field="output", quote="6")
regression = checked(RegressionRecord, dict(META, id=uid(4), attribution_id=uid(3), status="completed",
    disposition="synthesizable", version="regression-spec-v1", title="Calculator preserves addition", target_agent="calculator", review_reason=None,
    spec=dict(version="regression-spec-v1",disposition="synthesizable",test_name="test_calculator_addition",title="Calculator preserves addition", target_agent="calculator", failure_summary="An incorrect sum was returned.",
        scenario=dict(stimulus=dict(sequence=1,field="input",path=[]),preconditions=[]),
        assertions=[dict(kind="equals",observable="output",path=[],expected=5,evidence=[citation])], evidence=[citation],review_reason=None),
    scenario_snapshot=dict(stimulus={"a":2,"b":3},preconditions=[])))
generated = checked(GeneratedTestRecord, dict(id=uid(5),regression_spec_id=uid(4),version="generated-test-v1",status="completed",framework="pytest",
    test_name="test_calculator_addition",compiler_version="pytest-compiler-v1",harness_identifier="controlled.calculator",harness_version="controlled-calculator-v1",
    source_code="def test_calculator_addition():\n    assert 2 + 3 == 5\n",source_digest="a"*64,failure_code=None,failed_at=None,completed_at=NOW,created_at=NOW,updated_at=NOW))
limits=dict(timeout_seconds=10,command_timeout_seconds=10,memory_mb=256,cpus=1,pids=32,tmp_mb=16,output_bytes=32768,result_bytes=32768,source_bytes=262144)
runtime=dict(image_reference="traceguard-validation:1",image_id="sha256:"+"b"*64,repository_digest=None,bundle_digest="c"*64,limits=limits)
def execution(variant, outcome):
    return dict(variant=variant,outcome=outcome,exit_code=0 if outcome=="passed" else 1 if outcome=="assertion_failed" else 2,
        duration_ms=25,passed=int(outcome=="passed"),failed=int(outcome=="assertion_failed"),errors=int(outcome=="execution_error"),timed_out=False,
        resource_limited=False,output_truncated=False,diagnostic={"passed":"PASS","assertion_failed":"REGRESSION_ASSERTION_FAILED","execution_error":"EXECUTION_ERROR"}[outcome],container_id="d"*64)
validation=checked(ValidationRecord,dict(id=uid(6),generated_test_id=uid(5),status="completed",validator_version="regression-validator-v1",
    source_digest="a"*64,compiler_version="pytest-compiler-v1",harness_identifier="controlled.calculator",harness_version="controlled-calculator-v1",
    image_reference="traceguard-validation:1",runtime_identity=runtime,verdict="valid",faulty_outcome="assertion_failed",corrected_outcome="passed",
    faulty_execution=execution("faulty","assertion_failed"),corrected_execution=execution("corrected","passed"),
    failure_code=None,completed_at=NOW,failed_at=None,created_at=NOW,updated_at=NOW))
run=checked(RunSummary,dict(id=uid(1),source="controlled.calculator",status="normalized",created_at=NOW,updated_at=NOW,failure_code=None,failed_at=None,normalized_step_count=3,
    analysis_id=uid(2),analysis_status="completed",analysis_stage="validation",analysis_stop_reason="valid",attribution_id=uid(3),attribution_status="completed",
    responsible_agent="calculator",decisive_sequence=1,confidence="high",regression_spec_id=uid(4),regression_disposition="synthesizable",generated_test_id=uid(5),
    validation_id=uid(6),validation_verdict="valid",needs_attention=False))
analysis=checked(AnalysisRecord,dict(id=uid(2),run_id=uid(1),status="completed",stage="validation",model="fixture-model",reasoning_effort="medium",
    attribution_id=uid(3),regression_spec_id=uid(4),generated_test_id=uid(5),validation_id=uid(6),stop_reason="valid",deadline_at="2026-10-19T13:00:00Z",finished_at=NOW,created_at=NOW,updated_at=NOW))
system=checked(SystemInfo,dict(environment="development",model="fixture-model",reasoning_effort="medium",attribution_prompt_version="attribution-v1",context_policy_version="phase3-structural-v1",
    regression_spec_version="regression-spec-v1",regression_prompt_version="regression-spec-v1",compiler_version="pytest-compiler-v1",validator_version="regression-validator-v1"))
base=dict(run=run,analysis=analysis,attribution=attribution,regression=regression,generated=generated,validation=validation,trace=trace,original={"task":"Add two numbers"},system=system)
cases={"complete":copy.deepcopy(base)}
for name in ["no-analysis","processing","attribution-only","abstain","review","compile-failed","inconclusive","not-reproduced","not-discriminating","failed"]:
    case=copy.deepcopy(base)
    a=case["analysis"]; r=case["run"]
    if name in ["no-analysis","processing","attribution-only","abstain","review","compile-failed","failed"]:
        case["validation"]=None; r["validation_id"]=None; r["validation_verdict"]=None; a["validation_id"]=None
    if name in ["no-analysis","processing","attribution-only","abstain","review","failed"]:
        case["generated"]=None; r["generated_test_id"]=None; a["generated_test_id"]=None
    if name in ["no-analysis","processing","attribution-only","abstain","failed"]:
        case["regression"]=None; r["regression_spec_id"]=None; r["regression_disposition"]=None; a["regression_spec_id"]=None
    if name in ["no-analysis","processing"]:
        case["attribution"]=None
        for key in ["attribution_id","attribution_status","responsible_agent","decisive_sequence","confidence"]: r[key]=None
        a["attribution_id"]=None
    if name=="no-analysis":
        case["analysis"]=None
        for key in ["analysis_id","analysis_status","analysis_stage","analysis_stop_reason"]: r[key]=None
    elif name in ["processing","attribution-only"]:
        a.update(status="active",stage="attribution" if name=="processing" else "regression_spec",stop_reason=None,finished_at=None)
    elif name=="abstain":
        case["attribution"].update(decision="abstain",responsible_agent=None,decisive_sequence=None,failure_category=None,abstention_reason="Ambiguous evidence.",evidence=[])
        r.update(responsible_agent=None,decisive_sequence=None)
        a.update(status="review_required",stage="attribution",stop_reason="attribution_abstained")
    elif name=="review":
        spec=case["regression"]; spec.update(disposition="needs_review",review_reason="Replay requires human review.",scenario_snapshot=None)
        spec["spec"].update(disposition="needs_review",scenario=None,assertions=[],review_reason="Replay requires human review.")
        r["regression_disposition"]="needs_review"
        a.update(status="review_required",stage="regression_spec",stop_reason="regression_needs_review")
    elif name=="compile-failed":
        case["generated"].update(status="failed",source_code=None,source_digest=None,completed_at=None,failed_at=NOW,failure_code="REPLAY_CONTRACT_INCOMPATIBLE")
        a.update(status="review_required",stage="compilation",stop_reason="REPLAY_CONTRACT_INCOMPATIBLE")
    elif name in ["inconclusive","not-reproduced","not-discriminating"]:
        verdict=name.replace("-","_")
        v=case["validation"]; faulty="passed" if name=="not-reproduced" else "assertion_failed"
        corrected="execution_error" if name=="inconclusive" else "assertion_failed" if name=="not-discriminating" else "passed"
        v.update(verdict=verdict,faulty_outcome=faulty,corrected_outcome=corrected,faulty_execution=execution("faulty",faulty),corrected_execution=execution("corrected",corrected))
        r["validation_verdict"]=verdict; a.update(status="review_required",stop_reason=verdict)
    elif name=="failed":
        case["attribution"].update(status="failed",decision=None,responsible_agent=None,decisive_sequence=None,failure_category=None,explanation=None,confidence=None,evidence=[],context_manifest=None,completed_at=None,failed_at=NOW,failure_code="PROVIDER_UNAVAILABLE")
        a.update(status="failed",stage="attribution",stop_reason="ANALYSIS_DEADLINE_EXCEEDED")
    if case["analysis"]:
        r.update(analysis_status=a["status"],analysis_stage=a["stage"],analysis_stop_reason=a["stop_reason"],needs_attention=a["status"] in ["review_required","failed"])
    cases[name]=case
pruned=copy.deepcopy(base)
pruned["attribution"]["context_manifest"].update(visible_sequences=[0,1],truncated_sequences=[0],omitted_ranges=[dict(start=2,end=2)])
pruned["attribution"]["context_manifest"]["statistics"].update(selected_step_count=2,estimated_selected_size=600,pruning_occurred=True)
cases["pruned"]=pruned
for case in cases.values():
    for key,schema in [("run",RunSummary),("analysis",AnalysisRecord),("attribution",AttributionRecord),("regression",RegressionRecord),("generated",GeneratedTestRecord),("validation",ValidationRecord)]:
        if case[key] is not None: case[key]=checked(schema,case[key])
ledger=[checked(RunLedgerItem,dict(run,id=uid(100+i),responsible_agent="calculator" if i%2==0 else None)) for i in range(45)]
result=dict(cases=cases,ledger=ledger)
target=Path(__file__).resolve().parents[1]/"tests/fixtures/api.json"
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(result,indent=2),encoding="utf-8")
print(f"Validated {len(cases)} cases and {len(ledger)} ledger records against backend schemas.")


