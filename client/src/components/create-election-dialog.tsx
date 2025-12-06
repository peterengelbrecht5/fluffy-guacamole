import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

const createElectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CreateElectionForm = z.infer<typeof createElectionSchema>;

export function CreateElectionDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateElectionForm>({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: CreateElectionForm) => {
      await apiRequest("POST", "/api/elections", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Election created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create election",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateElectionForm) => {
    createElectionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-vote-primary hover:bg-blue-700 text-white" data-testid="button-create-election">
          <Plus className="w-4 h-4 mr-2" />
          Create New Election
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-election">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Election Title</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="e.g., Student Government President 2024"
              data-testid="input-election-title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-vote-error mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe the election and what voters are choosing..."
              rows={3}
              data-testid="textarea-election-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-vote-error mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...form.register("startDate")}
                data-testid="input-start-date"
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-vote-error mt-1">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...form.register("endDate")}
                data-testid="input-end-date"
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-vote-error mt-1">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createElectionMutation.isPending}
              className="flex-1 bg-vote-primary hover:bg-blue-700"
              data-testid="button-submit-create"
            >
              {createElectionMutation.isPending ? "Creating..." : "Create Election"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
