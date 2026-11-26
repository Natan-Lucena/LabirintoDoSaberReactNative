import { useState, type ReactElement } from "react";
import { useRouter } from "expo-router";

import type { InvitePreview } from "@/api/types";
import { DsButton } from "@/components/ds";
import { AuthCard } from "@/features/auth/invite/AuthCard";
import { InviteCodeStep } from "@/features/auth/invite/InviteCodeStep";
import { InvitePreviewCard } from "@/features/auth/invite/InvitePreviewCard";
import {
  consumeInviteScreenError,
  setLoginInviteNotice,
} from "@/features/auth/invite/notice";
import { AUTH_DESTINATION } from "@/features/auth/routes";

interface Confirmed {
  code: string;
  preview: InvitePreview;
}

export default function InviteScreen(): ReactElement {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [initialError] = useState(() => consumeInviteScreenError());

  function goToLogin() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(AUTH_DESTINATION);
  }

  return (
    <AuthCard title="Entrar com convite">
      {confirmed ? (
        <InvitePreviewCard preview={confirmed.preview}>
          <DsButton
            label="Criar minha conta"
            onPress={() =>
              router.push({
                pathname: "/(auth)/register",
                params: { code: confirmed.code },
              })
            }
            fullWidth
          />
          <DsButton
            label="Já tenho conta"
            variant="secondary"
            onPress={() => {
              setLoginInviteNotice({ kind: "invite", code: confirmed.code });
              goToLogin();
            }}
            fullWidth
          />
        </InvitePreviewCard>
      ) : (
        <InviteCodeStep
          initialError={initialError}
          onPreview={(code, preview) => setConfirmed({ code, preview })}
        />
      )}
    </AuthCard>
  );
}
