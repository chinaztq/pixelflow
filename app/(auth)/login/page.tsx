"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("邮箱或密码错误");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#f5f4ed" }}
    >
      <div
        className="w-full max-w-[400px] p-8 rounded-[12px] border"
        style={{
          background: "#faf9f5",
          borderColor: "#e8e6dc",
          boxShadow: "rgba(0,0,0,0.06) 0px 8px 32px, 0px 0px 0px 1px #e8e6dc",
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-sm font-bold"
              style={{ background: "#c96442", color: "#faf9f5" }}
            >
              P
            </div>
            <span
              className="text-xl font-semibold"
              style={{ color: "#141413", letterSpacing: "-0.02em" }}
            >
              PixelFlow
            </span>
          </div>
          <p className="text-sm" style={{ color: "#87867f", lineHeight: 1.6 }}>
            AI 素材协作平台，登录后开始使用
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: "#5e5d59" }}
            >
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              {...register("email")}
              className="h-9 rounded-[8px] text-sm"
              style={{
                background: "#f5f4ed",
                borderColor: errors.email ? "#b53333" : "#e8e6dc",
                color: "#141413",
              }}
            />
            {errors.email && (
              <p className="text-xs" style={{ color: "#b53333" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: "#5e5d59" }}
            >
              密码
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              className="h-9 rounded-[8px] text-sm"
              style={{
                background: "#f5f4ed",
                borderColor: errors.password ? "#b53333" : "#e8e6dc",
                color: "#141413",
              }}
            />
            {errors.password && (
              <p className="text-xs" style={{ color: "#b53333" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-[8px] text-sm font-semibold transition-all flex items-center justify-center"
            style={{
              background: loading ? "#e8e6dc" : "#c96442",
              color: loading ? "#87867f" : "#faf9f5",
              boxShadow: loading ? "none" : "0px 0px 0px 1px #c96442",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#b55a3a";
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#c96442";
            }}
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "登录"}
          </button>
        </form>

        <div
          className="mt-6 pt-4 border-t text-xs space-y-1"
          style={{ borderColor: "#e8e6dc", color: "#b0aea5" }}
        >
          <p className="font-medium" style={{ color: "#87867f" }}>测试账号</p>
          <p>投手: requester@pixelflow.com / Test123456</p>
          <p>设计师: designer@pixelflow.com / Test123456</p>
          <p>管理员: admin@pixelflow.com / Admin123456</p>
        </div>
      </div>
    </div>
  );
}
