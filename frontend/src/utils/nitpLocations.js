/**
 * Centralized NIT Patna Campuses and Hostels Data Structure (Frontend)
 */

export const CAMPUS_NAMES = {
  PATNA: 'Patna Campus',
  BIHTA: 'Bihta Campus',
};

export const NITP_LOCATIONS = {
  [CAMPUS_NAMES.PATNA]: [
    { name: 'Ganga Girls Hostel', isGirlsHostel: true },
    { name: 'Son Hostel', isGirlsHostel: false },
    { name: 'Son A Hostel', isGirlsHostel: false },
    { name: 'Son B Hostel', isGirlsHostel: false },
    { name: 'Brahmaputra Hostel', isGirlsHostel: false },
    { name: 'Kosi Hostel', isGirlsHostel: false },
    { name: 'Kosi Extension Hostel', isGirlsHostel: false },
  ],
  [CAMPUS_NAMES.BIHTA]: [
    { name: 'Nagarjuna Hostel', isGirlsHostel: false },
    { name: 'Aryabhatta Hostel', isGirlsHostel: false },
    { name: 'Kautilya Hostel', isGirlsHostel: false },
    { name: 'Sarojini Girls Hostel', isGirlsHostel: true },
    { name: 'Kadambini Girls Hostel', isGirlsHostel: true },
  ],
};

export const ALL_CAMPUSES = Object.keys(NITP_LOCATIONS);

export const getHostelsForCampus = (campus) => {
  if (!campus || !NITP_LOCATIONS[campus]) return [];
  return NITP_LOCATIONS[campus];
};

export const isGirlsHostelName = (hostelName) => {
  if (!hostelName) return false;
  return (
    hostelName.includes('Ganga') ||
    hostelName.includes('Sarojini') ||
    hostelName.includes('Kadambini')
  );
};
