export const FED_POWER_CATEGORY_ID = '30000000-0000-0000-0000-000000000003';

export type FedGovernorProfile = {
  name: string;
  role: string;
  origin: string;
  priorInstitutions: string[];
  politicalTilt: string;
  rateView: string;
  knownLinks: string[];
};

export const fedGovernorProfiles: FedGovernorProfile[] = [
  {
    name: 'Jerome Powell',
    role: 'Chair',
    origin: 'Wall Street / hukumet',
    priorInstitutions: ['Carlyle Group', 'Treasury Department', 'Dillon Read'],
    politicalTilt: 'Merkez / iki partiyle calisabilen ama piyasa istikrarina duyarli',
    rateView: 'Faiz bakisi: Nötr-sahin, gerekirse 0,25 artisa acik ama veri zayiflarsa durabilir.',
    knownLinks: ['Yatirim bankaciligi gecmisi', 'Treasury kokeni', 'Piyasa isleyisine yuksek hassasiyet'],
  },
  {
    name: 'Philip Jefferson',
    role: 'Vice Chair',
    origin: 'Akademi / kamu politikasi',
    priorInstitutions: ['Davidson College', 'Federal Reserve Board', 'Columbia University'],
    politicalTilt: 'Merkez-güvercin',
    rateView: 'Faiz bakisi: Nötr, erken artisa mesafeli; zayiflama halinde indirim tarafina daha yakin.',
    knownLinks: ['Akademik koken', 'Fed icinden gelen politika tecrubesi'],
  },
  {
    name: 'Michael Barr',
    role: 'Vice Chair for Supervision',
    origin: 'Hukumet / regülasyon',
    priorInstitutions: ['Treasury Department', 'University of Michigan', 'Clinton Administration'],
    politicalTilt: 'Demokrat egilimli / regülasyon agirlikli',
    rateView: 'Faiz bakisi: Nötr, finansal istikrar riskleri artarsa daha ihtiyatli ve bekle-gor cizgisi.',
    knownLinks: ['Dodd-Frank mimarisi', 'Regülasyon ve denetim odaği'],
  },
  {
    name: 'Michelle Bowman',
    role: 'Governor',
    origin: 'Topluluk bankaciligi / hukumet',
    priorInstitutions: ['Farmers & Drovers Bank', 'Kansas Bank Commissioner'],
    politicalTilt: 'Cumhuriyetci egilimli / daha sahin',
    rateView: 'Faiz bakisi: Şahin, gerekirse 0,25 artis tarafina en yakin isimlerden biri.',
    knownLinks: ['Topluluk bankaciligi', 'Bolgesel banka hassasiyeti'],
  },
  {
    name: 'Christopher Waller',
    role: 'Governor',
    origin: 'Akademi / St. Louis Fed',
    priorInstitutions: ['St. Louis Fed', 'University of Notre Dame', 'Indiana University'],
    politicalTilt: 'Sahin-merkez',
    rateView: 'Faiz bakisi: Sahin-merkez, enflasyon yuksek kalirsa ilave sikilastirmaya acik.',
    knownLinks: ['Akademik koken', 'Bolgesel Fed arastirma gelenegi'],
  },
  {
    name: 'Lisa Cook',
    role: 'Governor',
    origin: 'Akademi',
    priorInstitutions: ['Michigan State University', 'White House CEA'],
    politicalTilt: 'Demokrat egilimli / güvercin-merkez',
    rateView: 'Faiz bakisi: Güvercin-merkez, artistan cok sabit tutma veya zamanla indirim tarafina yakin.',
    knownLinks: ['Akademik politika aglari', 'Beyaz Saray ekonomi danismanligi'],
  },
  {
    name: 'Adriana Kugler',
    role: 'Governor',
    origin: 'Akademi / kamu politikasi',
    priorInstitutions: ['Georgetown University', 'World Bank', 'U.S. Department of Labor'],
    politicalTilt: 'Demokrat egilimli / isgucu odakli',
    rateView: 'Faiz bakisi: Güvercin-merkez, isgucu zayiflarsa indirim tarafina daha hizli kayabilir.',
    knownLinks: ['Kuresel kalkinma kurumlari', 'Emek piyasasi uzmanligi'],
  },
];
