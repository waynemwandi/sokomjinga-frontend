<script lang="ts">
  import { onMount } from "svelte";
  import { toggleTheme } from "$lib/theme";
  import {
    CirclePlus,
    ChartNoAxesCombined,
    Info,
    LogOut,
    Menu,
    Moon,
    UserRound,
  } from "lucide-svelte";

  export let trigger: "menu" | "user" | "text" = "menu";
  export let label = "My Account";
  export let onHowItWorks: () => void = () => {};

  let openMenu = false;
  let isDark = false;

  onMount(() => {
    isDark = document.documentElement.classList.contains("dark");
  });

  const handleThemeToggle = () => {
    toggleTheme();
    isDark = document.documentElement.classList.contains("dark");
  };
</script>

<div class="relative">
  <button
    class={trigger === "text"
      ? "inline-flex text-xs text-muted-foreground hover:text-foreground"
      : "inline-flex items-center justify-center rounded-md border border-border bg-card p-2"}
    aria-label={trigger === "text" ? undefined : "Account"}
    aria-haspopup="menu"
    aria-expanded={openMenu}
    onclick={() => (openMenu = !openMenu)}
  >
    {#if trigger === "user"}
      <UserRound class="h-4 w-4" />
    {:else if trigger === "text"}
      {label}
    {:else}
      <Menu class="h-4 w-4" />
    {/if}
  </button>

  {#if openMenu}
    <div
      class="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg p-1 text-sm z-50"
      role="menu"
      tabindex="-1"
      onkeydown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          openMenu = false;
        }
      }}
      onfocusout={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (!el.contains(e.relatedTarget as Node)) openMenu = false;
      }}
    >
      <a
        href="/account"
        class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        role="menuitem"
        onclick={() => (openMenu = false)}
      >
        <UserRound class="h-4 w-4" />
        <span>Profile</span>
      </a>

      <a
        href="/portfolio"
        class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        role="menuitem"
        onclick={() => (openMenu = false)}
      >
        <ChartNoAxesCombined class="h-4 w-4" />
        <span>Portfolio</span>
      </a>

      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
        role="menuitem"
        onclick={() => {
          openMenu = false;
          onHowItWorks();
        }}
      >
        <Info class="h-4 w-4" />
        <span>How it works</span>
      </button>

      <a
        href="https://forms.gle/HEwNNnT6pSWZfaNT6"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        role="menuitem"
        onclick={() => (openMenu = false)}
      >
        <CirclePlus class="h-4 w-4" />
        <span>Suggest a market</span>
      </a>

      <div class="flex items-center justify-between px-3 py-2">
        <span class="flex items-center gap-2 text-sm">
          <Moon class="h-4 w-4" />
          Dark mode
        </span>

        <button
          type="button"
          aria-label="Toggle dark mode"
          class={`relative inline-flex h-6 w-11 items-center rounded-full border transition
            ${
              isDark
                ? "border-emerald-500 bg-emerald-500"
                : "border-border bg-muted"
            }`}
          onclick={handleThemeToggle}
        >
          <span
            class={`inline-block h-5 w-5 transform rounded-full bg-white transition
            ${isDark ? "translate-x-5" : "translate-x-1"}`}
          ></span>
        </button>
      </div>

      <div class="my-1 h-px bg-border/70"></div>

      <form method="post" action="/logout">
        <button
          type="submit"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-500 hover:bg-accent hover:text-red-600"
          role="menuitem"
        >
          <LogOut class="h-4 w-4" />
          <span>Logout</span>
        </button>
      </form>
    </div>
  {/if}
</div>
