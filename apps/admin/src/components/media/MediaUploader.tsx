"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Copy, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/components/form/ImageField";

interface Uploaded {
  name: string;
  url: string;
  isImage: boolean;
}

/**
 * Upload a file and get its address, for an image in a post, a PDF behind a
 * link, a poster for an event. The editors upload their own images in place;
 * this is for everything else. It lists this session's uploads only — the
 * storage bucket is not browsable from here.
 */
export function MediaUploader() {
  const t = useTranslations("media");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [items, setItems] = React.useState<Uploaded[]>([]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file);
        setItems((prev) => [{ name: file.name, url, isImage: file.type.startsWith("image/") }, ...prev]);
      } catch {
        toast.error(t("uploadFailedNamed", { name: file.name }));
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadTitle")}</CardTitle>
          <CardDescription>{t("uploadHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void upload(event.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-10 text-center ${dragging ? "border-primary bg-surface-tint" : "border-line"}`}
          >
            <Upload className="size-6 text-content-muted" aria-hidden />
            <p className="text-sm text-content-muted">{t("dropHere")}</p>
            <input ref={inputRef} id="media-file" type="file" multiple className="sr-only" onChange={(event) => void upload(event.target.files)} />
            <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? t("uploading") : t("chooseFiles")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sessionUploads")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.url} className="flex flex-wrap items-center gap-3">
                  {item.isImage && (
                    // A thumbnail of the file just uploaded; the name beside it says what it is.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="size-14 rounded-md border border-line object-cover" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-content">{item.name}</p>
                    <Input readOnly value={item.url} dir="ltr" aria-label={t("addressOf", { name: item.name })} onFocus={(e) => e.target.select()} />
                  </div>
                  <Button type="button" variant="outline" onClick={() => void copy(item.url)}>
                    <Copy aria-hidden />
                    {t("copy")}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
