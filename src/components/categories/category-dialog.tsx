"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker, IconPicker } from "@/components/shared/icon-color-pickers";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { useCreateCategory } from "@/hooks/use-taxonomies";

export function CategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createCategory = useCreateCategory();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", icon: "folder", color: "#8B5CF6" },
  });

  useEffect(() => {
    if (open) form.reset({ name: "", icon: "folder", color: "#8B5CF6" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (input) => {
    await createCategory.mutateAsync(input);
    onOpenChange(false);
  });

  const icon = form.watch("icon");
  const color = form.watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>
            Create a custom category to classify your bookmarks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Name <span aria-hidden className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="e.g. Design"
              autoFocus
              {...form.register("name")}
              aria-invalid={Boolean(form.formState.errors.name)}
            />
            {form.formState.errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              value={icon}
              onChange={(next) => form.setValue("icon", next, { shouldDirty: true })}
              color={color}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker
              value={color}
              onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending && <Loader2 className="animate-spin" />}
              Create category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
