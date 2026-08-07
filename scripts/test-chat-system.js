import { chromium } from 'playwright';

async function testChatSystem() {
  console.log('🧪 Démarrage du test automatisé E2E de la messagerie...');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Initialiser le LocalStorage avant navigation
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('idla_portal_role', 'student');
    sessionStorage.setItem('idla_portal_session_email', 'test.student@idla.edu');
    localStorage.setItem('candidate_logged_in', 'true');
    localStorage.setItem('idla_student_selected_course', 'Algorithmique et Structures de Données');
    localStorage.setItem('idla_student_selected_level', 'L1');
    localStorage.setItem('idla_local_applications', JSON.stringify([
      { id: 'app_test_1', program: 'MSc in Computer Science', entryLevel: 'L1', status: 'Accepted', matricule: '26IDLATEST', email: 'test.student@idla.edu' }
    ]));
    localStorage.setItem('idla_local_courses', JSON.stringify([
      { id: 'c_test_1', code: 'INF101', title: 'Algorithmique et Structures de Données', program: 'MSc in Computer Science', level: 'L1', volumeCM: 20, volumeTD: 10, volumeTP: 10 }
    ]));
  });

  // Navigation vers la messagerie de cours
  await page.goto('http://localhost:3000/etudiant/discussion', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('✅ Navigation à l\'Espace Discussion Étudiant effectuée.');

  // 2. Remplir le champ texte et valider par la touche Entrée
  const messageInput = page.locator('form input[type="text"]').first();
  const testMsgText = `Message Test Automatise ${Date.now()}`;

  if (await messageInput.isVisible()) {
    await messageInput.fill(testMsgText);
    console.log('✅ Message renseigné dans l\'input :', testMsgText);

    // Envoi par Entrée (outrepasse les éléments superposés)
    await messageInput.press('Enter');
    console.log('✅ Touche Entrée pressée pour envoyer.');

    await page.waitForTimeout(1000);

    const countInDom = await page.locator(`text="${testMsgText}"`).count();
    console.log(`📊 Message affiché immédiatement dans la vue : ${countInDom > 0 ? 'OUI ✓' : 'NON ❌'}`);

    // 3. Rafraîchissement (F5) et contrôle de persistance
    console.log('🔄 Rechargement de la page (F5 / Refresh)...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const countAfterF5 = await page.locator(`text="${testMsgText}"`).count();
    console.log(`📊 Message affiché APRÈS rafraîchissement (F5) : ${countAfterF5 > 0 ? 'OUI ✓' : 'NON ❌'}`);

    if (countInDom > 0 && countAfterF5 > 0) {
      console.log('🎉 SUCCÈS TOTAL DU TEST : Les messages partent immédiatement et restent 100% conservés après rafraîchissement F5 !');
    } else {
      console.error('❌ Échec de la vérification de persistance.');
      process.exit(1);
    }
  } else {
    console.error('❌ Zone de texte introuvable.');
    process.exit(1);
  }

  await browser.close();
}

testChatSystem().catch(err => {
  console.error("❌ Erreur pendant le test:", err);
  process.exit(1);
});
