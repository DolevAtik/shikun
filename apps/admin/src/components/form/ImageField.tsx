"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Uploads a file straight to object storage through the API's presigned URL —
 * the file never passes through the API — and returns the public address.
 */
export async function uploadFile(file: File): Promise<string> {
  const presigned = await api.post<PresignedUpload>("/media/presign", {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
  });
  const response = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw new Error(`upload ${response.status}`);
  return presigned.publicUrl;
}

/** An image address: paste one, or upload a file and get one. */
export function ImageField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("media");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadFile(file));
      toast.success(t("uploaded"));
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://"
          dir="ltr"
          className="min-w-0 flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden />
          {uploading ? t("uploading") : t("upload")}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label={t("remove")}>
            <X aria-hidden />
          </Button>
        )}
      </div>
      {value && (
        // A preview of the chosen file, not content — it has no meaning of its own.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-28 w-auto max-w-full rounded-md border border-line object-cover" />
      )}
    </div>
  );
}
