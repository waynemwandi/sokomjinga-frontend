<!-- src/routes/(app)/admin/markets/+page.svelte -->
<script lang="ts">
  import { MarketQuestions, Markets } from "$lib/api";
  import { CircleAlert } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  export let data: {
    accessToken?: string | null;
    markets: any[];
    questions: any[];
  };

  const accessToken = (data.accessToken ?? undefined) as string | undefined;

  type Outcome = { id: string; label: string; price_cents?: number };
  type Market = {
    id: string;
    title: string;
    image_url?: string | null;
    category?: string | null;
    description?: string | null;
    status?: "open" | "closed" | "settled";
    close_at?: string | null;
    projected_end_date?: string | null;
    created_at?: string;
    updated_at?: string;
    is_archived?: boolean;
    outcomes?: Outcome[];
    [key: string]: unknown;
  };

  let showCreate = false;
  let showCreateQuestion = false;
  let newTitle = "";
  let newDescription = "";
  let newImageUrl = "";
  let newCategory = "";
  let isMultiQuestion = false;
  $: markets = (data.markets ?? []) as Market[];
  $: questions = data.questions ?? [];
  let loading = false;
  let error: string | null = null;
  let creating = false;
  let creatingQuestion = false;
  let updating = false;
  let settling = false;
  let busyMarketId: string | null = null;
  let busyAction: "archive" | "close" | null = null;
  let newProjectedEndDate = "";
  let editProjectedEndDate = "";
  let questionTitle = "";
  let questionDescription = "";
  let questionImageUrl = "";
  let questionCategory = "";
  let questionProjectedEndDate = "";
  let questionOptions = ["", ""];

  // Settlement modal state
  let settleOpen = false;
  let settleMarket: Market | null = null;
  let selectedOutcomeId: string | null = null;

  let q = "";
  let onlyOpen = false;
  let archiveFilter: "visible" | "archived" | "all" = "visible";
  let activeView: "single" | "multi" =
    (data.markets ?? []).length === 0 && (data.questions ?? []).length > 0
      ? "multi"
      : "single";

  async function onClose(m: Market) {
    if (busyMarketId) return;
    const ok = confirm(
      `Close market “${m.title}”? This will prevent further trading.`,
    );
    if (!ok) return;
    busyMarketId = m.id;
    busyAction = "close";
    try {
      await Markets.close(m.id, accessToken);
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Close failed");
    } finally {
      busyMarketId = null;
      busyAction = null;
    }
  }

  async function onArchive(m: Market) {
    if (busyMarketId) return;
    const nextArchived = !m.is_archived;
    const action = nextArchived ? "Archive" : "Unarchive";
    const impact = nextArchived
      ? "It will be hidden from the public home page, but direct links and portfolio history will still work."
      : "It will appear on the public home page again.";
    const ok = confirm(`${action} market "${m.title}"? ${impact}`);
    if (!ok) return;

    busyMarketId = m.id;
    busyAction = "archive";
    try {
      await Markets.update(m.id, { is_archived: nextArchived }, accessToken);
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || `${action} failed`);
    } finally {
      busyMarketId = null;
      busyAction = null;
    }
  }

  // async function onDelete(m: Market) {
  //   const ok = confirm(
  //     `Delete market “${m.title}”? This action cannot be undone.`,
  //   );
  //   if (!ok) return;
  //   try {
  //     await Markets.del(m.id, accessToken);
  //     await invalidateAll();
  //   } catch (e: any) {
  //     alert(e?.message || "Delete failed");
  //   }
  // }

  async function createMarket() {
    if (creating) return;

    if (!newTitle.trim()) {
      alert("Title is required");
      return;
    }

    const options = questionOptions.map((value) => value.trim()).filter(Boolean);
    if (isMultiQuestion && options.length < 2) {
      alert("Add at least two options");
      return;
    }

    creating = true;
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        image_url: newImageUrl.trim() || null,
        category: newCategory.trim() || null,
        projected_end_date: newProjectedEndDate || null,
        status: "open",
      };

      if (isMultiQuestion) {
        await MarketQuestions.create(
          {
            ...payload,
            options: options.map((label, order) => ({ label, order })),
          },
          accessToken,
        );
      } else {
        await Markets.create(payload, accessToken);
      }
      showCreate = false;
      newTitle = "";
      newDescription = "";
      newImageUrl = "";
      newCategory = "";
      newProjectedEndDate = "";
      isMultiQuestion = false;
      questionOptions = ["", ""];
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      creating = false;
    }
  }

  function addQuestionOption() {
    questionOptions = [...questionOptions, ""];
  }

  function removeQuestionOption(index: number) {
    if (questionOptions.length <= 2) return;
    questionOptions = questionOptions.filter((_, i) => i !== index);
  }

  async function createQuestion() {
    if (creatingQuestion) return;
    const options = questionOptions.map((value) => value.trim()).filter(Boolean);
    if (!questionTitle.trim()) {
      alert("Question title is required");
      return;
    }
    if (options.length < 2) {
      alert("Add at least two options");
      return;
    }

    creatingQuestion = true;
    try {
      await MarketQuestions.create(
        {
          title: questionTitle.trim(),
          description: questionDescription.trim() || null,
          image_url: questionImageUrl.trim() || null,
          category: questionCategory.trim() || null,
          projected_end_date: questionProjectedEndDate || null,
          options: options.map((label, order) => ({ label, order })),
          status: "open",
        },
        accessToken,
      );
      showCreateQuestion = false;
      questionTitle = "";
      questionDescription = "";
      questionImageUrl = "";
      questionCategory = "";
      questionProjectedEndDate = "";
      questionOptions = ["", ""];
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Create question failed");
    } finally {
      creatingQuestion = false;
    }
  }

  async function updateQuestionStatus(question: any, status: string) {
    if (!confirm(`${status === "closed" ? "Close" : "Update"} question "${question.title}"?`)) {
      return;
    }
    try {
      await MarketQuestions.update(question.id, { status }, accessToken);
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Question update failed");
    }
  }

  async function archiveQuestion(question: any) {
    const nextArchived = !question.is_archived;
    try {
      await MarketQuestions.update(
        question.id,
        { is_archived: nextArchived },
        accessToken,
      );
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Question archive failed");
    }
  }

  $: filtered = markets
    .filter((m) => (onlyOpen ? (m.status ?? "open") === "open" : true))
    .filter((m) => {
      if (archiveFilter === "all") return true;
      if (archiveFilter === "archived") return Boolean(m.is_archived);
      return !m.is_archived;
    })
    .filter((m) =>
      q ? m.title?.toLowerCase().includes(q.toLowerCase()) : true,
    );

  $: filteredQuestions = questions
    .filter((question) =>
      onlyOpen ? (question.status ?? "open") === "open" : true,
    )
    .filter((question) => {
      if (archiveFilter === "all") return true;
      if (archiveFilter === "archived") return Boolean(question.is_archived);
      return !question.is_archived;
    })
    .filter((question) => {
      if (!q) return true;
      const query = q.toLowerCase();
      const titleMatch = question.title?.toLowerCase().includes(query);
      const optionMatch = (question.options ?? []).some((option: any) =>
        option.label?.toLowerCase().includes(query),
      );
      return titleMatch || optionMatch;
    });

  let editOpen = false;
  let edit: Market | null = null;
  let editTitle = "";
  let editDescription = "";
  let editImageUrl = "";
  let editCategory = "";

  function onEdit(m: Market) {
    edit = m;
    editTitle = m.title ?? "";
    editDescription = (m.description as string) ?? "";
    editImageUrl = (m.image_url as string) ?? "";
    editCategory = (m.category as string) ?? "";
    editProjectedEndDate = m.projected_end_date
      ? m.projected_end_date.slice(0, 16)
      : "";
    editOpen = true;
  }

  async function updateMarket() {
    if (!edit || updating) return;

    updating = true;
    try {
      await Markets.update(
        edit.id,
        {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          image_url: editImageUrl.trim() || null,
          category: editCategory.trim() || null,
          projected_end_date: editProjectedEndDate || null,
        },
        accessToken,
      );
      editOpen = false;
      edit = null;
      await invalidateAll();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      updating = false;
    }
  }

  function onSettle(m: Market) {
    settleMarket = m;
    const yes = m.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
    selectedOutcomeId = yes?.id ?? m.outcomes?.[0]?.id ?? null;
    settleOpen = true;
  }

  async function confirmSettlement() {
    if (settling) return;

    if (!settleMarket || !selectedOutcomeId) {
      alert("Please select a winning outcome.");
      return;
    }

    const ok = confirm(
      `Are you sure you want to settle “${settleMarket.title}”? This action cannot be undone.`,
    );
    if (!ok) return;

    settling = true;
    try {
      await Markets.settle(settleMarket.id, selectedOutcomeId, accessToken);
      settleOpen = false;
      settleMarket = null;
      selectedOutcomeId = null;
      await invalidateAll();
    } catch (e: any) {
      if (e?.message?.includes("No bets")) {
        alert("This market has no bets and cannot be settled.");
      } else {
        alert(e?.message || "Settlement failed");
      }
    } finally {
      settling = false;
    }
  }

  function formatDateTime(value?: string) {
    if (!value) return "—";

    const d = new Date(value);

    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = String(d.getFullYear()).slice(-2);

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  }

  function formatDate(value?: string) {
    if (!value) return "—";

    const d = new Date(value);

    const day = String(d.getDate()).padStart(2, "0");

    const month = d.toLocaleString("en-GB", {
      month: "short",
    });

    const year = String(d.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
  }

  let refreshing = false;

  async function refreshPage() {
    refreshing = true;
    await invalidateAll();
    refreshing = false;
  }

  let page = 1;
  let pageSize = 8;

  $: activeCount = activeView === "multi" ? filteredQuestions.length : filtered.length;
  $: totalPages = Math.max(1, Math.ceil(activeCount / pageSize));
  $: paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  $: paginatedQuestions = filteredQuestions.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Prevent landing on empty pages
  $: if (page > totalPages) page = totalPages;

  // Reset to first page on new search or filter
  $: (filtered, filteredQuestions, activeView, (page = 1));
</script>

<div class="space-y-6">
<!-- ===========================
  Header Row
=========================== -->
<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Markets</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Create, archive, close and settle prediction markets.
    </p>
  </div>

  <div class="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
    <!-- Search -->
    <input
      bind:value={q}
      placeholder="Search markets…"
      class="admin-control w-full lg:w-80"
      aria-label="Search markets"
    />

    <!-- Only open checkbox -->
    <label class="admin-button inline-flex items-center gap-2">
      <input
        type="checkbox"
        bind:checked={onlyOpen}
        class="rounded border-border bg-input"
      />
      Only open
    </label>

    <select
      bind:value={archiveFilter}
      class="admin-control"
      aria-label="Archive filter"
    >
      <option value="visible">Visible</option>
      <option value="archived">Archived</option>
      <option value="all">All</option>
    </select>

    <!-- Refresh button -->
    <button
      class="admin-button"
      on:click={refreshPage}
    >
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>

    <button
      class="admin-button-primary"
      on:click={() => (showCreate = true)}
    >
      + New Market
    </button>
  </div>
</div>

<div class="grid gap-3 sm:grid-cols-2">
  <button
    type="button"
    class={`admin-panel p-4 text-left transition ${
      activeView === "single" ? "border-primary/60 bg-primary/5" : "hover:border-primary/40"
    }`}
    on:click={() => (activeView = "single")}
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold">Single markets</div>
        <div class="mt-1 text-xs text-muted-foreground">
          Traditional Yes/No markets
        </div>
      </div>
      <div class="rounded-md bg-input px-3 py-1 text-sm font-semibold">
        {markets.length}
      </div>
    </div>
    <div class="mt-3 text-xs text-muted-foreground">
      {filtered.length} matching current filters
    </div>
  </button>

  <button
    type="button"
    class={`admin-panel p-4 text-left transition ${
      activeView === "multi" ? "border-primary/60 bg-primary/5" : "hover:border-primary/40"
    }`}
    on:click={() => (activeView = "multi")}
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold">Multi-option questions</div>
        <div class="mt-1 text-xs text-muted-foreground">
          One question with grouped Yes/No options
        </div>
      </div>
      <div class="rounded-md bg-input px-3 py-1 text-sm font-semibold">
        {questions.length}
      </div>
    </div>
    <div class="mt-3 text-xs text-muted-foreground">
      {filteredQuestions.length} matching current filters
    </div>
  </button>
</div>

<!-- ===========================
  Create Market Modal
=========================== -->
{#if showCreate}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (showCreate = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (showCreate = false)}
    ></button>

    <div
      class="relative w-full max-w-3xl rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Create Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <!-- Modal header -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Create Market</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (showCreate = false)}
        >
          Close
        </button>
      </div>

      <!-- Modal form -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Left: fields -->
        <div class="space-y-3">
          <div class="grid gap-1.5">
            <label for="new-title" class="text-xs text-muted-foreground"
              >Title *</label
            >
            <input
              id="new-title"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newTitle}
              placeholder="e.g. Will BTC close above $100k by year-end?"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="new-category" class="text-xs text-muted-foreground"
              >Category</label
            >
            <input
              id="new-category"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newCategory}
              placeholder="e.g. Politics, Sports, Markets, Tech"
              list="market-categories"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="new-description" class="text-xs text-muted-foreground"
              >Description</label
            >
            <textarea
              id="new-description"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              rows="4"
              bind:value={newDescription}
              placeholder="Optional context shown to traders"
            ></textarea>
          </div>

          <div class="grid gap-1.5">
            <label for="new-image-url" class="text-xs text-muted-foreground"
              >Image URL</label
            >
            <input
              id="new-image-url"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newImageUrl}
              placeholder="https://…"
            />
          </div>

          <div class="grid gap-1.5">
            <label
              for="new-projected-end"
              class="text-xs text-muted-foreground"
            >
              Projected end date
            </label>
            <input
              id="new-projected-end"
              type="date"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newProjectedEndDate}
            />
          </div>

          <label class="admin-button inline-flex items-center gap-2">
            <input
              type="checkbox"
              bind:checked={isMultiQuestion}
              class="rounded border-border bg-input"
            />
            Multi-option question
          </label>

          {#if isMultiQuestion}
            <div class="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <div class="text-sm font-medium">Options</div>
                <p class="text-xs text-muted-foreground">
                  Each option becomes a separate Yes/No market under this question.
                </p>
              </div>

              {#each questionOptions as option, i}
                <div class="flex gap-2">
                  <input
                    class="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
                    bind:value={questionOptions[i]}
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    type="button"
                    class="admin-button px-3"
                    on:click={() => removeQuestionOption(i)}
                    disabled={questionOptions.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              {/each}

              <button
                type="button"
                class="admin-button"
                on:click={addQuestionOption}
              >
                + Add option
              </button>
            </div>
          {/if}
        </div>

        <!-- Right: preview -->
        <div class="rounded-lg border border-border bg-muted/30 p-3">
          <div class="text-xs mb-2 text-muted-foreground">Preview</div>
          <div class="rounded-lg overflow-hidden border border-border bg-card">
            {#if newImageUrl.trim()}
              <img
                src={newImageUrl}
                alt="Market preview"
                class="h-40 w-full object-cover"
                on:error={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display =
                    "none")}
              />
            {/if}
            <div class="p-3 space-y-1.5">
              <div class="text-sm font-medium">
                {newTitle || "Untitled market"}
              </div>
              {#if isMultiQuestion}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each questionOptions.filter(Boolean) as option}
                    <span class="inline-flex items-center rounded bg-input px-2 py-0.5 text-xs">
                      {option}
                    </span>
                  {/each}
                </div>
              {/if}
              {#if newCategory}
                <span
                  class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs bg-primary/10 text-primary"
                >
                  {newCategory}
                </span>
              {/if}
              {#if newDescription}
                <p class="text-xs text-muted-foreground line-clamp-3">
                  {newDescription}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
            on:click={() => (showCreate = false)}
          >
            Cancel
          </button>
          <button
            class="action-button action-button-primary px-3 py-1.5"
            on:click={createMarket}
            disabled={!newTitle.trim() || creating}
          >
            {#if creating}<span class="action-spinner"></span>{/if}
            {creating ? "Creating..." : isMultiQuestion ? "Create Question" : "Create"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ===========================
  Create Question Modal
=========================== -->
{#if showCreateQuestion}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (showCreateQuestion = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (showCreateQuestion = false)}
    ></button>

    <div
      class="relative w-full max-w-4xl rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Create Multi-option Question"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Create Multi-option Question</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (showCreateQuestion = false)}
        >
          Close
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-3">
          <div class="grid gap-1.5">
            <label for="question-title" class="text-xs text-muted-foreground">
              Question *
            </label>
            <input
              id="question-title"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={questionTitle}
              placeholder="e.g. What will WTI Crude Oil hit in May 2026?"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="question-category" class="text-xs text-muted-foreground">
              Category
            </label>
            <input
              id="question-category"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={questionCategory}
              list="market-categories"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="question-description" class="text-xs text-muted-foreground">
              Description
            </label>
            <textarea
              id="question-description"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              rows="3"
              bind:value={questionDescription}
            ></textarea>
          </div>

          <div class="grid gap-1.5">
            <label for="question-image-url" class="text-xs text-muted-foreground">
              Image URL
            </label>
            <input
              id="question-image-url"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={questionImageUrl}
              placeholder="https://..."
            />
          </div>

          <div class="grid gap-1.5">
            <label for="question-projected-end" class="text-xs text-muted-foreground">
              Projected end date
            </label>
            <input
              id="question-projected-end"
              type="date"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={questionProjectedEndDate}
            />
          </div>
        </div>

        <div class="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <div class="text-sm font-medium">Options</div>
            <p class="text-xs text-muted-foreground">
              Each option becomes its own Yes/No market with KES 1 display-only starter liquidity per side.
            </p>
          </div>

          {#each questionOptions as option, i}
            <div class="flex gap-2">
              <input
                class="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
                bind:value={questionOptions[i]}
                placeholder={`Option ${i + 1}`}
              />
              <button
                type="button"
                class="admin-button px-3"
                on:click={() => removeQuestionOption(i)}
                disabled={questionOptions.length <= 2}
              >
                Remove
              </button>
            </div>
          {/each}

          <button type="button" class="admin-button" on:click={addQuestionOption}>
            + Add option
          </button>
        </div>

        <div class="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
            on:click={() => (showCreateQuestion = false)}
          >
            Cancel
          </button>
          <button
            class="action-button action-button-primary px-3 py-1.5"
            on:click={createQuestion}
            disabled={!questionTitle.trim() || creatingQuestion}
          >
            {#if creatingQuestion}<span class="action-spinner"></span>{/if}
            {creatingQuestion ? "Creating..." : "Create Question"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ===========================
  Edit Market Modal
=========================== -->
{#if editOpen && edit}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (editOpen = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (editOpen = false)}
    ></button>

    <div
      class="relative w-full max-w-3xl rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <!-- Modal header -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Edit Market</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (editOpen = false)}
        >
          Close
        </button>
      </div>

      <!-- Modal form -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Left: fields -->
        <div class="space-y-3">
          <div class="grid gap-1.5">
            <label for="edit-title" class="text-xs text-muted-foreground"
              >Title *</label
            >
            <input
              id="edit-title"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editTitle}
            />
          </div>

          <div class="grid gap-1.5">
            <label for="edit-category" class="text-xs text-muted-foreground"
              >Category</label
            >
            <input
              id="edit-category"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editCategory}
              list="market-categories"
              placeholder="e.g. Politics, Sports, Markets, Tech"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="edit-description" class="text-xs text-muted-foreground"
              >Description</label
            >
            <textarea
              id="edit-description"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              rows="4"
              bind:value={editDescription}
            ></textarea>
          </div>

          <div class="grid gap-1.5">
            <label for="edit-image-url" class="text-xs text-muted-foreground"
              >Image URL</label
            >
            <input
              id="edit-image-url"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editImageUrl}
              placeholder="https://…"
            />
          </div>

          <div class="grid gap-1.5">
            <label
              for="edit-projected-end"
              class="text-xs text-muted-foreground"
            >
              Projected end date
            </label>
            <input
              id="edit-projected-end"
              type="date"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editProjectedEndDate}
            />
          </div>
        </div>

        <!-- Right: preview -->
        <div class="rounded-lg border border-border bg-muted/30 p-3">
          <div class="text-xs mb-2 text-muted-foreground">Preview</div>
          <div class="rounded-lg overflow-hidden border border-border bg-card">
            {#if editImageUrl.trim()}
              <img
                src={editImageUrl}
                alt="Market preview"
                class="h-40 w-full object-cover"
                on:error={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display =
                    "none")}
              />
            {/if}
            <div class="p-3 space-y-1.5">
              <div class="text-sm font-medium">
                {editTitle || "Untitled market"}
              </div>
              {#if editCategory}
                <span
                  class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs bg-primary/10 text-primary"
                >
                  {editCategory}
                </span>
              {/if}
              {#if editDescription}
                <p class="text-xs text-muted-foreground line-clamp-3">
                  {editDescription}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
            on:click={() => (editOpen = false)}
          >
            Cancel
          </button>
          <button
            class="action-button action-button-primary px-3 py-1.5"
            on:click={updateMarket}
            disabled={!editTitle.trim() || updating}
          >
            {#if updating}<span class="action-spinner"></span>{/if}
            {updating ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if settleOpen && settleMarket}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (settleOpen = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (settleOpen = false)}
    ></button>

    <div
      class="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Settle Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <h2 class="text-base font-semibold mb-3">Settle Market</h2>

      <div class="mb-4 text-sm text-muted-foreground">
        Select the winning outcome for:
        <div class="font-medium text-foreground mt-1">
          {settleMarket.title}
        </div>
      </div>

      <!-- Dropdown -->
      <div class="mb-4">
        <label
          for="settle-outcome"
          class="text-xs text-muted-foreground mb-1 block"
        >
          Winning outcome
        </label>

        <select
          id="settle-outcome"
          bind:value={selectedOutcomeId}
          class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
        >
          {#each settleMarket.outcomes ?? [] as o}
            <option value={o.id}>
              {o.label}
              {o.price_cents != null ? ` · ${o.price_cents}%` : ""}
            </option>
          {/each}
        </select>
      </div>

      <!-- Warning -->
      <div class="flex items-start gap-2 text-amber-400 text-sm">
        <CircleAlert class="w-4 h-4 mt-0.5" />
        <span
          >Settlement is irreversible. All payouts will be executed immediately.</span
        >
      </div>

      <!-- Buttons -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
          on:click={() => (settleOpen = false)}
        >
          Cancel
        </button>

        <button
          type="button"
          class="action-button border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
          on:click={confirmSettlement}
          disabled={!selectedOutcomeId || settling}
        >
          {#if settling}<span class="action-spinner"></span>{/if}
          {settling ? "Settling..." : "Confirm Settlement"}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ===========================
  Body States / Market Table
=========================== -->
{#if loading}
  <div class="text-sm text-muted-foreground">Loading markets…</div>
{:else if error}
  <div class="text-sm text-red-500">{error}</div>
{:else if activeView === "multi"}
  {#if filteredQuestions.length === 0}
    <div class="admin-panel p-6 text-sm text-muted-foreground">
      No multi-option questions found.
    </div>
  {:else}
    <section class="admin-panel overflow-hidden">
      <div class="admin-panel-header">
        <div>
          <h2 class="text-lg font-semibold tracking-tight">Multi-option questions</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"} matching the current view.
          </p>
        </div>
        <div class="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
      </div>

      <div class="overflow-x-auto">
        <table class="admin-table min-w-[980px]">
          <thead>
            <tr>
              <th>Question</th>
              <th>Status</th>
              <th>Options</th>
              <th>Projected End</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedQuestions as question (question.id)}
              <tr>
                <td>
                  <div class="font-medium">{question.title}</div>
                  {#if question.category}
                    <span class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {question.category}
                    </span>
                  {/if}
                  {#if question.is_archived}
                    <span class="ml-1 text-xs rounded bg-muted px-2 py-0.5 text-muted-foreground">
                      Archived
                    </span>
                  {/if}
                </td>
                <td>
                  <span class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs">
                    {question.status ?? "open"}
                  </span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    {#each question.options ?? [] as option}
                      <span class="inline-flex items-center rounded bg-input px-2 py-0.5 text-xs">
                        {option.label} ({option.yes_price_cents ?? 50}%)
                      </span>
                    {/each}
                  </div>
                </td>
                <td>
                  {#if question.projected_end_date}
                    <time class="text-xs text-muted-foreground">
                      {formatDate(question.projected_end_date)}
                    </time>
                  {:else}
                    <span class="text-xs text-muted-foreground">-</span>
                  {/if}
                </td>
                <td>
                  <div class="flex justify-end gap-2">
                    <a
                      class="admin-button h-8 px-3 py-1.5 text-xs"
                      href={`/question/${question.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                    <button
                      class="action-button action-button-secondary h-8 px-3 py-0 text-xs"
                      on:click={() => archiveQuestion(question)}
                    >
                      {question.is_archived ? "Unarchive" : "Archive"}
                    </button>
                    {#if (question.status ?? "open") === "open"}
                      <button
                        class="action-button action-button-warning h-8 px-3 py-0 text-xs"
                        on:click={() => updateQuestionStatus(question, "closed")}
                      >
                        Close
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm">
        <div>Page {page} of {totalPages}</div>

        <div class="flex gap-2">
          <button
            class="admin-button px-3 py-1.5"
            on:click={() => (page = Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>

          <button
            class="admin-button px-3 py-1.5"
            on:click={() => (page = Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  {/if}
{:else if filtered.length === 0}
  <div class="admin-panel p-6 text-sm text-muted-foreground">No single markets found.</div>
{:else}
  <section class="admin-panel overflow-hidden">
    <div class="admin-panel-header">
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Single markets</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {filtered.length} market{filtered.length === 1 ? "" : "s"} matching the current view.
        </p>
      </div>
      <div class="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
    </div>

    <div class="overflow-x-auto">
      <table class="admin-table min-w-[1120px]">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Outcomes</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Projected End</th>
            <th class="text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {#each paginated as m (m.id)}
          <tr class="align-top">
            <td>
              <div class="font-medium">{m.title}</div>
              {#if m.category}
                <span
                  class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded"
                  >{m.category}</span
                >
              {/if}
              {#if m.is_archived}
                <span
                  class="ml-1 text-xs rounded bg-muted px-2 py-0.5 text-muted-foreground"
                  >Archived</span
                >
              {/if}
              {#if m.description}
                <div class="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {m.description as string}
                </div>
              {/if}
            </td>

            <td>
              <span
                class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs
                {(m.status ?? 'open') === 'open'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : ''} 
                {(m.status ?? '') === 'closed'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : ''} 
                {(m.status ?? '') === 'settled'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : ''}"
              >
                {m.status ?? "open"}
              </span>
            </td>

            <td>
              {#if m.outcomes?.length}
                <div class="flex flex-wrap gap-1">
                  {#each m.outcomes as o}
                    <span
                      class="inline-flex items-center rounded bg-input px-2 py-0.5 text-xs"
                    >
                      {o.label}
                      {o.price_cents != null ? ` (${o.price_cents}%)` : ""}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>

            <td>
              <time class="text-xs text-muted-foreground">
                {m.created_at ? formatDateTime(m.created_at) : "—"}
              </time>
            </td>

            <td>
              <time class="text-xs text-muted-foreground">
                {m.updated_at ? formatDateTime(m.updated_at) : "—"}
              </time>
            </td>

            <td>
              {#if m.projected_end_date}
                <time class="text-xs text-muted-foreground">
                  {formatDate(m.projected_end_date)}
                </time>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>

            <td>
              <div class="flex justify-end gap-2">
                <button
                  class="admin-button h-8 px-3 py-0 text-xs"
                  on:click={() => onEdit(m)}
                >
                  Edit
                </button>

                <button
                  class="action-button action-button-secondary h-8 px-3 py-0 text-xs"
                  on:click={() => onArchive(m)}
                  disabled={busyMarketId === m.id}
                >
                  {#if busyMarketId === m.id && busyAction === "archive"}
                    <span class="action-spinner"></span>
                  {/if}
                  {busyMarketId === m.id && busyAction === "archive"
                    ? "Saving..."
                    : m.is_archived
                      ? "Unarchive"
                      : "Archive"}
                </button>

                {#if (m.status ?? "open") === "open"}
                  <button
                    class="action-button action-button-warning h-8 px-3 py-0 text-xs"
                    on:click={() => onClose(m)}
                    disabled={busyMarketId === m.id}
                  >
                    {#if busyMarketId === m.id && busyAction === "close"}
                      <span class="action-spinner"></span>
                    {/if}
                    {busyMarketId === m.id && busyAction === "close"
                      ? "Closing..."
                      : "Close"}
                  </button>
                {:else if m.status === "closed"}
                  <button
                    class="h-8 px-3 text-xs rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/20 transition"
                    on:click={() => onSettle(m)}
                  >
                    Settle
                  </button>
                {:else}
                  <button
                    class="h-8 px-3 text-xs rounded-md bg-muted text-muted-foreground border border-border cursor-not-allowed"
                    disabled
                  >
                    Settled
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
    <div class="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm">
      <div>
        Page {page} of {totalPages}
      </div>

      <div class="flex gap-2">
        <button
          class="admin-button px-3 py-1.5"
          on:click={() => (page = Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </button>

        <button
          class="admin-button px-3 py-1.5"
          on:click={() => (page = Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  </section>
{/if}
</div>

<!-- ===========================
  Shared Category Options
=========================== -->
<datalist id="market-categories">
  <option value="Politics"></option>
  <option value="Sports"></option>
  <option value="Markets"></option>
  <option value="Tech"></option>
  <option value="World"></option>
  <option value="Culture"></option>
</datalist>
