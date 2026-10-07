// Barrel do design system (Figma Make). DS-03 possui as linhas abaixo; a
// DS-04 acrescenta as suas (Field, SelectField, DateField, TimeField,
// SearchField) sem remover estas.
export { DsButton } from "./DsButton";
export type { DsButtonProps, DsButtonVariant } from "./DsButton";

export { IconButton } from "./IconButton";
export type { IconButtonProps } from "./IconButton";

export { BackButton } from "./BackButton";
export type { BackButtonProps } from "./BackButton";

export { Switch } from "./Switch";
export type { SwitchProps } from "./Switch";

export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";

export { CheckList } from "./CheckList";
export type { CheckListOption, CheckListProps } from "./CheckList";

export { SegmentedControl } from "./SegmentedControl";
export type {
  SegmentedControlProps,
  SegmentedOption,
} from "./SegmentedControl";

export { FilterChip, FilterRow } from "./FilterChip";
export type {
  FilterChipOption,
  FilterChipProps,
  FilterRowProps,
} from "./FilterChip";

export { Tabs } from "./Tabs";
export type { TabOption, TabsProps } from "./Tabs";

// DS-04: campos e formulários (barrel próprio, integrado aqui pela DS-05).
export * from "./fields";

// DS-05: cards e blocos (Figma Make).
export { Avatar } from "./Avatar";
export type { AvatarProps, AvatarTone } from "./Avatar";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant } from "./Badge";

export { InfoCard } from "./InfoCard";
export type { InfoCardAction, InfoCardProps } from "./InfoCard";

export { SectionTitle } from "./SectionTitle";
export type { SectionTitleProps } from "./SectionTitle";

export { FeatureRow } from "./FeatureRow";
export type { FeatureRowProps } from "./FeatureRow";

export { ProgressBar } from "./ProgressBar";
export type { ProgressBarProps } from "./ProgressBar";

export { MiniBars } from "./MiniBars";
export type { MiniBarsProps } from "./MiniBars";

export { Toast, useToast } from "./Toast";
export type { ToastProps, UseToastResult } from "./Toast";

export { SuccessPanel } from "./SuccessPanel";
export type { SuccessPanelProps } from "./SuccessPanel";

export { AIContext } from "./AIContext";
export type { AIContextProps } from "./AIContext";

export { AIInsight } from "./AIInsight";
export type { AIInsightProps } from "./AIInsight";

export { AIHero } from "./AIHero";
export type { AIHeroAction, AIHeroProps } from "./AIHero";

export { InsightCard } from "./InsightCard";
export type { InsightCardProps } from "./InsightCard";

export { PrivacyNote } from "./PrivacyNote";
export type { PrivacyNoteProps } from "./PrivacyNote";

export { Fab } from "./Fab";
export type { FabProps } from "./Fab";

export { Timeline } from "./Timeline";
export type {
  TimelineItemData,
  TimelineItemStatus,
  TimelineProps,
} from "./Timeline";

// NAV-01/NAV-02: casca nova (abas e cabeçalho) do Figma Make.
export { BottomNav } from "./BottomNav";
export type { BottomNavItem, BottomNavProps } from "./BottomNav";

export { AppHeader } from "./AppHeader";
export type { AppHeaderProps } from "./AppHeader";
