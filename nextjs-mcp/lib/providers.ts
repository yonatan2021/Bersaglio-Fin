export type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'password';
  placeholder?: string;
};

export type Provider = {
  id: string;
  displayName: string;
  displayNameEn: string;
  category: 'bank' | 'credit';
  fields: FieldDef[];
};

export const PROVIDERS: Provider[] = [
  {
    id: 'hapoalim',
    displayName: 'בנק הפועלים',
    displayNameEn: 'Bank Hapoalim',
    category: 'bank',
    fields: [
      { name: 'userCode', label: 'קוד משתמש', type: 'text', placeholder: '123456' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'leumi',
    displayName: 'בנק לאומי',
    displayNameEn: 'Bank Leumi',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'discount',
    displayName: 'בנק דיסקונט',
    displayNameEn: 'Discount Bank',
    category: 'bank',
    fields: [
      { name: 'id', label: 'תעודת זהות', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
      { name: 'num', label: 'מספר משתמש', type: 'text' },
    ],
  },
  {
    id: 'mercantile',
    displayName: 'מרקנטיל',
    displayNameEn: 'Mercantile Bank',
    category: 'bank',
    fields: [
      { name: 'id', label: 'תעודת זהות', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
      { name: 'num', label: 'מספר משתמש', type: 'text' },
    ],
  },
  {
    id: 'mizrahi',
    displayName: 'מזרחי טפחות',
    displayNameEn: 'Mizrahi Tefahot',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'beinleumi',
    displayName: 'בנק בינלאומי',
    displayNameEn: 'Bank Beinleumi',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'massad',
    displayName: 'מסד',
    displayNameEn: 'Bank Massad',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'otsarHahayal',
    displayName: 'אוצר החייל',
    displayNameEn: 'Otsar HaHayal',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'yahav',
    displayName: 'בנק יהב',
    displayNameEn: 'Bank Yahav',
    category: 'bank',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'nationalID', label: 'תעודת זהות', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'visaCal',
    displayName: 'ויזה כאל',
    displayNameEn: 'Visa Cal',
    category: 'credit',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'max',
    displayName: 'מקס',
    displayNameEn: 'Max',
    category: 'credit',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'isracard',
    displayName: 'ישראכרט',
    displayNameEn: 'Isracard',
    category: 'credit',
    fields: [
      { name: 'id', label: 'תעודת זהות', type: 'text' },
      { name: 'card6Digits', label: '6 ספרות ראשונות כרטיס', type: 'text', placeholder: '123456' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'amex',
    displayName: 'אמריקן אקספרס',
    displayNameEn: 'American Express',
    category: 'credit',
    fields: [
      { name: 'username', label: 'שם משתמש', type: 'text' },
      { name: 'card6Digits', label: '6 ספרות ראשונות כרטיס', type: 'text', placeholder: '123456' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
  {
    id: 'beyhadBishvilha',
    displayName: 'בייחד בשבילה',
    displayNameEn: 'Beyhad Bishvilha',
    category: 'credit',
    fields: [
      { name: 'id', label: 'תעודת זהות', type: 'text' },
      { name: 'password', label: 'סיסמה', type: 'password' },
    ],
  },
];

export const PROVIDER_MAP = new Map(PROVIDERS.map(p => [p.id, p]));
