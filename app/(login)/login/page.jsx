"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { login } from "@/app/actions/auth";
import {
  MaterialSymbolsErrorRounded,
  MaterialSymbolsLoginRounded,
  MaterialSymbolsVisibilityOffOutlineRounded,
  MaterialSymbolsVisibilityOutlineRounded,
  MaterialSymbolsWarningRounded,
} from "@/components/icons";

const ERROR_MESSAGES = {
  unauthenticated: "请先登录以访问",
  expired: "登录已过期，请重新登录",
};

function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const proxyError = searchParams.get("error");
  const proxyMessage = ERROR_MESSAGES[proxyError] || null;

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center page-enter">
      <div className={`w-full max-w-md mx-auto transition-transform ${state?.error ? "animate-shake" : ""}`}>
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            欢迎回来
          </h1>
          <p className="text-gray-400 text-sm">
            请输入密码以继续访问
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 md:p-8">
          <form action={formAction} className="space-y-5">
            {/* Proxy redirect error banner */}
            {proxyMessage && !state?.error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <MaterialSymbolsWarningRounded className="shrink-0 text-[18px]" />
                {proxyMessage}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                密码
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入访问密码"
                  className={`w-full px-4 py-3 pr-12 text-sm rounded-xl border ${
                    state?.error
                      ? "border-red-300 bg-red-50/50 focus:ring-red-300/40 focus:border-red-400"
                      : "border-gray-200 bg-gray-50 focus:ring-primary/40 focus:border-primary"
                  } text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                  autoFocus
                  autoComplete="current-password"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <MaterialSymbolsVisibilityOffOutlineRounded className="text-lg" />
                  ) : (
                    <MaterialSymbolsVisibilityOutlineRounded className="text-lg" />
                  )}
                </button>
              </div>

              {/* Server Action Error */}
              {state?.error && (
                <div className="mt-2">
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <MaterialSymbolsErrorRounded className="text-[14px]" />
                    {state.error}
                  </p>
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer btn-press"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  验证中…
                </>
              ) : (
                <>
                  <MaterialSymbolsLoginRounded className="text-xl" />
                  登 录
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-300 mt-6">
          NextTV · 影视无限
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
