"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { setToken, useToken } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const token = useToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (result) => setToken(result.accessToken),
  });

  useEffect(() => {
    if (token) router.replace("/");
  }, [token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <form
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-8"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate({ username: username.trim(), password });
        }}
      >
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/logo.webp"
            alt=""
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <p className="text-lg font-bold leading-tight">운Pick</p>
            <p className="text-xs font-medium text-ink-mute">관리자</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            className="input h-11 w-full"
            placeholder="아이디"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />
          <input
            className="input h-11 w-full"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {login.error && <ErrorBox error={login.error} />}
          <button
            className="btn-primary h-11 w-full"
            disabled={!username || !password || login.isPending}
          >
            {login.isPending ? "확인 중" : "로그인"}
          </button>
        </div>
      </form>
    </main>
  );
}
