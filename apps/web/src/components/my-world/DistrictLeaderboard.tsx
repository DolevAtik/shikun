"use client";

import { Card, SectionHeader, cn } from "@moch/ui";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { DistrictStanding } from "./types";

const DISTRICT_ORDER = ["NORTH", "HAIFA", "CENTER", "JERUSALEM", "SOUTH"] as const;

export function DistrictLeaderboard({ districts }: { districts: DistrictStanding[] }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const ranked = [...districts].sort(
    (a, b) => b.xp - a.xp || DISTRICT_ORDER.indexOf(a.code) - DISTRICT_ORDER.indexOf(b.code),
  );
  const leaderXp = ranked[0]?.xp ?? 0;
  const mine = ranked.find((district) => district.isMine);

  return (
    <section>
      <SectionHeader title={t("districtsTitle")} titleClassName="text-lg" />
      <p className="-mt-1 mb-3 px-1 text-sm text-content-muted">{t("districtsHint")}</p>
      {ranked.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-5 py-6 text-center text-sm text-content-muted shadow-sm">
          {t("districtsEmpty")}
        </p>
      ) : (
        <Card className="p-3 shadow-md sm:p-4">
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {ranked.map((district, index) => {
              const place = index + 1;
              const width = leaderXp > 0 ? Math.round((district.xp / leaderXp) * 100) : 0;
              return (
                <li key={district.code}>
                  <div
                    className={cn("rounded-lg px-3 py-3", district.isMine && "ring-2 ring-brand")}
                    style={
                      district.isMine
                        ? { backgroundColor: "color-mix(in srgb, var(--brand-blue) 8%, var(--surface))" }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                          place === 1 ? "bg-brand text-content-onbrand" : "bg-surface-sunken text-content",
                        )}
                      >
                        <span className="sr-only">{t("districtPlace", { place })}</span>
                        <span aria-hidden="true">
                          <Numeric>{place}</Numeric>
                        </span>
                      </span>
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: district.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-semibold text-content">
                            {district.name}
                            {place === 1 ? (
                              <span className="ms-2 text-xs font-semibold text-brand">{t("districtLeader")}</span>
                            ) : null}
                          </p>
                          <Numeric className="shrink-0 text-sm font-bold text-content">
                            {formatXp(district.xp, locale)} XP
                          </Numeric>
                        </div>
                        <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                          <div
                            className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
                            style={{ width: `${width}%`, backgroundColor: district.color }}
                          />
                        </div>
                        {district.isMine ? (
                          <p className="mt-1 text-xs font-semibold text-brand">{t("myDistrict")}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {mine ? null : <p className="mt-3 px-1 text-sm text-content-muted">{t("districtsHeadquarters")}</p>}
        </Card>
      )}
    </section>
  );
}
