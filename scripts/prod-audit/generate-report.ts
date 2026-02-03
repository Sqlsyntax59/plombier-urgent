import * as fs from 'fs';
import * as path from 'path';

interface AuditData {
  timestamp: string;
  baseUrl: string;
  availability: {
    ok: boolean;
    statusCode: number;
    responseTime: number;
    httpsValid: boolean;
    error?: string;
  };
  routes: {
    discovered: string[];
    tested: { url: string; status: number; ok: boolean }[];
    errors4xx: { url: string; status: number }[];
    errors5xx: { url: string; status: number }[];
  };
  brokenLinks: { source: string; href: string; status: number }[];
  networkRequests: {
    endpoints: { url: string; method: string; status: number }[];
    errors: { url: string; method: string; status: number; error?: string }[];
  };
  auth: {
    loginPageAccessible: boolean;
    loginTested: boolean;
    loginSuccess?: boolean;
    protectedPageAccess?: boolean;
    logoutSuccess?: boolean;
    error?: string;
  };
  consoleErrors: { page: string; message: string; type: string }[];
  security: {
    https: boolean;
    csp: string | null;
    cookiesSecure: boolean;
    xFrameOptions: string | null;
    strictTransportSecurity: string | null;
  };
  verdict: 'GO' | 'NO-GO';
  reasons: string[];
}

function generateReport(data: AuditData): string {
  const verdictEmoji = data.verdict === 'GO' ? '✅' : '❌';
  const verdictColor = data.verdict === 'GO' ? 'green' : 'red';

  return `# AUDIT DE PRODUCTION - Plombier Urgent

**Date:** ${new Date(data.timestamp).toLocaleString('fr-FR')}
**URL Testée:** ${data.baseUrl}

---

## ${verdictEmoji} VERDICT: **${data.verdict}**

${data.reasons.length > 0 ? `
### Raisons du verdict NO-GO:
${data.reasons.map(r => `- ❌ ${r}`).join('\n')}
` : '### Tous les tests ont passé avec succès.'}

---

## 1. Disponibilité

| Métrique | Valeur | Status |
|----------|--------|--------|
| Site accessible | ${data.availability.ok ? 'Oui' : 'Non'} | ${data.availability.ok ? '✅' : '❌'} |
| Code HTTP | ${data.availability.statusCode} | ${data.availability.statusCode === 200 ? '✅' : '⚠️'} |
| Temps de réponse | ${data.availability.responseTime}ms | ${data.availability.responseTime < 3000 ? '✅' : '⚠️'} |
| HTTPS valide | ${data.availability.httpsValid ? 'Oui' : 'Non'} | ${data.availability.httpsValid ? '✅' : '❌'} |

${data.availability.error ? `**Erreur:** ${data.availability.error}` : ''}

---

## 2. Routes Testées

### Routes découvertes (${data.routes.discovered.length})

\`\`\`
${data.routes.discovered.join('\n')}
\`\`\`

### Résultats des tests

| Route | Status | OK |
|-------|--------|-----|
${data.routes.tested.map(r => `| ${r.url} | ${r.status} | ${r.ok ? '✅' : '❌'} |`).join('\n')}

${data.routes.errors4xx.length > 0 ? `
### Erreurs 4xx (${data.routes.errors4xx.length})
${data.routes.errors4xx.map(e => `- \`${e.url}\` → ${e.status}`).join('\n')}
` : '### Aucune erreur 4xx ✅'}

${data.routes.errors5xx.length > 0 ? `
### ❌ Erreurs 5xx (${data.routes.errors5xx.length})
${data.routes.errors5xx.map(e => `- \`${e.url}\` → ${e.status}`).join('\n')}
` : '### Aucune erreur 5xx ✅'}

---

## 3. Liens Cassés

${data.brokenLinks.length > 0 ? `
### ❌ ${data.brokenLinks.length} liens cassés trouvés

| Page Source | Lien | Status HTTP |
|-------------|------|-------------|
${data.brokenLinks.map(l => `| ${l.source} | ${l.href} | ${l.status} |`).join('\n')}
` : '### ✅ Aucun lien interne cassé'}

---

## 4. Santé Backend/API

### Endpoints observés (${data.networkRequests.endpoints.length})

${data.networkRequests.endpoints.slice(0, 20).map(e => `- \`${e.method}\` ${e.url.substring(0, 80)} → ${e.status}`).join('\n')}
${data.networkRequests.endpoints.length > 20 ? `\n... et ${data.networkRequests.endpoints.length - 20} autres` : ''}

${data.networkRequests.errors.length > 0 ? `
### ❌ Erreurs Backend (${data.networkRequests.errors.length})
${data.networkRequests.errors.map(e => `- \`${e.method}\` ${e.url} → ${e.status} ${e.error || ''}`).join('\n')}
` : '### ✅ Aucune erreur backend 5xx observée'}

---

## 5. Authentification

| Test | Résultat |
|------|----------|
| Page login accessible | ${data.auth.loginPageAccessible ? '✅ Oui' : '❌ Non'} |
| Test login complet | ${data.auth.loginTested ? (data.auth.loginSuccess ? '✅ Succès' : '❌ Échec') : '⏭️ Non testé (pas de credentials)'} |
| Accès page protégée | ${data.auth.protectedPageAccess !== undefined ? (data.auth.protectedPageAccess ? '✅ OK' : '❌ KO') : 'N/A'} |
| Logout | ${data.auth.logoutSuccess !== undefined ? (data.auth.logoutSuccess ? '✅ OK' : '❌ KO') : 'N/A'} |

${data.auth.error ? `**Erreur:** ${data.auth.error}` : ''}

---

## 6. Erreurs Console

${data.consoleErrors.length > 0 ? `
### ⚠️ ${data.consoleErrors.length} erreurs console détectées

| Page | Type | Message |
|------|------|---------|
${data.consoleErrors.slice(0, 10).map(e => `| ${e.page} | ${e.type} | ${e.message.substring(0, 60)}... |`).join('\n')}
` : '### ✅ Aucune erreur console critique'}

---

## 7. Sécurité (Headers HTTP)

| Header | Valeur | Status |
|--------|--------|--------|
| HTTPS | ${data.security.https ? 'Actif' : 'Non'} | ${data.security.https ? '✅' : '❌'} |
| Content-Security-Policy | ${data.security.csp ? 'Présent' : 'Absent'} | ${data.security.csp ? '✅' : '⚠️'} |
| X-Frame-Options | ${data.security.xFrameOptions || 'Absent'} | ${data.security.xFrameOptions ? '✅' : '⚠️'} |
| Strict-Transport-Security | ${data.security.strictTransportSecurity ? 'Présent' : 'Absent'} | ${data.security.strictTransportSecurity ? '✅' : '⚠️'} |

---

## Résumé Exécutif

| Catégorie | Status |
|-----------|--------|
| Disponibilité | ${data.availability.ok ? '✅ OK' : '❌ KO'} |
| Routes publiques | ${data.routes.errors5xx.length === 0 ? '✅ OK' : '❌ KO'} |
| Liens internes | ${data.brokenLinks.length === 0 ? '✅ OK' : '❌ KO'} |
| Backend API | ${data.networkRequests.errors.filter(e => e.status >= 500).length === 0 ? '✅ OK' : '❌ KO'} |
| Authentification | ${data.auth.loginPageAccessible ? '✅ OK' : '❌ KO'} |
| Sécurité HTTPS | ${data.security.https ? '✅ OK' : '❌ KO'} |

---

## Conclusion

${data.verdict === 'GO' ? `
### ✅ Le site est prêt pour la production

Tous les critères essentiels sont validés:
- Le site est accessible et répond correctement
- Aucune erreur serveur (5xx)
- Aucun lien interne cassé
- L'authentification est fonctionnelle
- HTTPS est correctement configuré
` : `
### ❌ Des corrections sont nécessaires avant la mise en production

**Actions requises:**
${data.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`}

---

*Rapport généré automatiquement par l'audit Playwright le ${new Date().toLocaleString('fr-FR')}*
`;
}

// Main execution
const auditDataPath = path.join(__dirname, 'audit-data.json');
const reportPath = path.join(__dirname, '..', '..', 'AUDIT_PROD_REPORT.md');

if (fs.existsSync(auditDataPath)) {
  const auditData: AuditData = JSON.parse(fs.readFileSync(auditDataPath, 'utf-8'));
  const report = generateReport(auditData);
  fs.writeFileSync(reportPath, report);
  console.log(`Report generated: ${reportPath}`);
} else {
  console.error('audit-data.json not found. Run the audit first.');
  process.exit(1);
}
