import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useQueryState, parseAsInteger } from "nuqs";
import { useState } from "react";
import { GripVertical, Plus, X, Sparkles } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/shared/step-indicator";
import { useCreatePoll } from "@/features/poll/queries";

export const Route = createFileRoute("/create")({
  component: CreatePollPage,
});

interface OptionItem {
  id: string;
  text: string;
}

const STEP_LABELS = ["Details", "Options", "Settings", "Review"];

function SortableOption({
  item,
  index,
  onRemove,
  onChange,
  canRemove,
}: {
  item: OptionItem;
  index: number;
  onRemove: () => void;
  onChange: (text: string) => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <Input
        placeholder={`Option ${index + 1}`}
        value={item.text}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      {canRemove && (
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function CreatePollPage() {
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const createPoll = useCreatePoll();

  const [options, setOptions] = useState<OptionItem[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);

  const [config, setConfig] = useState({
    weighted_voting: false,
    veto_enabled: false,
    llm_suggestions_enabled: false,
  });

  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      createPoll.mutate({
        title: value.title,
        description: value.description,
        options: options
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim() })),
        password: passwordEnabled && password ? password : null,
        config,
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOptions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), text: "" }]);
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const canProceedStep1 = () => {
    const title = form.getFieldValue("title");
    return Boolean(title && title.trim());
  };

  const canProceedStep2 = () => {
    const filledOptions = options.filter((o) => o.text.trim());
    return filledOptions.length >= 2;
  };

  const next = () => {
    if (step === 1 && !canProceedStep1()) return;
    if (step === 2 && !canProceedStep2()) return;
    setStep(Math.min(step + 1, 4));
  };

  const back = () => setStep(Math.max(step - 1, 1));

  return (
    <main className="container mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Create a Poll</h1>
      <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="What should we decide?"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add some context (optional)"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Options (minimum 2)</Label>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {options.map((item, index) => (
                      <SortableOption
                        key={item.id}
                        item={item}
                        index={index}
                        canRemove={options.length > 2}
                        onRemove={() => removeOption(item.id)}
                        onChange={(text) => updateOption(item.id, text)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="llm-toggle">Use AI to suggest options</Label>
                </div>
                <Switch
                  id="llm-toggle"
                  checked={config.llm_suggestions_enabled}
                  onCheckedChange={(checked) =>
                    setConfig((c) => ({ ...c, llm_suggestions_enabled: checked }))
                  }
                />
              </div>
              {config.llm_suggestions_enabled && (
                <p className="text-sm text-muted-foreground">
                  AI will generate additional options based on your title and description when the poll is created.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger render={<Label htmlFor="weighted" className="cursor-help" />}>
                    Enable Weighted Voting
                  </TooltipTrigger>
                  <TooltipContent>Voters can express conviction from 1-5</TooltipContent>
                </Tooltip>
                <Switch
                  id="weighted"
                  checked={config.weighted_voting}
                  onCheckedChange={(checked) =>
                    setConfig((c) => ({ ...c, weighted_voting: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger render={<Label htmlFor="veto" className="cursor-help" />}>
                    Enable Veto Power
                  </TooltipTrigger>
                  <TooltipContent>Voters can veto options they find unacceptable</TooltipContent>
                </Tooltip>
                <Switch
                  id="veto"
                  checked={config.veto_enabled}
                  onCheckedChange={(checked) =>
                    setConfig((c) => ({ ...c, veto_enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-toggle">Password Protect</Label>
                  <Switch
                    id="password-toggle"
                    checked={passwordEnabled}
                    onCheckedChange={setPasswordEnabled}
                  />
                </div>
                {passwordEnabled && (
                  <Input
                    type="password"
                    placeholder="Enter a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-lg">Review Your Poll</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{form.getFieldValue("title")}</p>
                </div>
                {form.getFieldValue("description") && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{form.getFieldValue("description")}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Options</p>
                  <ul className="list-disc list-inside">
                    {options
                      .filter((o) => o.text.trim())
                      .map((o) => (
                        <li key={o.id}>{o.text}</li>
                      ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.weighted_voting && <Badge variant="secondary">Weighted Voting</Badge>}
                  {config.veto_enabled && <Badge variant="secondary">Veto Power</Badge>}
                  {config.llm_suggestions_enabled && <Badge variant="secondary">AI Suggestions</Badge>}
                  {passwordEnabled && password && <Badge variant="secondary">Password Protected</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                disabled={createPoll.isPending}
              >
                {createPoll.isPending ? "Creating..." : "Create Poll"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
