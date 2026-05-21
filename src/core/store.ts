import type { InMemoryResourceStore } from "./resource-store";
import type { PostgresResourceStore } from "./postgres-store";

export type Store = InMemoryResourceStore | PostgresResourceStore;
