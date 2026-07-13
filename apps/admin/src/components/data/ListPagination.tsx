"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@moch/contracts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ListPagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const t = useTranslations("list");
  if (meta.total === 0) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-content-muted">
      <p>
        <span className="numeric">
          {from}–{to}
        </span>{" "}
        {t("of")} <span className="numeric">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="sr-only">{t("pageSize")}</span>
          <Select
            value={String(meta.pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label={t("prev")}
        >
          <ChevronRight className="size-4 rtl:hidden" />
          <ChevronLeft className="size-4 ltr:hidden" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label={t("next")}
        >
          <ChevronLeft className="size-4 rtl:hidden" />
          <ChevronRight className="size-4 ltr:hidden" />
        </Button>
      </div>
    </div>
  );
}
