import { computed, onMounted, watch } from "vue";
import { siteUseCases } from "~/usecases";

const STORAGE_KEY = "seedstone:active-use-case";

export function useActiveUseCase() {
  const fallbackId = siteUseCases[0]?.uc.id ?? "gem";
  const activeId = useState<string>("active-use-case", () => fallbackId);

  const active = computed(
    () => siteUseCases.find((entry) => entry.uc.id === activeId.value) ?? siteUseCases[0],
  );

  function setActive(id: string): void {
    if (siteUseCases.some((entry) => entry.uc.id === id)) activeId.value = id;
  }

  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setActive(saved);
  });

  watch(activeId, (id) => {
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, id);
  });

  return { siteUseCases, active, activeId, setActive };
}
