import { useState, type ReactElement } from "react";
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
import { CreateClinicForm } from "@/features/team/components/CreateClinicForm";
import { InviteCard } from "@/features/team/components/InviteCard";
import { MemberRow } from "@/features/team/components/MemberRow";
import { useClinic } from "@/features/team/useClinic";
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

export function TeamScreen(): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const query = useClinic();
  const { data: educator } = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  const [creating, setCreating] = useState(false);

  const header = (
    <AppHeader
      title="Equipe e convites"
      subtitle="Gestão da clínica"
      onBack={router.back}
    />
  );

  let body: ReactElement;
  if (query.isPending) {
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
        <Text style={styles.clinicName}>{view.clinic.name}</Text>
        {view.myRole === "ADMIN" ? <InviteCard onMessage={toast.show} /> : null}
        <View style={styles.group}>
          <SectionTitle
            title={`Profissionais ativos · ${view.members.length}`}
          />
          {view.members.map((member) => (
            <MemberRow
              key={member.educatorId}
              member={member}
              isMe={member.educatorId === educator?.id}
            />
          ))}
        </View>
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
