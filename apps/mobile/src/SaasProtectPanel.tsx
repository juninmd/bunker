import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconButton } from './components/IconButton';
import { colors, spacing, fontSize, fontWeight, radius } from './theme';

interface Props {
  data: any[];
  onClose: () => void;
}

const CORPORATE_DOMAINS = ['slack', 'google', 'aws', 'microsoft', 'okta', 'github'];

export function SaasProtectPanel({ data, onClose }: Props) {
  const corporateApps = Array.from(
    new Set(
      data
        .filter(item => item.site && CORPORATE_DOMAINS.some(domain => item.site.toLowerCase().includes(domain)))
        .map(item => item.site)
    )
  ).slice(0, 10); // Limit display to avoid massive lists

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SaaS Protect</Text>
        <IconButton icon="minus" onPress={onClose} accessibilityLabel="Fechar" />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scoreCard}>
          <Text style={[styles.scoreNum, { color: colors.ok }]}>100</Text>
          <View>
            <Text style={styles.scoreTitle}>Ativo</Text>
            <Text style={styles.scoreSubtitle}>Monitoramento corporativo funcionando.</Text>
          </View>
        </View>

        <View style={styles.issuesCard}>
          <Issue label="Aplicações Monitoradas" count={corporateApps.length} />
          <View style={styles.appList}>
            {corporateApps.length > 0 ? (
              corporateApps.map(app => (
                <Text key={app} style={styles.appItem}>{app}</Text>
              ))
            ) : (
              <Text style={styles.appItem}>Nenhuma aplicação corporativa detectada.</Text>
            )}
          </View>
        </View>

        <Text style={styles.note}>
          O SaaS Protect monitora o uso de credenciais corporativas no dispositivo.
        </Text>
      </ScrollView>
    </View>
  );
}

function Issue({ label, count }: { label: string, count: number }) {
  return (
    <View style={styles.issue}>
      <Text style={styles.issueLabel}>{label}</Text>
      <Text style={[styles.issueCount, styles.issueGood]}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.lg,
  },
  scoreNum: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
  },
  scoreTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
  },
  scoreSubtitle: {
    color: colors.muted,
    fontSize: fontSize.label,
    marginTop: spacing.xs,
  },
  issuesCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  issue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  issueLabel: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  issueCount: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  issueGood: { color: colors.muted },
  appList: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  appItem: {
    color: colors.text,
    fontSize: fontSize.body,
    paddingVertical: spacing.xs,
  },
  note: {
    color: colors.muted,
    fontSize: fontSize.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
