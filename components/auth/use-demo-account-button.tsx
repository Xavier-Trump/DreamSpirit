"use client";

import { EXPERIENCE_ACCOUNT_EVENT } from "@/components/auth/sign-in-form";

export function UseDemoAccountButton() {
  function fillExperienceAccount() {
    window.dispatchEvent(new Event(EXPERIENCE_ACCOUNT_EVENT));
  }

  return (
    <button className="link-inline auth-demo-fill-button" type="button" onClick={fillExperienceAccount}>
      使用体验账号 →
    </button>
  );
}
