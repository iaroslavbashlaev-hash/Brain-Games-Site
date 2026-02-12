"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function VerifyEmailForm({ onClose }: { onClose?: () => void }) {
  const user = useQuery(api.auth.loggedInUser);
  const sendVerificationCode = useAction(api.emailVerificationActions.sendVerificationCode);
  const verifyEmail = useMutation(api.emailVerification.verifyEmail);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [autoSent, setAutoSent] = useState(false);

  const email = user?.email ?? "";
  const needsVerification = !!user && !!user.email && !user.emailVerificationTime;

  const helperText = useMemo(() => {
    if (!email) return "Проверьте почту и папку “Спам”.";
    return `Проверьте почту и папку “Спам”. Мы отправили код на ${email}.`;
  }, [email]);

  useEffect(() => {
    if (!needsVerification) return;
    if (autoSent) return;
    setAutoSent(true);
    setSending(true);
    void (async () => {
      try {
        await sendVerificationCode({});
        toast.success("Код отправлен на почту");
      } catch (e) {
        // не блокируем пользователя, он может нажать "Отправить ещё раз"
        console.error(e);
      } finally {
        setSending(false);
      }
    })();
  }, [needsVerification, autoSent, sendVerificationCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Введите код");
      return;
    }
    if (!/^\d{4,8}$/.test(trimmed)) {
      setError("Код должен состоять из цифр (обычно 6)");
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmail({ code: trimmed });
      toast.success("Почта подтверждена! Теперь можно играть 🎉");
      onClose?.();
    } catch (e) {
      const message = (e as Error).message || "Неверный код";
      setError(message);
      toast.error("Не удалось подтвердить код");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    setSending(true);
    try {
      await sendVerificationCode({});
      toast.success("Код отправлен ещё раз");
    } catch (e) {
      toast.error((e as Error).message || "Не удалось отправить код");
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        Подтверждение почты
      </h2>

      <p className="text-xs text-gray-400 mb-2 text-center">{helperText}</p>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <input
            className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-gray-400 focus:outline-none transition-colors ${
              error ? "border-red-500 focus:border-red-400" : "border-white/20 focus:border-cyan-400"
            }`}
            inputMode="numeric"
            autoComplete="one-time-code"
            name="code"
            placeholder="Введите код"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            disabled={submitting || sending}
          />
          {error && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}
        </div>

        <button
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          type="submit"
          disabled={submitting || sending}
        >
          {submitting ? "Проверяем..." : "Подтвердить"}
        </button>

        <button
          type="button"
          onClick={resend}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white/90 font-semibold hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting || sending}
        >
          {sending ? "Отправляем..." : "Отправить код ещё раз"}
        </button>
      </form>
    </div>
  );
}


