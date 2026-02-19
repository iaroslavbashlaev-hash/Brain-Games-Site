"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

// Функция для получения понятного сообщения об ошибке
function getErrorMessage(error: Error, flow: "signIn" | "signUp"): string {
  const message = error.message.toLowerCase();

  // Convex Auth конкретные коды
  if (message.includes("invalidaccountid")) {
    return flow === "signIn"
      ? "Пользователь не найден. Проверьте email или нажмите «Зарегистрироваться»."
      : "Не удалось создать аккаунт. Попробуйте другой email.";
  }
  if (message.includes("invalidsecret")) {
    return "Неверный пароль. Проверьте правильность ввода.";
  }
  if (message.includes("toomanyfailedattempts")) {
    return "Слишком много неудачных попыток. Подождите несколько минут и попробуйте снова.";
  }
  
  // Ошибки пароля
  if (message.includes("invalid password") || message.includes("wrong password") || message.includes("incorrect password")) {
    return "Неверный пароль. Проверьте правильность ввода.";
  }
  
  // Ошибки email
  if (message.includes("invalid email") || message.includes("email is invalid")) {
    return "Неверный формат email адреса.";
  }
  
  // Пользователь не найден
  if (message.includes("user not found") || message.includes("no user") || message.includes("account not found")) {
    return "Пользователь с таким email не найден. Попробуйте зарегистрироваться.";
  }
  
  // Пользователь уже существует
  if (message.includes("already exists") || message.includes("user exists") || message.includes("email already") || message.includes("account already")) {
    return "Пользователь с таким email уже существует. Попробуйте войти.";
  }
  
  // Слабый пароль
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("min") || message.includes("length"))) {
    return "Пароль слишком короткий. Минимум 8 символов.";
  }
  
  // Сетевые ошибки
  if (message.includes("network") || message.includes("connection") || message.includes("timeout") || message.includes("fetch")) {
    return "Ошибка сети. Проверьте подключение к интернету.";
  }
  
  // Ошибка сервера
  if (message.includes("server") || message.includes("500") || message.includes("internal")) {
    return "Ошибка сервера. Попробуйте позже.";
  }
  
  // Слишком много попыток
  if (message.includes("rate limit") || message.includes("too many") || message.includes("blocked")) {
    return "Слишком много попыток. Подождите несколько минут.";
  }

  // Resend: тестовый режим — письма только на свой email
  if (message.includes("resend") && (message.includes("403") || message.includes("testing emails") || message.includes("verify a domain"))) {
    return "Сейчас письма отправляются только на email разработчика. Для продакшена настройте домен в Resend.";
  }

  // Could not verify - общая ошибка верификации
  if (message.includes("could not verify") || message.includes("verification failed")) {
    return flow === "signIn" 
      ? "Не удалось подтвердить данные. Проверьте email и пароль."
      : "Не удалось создать аккаунт. Проверьте данные.";
  }
  
  // Общие ошибки по типу действия
  if (flow === "signIn") {
    return "Не удалось войти. Проверьте email и пароль, или зарегистрируйтесь.";
  } else {
    return "Не удалось зарегистрироваться. Возможно, аккаунт уже существует.";
  }
}

// Валидация email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация пароля
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Пароль должен содержать минимум 8 символов";
  }
  if (password.length > 35) {
    return "Пароль слишком длинный";
  }
  return null;
}

export function SignInForm({ onClose }: { onClose?: () => void }) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const isSignUp = flow === "signUp";
  const passwordsMatch = !isSignUp || (password.length > 0 && confirmPassword.length > 0 && password === confirmPassword);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Валидация email
    if (!email.trim()) {
      setEmailError("Введите email");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Неверный формат email");
      isValid = false;
    } else {
      setEmailError(null);
    }
    
    // Валидация пароля
    if (!password) {
      setPasswordError("Введите пароль");
      isValid = false;
    } else if (isSignUp) {
      const passError = validatePassword(password);
      if (passError) {
        setPasswordError(passError);
        isValid = false;
      } else {
        setPasswordError(null);
      }
    } else {
      setPasswordError(null);
    }

    // Валидация повтора пароля (только при регистрации)
    if (isSignUp) {
      if (!confirmPassword) {
        setConfirmPasswordError("Повторите пароль");
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("Пароли не совпадают");
        isValid = false;
      } else {
        setConfirmPasswordError(null);
      }
    } else {
      setConfirmPasswordError(null);
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setEmailError(null);
    setPasswordError(null);
    
    const formData = new FormData();
    formData.set("email", email.trim().toLowerCase());
    formData.set("password", password);
    formData.set("flow", flow);
    
    try {
      await signIn("password", formData);
      toast.success(flow === "signIn" ? "Добро пожаловать! 🎉" : "Аккаунт создан! 🎉");
      onClose?.();
    } catch (error) {
      const errorMessage = getErrorMessage(error as Error, flow);
      toast.error(errorMessage);
      console.error("Auth error:", error);
      
      // Устанавливаем конкретные ошибки полей если возможно
      const msg = (error as Error).message.toLowerCase();
      if (msg.includes("email") || msg.includes("user not found") || msg.includes("already exists")) {
        setEmailError(errorMessage);
      } else if (msg.includes("password")) {
        setPasswordError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        {flow === "signIn" ? "Вход" : "Регистрация"}
      </h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <input
            className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-gray-400 focus:outline-none transition-colors ${
              emailError 
                ? "border-red-500 focus:border-red-400" 
                : "border-white/20 focus:border-cyan-400"
            }`}
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            disabled={submitting}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {emailError}
            </p>
          )}
        </div>
        
        <div>
          <div className="relative">
            <input
              className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border text-white placeholder-gray-400 focus:outline-none transition-colors ${
                passwordError 
                  ? "border-red-500 focus:border-red-400" 
                  : "border-white/20 focus:border-cyan-400"
              }`}
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (confirmPasswordError) setConfirmPasswordError(null);
              }}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {passwordError}
            </p>
          )}
          {flow === "signUp" && !passwordError && (
            <p className="mt-1 text-xs text-gray-500">
              Минимум 8 символов
            </p>
          )}
        </div>

        {isSignUp && (
          <div>
            <input
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-gray-400 focus:outline-none transition-colors ${
                confirmPasswordError
                  ? "border-red-500 focus:border-red-400"
                  : "border-white/20 focus:border-cyan-400"
              }`}
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError(null);
              }}
              disabled={submitting}
            />
            {confirmPasswordError && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {confirmPasswordError}
              </p>
            )}
          </div>
        )}
        
        <button 
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          type="submit" 
          disabled={submitting || !passwordsMatch}
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Загрузка...
            </>
          ) : (
            flow === "signIn" ? "Войти" : "Зарегистрироваться"
          )}
        </button>
        
        <div className="text-center text-sm text-gray-400">
          <span>
            {flow === "signIn"
              ? "Нет аккаунта? "
              : "Уже есть аккаунт? "}
          </span>
          <button
            type="button"
            className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium cursor-pointer"
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setEmailError(null);
              setPasswordError(null);
              setConfirmPasswordError(null);
              setConfirmPassword("");
            }}
            disabled={submitting}
          >
            {flow === "signIn" ? "Зарегистрироваться" : "Войти"}
          </button>
        </div>
      </form>
      
    </div>
  );
}
