import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ruleBuilderSchema, type RuleBuilderForm } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  Bell,
  ChevronRight,
  Heart,
  Mail,
  Plus,
  Settings,
  Shield,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Rule {
  id: string;
  trigger: string;
  condition: {
    field: string;
    operator: string;
    value: string | number;
  };
  action: {
    type: string;
    params?: Record<string, any>;
  };
  enabled: boolean;
  matches: number;
}

const mockRules: Rule[] = [
  {
    id: "1",
    trigger: "message.new",
    condition: { field: "price", operator: "<", value: 300 },
    action: { type: "notify", params: { autofav: true } },
    enabled: true,
    matches: 6,
  },
  {
    id: "2",
    trigger: "price.changed",
    condition: { field: "percentage", operator: ">", value: 10 },
    action: { type: "email", params: { template: "price_drop" } },
    enabled: true,
    matches: 3,
  },
];

const triggerIcons = {
  "message.new": Bell,
  "price.changed": Zap,
  "ad.updated": Settings,
};

const actionIcons = {
  notify: Bell,
  autofav: Heart,
  email: Mail,
  webhook: Webhook,
};

export default function RuleBuilder() {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  const form = useForm<RuleBuilderForm>({
    resolver: zodResolver(ruleBuilderSchema),
    defaultValues: {
      trigger: "message.new",
      condition: {
        field: "price",
        operator: "<",
        value: "",
      },
      action: {
        type: "notify",
      },
      enabled: true,
    },
  });

  const onSubmit = (data: RuleBuilderForm) => {
    const newRule: Rule = {
      id: Date.now().toString(),
      trigger: data.trigger,
      condition: data.condition,
      action: data.action,
      enabled: data.enabled,
      matches: 0,
    };

    setRules([...rules, newRule]);
    form.reset();
    toast.success("Rule created successfully");
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
    toast.success("Rule deleted");
  };

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rule Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create automated triggers and actions for your listings
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Rule Builder Form */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Rule Configuration
            </CardTitle>
            <CardDescription>
              Define triggers, conditions, and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Trigger Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <h3 className="text-lg font-semibold">Trigger</h3>
                  </div>
                  <Card className="bg-muted/20 border-primary/30">
                    <CardContent className="pt-4">
                      <FormField
                        control={form.control}
                        name="trigger"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>When this happens</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="message.new">
                                    New Message
                                  </SelectItem>
                                  <SelectItem value="price.changed">
                                    Price Changed
                                  </SelectItem>
                                  <SelectItem value="ad.updated">
                                    Ad Updated
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />

                {/* Condition Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent-foreground">
                        2
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">Condition</h3>
                  </div>
                  <Card className="bg-muted/20 border-accent/30">
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="condition.field"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="price">Price</SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                    <SelectItem value="location">
                                      Location
                                    </SelectItem>
                                    <SelectItem value="description">
                                      Description
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="condition.operator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operator</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select operator" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="<">Less than</SelectItem>
                                    <SelectItem value=">">
                                      Greater than
                                    </SelectItem>
                                    <SelectItem value="=">Equals</SelectItem>
                                    <SelectItem value="!=">
                                      Not equals
                                    </SelectItem>
                                    <SelectItem value="contains">
                                      Contains
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="condition.value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter value" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />

                {/* Action Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-success">3</span>
                    </div>
                    <h3 className="text-lg font-semibold">Action</h3>
                  </div>
                  <Card className="bg-muted/20 border-success/30">
                    <CardContent className="pt-4">
                      <FormField
                        control={form.control}
                        name="action.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Do this action</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="notify">
                                    Send Notification
                                  </SelectItem>
                                  <SelectItem value="autofav">
                                    Auto Favorite
                                  </SelectItem>
                                  <SelectItem value="email">
                                    Send Email
                                  </SelectItem>
                                  <SelectItem value="webhook">
                                    Call Webhook
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <ArrowDown className="h-6 w-6 text-muted-foreground mx-auto" />

                {/* SAFE Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-info" />
                    </div>
                    <h3 className="text-lg font-semibold">SAFE</h3>
                  </div>
                  <Card className="bg-muted/20 border-info/30">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">
                        Confirm required - This rule will ask for confirmation
                        before executing
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Create Rule
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview & Active Rules */}
        <div className="space-y-6">
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Preview & Test
                </span>
                <Badge variant="secondary">Dry-Run</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm">Match {i + 1}: Preview</span>
                  <Badge variant="outline">Dry-Run</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Active Rules
              </CardTitle>
              <CardDescription>
                Currently running automation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => {
                const TriggerIcon =
                  triggerIcons[rule.trigger as keyof typeof triggerIcons];
                const ActionIcon =
                  actionIcons[rule.action.type as keyof typeof actionIcons];

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-lg border ${
                      rule.enabled
                        ? "border-primary/30 bg-primary/5"
                        : "border-muted bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TriggerIcon className="h-4 w-4 text-primary" />
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <ActionIcon className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {rule.matches} matches
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRule(rule.id)}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      When <strong>{rule.trigger}</strong> and{" "}
                      <strong>
                        {rule.condition.field} {rule.condition.operator}{" "}
                        {rule.condition.value}
                      </strong>{" "}
                      then <strong>{rule.action.type}</strong>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
