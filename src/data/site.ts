// Everything that is likely to change later lives here: name, contact
// details, the menu structure and the footer links.

export const site = {
  name: 'Dr. Pintér Márta Zsuzsanna',
  role: 'Tanszékvezető egyetemi tanár',
  greeting: 'Üdvözlöm honlapomon!',
  description: 'Dr. Pintér Márta Zsuzsanna irodalom- és színháztörténész honlapja: hírek, könyvek, tanulmányok, előadások.',
  contact: {
    institution: 'Eszterházy Károly Katolikus Egyetem, Irodalomtudományi Tanszék',
    address: 'Eger, Eszterházy tér 1., A épület, 305. szoba',
    phone: '+36 36 520400/2064',
    email: 'pinter.marta@uni-eszterhazy.hu',
  },
};

export interface NavItem {
  label: string;
  href: string;          // internal path, or a full URL for external links
  children?: NavItem[];
}

// The menu. Internal paths match the file names in src/content/oldalak
// (e.g. '/konyvek/' is src/content/oldalak/konyvek.md).
export const navigation: NavItem[] = [
  { label: 'Főoldal', href: '/' },
  {
    label: 'Névjegy', href: '/nevjegy/',
    children: [
      { label: 'Tudományos önéletrajz', href: '/nevjegy/' },
      { label: 'Díjak, ösztöndíjak', href: '/dijak/' },
    ],
  },
  { label: 'Események', href: '/esemenyek/' },
  {
    label: 'Publikációk', href: '/konyvek/',
    children: [
      { label: 'Könyvek', href: '/konyvek/' },
      { label: 'Online könyvek', href: '/online-konyvek/' },
      { label: 'Tanulmányok', href: '/tanulmanyok/' },
      { label: 'Kritikák, recenziók', href: '/kritikak/' },
    ],
  },
  {
    label: 'Előadások', href: '/konferenciak/',
    children: [
      { label: 'Konferenciák', href: '/konferenciak/' },
      { label: 'Rádiós előadások', href: '/radio/' },
      { label: 'Videófelvételek', href: '/video/' },
    ],
  },
  { label: 'Galéria', href: '/galeria/' },
];

export const footerLinks: NavItem[] = [
  { label: 'Eszterházy Károly Katolikus Egyetem', href: 'https://uni-eszterhazy.hu/' },
  { label: 'Irodalomtudományi Intézet (kutatóhely)', href: 'http://www.iti.mta.hu/' },
  { label: 'Publikációs lista (MTMT)', href: 'https://vm.mtmt.hu//search/slist.php?nwi=1&inited=1&ty_on=1&url_on=1&cite_type=2&orderby=3D1a&location=mtmt&stn=1&AuthorID=10008092' },
];
