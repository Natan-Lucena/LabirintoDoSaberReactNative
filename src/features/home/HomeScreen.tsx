import type { ReactElement } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { PendingBanner } from "@/components/PendingBanner";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { ContentCard } from "@/features/content/ContentCard";
import { CompletedSessionCard } from "@/features/home/components/CompletedSessionCard";
import { GreetingBanner } from "@/features/home/components/GreetingBanner";
import { ScheduledSessionCard } from "@/features/home/components/ScheduledSessionCard";
import { useHomeQuery } from "@/features/home/useHomeData";
import { useOnline } from "@/hooks/useOnline";
import { color } from "@/theme";

const statusLabels = {
  PENDING: "Pendente",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
} as const;

const ACCENTS = ["primary", "info", "success"] as const;

const categoryLabels = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
} as const;

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  section: { gap: 10 },
  carousel: { gap: 10, paddingRight: 4 },
  state: { flex: 1, justifyContent: "center" },
  fallback: { color: color.textSecondary },
});

export function HomeScreen(): ReactElement {
  const router = useRouter();
  const isOnline = useOnline();
  const { data, isPending, isError, refetch } = useHomeQuery();

  if (isPending && !data) {
    return (
      <Screen style={styles.state}>
        <LoadingState label="Carregando Home" />
      </Screen>
    );
  }

  if (isError && !data) {
    return (
      <Screen style={styles.state}>
        <ErrorState
          message="Não foi possível carregar a Home."
          onRetry={refetch}
        />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={styles.state}>
        <LoadingState label="Carregando Home" />
      </Screen>
    );
  }

  const openComingSoon = (title: string) =>
    router.push({ pathname: "/shell/coming-soon", params: { title } });

  return (
    <Screen scroll style={styles.content}>
      {!isOnline ? (
        <PendingBanner message="Sem conexão - mostrando dados salvos" />
      ) : null}
      <GreetingBanner
        educatorName={data.educator?.name ?? "Educador(a)"}
        appointmentsTodayCount={data.scheduledAppointmentsCount}
        onStartSession={() => router.push("/session/student")}
      />
      {data.todayAppointments.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Sessões de hoje" />
          {data.todayAppointments.map(({ appointment, student }, index) => (
            <ScheduledSessionCard
              key={appointment.id}
              studentName={student?.name ?? "Aluno não encontrado"}
              scheduledAt={new Date(appointment.scheduledAt)}
              statusLabel={statusLabels[appointment.status]}
              accent={index % 2 === 0 ? "primary" : "pink"}
              onPress={() => openComingSoon("Agenda")}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeader
          title="Últimas Sessões Realizadas"
          actionLabel="Ver todas →"
          onActionPress={() => openComingSoon("Relatórios")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {data.lastSessions.map((session, index) => (
            <CompletedSessionCard
              key={`${session.studentName ?? "session"}-${session.sessionName}-${index}`}
              studentName={session.studentName}
              sessionName={session.sessionName}
              accent={ACCENTS[index % ACCENTS.length]}
              onPress={() => openComingSoon("Relatórios")}
            />
          ))}
        </ScrollView>
      </View>
      {data.todayAppointments.length === 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Atividades Recentes" />
          {data.recentNotebooks.map(({ notebook }) => (
            <ContentCard
              key={notebook.id}
              description={notebook.description}
              tags={[
                categoryLabels[notebook.category],
                `${notebook.tasks.length} atividades`,
              ]}
              accessibilityLabel={notebook.description}
              onPress={() => openComingSoon("Atividades")}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
