"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { SearchResponse } from "@moch/contracts";
import { useRouter } from "@/i18n/routing";
import { api, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const GROUP_LABEL: Record<SearchResponse["groups"][number]["group"], string> = {
  content: "content",
  employees: "employees",
  districts: "districts",
  departments: "districts",
  media: "media",
};

export function GlobalSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const query = useQuery({
    queryKey: qk.search(term),
    queryFn: () => api.get<SearchResponse>(`/admin/search?${toSearchParams({ q: term })}`),
    enabled: open && term.trim().length >= 2,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden gap-2 text-content-muted sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span>{t("common.search")}</span>
        <kbd className="ms-2 hidden rounded border border-line bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">
          ⌘K
        </kbd>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("common.search")}
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("search.title")}
        description={t("search.description")}
      >
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder={t("search.placeholder")}
        />
        <CommandList>
          <CommandEmpty>
            {term.trim().length < 2 ? t("search.hint") : t("search.empty")}
          </CommandEmpty>
          {(query.data?.groups ?? []).map((group) => (
            <CommandGroup key={group.group} heading={t(`nav.${GROUP_LABEL[group.group]}`)}>
              {group.items.map((item) => (
                <CommandItem
                  key={`${group.group}-${item.id}`}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => {
                    setOpen(false);
                    setTerm("");
                    router.push(item.href);
                  }}
                >
                  <span className="truncate font-medium">{item.title}</span>
                  {item.subtitle && (
                    <span className="ms-2 truncate text-xs text-content-muted">{item.subtitle}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
