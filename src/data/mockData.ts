import { Program, NewsArticle, Testimonial, User, PreRegistration, ActivityLog, Donation, Campaign } from '../types';

export const programsData: Program[] = [
  {
    id: 'prog-1',
    title: 'Ingénierie & Technologie',
    description: 'Informatique, Intelligence Artificielle et Systèmes Embarqués.',
    type: 'Master',
    category: 'Tech',
    duration: '2 ans (Full-time)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUtIEydjge_EXT1L9pfV2XddbQHo51hwM4dcReAiVfQXR8z0mG-EXYOM4fbQKGDpCJNFZ4LeBQqKxk6uOxSXzaAn3GvCI467OHg8hNbbsSqjy0ZRL3twaTcCsHv3jM5h5DSIftODKbl8qnzPCd08KwVUsoMqnz9cpIdh43RVdGmXUdOLiT7U3wu_Px4PpIZrGypvMc0Vuys-0zesD7Ic4e7x4siVQ0TZouFrEjfHQr1Eyii_9eRWFtbVrfNvWENTj6Yg8lOKNwrJE',
    isNew: true
  },
  {
    id: 'prog-2',
    title: 'Management & Finance',
    description: 'Executive MBA Stratégie Digitale pour les futurs dirigeants d\'organisations.',
    type: 'Master',
    category: 'Management',
    duration: '18 mois (Part-time)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh9h3O-3okEfpXeS3OpSZdI9iyRktsPTbJETnpi__eKUq0TTG6zfAPuGpQ8_pSPv6PnRE63nqy1fS2e287MIjANmTaauSRkOZn1oIExgZFS9q9MeMnX9yRx9GCtob5yObhI4yt_9pjdXH3G4nBGOdsFZvTmITYLCLZ-oGhck6zK_leGO9S4auIMhw0nSPUycI7Cp81hJN3xm_iJAX-pxMb9q5KxP2Q7ds72WV74kaMh-KZdZGjbB06HLRHbPNpeHAc-BReZXdgjME',
  },
  {
    id: 'prog-3',
    title: 'Doctorat en Intelligence Artificielle',
    description: 'Recherche avancée sur les algorithmes d\'apprentissage profond et éthiques.',
    type: 'Doctorat',
    category: 'Tech',
    duration: '3-4 ans (Recherche)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEpK0m05XsrS4057MmVSJa2u_UyjeVVST0S7zdZpAZ4-_oAfvA95Jb2QDvrYN5a5r_Tyv_knIlVOKpWa7NvTaIIPC9Bh0M8m3Buop3cKnBHtmZhZbIyr8m4dn6OC75nB1Chu-0visWTLbA0RCWroAcv1JelN809Y9Oiqtp4W6kp6yfgiFyUAJJbwOsM1UG15Nvw0S5_HLj9VdXz-g8YYWfUcfnDEJ-UJFMif-pm7YXiKH792OIYwS1ccd_j9kZ0xE5_JDpxuesJkE',
  },
  {
    id: 'prog-4',
    title: 'Bachelor en Design Environnemental',
    description: 'Apprenez à concevoir des espaces urbains résilients et respectueux de l\'écosystème.',
    type: 'Bachelor',
    category: 'Sciences',
    duration: '3 ans (Full-time)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTogdiLpJD2Mq01JkeVDFdQ18Pp68ZofQG7hUiXC2PSviBhSgYsL-b75FpQ66xDipY_ff_TUb0tnTnac5X9oNOTwzxWC59F_4p5Z1GZbbG0xSpSfi0zrhzGdrbNIxCPbY9BPIXfD1to1si640cO5ErIHSkTBZzqwO9ls48F4H1X4B5ccL5Fi8ip0YVgBJzvBAJkD3CWUBQOWr2n5xrO01RYi7V8Nowg3c0lvg88KTRHISdBY4O0oGiUyC36CVtJQdDrXDBPLiIKI',
  },
  {
    id: 'prog-5',
    title: 'Gestion de Crise Sanitaire',
    description: 'Développez des compétences stratégiques pour gérer les urgences épidémiologiques.',
    type: 'Master',
    category: 'Santé',
    duration: '2 ans (Modulable)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5SxJpMzwFY9GH00lCDOysjifFxB06WMaPWa-XIe69li7gpBzKycx0VPZt41k-U9yhY5onnqzyPH3zzgojFcInqzhvpULBxBjePih-zUJH-lp4l-2lsx84TVNp4MTOVDtMaAZYqXygk3vqp4Pahdr5iucBdnyeiDmEYCRWs2Dp4PJVHAzRlaBx2PJJiQWHC95CsX9N4PnBd__Auj2Ko0jf5ZE9ByCZPDXw4CyluK38ME3B6hVtCLZqttCXY1GR1pzxk8jn-PnyrzE',
  },
  {
    id: 'prog-6',
    title: 'Droit International des Affaires',
    description: 'Spécialisation avancée pour les juristes souhaitant opérer dans un contexte globalisé.',
    type: 'Certification',
    category: 'Droit',
    duration: '1 an (Intensif)',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXCUARYZZoMQTL2rrM9oxQjdcYTG-DjRSQyxAHyJEoSMxxv5xqBcQ_tbiLpLXA0EBbdHLX7llGZEJfEc3X_7NaScACNdiB37Nwtk4eW1Q_GD2ioZCAfFCfA6hfkgIdFpLWSCfGrkBkzFHyKXR_swlIT0osZsguHbdve1mJr7okh_WL39md6AfFzTQAN5Mz56smX17TALR4wi_gmAoO6F1gUZcIMnUraLR97Epu9lGGIMkRDuG9wD8FxKxFXRZrXvynPpewBp5g8kw',
  }
];

export const newsData: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Lancement de la nouvelle Promotion IDLA 2024',
    description: 'La cérémonie de rentrée a réuni plus de 500 nouveaux étudiants et partenaires académiques pour une journée d\'innovation et de partage.',
    date: '12 Oct 2024',
    category: 'Événements',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBprjRyAEXjYmXbz5vHtB36U12cqHK2zv20a-rFQ2HdZ2DZjeymPSsz_V6UXyYNHHgMsnotqkjxXGnNRFEKUE8IWl9pa_8WCGlCOAVJ3G7-wDo1noNDgt_d6b3rukhDDwJUQVHxrDTfZiabgnX3b5_3w0H0pkjJ2bXUrgvNnsTnRqXXXoUcc2mPJDYPzO62QAmGZ7-zotZyNNlLbr0cXR46TmNs4sWGZ-fOCX8Ekh6hBtRP6HX0qTDwuxL8TcezQpcUprTjE2GTI2k',
    isFeatured: true
  },
  {
    id: 'news-2',
    title: 'Signature d\'accord de partenariat avec HEC Paris',
    description: 'L\'IDLA renforce son réseau international avec un nouveau programme d\'échange exclusif pour les diplômés et cadres de la région.',
    date: '08 Oct 2024',
    category: 'Partenariats',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlJ-29doIxBrQ7Zgd4NwmTgzc2AaYLacq1DIrpAzCC_lTCvkzHHck-JPro51zlopmnuGxy4X7cbMpqaNJ8CNuvYRiL50pUrJZM4WfYDfI0WNhMGKbVmyANIMs3p7BvYcX4_hbJ8NL-Yv6uLxdz907_mOIxSg7HgvxPoaOGbL3CqGDeSvjeFloKUO6O6ECyak0pDBKhLr7ituwCyNH23bzPS_5raantAQqy_o6wA10aNV5etf5v1R4B968EU1GHbn0pZOqJnhTuVmM',
  },
  {
    id: 'news-3',
    title: 'Nouveau Master de pointe en Intelligence Artificielle',
    description: 'Le cursus académique de l\'IDLA s\'enrichit d\'une spécialisation de pointe répondant aux besoins croissants du marché technologique africain.',
    date: '05 Oct 2024',
    category: 'Académique',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDp8-dtjJTsc5CoXaHL4c3GKlMxlCqOAvnOADUYwSHQu3PdFMBH0WkFEeAw4r-FHu_Huwjl_m3XVtmIgdfHSo3in7Wpl_s66wg7XzQOpXYissj5ubyCR69Lb7gVfHC15qe-4d0L3byg9CZAkj_cTtV2iHwpqvAr7wzDJ5-zswLXowg110jRYm8BwpphMBnsJYelYRMNNwBy-7gghVU9KW4K3nHWWiP3RCODdMnW58tsvbfNznDew1NsUZURHlBceqxLmbo5dVIufT8',
  },
  {
    id: 'news-4',
    title: 'Success Story : De l\'IDLA à Forbes 30 under 30',
    description: 'Découvrez le parcours inspirant de Sarah M., diplômée de la promotion 2019, qui révolutionne actuellement le secteur de la Fintech en Afrique Centrale.',
    date: '01 Oct 2024',
    category: 'Alumni',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD03rVo4A5q5zSYp0hjMoR6BQjpZsc3LG3b62ChdKyygUqxP3tOiSnJP_v_fRIyGhCRtjyxmorl_-rfgq4x4iWVZTigx-cG3EhtUcOKZiFbhgMk2u9l6wRABoBKUIDyuJGpWcRfAmBj-A1d8ibDcikSPbn9k0f_KwBVMc-dd_96PNgq0tBob9AAfdvluN5bpug1-QS0G_C9DW3eJBU3gjqcvqGVd5fWUXNNCIjAxyYhw2UQtjO66-hYCuFQBV8KiAO_FWJAxIBfZNw',
  },
  {
    id: 'news-5',
    title: 'Ouverture officielle des inscriptions de la session 2025',
    description: 'Consultez les dates clés de dépôt de dossier et d\'admission pour la prochaine rentrée universitaire.',
    date: '28 Sep 2024',
    category: 'Annonces',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK5Ap_hI3nQSBIkU-HjcWMZiRFjDdwlVJPOLKX9pCh1lFmHaLP1CctNnOtKdsemEsNY7RiVPdWmfe9Isc_XJ1-rWme4PQIVpO2YP9zAlWqm_j8HDudQ7TlzdVwkt_C9Iny2iF86_Ida2chULQzt7Oo91OE2uVF_4bh4lqdCif0Yper2JRvlfTroz_bMpR3bb93QVyNWAM11GeI7zTFmzOEsH62rlN_nptgIO5n6Ub25c7DqLoEhC_zipPPlzPJRU-PMJODDM9xEn0',
  }
];

export const testimonialsData: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Fatou Camara',
    role: 'Directrice de Projets IT',
    text: 'L\'IDLA n\'a pas seulement changé ma carrière, elle a redéfini ma vision du leadership en Afrique à travers son infrastructure et ses profs.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsm-xQrD78PLIpIjcahH_RF3K2xe_YyqKyewS7dTY855mM3opIFXvWFBi5a6gSKx2laNE7HstqSmtxY-MoM22E6JgpbDY38xPQM7CcBKxPTxJjwEc0N_YXcXR2-gX0OFtXmmzNK2FcCH3e-FUVlSfqg4JmPfHhndvVrNXvcxjkMxfRpJdDzzDWIbd6WWcBY6NySBG1U9f1SUIAwKmID3IZE9ppzNcSaMP-9wEP_-rYEme0v02beXHOU-p9z86s82Y79wwVdWB4n5U',
    promo: 'Promo 2021',
    category: 'Alumni',
    isFeatured: true
  },
  {
    id: 'test-2',
    name: 'Sarah Kamga',
    role: 'CEO, TechAfrica Solutions',
    text: 'IDLA m\'a non seulement donné les compétences techniques, mais surtout la confiance nécessaire pour lancer ma startup technologique qui emploie aujourd\'hui 15 personnes.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZl_ErfPzGZGQ2f1Rsa3LXDpJ3rhlD35FsbORa4moBvqgxzo5OyJBQMrDpInxr4kewGwIfnsKd_Xw2KnG2Rw09tk0_lZt-pBlZn9h4v-YBJq0dKcVhj_pjwQSLqDxC2m-XAlomgylQNid_A4X3Z7kyjG--Bd2GNEbiG4zjDA9wDs_pkRC5OlleWqNgjEb_vAnsc9rsXA8QLSPyWLJP-EYpeambXj9mNxGLras7tY6hqjmmCNW0jbM5eAkkCEnl8ql3Uf33LkJ-IzM',
    promo: 'Promo 2020',
    category: 'Alumni'
  },
  {
    id: 'test-3',
    name: 'Marc-Antoine Diallo',
    role: 'Analyste Financier',
    text: 'Une immersion totale. Les projets pratiques m\'ont permis d\'être opérationnel dès mon premier jour en entreprise.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRGUsBo8wXWi0UAGcX7qmhtw5w3cDohSYyfKnpGPp_9gLs4YlTallGsEiI_rVCBNa8zhEvZXH4pU_05vMUIPnelsZNi2_zO1-yEH18cGQxWW_6gZ0qlrou11Icf1uTEtckxMx2xmMp0J-LxfL1XgQVhUh6EB6vyCD2pcMe_KquJD6L7ttPPqigxZJite-c_gk2dwDGMezb9kZWRaYzRPCRLAh1enCcY75t5OAdw2VEr-h88G-P1j6BQM8WPVVDRcrOxx3rZOTql_s',
    promo: 'Promo 2022',
    category: 'Master'
  },
  {
    id: 'test-4',
    name: 'Ibrahim Sissoko',
    role: 'Entrepreneur Social',
    text: 'Le réseau d\'alumni est une ressource inestimable. J\'ai trouvé mon mentorat grâce à la communauté IDLA.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADrju_nzPH0ifRDaqGcEv4syKBqDVA1zo9mbrNymPK0KHa5RLeUmUC5KWQ-r10FoCcuj-KudtzSK1hkBIiQL14MkTL1WTC3VYzbzN7zbAE46s0xWktI0J0dyVDn-zcvGPs4ddZ-MBl1uQTqixrFCo16G7s2JtTdJZguKluENdDkGC3y3inqaqWDif5NLtPlJvFHLrijavhccIQGP9417EDDO_9L4syP8TPaJ1f3jV21trK_0AJnpOX-1wnWR06gpsoxNTdIcC_cDQ',
    promo: 'Promo 2019',
    category: 'Executive'
  },
  {
    id: 'test-5',
    name: 'Estelle Bella',
    role: 'Étudiante en Master Data Science',
    text: 'L\'infrastructure moderne et l\'accès permanent aux ressources numériques font d\'IDLA un lieu unique pour l\'apprentissage en Afrique Centrale.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLaxwD3SvHXO7z4XVZfjpYKld-nYaahrK8o3h7dZ2mMCWmhY2SSRqEwYGAcawyHSWJ0cchKKWxlGBvcKGpAsDeYF9ffS0wL4dm74TI2VeQTeBFGUI1NMic3gj9MHWo9HLI95_tFYFIWJtOTJuxvEoq3-JO179YfRuw7hTDlWsc5YkK6VFFFz2eDnbre-zfSTx_p0eVkml_3GyliTkqqpNbCQE2DYDA9tKbTlat7hTcieormhnYx1EQcjJ_S7hltXRRZlyvyzpJV8o',
    promo: 'Promo 2023',
    category: 'Master'
  }
];

export const initialUsers: User[] = [
  {
    id: '8821',
    name: 'Jean-Sebastien Dupont',
    email: 'js.dupont@idla.edu',
    role: 'Super Admin',
    status: 'Actif',
    lastLogin: 'Il y a 2 heures',
    initials: 'JS'
  },
  {
    id: '8822',
    name: 'Amélie Lefebvre',
    email: 'a.lefebvre@idla.edu',
    role: 'Admin',
    status: 'Actif',
    lastLogin: 'Hier, 14:30',
    initials: 'AL',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3bI7myND64YjGslxGVdR_XBKOVCZu3pJqVHlNQJ7EpW1drGG37TgszrLJ9ffzPaY2W4ILBaVHP7aXRi9yheWoyh6_RveFZGO5Ismy1nhVGam5j1e7VGGDFlfR783suImS0p4THhJwmka06k-CekAbV2CVPLCMerN7aUtGFROlsOUHOG4FQtCQhVVoz1SPSNloDFOXVwDsIkihvr491BucYGQMxMcdocbEPAz3up95vOGNYj5bT_Q0o2D4LJHpWCrKj2DxCEg8j6w'
  },
  {
    id: '8845',
    name: 'Marc Bernard',
    email: 'm.bernard@marketer.com',
    role: 'Marketer',
    status: 'Inactif',
    lastLogin: '3 Oct 2024',
    initials: 'MB'
  },
  {
    id: '8910',
    name: 'Lucie Moreau',
    email: 'l.moreau@editorial.fr',
    role: 'Writer',
    status: 'Actif',
    lastLogin: 'Il y a 15 min',
    initials: 'LM',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfzU7o0rHU9BUPIy71v8qziiNjFw3-YIXxEsm2w5ujoY5s_NfU_6yekaqQbxjwBqv6IXL-XrrbHAvirVjY_nR-ZCHlPkoJj4xY5u0Ed9KZYofYLSVfmbKSYX5RVSoAiZpQ22TGzhVyJA8HpAItz6JE1w5R2Wkk0awe6CzBN7hIKDApyIntrIiGS01y9J0giB7-rcjh9TFzI15bqBLG2-Epj6MWR8QIXD7H74Qv9C5GfpVYqT6j4vSBUJguC84LaJA8ZUqHrZ0NY1c'
  },
  {
    id: '9012',
    name: 'Karim Kasmi',
    email: 'k.kasmi@idla.edu',
    role: 'OC',
    status: 'Bloqué',
    lastLogin: '12 Sep 2024',
    initials: 'KK'
  }
];

export const preRegistrationsData: PreRegistration[] = [
  {
    id: 'pre-1',
    name: 'Amadou Loum',
    email: 'amadou.l@email.com',
    program: 'Master en Management Digital',
    dateApplied: '24 Oct 2024',
    status: 'In Review',
    initials: 'AL',
    phone: '+221 77 123 45 67',
    nationality: 'Sénégalaise',
    highestDegree: 'Licence en Économie',
    graduationYear: 2022,
    motivation: "Je souhaite approfondir mes compétences en transformation digitale pour piloter l'innovation dans le secteur bancaire ouest-africain.",
    documents: ['CV_Amadou_Loum.pdf', 'Diplome_Licence.pdf', 'Lettre_motivation.pdf'],
  },
  {
    id: 'pre-2',
    name: 'Catherine Balle',
    email: 'c.balle@email.com',
    program: 'Bachelor Communication',
    dateApplied: '23 Oct 2024',
    status: 'New',
    initials: 'CB',
    phone: '+237 6 55 44 33 22',
    nationality: 'Camerounaise',
    highestDegree: 'Baccalauréat série A',
    graduationYear: 2024,
    motivation: "Passionnée par la communication digitale, je veux acquérir les fondamentaux du storytelling de marque.",
    documents: ['CV_Catherine.pdf', 'Releve_notes_Bac.pdf'],
  }
];

export const pendingTestimonialsData: Testimonial[] = [
  {
    id: 'pending-1',
    name: 'Nadia Belkacem',
    role: 'Consultante en Stratégie',
    text: "Mon passage à l'IDLA a été déterminant : le réseau et la rigueur académique m'ont ouvert les portes du conseil international.",
    image: 'https://ui-avatars.com/api/?name=Nadia+Belkacem&background=006c49&color=fff',
    promo: 'Promo 2022',
    category: 'Alumni',
  },
  {
    id: 'pending-2',
    name: 'Thomas Nkeng',
    role: 'Ingénieur Logiciel, Google',
    text: "Les projets pratiques et l'accompagnement des professeurs m'ont préparé aux entretiens des plus grandes entreprises tech.",
    image: 'https://ui-avatars.com/api/?name=Thomas+Nkeng&background=006c49&color=fff',
    promo: 'Promo 2021',
    category: 'Master',
  },
];

export const donationsData: Donation[] = [
  {
    id: 'don-1',
    donor: 'Fondation Orange',
    email: 'contact@fondationorange.org',
    amount: 5000000,
    message: 'Pour le programme de bourses d\'excellence.',
    date: '28 Juin 2026',
    status: 'Confirmé',
  },
  {
    id: 'don-2',
    donor: 'Association Alumni Promo 2018',
    email: 'alumni2018@idla.edu',
    amount: 1200000,
    message: 'Contribution annuelle des anciens.',
    date: '21 Juin 2026',
    status: 'Nouveau',
  },
  {
    id: 'don-3',
    donor: 'Donateur anonyme',
    email: 'anonyme@email.com',
    amount: 750000,
    date: '12 Juin 2026',
    status: 'Nouveau',
  },
];

export const campaignsData: Campaign[] = [
  { id: 'camp-1', name: 'Rentrée 2026 — Admissions', channel: 'Email + Réseaux', status: 'Active', reach: 12500 },
  { id: 'camp-2', name: 'Webinaire Executive MBA', channel: 'LinkedIn Ads', status: 'Active', reach: 4200 },
  { id: 'camp-3', name: 'Journée Portes Ouvertes', channel: 'Instagram', status: 'En pause', reach: 8800 },
];

export const activityLogsData: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'registration',
    user: 'Jean Dupont',
    text: 'a complété son inscription au programme Executive MBA.',
    time: 'Il y a 10 minutes'
  },
  {
    id: 'act-2',
    type: 'article',
    user: 'Admin Marc',
    text: 'a publié un nouvel article : "L\'avenir de l\'IA dans l\'éducation".',
    time: 'Il y a 2 heures'
  },
  {
    id: 'act-3',
    type: 'error',
    user: 'Échec de paiement',
    text: 'pour le dossier #45218 (Mme. Sarr).',
    time: 'Il y a 4 heures'
  },
  {
    id: 'act-4',
    type: 'alumni',
    user: 'Sofia Martinez',
    text: 'a rejoint le réseau des Alumni.',
    time: 'Hier à 18:30'
  }
];
