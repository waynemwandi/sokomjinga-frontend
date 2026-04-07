// src/lib/stores/portfolio.ts
import { writable } from "svelte/store";

export const portfolio = writable<number>(0);
