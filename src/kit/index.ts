/**
 * @seedstone/kit (internal layer) — the use-case toolkit. Depends only on core.
 * The functional `UseCase` contract every use case implements, plus a reusable
 * string→div renderer. No website/presentation concepts.
 */

import type { Traits } from "../core/index";
import type { UseCase } from "./contract";

export type { UseCase, Mounted, MountOptions, ControlBounds } from "./contract";
export { mountString } from "./mount-string";

/** Identity helper — declare a use case with full type inference. */
export function defineUseCase<T extends Traits, C>(useCase: UseCase<T, C>): UseCase<T, C> {
  return useCase;
}
