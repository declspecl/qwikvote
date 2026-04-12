import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { useQueryState, parseAsInteger } from "nuqs";
import { useState } from "react";
import { GripVertical, Plus, X, Sparkles, Scale, ShieldBan, Lock, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/shared/step-indicator";
import { useCreatePoll } from "@/features/poll/queries";
import { getSuggestions } from "@/lib/api-client";

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
  disabled,
}: {
  item: OptionItem;
  index: number;
  onRemove: () => void;
  onChange: (text: string) => void;
  canRemove: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        type="button"
        disabled={disabled}
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Input
        placeholder={`Option ${index + 1}`}
        value={item.text}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-background/50"
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  id,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
}) {
  return (
    <div
      className={`surface p-4 transition-all duration-200 ${checked ? "ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${checked ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`h-4 w-4 ${checked ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <Label htmlFor={id} className="cursor-pointer font-medium">
              {title}
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function CreatePollPage() {
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const createPoll = useCreatePoll();

  const [options, setOptions] = useState<OptionItem[]>([
    { id: uuidv4(), text: "" },
    { id: uuidv4(), text: "" },
  ]);

  const [config, setConfig] = useState({
    weighted_voting: false,
    veto_enabled: false,
  });

  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      createPoll.mutate({
        title: value.title,
        description: value.description,
        options: options.filter((o) => o.text.trim()).map((o) => o.text.trim()),
        password: passwordEnabled && password ? password : null,
        config: { ...config, llm_suggestions_enabled: false },
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
    setOptions((prev) => [...prev, { id: uuidv4(), text: "" }]);
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const title = useStore(form.store, (s) => s.values.title);

  const canProceed =
    (step === 1 && Boolean(title.trim())) ||
    (step === 2 && options.filter((o) => o.text.trim()).length >= 2) ||
    step === 3;

  const next = () => {
    if (!canProceed) return;
    setStep(Math.min(step + 1, 4));
  };

  const back = () => setStep(Math.max(step - 1, 1));

  return (
    <main className="container mx-auto max-w-xl px-4 py-8 animate-fade-in-up">
      <h1 className="font-display text-2xl font-bold mb-2 text-center">Create a Poll</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Step {step} of 4 — {STEP_LABELS[step - 1]}
      </p>
      <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

      <Card className="surface">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-5">
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="What should we decide?"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background/50"
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
                      className="bg-background/50"
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
                        disabled={suggestionsLoading}
                        onRemove={() => removeOption(item.id)}
                        onChange={(text) => updateOption(item.id, text)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={suggestionsLoading} onClick={addOption} className="hover:bg-primary/10 transition-colors">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={suggestionsLoading}
                  className="hover:bg-primary/10 transition-colors"
                  onClick={async () => {
                    const title = form.getFieldValue("title");
                    const description = form.getFieldValue("description");

                    if (!title) {
                      toast.error("Add a title first so the AI knows what to suggest");
                      return;
                    }

                    setSuggestionsLoading(true);
                    try {
                      const existingTexts = options
                        .map((o) => o.text.trim())
                        .filter(Boolean);

                      const suggestions = await getSuggestions(
                        title,
                        description || "",
                        existingTexts
                      );

                      const newOptions = suggestions.map((text: string) => ({
                        id: uuidv4(),
                        text,
                      }));

                      setOptions((prev) => {
                        // If the user only has the 2 default empties, replace them
                        const allEmpty = prev.length === 2 && prev.every((o) => !o.text.trim());
                        return allEmpty ? newOptions : [...prev, ...newOptions];
                      });

                      toast.success(`Added ${suggestions.length} suggestions`);
                    } catch {
                      toast.error("Couldn't generate suggestions — try again");
                    } finally {
                      setSuggestionsLoading(false);
                    }
                  }}
                >
                  {suggestionsLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  {suggestionsLoading ? "Generating..." : "Suggest with AI"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SettingCard
                icon={Scale}
                title="Weighted Voting"
                description="Voters can express conviction from 1-5"
                id="weighted"
                checked={config.weighted_voting}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, weighted_voting: checked }))
                }
              />

              <SettingCard
                icon={ShieldBan}
                title="Veto Power"
                description="Voters can veto options they find unacceptable"
                id="veto"
                checked={config.veto_enabled}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, veto_enabled: checked }))
                }
              />

              <SettingCard
                icon={Lock}
                title="Password Protect"
                description="Require a password to view and vote"
                id="password-toggle"
                checked={passwordEnabled}
                onCheckedChange={setPasswordEnabled}
              />
              {passwordEnabled && (
                <div className="pl-12">
                  <Input
                    type="password"
                    placeholder="Enter a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <CardHeader className="p-0">
                <CardTitle className="text-lg font-display">Review Your Poll</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="surface p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Title</p>
                  <p className="font-medium">{form.getFieldValue("title")}</p>
                </div>
                {form.getFieldValue("description") && (
                  <div className="surface p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p>{form.getFieldValue("description")}</p>
                  </div>
                )}
                <div className="surface p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Options</p>
                  <ul className="space-y-1">
                    {options
                      .filter((o) => o.text.trim())
                      .map((o, i) => (
                        <li key={o.id} className="flex items-center gap-2 text-sm">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          {o.text}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.weighted_voting && <Badge variant="secondary">Weighted Voting</Badge>}
                  {config.veto_enabled && <Badge variant="secondary">Veto Power</Badge>}
                  {passwordEnabled && password && <Badge variant="secondary">Password Protected</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 1 || suggestionsLoading}
              className="hover:bg-accent/50 transition-colors"
            >
              Back
            </Button>
            {step < 4 ? (
              <Button
                type="button"
                onClick={next}
                disabled={!canProceed || suggestionsLoading}
                className="bg-primary text-primary-foreground btn-lift"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                disabled={createPoll.isPending}
                className="bg-primary text-primary-foreground btn-lift"
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
