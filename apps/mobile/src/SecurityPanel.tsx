import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SecondaryButton } from './components/SecondaryButton';
import { IconButton } from './components/IconButton';
import { colors, spacing, fontSize, fontWeight, radius } from './theme';
import { buildSecurityReport, findLeaked } from './core/security-report';
import type { VaultItem } from './types';

interface Props {
  data: VaultItem[];
  onClose: () => void;
}

export function SecurityPanel({ data, onClose }: Props) {
  const [leaked, setLeaked] = useState<VaultItem[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const report = buildSecurityReport(data);
  const level = report.score >= 80 ? colors.ok : report.score >= 50 ? colors.warn : colors.danger;
  const title = !report.total ? 'Sem dados ainda' : report.score >= 80 ? 'Cofre saudável' : report.score >= 50 ? 'Pode melhorar' : 'Atenção necessária';
  const subtitle = report.total ? `${report.total} logins analisados. ${report.withoutTotp} ainda sem 2FA no cofre.` : 'Adicione logins para ver a saúde do cofre.';

  const handleCheckLeaked = async () => {
    setIsChecking(true);
    try {
      const result = await findLeaked(data);
      setLeaked(result);
    } catch {
      setLeaked(null);
    }
    setIsChecking(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saúde do Cofre</Text>
        <IconButton icon="minus" onPress={onClose} accessibilityLabel="Fechar" />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scoreCard}>
          <Text style={[styles.scoreNum, { color: level }]}>{report.total ? report.score : '—'}</Text>
          <View>
            <Text style={styles.scoreTitle}>{title}</Text>
            <Text style={styles.scoreSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.issuesCard}>
          <Issue label="Senhas fracas" count={report.weak.length} items={report.weak} />
          <Issue label="Senhas repetidas" count={report.reused.length} items={report.reused} />
          <Issue label="Sem troca há 1 ano" count={report.old.length} items={report.old} />
          <Issue label="Vazadas" count={leaked ? leaked.length : null} items={leaked} hint='Toque em "Verificar vazamentos"' />
        </View>

        <SecondaryButton
          title={leaked === null ? 'Verificar vazamentos' : 'Verificar de novo'}
          icon="sync"
          onPress={handleCheckLeaked}
        />
        <Text style={styles.note}>
          Só os 5 primeiros caracteres do hash de cada senha são enviados ao Have I Been Pwned. A senha nunca sai do dispositivo.
        </Text>
      </ScrollView>
    </View>
  );
}

function Issue({ label, count, items, hint }: { label: string, count: number | null, items: any[] | null, hint?: string }) {
  return (
    <View style={styles.issue}>
      <Text style={styles.issueLabel}>{label}</Text>
      <Text style={[styles.issueCount, count && count > 0 ? styles.issueBad : styles.issueGood]}>
        {count === null ? '—' : count}
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
  issueBad: { color: colors.danger },
  note: {
    color: colors.muted,
    fontSize: fontSize.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
