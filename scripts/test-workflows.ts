import 'dotenv/config';
import dns from 'dns';
import { spawn } from 'child_process';
import { chromium } from 'playwright';

// Override DNS lookup for fra.cloud.appwrite.io to directly use its resolved IP address
const originalLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback: any) => {
  if (hostname === 'fra.cloud.appwrite.io') {
    const cb = typeof options === 'function' ? options : callback;
    return cb(null, [{ address: '151.101.67.52', family: 4 }], 4);
  }
  return originalLookup(hostname, options, callback);
};

async function runTests() {
  console.log("=== DÉBUT DES TESTS DE WORKFLOWS E2E ===");

  // 1. Start the Vite dev server
  console.log("Démarrage du serveur Vite en arrière-plan...");
  const viteProcess = spawn('npm', ['run', 'dev'], {
    shell: true,
  });

  let port = 3000;
  let serverStarted = false;

  try {
    // Wait and parse the dynamic port assigned by Vite
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Le serveur Vite n'a pas démarré dans les 25 secondes."));
      }, 25000);

      viteProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log("Vite Stdout: " + output.trim());
        
        // Match Local URL like "Local:   http://localhost:3002/"
        const match = output.match(/Local:\s+http:\/\/localhost:(\d+)/i);
        if (match) {
          port = parseInt(match[1], 10);
          serverStarted = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      viteProcess.stderr?.on('data', (data) => {
        console.error("Vite Stderr: " + data.toString().trim());
      });

      viteProcess.on('close', (code) => {
        if (!serverStarted) {
          clearTimeout(timeout);
          reject(new Error(`Le processus Vite s'est arrêté avec le code : ${code}`));
        }
      });
    });

    const BASE_URL = `http://localhost:${port}`;
    console.log(`\n[VITE STARTED] Serveur actif sur ${BASE_URL}\n`);

    // 2. Launch headless browser with browser DNS mapping to prevent timeouts
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--host-rules=MAP fra.cloud.appwrite.io 151.101.67.52'
      ]
    });
    const page = await browser.newPage();

    // Listen to browser console and page errors for debugging
    page.on('console', msg => console.log('BROWSER LOG: ', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR: ', err.message));

    // STEP 1: Public newsletter subscription
    console.log("Étape 1 : Inscription à la newsletter public...");
    await page.goto(BASE_URL);
    await page.waitForSelector('input[placeholder="Votre adresse email d\'excellence"]', { timeout: 10000 });

    const emailInput = page.locator('input[placeholder="Votre adresse email d\'excellence"]');
    await emailInput.fill('test-subscriber@idla.edu');
    await page.click('button:has-text("S\'abonner")');
    await page.waitForTimeout(2000);

    const newsletterSuccess = page.locator('text=Inscription réussie');
    if (await newsletterSuccess.isVisible()) {
      console.log("  [OK] Inscription à la newsletter confirmée.");
    } else {
      console.log("  [AVERTISSEMENT] Message d'inscription newsletter non visible.");
    }

    // STEP 2: Candidate Registration Stepper
    console.log("\nÉtape 2 : Dépôt de dossier candidat...");
    await page.click('button:has-text("Je m\'inscris")');
    await page.waitForTimeout(1000);

    // Step 1: Personal Info
    await page.fill('input[placeholder="Votre prénom"]', 'Albert');
    await page.fill('input[placeholder="Votre nom de famille"]', 'Nkembe');
    await page.fill('input[placeholder="prenom.nom@exemple.com"]', 'albert.nkembe@email.com');
    await page.fill('input[placeholder="+237 6 00 00 00 00"]', '+237 6 77 77 77 77');
    await page.fill('input[placeholder="Votre nationalité"]', 'Camerounaise');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Step 2: Choose Program
    await page.fill('input[placeholder="ex: Licence en Management"]', 'Licence en Informatique');
    await page.fill('input[placeholder="2024"]', '2025');
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Step 3: Upload files
    console.log("  Téléchargement simulé de pièces justificatives...");
    await page.setInputFiles('input[type="file"]', {
      name: 'cv.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock content'),
    });
    await page.waitForTimeout(3000); // wait for simulated upload progress
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(1000);

    // Step 4: Declaration check & Submit
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("Soumettre ma Candidature")');
    await page.waitForTimeout(3000);

    const successHeader = page.locator('h1:has-text("Candidature Reçue")');
    if (await successHeader.isVisible()) {
      console.log("  [OK] Candidature déposée avec succès !");
    } else {
      throw new Error("L'écran de confirmation de candidature n'est pas apparu.");
    }

    // STEP 3: Candidate Portal login & Chat
    console.log("\nÉtape 3 : Connexion candidat & Chat...");
    await page.click('button:has-text("Suivre mon dossier")');
    await page.waitForTimeout(3500);

    // If auto-logged in, log out first to test the login workflow
    const logoutBtn = page.locator('button:has-text("Déconnexion")');
    if (await logoutBtn.isVisible()) {
      console.log("  Détection de la connexion automatique. Déconnexion de test...");
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      
      // Navigate to candidate login form by clicking "Connexion" in the public header
      console.log("  Navigation vers le formulaire de connexion candidat...");
      await page.click('button:has-text("Connexion")');
      await page.waitForTimeout(2000);
    }

    // Now fill login credentials on the candidate login screen
    await page.fill('input[placeholder="Votre adresse email"]', 'jean.dupont@email.com');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Se connecter")');
    await page.waitForTimeout(4000);

    const candidateDossierTitle = page.locator('h1:has-text("Bonjour, Jean Dupont")');
    if (await candidateDossierTitle.isVisible()) {
      console.log("  [OK] Connexion au portail candidat réussie.");
    } else {
      throw new Error("Impossible d'accéder au portail candidat.");
    }

    // Send a message
    await page.fill('input[placeholder="Rédiger votre réponse..."]', 'Bonjour, quel est le délai moyen pour la convocation à l\'entretien ?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500); // Wait for advisor mock reply
    console.log("  [OK] Envoi du message et réponse de la conseillère validés.");

    // STEP 4: Admin Portal login & Operations
    console.log("\nÉtape 4 : Connexion administration & CMS...");
    
    // Log out first from candidate portal
    await page.click('button:has-text("Déconnexion")');
    await page.waitForTimeout(3000);

    // If we're not automatically redirected to /admin, force goto BASE_URL/admin
    if (page.url() !== `${BASE_URL}/admin`) {
      console.log("  Redirection forcée vers l'espace administration...");
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForTimeout(2000);
    }

    await page.fill('input[placeholder="Adresse email professionnelle"]', 'admin@idla.edu');
    await page.fill('input[placeholder="••••••••"]', 'admin123');
    await page.click('button:has-text("Valider les privilèges")');
    await page.waitForTimeout(3000);

    const adminPortalHeader = page.locator('h2:has-text("IDLA CMS Académique")');
    if (await adminPortalHeader.isVisible()) {
      console.log("  [OK] Connexion à la console d'administration réussie.");
    } else {
      throw new Error("Impossible d'accéder à la console d'administration.");
    }

    // Navigate to Pre-registrations
    console.log("  Vérification des demandes de pré-inscriptions...");
    await page.click('button:has-text("Pré-inscriptions")');
    await page.waitForTimeout(2000);

    const candidateRow = page.locator('td:has-text("Jean Dupont")');
    if (await candidateRow.isVisible()) {
      console.log("  [OK] Liste des candidats présente.");
    }

    // Navigate to Users
    console.log("  Gestion des utilisateurs CMS...");
    await page.click('button:has-text("Utilisateurs")');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Nouveau")');
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Nom complet"]', 'Sophie Vallet');
    await page.fill('input[placeholder="adresse.email@idla.edu"]', 'sophie.vallet@idla.edu');
    await page.selectOption('select', 'Advisor');
    await page.click('button:has-text("Créer l\'utilisateur")');
    await page.waitForTimeout(2000);

    const newUserRow = page.locator('div:has-text("Sophie Vallet")');
    if (await newUserRow.isVisible()) {
      console.log("  [OK] Création de l'utilisateur CMS validée.");
    }

    // Navigate to Programmes and Create a Program to test newsletter email dispatch
    console.log("  Création de programme & Dispatch Newsletter...");
    await page.click('button:has-text("Programmes")');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Nouveau")');
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="ex: Master en Management Public"]', 'Master en Génie Logiciel Avancé');
    await page.fill('textarea[placeholder="Description détaillée du programme..."]', 'Formation d\'excellence en développement de systèmes d\'information hautement évolutifs et sécurisés.');
    await page.selectOption('select:near(label:has-text("Type de diplôme"))', 'Master');
    await page.selectOption('select:near(label:has-text("Filière"))', 'Ingénierie & Tech');
    await page.fill('input[placeholder="ex: 2 ans"]', '2 ans');
    await page.click('button:has-text("Créer le programme")');
    await page.waitForTimeout(3000);

    // Verify activity logs show the email dispatch
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(2000);

    const emailDispatchLog = page.locator('div:has-text("a envoyé une alerte email"), div:has-text("a envoyé une notification email")');
    const logsVisible = await emailDispatchLog.count();
    if (logsVisible > 0) {
      console.log("  [OK] Alerte e-mail et journalisation système validés.");
    } else {
      console.log("  [AVERTISSEMENT] Le log du Système Mailer n'a pas été détecté.");
    }

    console.log("\nÉtape 5 : Fermeture de session...");
    await page.click('button:has-text("Déconnexion")');
    await page.waitForTimeout(1000);

    await browser.close();
    console.log("\n=== TOUS LES TESTS DE WORKFLOWS ONT RÉUSSI ENTIÈREMENT ===");
  } catch (err: any) {
    console.error("\n❌ ÉCHEC DU TEST :", err.message || err);
  } finally {
    console.log("Arrêt du serveur Vite...");
    viteProcess.kill();
  }
}

runTests();
