import type { ReactElement } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { FigmaIcon } from "@/components/FigmaIcon";
import { AppHeader, Avatar, FeatureRow, SectionTitle } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { useHomeData } from "@/features/home/useHomeData";
import { color, fontFamilies, shape } from "@/theme";

type ResourceItem = {
  title: string;
  subtitle: string;
  icon: "sparkles" | "chart" | "clipboard" | "book" | "file" | "users" | "play";
  destination?: "/activities" | "/reports" | "/anamnese/templates" | "/plans";
};

const featureGroups: readonly {
  title: string;
  items: readonly ResourceItem[];
}[] = [
  {
    title: "Planejamento personalizado",
    items: [
      {
        title: "Planos com IA",
        subtitle: "Crie planos personalizados com inteligência artificial",
        icon: "sparkles",
        destination: "/plans",
      },
      {
        title: "Evolução da sessão",
        subtitle: "Acompanhe o progresso de cada atendimento",
        icon: "chart",
      },
    ],
  },
  {
    title: "Avaliação e conteúdo",
    items: [
      {
        title: "Modelos de anamnese",
        subtitle: "Monte os questionários de anamnese",
        icon: "clipboard",
        destination: "/anamnese/templates",
      },
      {
        title: "Avaliações e escalas",
        subtitle: "Aplique instrumentos e acompanhe os resultados",
        icon: "clipboard",
      },
      {
        title: "Banco de atividades",
        subtitle: "Encontre atividades para suas sessões",
        icon: "book",
        destination: "/activities",
      },
      {
        title: "Cadernos e grupos",
        subtitle: "Monte cadernos e grupos de atividades",
        icon: "book",
        destination: "/activities",
      },
      {
        title: "Relatórios",
        subtitle: "Acompanhe os resultados e a evolução",
        icon: "file",
        destination: "/reports",
      },
    ],
  },
  {
    title: "Conta e suporte",
    items: [
      {
        title: "Equipe e convites",
        subtitle: "Gerencie a equipe e seus acessos",
        icon: "users",
      },
      {
        title: "Central de ajuda",
        subtitle: "Tire dúvidas e veja como usar o app",
        icon: "play",
      },
    ],
  },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 24, paddingBottom: 36 },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: color.surface,
    borderRadius: shape.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  profileCopy: { flex: 1, gap: 2 },
  profilePhoto: { width: 46, height: 46, borderRadius: 23 },
  profileName: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  profileRole: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  group: { gap: 10 },
  featureList: {
    overflow: "hidden",
    backgroundColor: color.surface,
    borderRadius: shape.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
});

export function ResourcesScreen(): ReactElement {
  const router = useRouter();
  const { educator } = useHomeData();
  const educatorName = educator?.name ?? "Educador(a)";

  const openComingSoon = (title: string) =>
    router.push({ pathname: "/shell/coming-soon", params: { title } });

  return (
    <View style={styles.screen}>
      <AppHeader title="Recursos" subtitle="Tudo em um só lugar" />
      <ScrollView contentContainerStyle={styles.content}>
        <StaticPressable
          accessibilityRole="button"
          accessibilityLabel="Perfil"
          onPress={() => router.push("/profile")}
          style={styles.profileBanner}
        >
          {educator?.photoUrl ? (
            <Image
              source={{ uri: educator.photoUrl }}
              style={styles.profilePhoto}
              accessibilityLabel={educatorName}
            />
          ) : (
            <Avatar name={educatorName} tone="lavender" />
          )}
          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>{educatorName}</Text>
            {educator?.profession || educator?.email ? (
              <Text style={styles.profileRole}>
                {educator.profession || educator.email}
              </Text>
            ) : null}
          </View>
          <FigmaIcon name="chevron" size={18} color={color.ink[500]} />
        </StaticPressable>

        {featureGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionTitle title={group.title} />
            <View style={styles.featureList}>
              {group.items.map((item) => (
                <FeatureRow
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() =>
                    item.destination
                      ? router.push(item.destination)
                      : openComingSoon(item.title)
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
