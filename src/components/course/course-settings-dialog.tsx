"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  updateCourseAction,
  deleteCourseAction,
} from "@/app/(teach)/studio/actions";
import { uploadFile } from "@/lib/upload-client";

type Category = { id: string; name: string };

export function CourseSettingsDialog({
  course,
  categories,
}: {
  course: {
    id: string;
    title: string;
    summary: string;
    description: string;
    categoryId: string | null;
    completionThreshold: number;
    coverImageUrl: string | null;
  };
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(course.title);
  const [summary, setSummary] = useState(course.summary);
  const [description, setDescription] = useState(course.description);
  const [categoryId, setCategoryId] = useState(course.categoryId ?? "");
  const [threshold, setThreshold] = useState(String(course.completionThreshold));
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    course.coverImageUrl,
  );

  async function handleCover() {
    const file = coverRef.current?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateCourseAction(course.id, {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        completionThreshold: Number(threshold),
        coverImageUrl,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      // On success this redirects to /studio; on failure it returns an error.
      const res = await deleteCourseAction(course.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setConfirmingDelete(false);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings /> Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course settings</DialogTitle>
          <DialogDescription>
            Edit the course details. Changes save immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cover photo</Label>
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-gradient-to-br from-primary/10 to-primary/5">
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImageUrl}
                  alt="Course cover preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No cover photo yet
                </span>
              )}
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Course cover image"
              onChange={handleCover}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || pending}
                onClick={() => coverRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ImagePlus />
                )}
                {coverImageUrl ? "Replace photo" : "Upload photo"}
              </Button>
              {coverImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading || pending}
                  onClick={() => setCoverImageUrl(null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Shown on the catalog card and course page. Landscape (16:9) works
              best. Click Save changes to apply.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cs-title">Title</Label>
            <Input
              id="cs-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-summary">Summary</Label>
            <Textarea
              id="cs-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              minLength={10}
              maxLength={280}
              placeholder="A short blurb shown in the catalog."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-description">Description</Label>
            <Textarea
              id="cs-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={20_000}
              placeholder="The full course description shown on the course page."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cs-category">Category</Label>
              <select
                id="cs-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-threshold">Completion %</Label>
              <Input
                id="cs-threshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Save changes
            </Button>
          </div>

          {/* Danger zone */}
          <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Danger zone</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deleting archives the course and removes it from the catalog.
              Enrolled learners keep access to content they already have.
            </p>
            {confirmingDelete ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">Are you sure?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={remove}
                  disabled={pending}
                >
                  {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  Yes, delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
              >
                <Trash2 /> Delete course
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
