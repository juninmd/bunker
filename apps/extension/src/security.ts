// src/security.ts
export async function initSecurityDashboard() {
  const weakList = document.getElementById('weak-list');
  if (weakList) {
    weakList.innerHTML = '<li>Nenhuma senha fraca encontrada no momento. (Feature em desenvolvimento)</li>';
  }
}

document.addEventListener('DOMContentLoaded', initSecurityDashboard);
