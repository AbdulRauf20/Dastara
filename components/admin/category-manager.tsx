"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import type { CategoryRow } from "@/types/database";
import type { ActionResult } from "@/lib/action-result";

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSuccess={() => {
                setCreateOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>{c.display_order}</TableCell>
                  <TableCell>
                    {c.is_archived ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : c.is_visible ? (
                      <Badge variant="accent">Visible</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <ConfirmButton
                        title="Delete category?"
                        description="Products in this category will become uncategorised. This cannot be undone."
                        confirmLabel="Delete"
                        onConfirm={() => deleteCategory(c.id)}
                        onDone={() => router.refresh()}
                      >
                        Delete
                      </ConfirmButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              category={editing}
              onSuccess={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({
  category,
  onSuccess,
}: {
  category?: CategoryRow;
  onSuccess: () => void;
}) {
  const isEdit = !!category;
  const action = isEdit
    ? (updateCategory.bind(null, category!.id) as (p: ActionResult | null, fd: FormData) => Promise<ActionResult>)
    : createCategory;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onSuccess();
    } else {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug (optional)</Label>
        <Input id="slug" name="slug" defaultValue={category?.slug} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={category?.description ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayOrder">Display order</Label>
          <Input id="displayOrder" name="displayOrder" type="number" defaultValue={String(category?.display_order ?? 0)} />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isVisible" defaultChecked={category ? category.is_visible : true} />
          Visible on storefront
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}
