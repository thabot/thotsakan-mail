import { MachineFingerprintService } from '../services/machine-fingerprint.service.js';

async function main() {
  const service = new MachineFingerprintService();
  const fingerprint = await service.getFingerprint();

  console.log('\n' + '='.repeat(60));
  console.log('🛡️  THOTSAKAN MAIL ENGINE - MACHINE FINGERPRINT');
  console.log('='.repeat(60));
  console.log(`  Machine ID:   ${fingerprint.machineId}`);
  console.log(`  Platform:     ${fingerprint.platform}`);
  console.log(`  Hostname:     ${fingerprint.hostname}`);
  console.log(`  CPU:          ${fingerprint.cpuModel} (${fingerprint.cpuCores} cores)`);
  console.log(`  Container:    ${fingerprint.isContainer ? 'Yes (Docker/K8s)' : 'No (Bare-metal / Host VM)'}`);
  console.log('='.repeat(60));
  console.log('👉 Provide the \'Machine ID\' above to receive your signed license key.');
  console.log('='.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('Failed to generate machine fingerprint:', err);
  process.exit(1);
});
