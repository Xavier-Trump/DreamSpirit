"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

type DeleteAccountButtonProps = {
  accountEmail?: string | null;
  disabled?: boolean;
  disabledMessage?: string;
};

export function DeleteAccountButton({ accountEmail, disabled = false, disabledMessage }: DeleteAccountButtonProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const normalizedConfirmEmail = confirmEmail.trim().toLowerCase();
  const normalizedAccountEmail = (accountEmail || "").trim().toLowerCase();
  const emailMatches = Boolean(normalizedAccountEmail) && normalizedConfirmEmail === normalizedAccountEmail;

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [open]);

  function closeModal() {
    if (pending) {
      return;
    }

    setOpen(false);
    setConfirmEmail("");
    setMessage(null);
  }

  function confirmDelete() {
    setMessage(null);

    if (disabled) {
      setMessage(disabledMessage || "当前状态暂不支持注销账号。");
      return;
    }

    if (!emailMatches) {
      setMessage("请输入当前登录账号的邮箱后再确认注销。");
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/account", {
          method: "DELETE"
        });

        if (!response.ok) {
          const result = await response.json();
          setMessage(result.error || "账号注销失败");
          return;
        }

        await signOut({
          callbackUrl: "/sign-in"
        });
      })();
    });
  }

  return (
    <div className="stack-md">
      <button
        className="button button-secondary"
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage(disabled ? disabledMessage || "当前状态暂不支持注销账号。" : null);
        }}
      >
        注销账号
      </button>
      {disabledMessage ? <div className="helper-text">{disabledMessage}</div> : null}
      {message && !open ? <div className="notice danger-zone">{message}</div> : null}

      {open ? createPortal(
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={closeModal} onWheel={(event) => event.stopPropagation()}>
          <div
            className="auth-modal account-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="auth-modal-header">
              <div>
                <div className="brand-mark">
                  <span className="brand-orb" />
                  DreamSpirit
                </div>
                <h2 className="panel-title" id="delete-account-title">
                  注销账号
                </h2>
              </div>
              <button className="auth-modal-close" type="button" aria-label="关闭" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="stack-md">
              <div className="notice danger-zone">
                注销后，账号下的私有梦境、共享记录、任务记录与个人设置会被清除。此操作不可撤销，请确认已经完成必要导出。
              </div>

              <label className="field-group">
                <span className="field-label">当前登录邮箱</span>
                <span className="account-delete-email">{accountEmail || "未读取到邮箱"}</span>
                <input
                  className="field-input"
                  disabled={pending || disabled || !accountEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  placeholder="输入当前账号邮箱"
                  value={confirmEmail}
                />
              </label>

              {message ? <div className="notice danger-zone">{message}</div> : null}

              <div className="button-row account-delete-actions">
                <button className="button button-secondary" disabled={pending} type="button" onClick={closeModal}>
                  取消
                </button>
                <button className="button button-primary" disabled={pending || disabled || !emailMatches} type="button" onClick={confirmDelete}>
                  {pending ? "注销中..." : "确认注销"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
