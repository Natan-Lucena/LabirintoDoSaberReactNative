import { useEffect, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { PendingBanner } from "@/components/PendingBanner";
import {
  AppHeader,
  DsButton,
  SectionTitle,
  Toast,
  useToast,
} from "@/components/ds";
import { getMe } from "@/api/endpoints/educator";
import { homeQueryKeys } from "@/features/home/useHomeData";
import type { ClinicMember, TeamRole } from "@/api/types";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ConfirmDialog } from "@/features/team/components/ConfirmDialog";
import { CreateClinicForm } from "@/features/team/components/CreateClinicForm";
import { InviteCard } from "@/features/team/components/InviteCard";
import { InvitesSection } from "@/features/team/components/InvitesSection";
import { ManageMemberDialog } from "@/features/team/components/ManageMemberDialog";
import { MemberRow } from "@/features/team/components/MemberRow";
import { RenameClinicDialog } from "@/features/team/components/RenameClinicDialog";
import { teamErrorMessage } from "@/features/team/messages";
import { consumeTeamNotice } from "@/features/team/notice";
import { teamRoleLabel } from "@/features/team/roles";
import {
  useClinic,
  useLeaveTeam,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/features/team/useClinic";
import { useOnline } from "@/hooks/useOnline";
import { color, fontFamilies } from "@/theme";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 20, paddingBottom: 36 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  clinicName: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  group: { gap: 8 },
});

type PendingAction =
  | { kind: "role"; member: ClinicMember; role: TeamRole }
  | { kind: "remove"; member: ClinicMember }
  | { kind: "leave" };

function confirmTitle(
  pending: PendingAction | null,
  clinicName: string,
): string {
  if (!pending) return "";
  if (pending.kind === "role") {
    return `Mudar o papel de ${pending.member.name} para ${teamRoleLabel(pending.role)}?`;
  }
  if (pending.kind === "remove") {
    return `Remover ${pending.member.name} da equipe?`;
  }
  return `Sair da equipe ${clinicName}?`;
}

function confirmMessage(pending: PendingAction | null): string | undefined {
  if (pending?.kind === "remove") {
    return "Os pacientes dele(a) continuam com ele(a), e os compartilhamentos com a equipe são desfeitos.";
  }
  if (pending?.kind === "leave") {
    return "Seus pacientes continuam com você, e os compartilhamentos são desfeitos.";
  }
  return undefined;
}

export function TeamScreen(): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const query = useClinic();
  const { data: educator } = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  const permissions = usePermissions();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const leaveTeam = useLeaveTeam();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [managing, setManaging] = useState<ClinicMember | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const showToast = toast.show;
  useEffect(() => {
    const notice = consumeTeamNotice();
    if (notice) showToast(notice);
  }, [showToast]);
  const busy =
    updateRole.isPending || removeMember.isPending || leaveTeam.isPending;

  function openPending(action: PendingAction) {
    setActionError(null);
    setPending(action);
  }

  function confirmPending(myId: string | undefined) {
    if (!pending) return;
    setActionError(null);
    const fail = (failure: Error) => setActionError(teamErrorMessage(failure));
    if (pending.kind === "role") {
      updateRole.mutate(
        { educatorId: pending.member.educatorId, role: pending.role },
        {
          onSuccess: () => {
            setPending(null);
            toast.show("Papel atualizado");
          },
          onError: fail,
        },
      );
    } else if (pending.kind === "remove") {
      removeMember.mutate(pending.member.educatorId, {
        onSuccess: () => {
          setPending(null);
          toast.show("Membro removido");
        },
        onError: fail,
      });
    } else if (myId) {
      leaveTeam.mutate(myId, {
        onSuccess: () => {
          setPending(null);
          toast.show("Você saiu da equipe");
        },
        onError: fail,
      });
    }
  }

  const header = (
    <AppHeader
      title="Equipe e convites"
      subtitle="Gestão da clínica"
      onBack={router.back}
    />
  );

  let body: ReactElement;
  if (query.isPending && !online) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        <PendingBanner message="Sem conexão" />
        <Text style={styles.stateText}>
          Sem conexão e sem dados salvos da equipe. Conecte-se para carregar.
        </Text>
      </ScrollView>
    );
  } else if (query.isPending) {
    body = (
      <View style={styles.state}>
        <ActivityIndicator accessibilityLabel="Carregando a equipe" />
        <Text style={styles.stateText}>Carregando a equipe</Text>
      </View>
    );
  } else if (query.isError && query.data === undefined) {
    body = (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          Não foi possível carregar a equipe.
        </Text>
        <DsButton
          label="Tentar de novo"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  } else if (!query.data) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {!online ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        <Text style={styles.stateText}>
          Você ainda não faz parte de uma equipe.
        </Text>
        {creating ? (
          <CreateClinicForm
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              toast.show("Equipe criada");
            }}
          />
        ) : (
          <DsButton
            label="Criar equipe"
            onPress={() => setCreating(true)}
            fullWidth
          />
        )}
        <Text style={styles.hint}>
          Recebeu um código? Use &quot;Entrar numa equipe&quot; no seu perfil.
        </Text>
      </ScrollView>
    );
  } else {
    const view = query.data;
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {!online ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        {permissions.canManageTeam ? (
          <SectionTitle
            title={view.clinic.name}
            actionLabel="Renomear"
            onActionPress={() => setRenaming(true)}
          />
        ) : (
          <Text style={styles.clinicName}>{view.clinic.name}</Text>
        )}
        {permissions.canInvite ? <InviteCard onMessage={toast.show} /> : null}
        {permissions.canInvite ? (
          <InvitesSection onMessage={toast.show} />
        ) : null}
        <View style={styles.group}>
          <SectionTitle
            title={`Profissionais ativos · ${view.members.length}`}
          />
          {view.members.map((member) => {
            const isMe = member.educatorId === educator?.id;
            return (
              <MemberRow
                key={member.educatorId}
                member={member}
                isMe={isMe}
                onManage={
                  permissions.canManageTeam && !isMe
                    ? () => setManaging(member)
                    : undefined
                }
              />
            );
          })}
        </View>
        {permissions.canLeaveTeam && educator ? (
          <DsButton
            label="Sair da equipe"
            variant="ghost"
            onPress={() => setPending({ kind: "leave" })}
            fullWidth
          />
        ) : null}
        <RenameClinicDialog
          key={renaming ? "open" : "closed"}
          visible={renaming}
          currentName={view.clinic.name}
          onClose={() => setRenaming(false)}
          onRenamed={() => {
            setRenaming(false);
            toast.show("Nome atualizado");
          }}
        />
        <ManageMemberDialog
          member={managing}
          onClose={() => setManaging(null)}
          onChangeRole={(member, role) => {
            setManaging(null);
            openPending({ kind: "role", member, role });
          }}
          onRemove={(member) => {
            setManaging(null);
            openPending({ kind: "remove", member });
          }}
        />
        <ConfirmDialog
          visible={pending !== null}
          title={confirmTitle(pending, view.clinic.name)}
          message={confirmMessage(pending)}
          confirmLabel={pending?.kind === "leave" ? "Sair" : "Confirmar"}
          loading={busy}
          error={actionError}
          onConfirm={() => confirmPending(educator?.id)}
          onCancel={() => setPending(null)}
        />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      {header}
      {body}
      <Toast message={toast.message} onHide={toast.hide} />
    </SafeAreaView>
  );
}
