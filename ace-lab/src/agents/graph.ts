// Pseudocode wiring for agent flows
// graph Brief -> Architect -> Perf -> Policy -> UI
// graph MediaAnalyze -> Transition -> UI.timeline
// graph Telemetry -> Preset -> UI.presets
// graph ReleaseCandidate -> QA -> Policy.finalGate

export type Node<TIn, TOut> = (input: TIn) => Promise<TOut> | TOut;

export function sequence<A, B, C>(a: Node<A, B>, b: Node<B, C>): Node<A, C> {
	return async (input: A) => b(await a(input));
}


