import { useState, type FormEvent } from "react";

export function WebTestAccessPage({
  onAuthenticate,
}: {
  onAuthenticate: (password: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const zh = /^zh\b/i.test(navigator.language);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim() || pending) return;
    setPending(true);
    setFailed(false);
    try {
      if (!(await onAuthenticate(password.trim()))) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPassword("");
      setPending(false);
    }
  };
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground"
      data-testid="test-access-login"
    >
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6"
      >
        <h1 className="text-ui-xl font-semibold">{zh ? "教智星" : "JiaoZhiXing"}</h1>
        <p className="mt-2 text-ui-base">
          {zh ? "高校专业课教师的教学工作台" : "Teaching workspace for university educators"}
        </p>
        <p className="mt-3 text-ui-sm text-foreground-subtle">
          {zh
            ? "请输入部署者提供的限时测试口令，或扫描测试二维码访问。"
            : "Enter your temporary access credential or scan the test QR code."}
        </p>
        <label className="mt-5 flex flex-col gap-2 text-ui-base">
          {zh ? "测试口令" : "Test credential"}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
            data-testid="test-access-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-mobile-input-safe outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        {failed ? (
          <p role="alert" className="mt-3 text-ui-sm text-destructive">
            {zh
              ? "口令无效或已过期，请联系部署者。"
              : "Credential invalid or expired. Contact the deployment owner."}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !password.trim()}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-ui-base text-primary-foreground disabled:opacity-50"
        >
          {pending
            ? zh
              ? "正在验证…"
              : "Verifying…"
            : zh
              ? "进入教学工作台"
              : "Open teaching workspace"}
        </button>
        <p className="mt-4 text-ui-sm text-foreground-subtle">
          {zh
            ? "演示环境仅使用虚构或脱敏数据；教学内容与建议成绩须由教师审定。"
            : "Use synthetic or anonymized data. Teachers review all content and suggested grades."}
        </p>
      </form>
    </main>
  );
}
