"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteDreamButton({
  dreamId,
  disabled = false,
  disabledMessage
}: {
  dreamId: string;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="stack-sm">
      <button
        className="button button-secondary"
        disabled={disabled || pending}
        onClick={() => {
          if (disabled) {
            if (disabledMessage) {
              window.alert(disabledMessage);
            }
            return;
          }

          if (!window.confirm("确认删除这条梦境吗？它会从主列表移除。")) {
            return;
          }

          startTransition(() => {
            void (async () => {
              await fetch(`/api/dreams/${dreamId}`, {
                method: "DELETE"
              });
              router.push("/app");
              router.refresh();
            })();
          });
        }}
        type="button"
      >
        删除梦境
      </button>
      {disabledMessage ? <div className="helper-text">{disabledMessage}</div> : null}
    </div>
  );
}
