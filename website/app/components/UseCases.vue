<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import type { Mounted } from "seedstone";

const { active } = useActiveUseCase();

const USE_CASES = [
  {
    seed: "agent://atlas",
    title: "AI Agents",
    tag: "Per-agent identity",
    desc: "Give every autonomous agent a face. A stone that follows it across logs, dashboards, and handoffs.",
  },
  {
    seed: "0x71C7856E9D4a4C6A",
    title: "Wallets",
    tag: "Crypto & Web3",
    desc: "Turn an unreadable address into a recognizable gem. Spot your wallet instantly without reading a single hex character.",
  },
  {
    seed: "api_key_7731",
    title: "Developer platforms",
    tag: "Keys & services",
    desc: "Deterministic avatars for keys, services, and endpoints. Generated, never stored.",
  },
  {
    seed: "Helix Collective",
    title: "Teams & communities",
    tag: "Groups & spaces",
    desc: "Memorable identities for squads, guilds, and spaces that feel earned and permanent.",
  },
  {
    seed: "DOC-99812",
    title: "Documents & records",
    tag: "Files & ledgers",
    desc: "Fingerprint files, invoices, and records so any item is identifiable at a glance.",
  },
  {
    seed: "@satoshi",
    title: "People & profiles",
    tag: "Usernames",
    desc: "A profile identity that is unique, consistent, and impossible to spoof by sight.",
  },
];

const thumbnails: Mounted[] = [];
let io: IntersectionObserver | null = null;

function destroyThumbnails(): void {
  while (thumbnails.length) thumbnails.pop()?.destroy();
}

function setupObserver(): void {
  io?.disconnect();
  destroyThumbnails();
  // Build each thumbnail's gem only as it nears the viewport. These sit below
  // the fold, so this keeps their (synchronous) construction off the critical
  // first second, where it would otherwise starve the hero animation.
  io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLDivElement;
        io!.unobserve(el); // build once
        if (!el.isConnected) return;
        const s = el.clientWidth || 104;
        thumbnails.push(
          active.value.uc.mount(el, el.dataset.ucSeed!, {
            width: s,
            height: s,
            background: null,
            targetFPS: 24,
          }),
        );
      }),
    { rootMargin: "200px" }, // start building just before they scroll in
  );
  document.querySelectorAll<HTMLDivElement>("[data-uc-seed]").forEach((el) => io!.observe(el));
}

onMounted(() => {
  setupObserver();
});

watch(
  () => active.value.uc.id,
  async () => {
    await nextTick();
    setupObserver();
  },
);

onBeforeUnmount(() => {
  io?.disconnect();
  destroyThumbnails();
});
</script>

<template>
  <section id="cases" class="section-cases reveal">
    <div class="wrap">
      <div class="sec-head">
        <span class="eyebrow">Where it lives</span>
        <h2 class="sec-h2">A visual identity layer<br />for everything.</h2>
        <p class="sec-lede">
          Wherever an identifier appears, a Seedstone makes it instantly recognizable — and
          impossible to confuse.
        </p>
      </div>
      <div class="uc-grid">
        <div v-for="uc in USE_CASES" :key="uc.seed" class="uc">
          <div class="ucg" :data-uc-seed="uc.seed"></div>
          <h3>{{ uc.title }}</h3>
          <p>{{ uc.desc }}</p>
          <span class="uc-tag">{{ uc.tag }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-cases {
  width: 100%;
  padding: 80px 0;
  position: relative;
  z-index: 1;
}

.sec-head {
  max-width: 42em;
  margin-bottom: 42px;
}
.sec-h2 {
  font-size: clamp(28px, 3.4vw, 40px);
  letter-spacing: -0.025em;
  font-weight: 600;
  line-height: 1.08;
  margin-top: 14px;
  color: var(--text);
}
.sec-lede {
  color: var(--text-2);
  font-size: 17px;
  margin-top: 14px;
  line-height: 1.6;
  max-width: 34em;
}

.uc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 860px) {
  .uc-grid {
    grid-template-columns: 1fr;
  }
}

.uc {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 24px;
  transition:
    border-color 0.25s,
    transform 0.25s;
  position: relative;
  overflow: hidden;
}
.uc:hover {
  border-color: var(--line-2);
  transform: translateY(-3px);
}

.ucg {
  width: 104px;
  height: 104px;
  margin-bottom: 6px;
  background: radial-gradient(circle at 50% 45%, oklch(0.42 0.13 290 / 0.4), transparent 68%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.ucg :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
.ucg :deep(svg) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.uc h3 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin-top: 10px;
  color: var(--text);
}
.uc p {
  color: #9491a3;
  font-size: 14px;
  margin-top: 8px;
  line-height: 1.58;
}
.uc-tag {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--violet);
  margin-top: 14px;
  display: block;
}
</style>
