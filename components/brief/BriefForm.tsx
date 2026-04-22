"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CHANNELS = ["Facebook", "Instagram", "Google", "TikTok", "其他"];
const PRIORITIES = [
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "URGENT", label: "紧急" },
] as const;

const schema = z.object({
  title: z.string().min(1, "请填写标题"),
  channel: z.string().min(1, "请选择投放渠道"),
  audience: z.string().optional(),
  product: z.string().optional(),
  specs: z.string().min(1, "请填写尺寸规格"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: z.string().optional(),
  description: z.string().min(1, "请填写详细描述"),
  assigneeId: z.string().optional(),
});

type BriefFormValues = z.infer<typeof schema>;

interface BriefFormProps {
  designers: { id: string; name: string }[];
  initialData?: Partial<BriefFormValues & { id: string }>;
  onSuccess?: (briefId: string) => void;
  onCancel?: () => void;
}

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide font-medium" style={{ color: "#5e5d59" }}>
        {label}
        {required && <span style={{ color: "#b53333" }} className="ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs" style={{ color: "#b53333" }}>{error}</p>}
    </div>
  );
}

export function BriefForm({ designers, initialData, onSuccess, onCancel }: BriefFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BriefFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: "MEDIUM",
      ...initialData,
    },
  });

  const handleRefFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setRefFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  };

  const onSubmit = async (data: BriefFormValues) => {
    setSubmitting(true);
    try {
      // 1. Create brief
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
          assigneeId: data.assigneeId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "创建失败");
        return;
      }

      const briefId: string = json.data.id;

      // 2. Upload reference images if any
      if (refFiles.length > 0) {
        const fd = new FormData();
        refFiles.forEach((f) => fd.append("files", f));
        await fetch(`/api/briefs/${briefId}/references`, {
          method: "POST",
          body: fd,
        });
      }

      toast.success("需求单已创建");
      if (onSuccess) {
        onSuccess(briefId);
      } else {
        router.push(`/briefs/${briefId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderColor: "#e8e6dc",
    background: "#f5f4ed",
    color: "#141413",
    borderRadius: "8px",
    height: "32px",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="标题" required error={errors.title?.message}>
        <Input {...register("title")} style={inputStyle} placeholder="简明描述需求" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="投放渠道" required error={errors.channel?.message}>
          <select
            {...register("channel")}
            className="w-full h-8 px-2.5 rounded-[8px] border text-sm"
            style={{ borderColor: "#e8e6dc", background: "#f5f4ed", color: "#141413" }}
          >
            <option value="" style={{ background: "#f5f4ed", color: "#141413" }}>请选择</option>
            {CHANNELS.map((c) => <option key={c} value={c} style={{ background: "#f5f4ed", color: "#141413" }}>{c}</option>)}
          </select>
        </Field>

        <Field label="优先级" required error={errors.priority?.message}>
          <select
            {...register("priority")}
            className="w-full h-8 px-2.5 rounded-[8px] border text-sm"
            style={{ borderColor: "#e8e6dc", background: "#f5f4ed", color: "#141413" }}
          >
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="目标受众" error={errors.audience?.message}>
          <Input {...register("audience")} style={inputStyle} placeholder="如：25-35岁女性" />
        </Field>
        <Field label="产品/服务" error={errors.product?.message}>
          <Input {...register("product")} style={inputStyle} placeholder="产品名称" />
        </Field>
      </div>

      <Field label="尺寸规格" required error={errors.specs?.message}>
        <Input {...register("specs")} style={inputStyle} placeholder="如: 1080x1080, 1200x628" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="截止日期" error={errors.deadline?.message}>
          <Input {...register("deadline")} type="date" style={inputStyle} />
        </Field>
        {designers.length > 0 && (
          <Field label="指派设计师" error={errors.assigneeId?.message}>
            <select
              {...register("assigneeId")}
              className="w-full h-8 px-2.5 rounded-[8px] border text-sm"
              style={{ borderColor: "#e8e6dc", background: "#f5f4ed", color: "#141413" }}
            >
              <option value="" style={{ background: "#f5f4ed", color: "#141413" }}>进入公共池</option>
              {designers.map((d) => <option key={d.id} value={d.id} style={{ background: "#f5f4ed", color: "#141413" }}>{d.name}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Field label="详细描述" required error={errors.description?.message}>
        <Textarea
          {...register("description")}
          rows={5}
          placeholder="详细说明需求：风格、色调、文案要求、参考链接等"
          className="rounded-[8px] text-sm resize-none"
          style={{ borderColor: "#e8e6dc", background: "#f5f4ed", color: "#141413" }}
        />
      </Field>

      {/* Reference images */}
      <Field label="参考图">
        <div
          className={cn(
            "border-2 border-dashed rounded-[8px] p-4 text-center cursor-pointer transition-colors hover:bg-[#f5f4ed]"
          )}
          style={{ borderColor: "#e8e6dc" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} className="mx-auto mb-1" strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            点击上传参考图（最多10张）
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
            支持 JPG / PNG / WebP，单张 ≤ 20MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleRefFiles}
          />
        </div>
        {refFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {refFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 h-7 px-2 rounded-[8px] border text-xs"
                style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text-muted)" }}
              >
                {f.name.length > 20 ? f.name.slice(0, 20) + "…" : f.name}
                <button
                  type="button"
                  onClick={() => setRefFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={submitting}
          className="h-8 px-4 rounded-[8px] text-sm font-semibold"
          style={{ background: "#c96442", color: "#faf9f5", border: "1px solid #c96442" }}
        >
          {submitting ? <Loader size={14} className="animate-spin" /> : "提交需求"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-8 px-4 rounded-[8px] text-sm"
          style={{ borderColor: "#e8e6dc", color: "#5e5d59", background: "transparent" }}
          onClick={() => onCancel ? onCancel() : router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
