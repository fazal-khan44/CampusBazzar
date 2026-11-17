/**
 * Centralized NIT Patna Campuses and Hostels Data Structure
 * Reused across backend validation, seeder, models, and frontend UI.
 */

const CAMPUS_NAMES = {
  PATNA: 'Patna Campus',
  BIHTA: 'Bihta Campus',
};

const NITP_LOCATIONS = {
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

const ALL_CAMPUSES = Object.keys(NITP_LOCATIONS);

const isValidCampus = (campus) => {
  return ALL_CAMPUSES.includes(campus);
};

const isValidHostel = (campus, hostel) => {
  if (!isValidCampus(campus)) return false;
  return NITP_LOCATIONS[campus].some((h) => h.name === hostel);
};

const getHostelsForCampus = (campus) => {
  if (!campus || !NITP_LOCATIONS[campus]) return [];
  return NITP_LOCATIONS[campus];
};

module.exports = {
  CAMPUS_NAMES,
  NITP_LOCATIONS,
  ALL_CAMPUSES,
  isValidCampus,
  isValidHostel,
  getHostelsForCampus,
};
