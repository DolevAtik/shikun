"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/EmptyState";

/**
 * A short, hand-ordered list: move up, move down, edit, delete. Used for the
 * rows an admin arranges by hand — key numbers, projects, services — where the
 * order on screen is the order employees see.
 *
 * Buttons rather than drag-and-drop: they work with a keyboard and a screen
 * reader as they are, which a drag handle does not.
 */
export function OrderedRows<T extends { id: string }>({
  items,
  render,
  onReorder,
  onEdit,
  onDelete,
  itemLabel,
  emptyTitle,
  emptyDescription,
  busy,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  onReorder?: (ids: string[]) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  itemLabel: (item: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
  busy?: boolean;
}) {
  const t = useTranslations("rows");

  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!onReorder || target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    const [id] = ids.splice(index, 1);
    ids.splice(target, 0, id!);
    onReorder(ids);
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const label = itemLabel(item);
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface px-3 py-2"
          >
            <div className="min-w-0 flex-1">{render(item)}</div>
            <div className="flex items-center gap-1">
              {onReorder && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={t("moveUp", { name: label })}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy || index === items.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={t("moveDown", { name: label })}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label={t("edit", { name: label })}>
                <Pencil aria-hidden />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(item)} aria-label={t("delete", { name: label })}>
                <Trash2 aria-hidden className="text-danger" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
