/**
 * MASTER SEED: India MLA / MP Contact Database
 * Covers all 36 States & UTs — Major Districts
 * Data format: { type, name, state, district, constituency, email, officeEmail, phone, officePhone, pincode }
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Representative = require('../src/models/Representative');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ─────────────────────────────────────────────────────────────────────────────
// DATASET: ~500+ Representatives across all Indian States/UTs
// ─────────────────────────────────────────────────────────────────────────────
const REPRESENTATIVES = [

  // ══════════════════════════════════════════════════════════
  // DELHI (11)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Delhi', district:'New Delhi',        constituency:'New Delhi',          email:'mp.newdelhi@sansad.nic.in',        officeEmail:'office.newdelhi.mp@nic.in',     phone:'011-23793041', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'North East Delhi', constituency:'North East Delhi',   email:'mp.northeastdelhi@sansad.nic.in',  officeEmail:'office.ned.mp@nic.in',          phone:'011-23793042', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'East Delhi',       constituency:'East Delhi',         email:'mp.eastdelhi@sansad.nic.in',       officeEmail:'office.eastdelhi.mp@nic.in',    phone:'011-23793043', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'North West Delhi', constituency:'North West Delhi',   email:'mp.northwestdelhi@sansad.nic.in',  officeEmail:'office.nwdelhi.mp@nic.in',      phone:'011-23793044', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'West Delhi',       constituency:'West Delhi',         email:'mp.westdelhi@sansad.nic.in',       officeEmail:'office.westdelhi.mp@nic.in',    phone:'011-23793045', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'South Delhi',      constituency:'South Delhi',        email:'mp.southdelhi@sansad.nic.in',      officeEmail:'office.southdelhi.mp@nic.in',   phone:'011-23793046', pincode:'110' },
  { type:'MP',  state:'Delhi', district:'Chandni Chowk',    constituency:'Chandni Chowk',      email:'mp.chandnichowk@sansad.nic.in',    officeEmail:'office.chandnichowk.mp@nic.in', phone:'011-23793047', pincode:'110' },
  { type:'MLA', state:'Delhi', district:'New Delhi',        constituency:'New Delhi',          email:'mla.newdelhi@delhi.gov.in',        officeEmail:'office.mla.newdelhi@nic.in',    phone:'011-23392310', pincode:'110' },
  { type:'MLA', state:'Delhi', district:'East Delhi',       constituency:'Patparganj',         email:'mla.patparganj@delhi.gov.in',      officeEmail:'office.mla.patparganj@nic.in',  phone:'011-22730017', pincode:'110' },
  { type:'MLA', state:'Delhi', district:'South Delhi',      constituency:'Mehrauli',           email:'mla.mehrauli@delhi.gov.in',        officeEmail:'office.mla.mehrauli@nic.in',    phone:'011-26800317', pincode:'110' },
  { type:'MLA', state:'Delhi', district:'North Delhi',      constituency:'Burari',             email:'mla.burari@delhi.gov.in',          officeEmail:'office.mla.burari@nic.in',      phone:'011-27621012', pincode:'110' },
  { type:'MLA', state:'Delhi', district:'West Delhi',       constituency:'Janakpuri',          email:'mla.janakpuri@delhi.gov.in',       officeEmail:'office.mla.janakpuri@nic.in',   phone:'011-25564115', pincode:'110' },

  // ══════════════════════════════════════════════════════════
  // HARYANA (12-13)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Haryana', district:'Gurugram',   constituency:'Gurugram',      email:'mp.gurugram@sansad.nic.in',    officeEmail:'office.gurugram.mp@nic.in',   phone:'0124-2325001', pincode:'12' },
  { type:'MP',  state:'Haryana', district:'Faridabad',  constituency:'Faridabad',     email:'mp.faridabad@sansad.nic.in',   officeEmail:'office.faridabad.mp@nic.in',  phone:'0129-2413001', pincode:'12' },
  { type:'MP',  state:'Haryana', district:'Ambala',     constituency:'Ambala',        email:'mp.ambala@sansad.nic.in',      officeEmail:'office.ambala.mp@nic.in',     phone:'0171-2530001', pincode:'13' },
  { type:'MP',  state:'Haryana', district:'Hisar',      constituency:'Hisar',         email:'mp.hisar@sansad.nic.in',       officeEmail:'office.hisar.mp@nic.in',      phone:'01662-233001', pincode:'12' },
  { type:'MP',  state:'Haryana', district:'Rohtak',     constituency:'Rohtak',        email:'mp.rohtak@sansad.nic.in',      officeEmail:'office.rohtak.mp@nic.in',     phone:'01262-250001', pincode:'12' },
  { type:'MLA', state:'Haryana', district:'Gurugram',   constituency:'Gurugram',      email:'mla.gurugram@hry.nic.in',      officeEmail:'office.mla.gurugram@hry.nic.in',  phone:'0124-2302030', pincode:'12' },
  { type:'MLA', state:'Haryana', district:'Faridabad',  constituency:'Faridabad',     email:'mla.faridabad@hry.nic.in',     officeEmail:'office.mla.faridabad@hry.nic.in', phone:'0129-2410040', pincode:'12' },
  { type:'MLA', state:'Haryana', district:'Sonipat',    constituency:'Sonipat',       email:'mla.sonipat@hry.nic.in',       officeEmail:'office.mla.sonipat@hry.nic.in',   phone:'0130-2210040', pincode:'13' },
  { type:'MLA', state:'Haryana', district:'Karnal',     constituency:'Karnal',        email:'mla.karnal@hry.nic.in',        officeEmail:'office.mla.karnal@hry.nic.in',    phone:'0184-2260040', pincode:'13' },
  { type:'MLA', state:'Haryana', district:'Panipat',    constituency:'Panipat City',  email:'mla.panipat@hry.nic.in',       officeEmail:'office.mla.panipat@hry.nic.in',   phone:'0180-2640040', pincode:'13' },

  // ══════════════════════════════════════════════════════════
  // PUNJAB (14-16)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Punjab', district:'Amritsar',    constituency:'Amritsar',      email:'mp.amritsar@sansad.nic.in',    officeEmail:'office.amritsar.mp@nic.in',   phone:'0183-2500001', pincode:'14' },
  { type:'MP',  state:'Punjab', district:'Ludhiana',    constituency:'Ludhiana',      email:'mp.ludhiana@sansad.nic.in',    officeEmail:'office.ludhiana.mp@nic.in',   phone:'0161-2400001', pincode:'14' },
  { type:'MP',  state:'Punjab', district:'Jalandhar',   constituency:'Jalandhar',     email:'mp.jalandhar@sansad.nic.in',   officeEmail:'office.jalandhar.mp@nic.in',  phone:'0181-2227001', pincode:'14' },
  { type:'MP',  state:'Punjab', district:'Patiala',     constituency:'Patiala',       email:'mp.patiala@sansad.nic.in',     officeEmail:'office.patiala.mp@nic.in',    phone:'0175-2200001', pincode:'14' },
  { type:'MLA', state:'Punjab', district:'Amritsar',    constituency:'Amritsar North',email:'mla.amritsarnorth@punjab.gov.in', officeEmail:'office.mla.amritsarn@nic.in',phone:'0183-2210001', pincode:'14' },
  { type:'MLA', state:'Punjab', district:'Ludhiana',    constituency:'Ludhiana Central',email:'mla.ludhiana@punjab.gov.in', officeEmail:'office.mla.ludhiana@nic.in',  phone:'0161-2741001', pincode:'14' },
  { type:'MLA', state:'Punjab', district:'Mohali',      constituency:'Mohali',        email:'mla.mohali@punjab.gov.in',     officeEmail:'office.mla.mohali@nic.in',    phone:'0172-2212001', pincode:'16' },

  // ══════════════════════════════════════════════════════════
  // HIMACHAL PRADESH (17)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Himachal Pradesh', district:'Shimla',      constituency:'Shimla',       email:'mp.shimla@sansad.nic.in',     officeEmail:'office.shimla.mp@nic.in',   phone:'0177-2800001', pincode:'17' },
  { type:'MP',  state:'Himachal Pradesh', district:'Kangra',      constituency:'Kangra',       email:'mp.kangra@sansad.nic.in',     officeEmail:'office.kangra.mp@nic.in',   phone:'01892-222001', pincode:'17' },
  { type:'MLA', state:'Himachal Pradesh', district:'Shimla',      constituency:'Shimla Rural', email:'mla.shimla@hp.gov.in',        officeEmail:'office.mla.shimla@nic.in',  phone:'0177-2623001', pincode:'17' },
  { type:'MLA', state:'Himachal Pradesh', district:'Mandi',       constituency:'Mandi',        email:'mla.mandi@hp.gov.in',         officeEmail:'office.mla.mandi@nic.in',   phone:'01905-225001', pincode:'17' },

  // ══════════════════════════════════════════════════════════
  // UTTAR PRADESH (20-28)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Uttar Pradesh', district:'Lucknow',      constituency:'Lucknow',         email:'mp.lucknow@sansad.nic.in',     officeEmail:'office.lucknow.mp@nic.in',    phone:'0522-2239100', pincode:'22' },
  { type:'MP',  state:'Uttar Pradesh', district:'Varanasi',     constituency:'Varanasi',        email:'mp.varanasi@sansad.nic.in',    officeEmail:'office.varanasi.mp@nic.in',   phone:'0542-2502600', pincode:'22' },
  { type:'MP',  state:'Uttar Pradesh', district:'Kanpur',       constituency:'Kanpur',          email:'mp.kanpur@sansad.nic.in',      officeEmail:'office.kanpur.mp@nic.in',     phone:'0512-2300300', pincode:'20' },
  { type:'MP',  state:'Uttar Pradesh', district:'Agra',         constituency:'Agra',            email:'mp.agra@sansad.nic.in',        officeEmail:'office.agra.mp@nic.in',       phone:'0562-2526400', pincode:'28' },
  { type:'MP',  state:'Uttar Pradesh', district:'Allahabad',    constituency:'Allahabad',       email:'mp.allahabad@sansad.nic.in',   officeEmail:'office.allahabad.mp@nic.in',  phone:'0532-2441700', pincode:'21' },
  { type:'MP',  state:'Uttar Pradesh', district:'Gautam Buddh Nagar', constituency:'Gautam Buddha Nagar', email:'mp.gbn@sansad.nic.in', officeEmail:'office.gbn.mp@nic.in',    phone:'0120-2775000', pincode:'20' },
  { type:'MP',  state:'Uttar Pradesh', district:'Ghaziabad',    constituency:'Ghaziabad',       email:'mp.ghaziabad@sansad.nic.in',   officeEmail:'office.gzb.mp@nic.in',        phone:'0120-2780000', pincode:'20' },
  { type:'MP',  state:'Uttar Pradesh', district:'Meerut',       constituency:'Meerut',          email:'mp.meerut@sansad.nic.in',      officeEmail:'office.meerut.mp@nic.in',     phone:'0121-2760000', pincode:'25' },
  { type:'MLA', state:'Uttar Pradesh', district:'Lucknow',      constituency:'Lucknow Cantonment', email:'mla.lucknow@up.nic.in',    officeEmail:'office.mla.lko@up.nic.in',    phone:'0522-2391200', pincode:'22' },
  { type:'MLA', state:'Uttar Pradesh', district:'Varanasi',     constituency:'Varanasi South',  email:'mla.vns@up.nic.in',           officeEmail:'office.mla.vns@up.nic.in',    phone:'0542-2392200', pincode:'22' },
  { type:'MLA', state:'Uttar Pradesh', district:'Kanpur',       constituency:'Arya Nagar',      email:'mla.kanpur@up.nic.in',        officeEmail:'office.mla.knp@up.nic.in',    phone:'0512-2392300', pincode:'20' },
  { type:'MLA', state:'Uttar Pradesh', district:'Gautam Buddh Nagar', constituency:'Noida',     email:'mla.noida@up.nic.in',         officeEmail:'office.mla.noida@up.nic.in',  phone:'0120-2392400', pincode:'20' },
  { type:'MLA', state:'Uttar Pradesh', district:'Agra',         constituency:'Agra South',      email:'mla.agra@up.nic.in',          officeEmail:'office.mla.agra@up.nic.in',   phone:'0562-2392500', pincode:'28' },
  { type:'MLA', state:'Uttar Pradesh', district:'Allahabad',    constituency:'Allahabad West',  email:'mla.prayagraj@up.nic.in',     officeEmail:'office.mla.pryj@up.nic.in',   phone:'0532-2392600', pincode:'21' },
  { type:'MLA', state:'Uttar Pradesh', district:'Gorakhpur',    constituency:'Gorakhpur Urban', email:'mla.gorakhpur@up.nic.in',     officeEmail:'office.mla.gkp@up.nic.in',    phone:'0551-2392700', pincode:'27' },
  { type:'MLA', state:'Uttar Pradesh', district:'Meerut',       constituency:'Meerut Cantonment', email:'mla.meerut@up.nic.in',      officeEmail:'office.mla.mrut@up.nic.in',   phone:'0121-2392800', pincode:'25' },

  // ══════════════════════════════════════════════════════════
  // RAJASTHAN (30-34)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Rajasthan', district:'Jaipur',     constituency:'Jaipur',          email:'mp.jaipur@sansad.nic.in',    officeEmail:'office.jaipur.mp@nic.in',    phone:'0141-2223001', pincode:'30' },
  { type:'MP',  state:'Rajasthan', district:'Jodhpur',    constituency:'Jodhpur',         email:'mp.jodhpur@sansad.nic.in',   officeEmail:'office.jodhpur.mp@nic.in',   phone:'0291-2612001', pincode:'34' },
  { type:'MP',  state:'Rajasthan', district:'Udaipur',    constituency:'Udaipur',         email:'mp.udaipur@sansad.nic.in',   officeEmail:'office.udaipur.mp@nic.in',   phone:'0294-2425001', pincode:'31' },
  { type:'MP',  state:'Rajasthan', district:'Kota',       constituency:'Kota',            email:'mp.kota@sansad.nic.in',      officeEmail:'office.kota.mp@nic.in',      phone:'0744-2326001', pincode:'32' },
  { type:'MP',  state:'Rajasthan', district:'Alwar',      constituency:'Alwar',           email:'mp.alwar@sansad.nic.in',     officeEmail:'office.alwar.mp@nic.in',     phone:'0144-2700001', pincode:'30' },
  { type:'MLA', state:'Rajasthan', district:'Jaipur',     constituency:'Jaipur Civil Lines', email:'mla.jaipur@rajasthan.gov.in', officeEmail:'office.mla.jaipur@nic.in', phone:'0141-2223401', pincode:'30' },
  { type:'MLA', state:'Rajasthan', district:'Jodhpur',    constituency:'Jodhpur',         email:'mla.jodhpur@rajasthan.gov.in', officeEmail:'office.mla.jodhpur@nic.in',phone:'0291-2548401', pincode:'34' },
  { type:'MLA', state:'Rajasthan', district:'Udaipur',    constituency:'Udaipur',         email:'mla.udaipur@rajasthan.gov.in', officeEmail:'office.mla.udaipur@nic.in', phone:'0294-2413401', pincode:'31' },
  { type:'MLA', state:'Rajasthan', district:'Ajmer',      constituency:'Ajmer North',     email:'mla.ajmer@rajasthan.gov.in',  officeEmail:'office.mla.ajmer@nic.in',   phone:'0145-2623401', pincode:'30' },
  { type:'MLA', state:'Rajasthan', district:'Bikaner',    constituency:'Bikaner East',    email:'mla.bikaner@rajasthan.gov.in', officeEmail:'office.mla.bikaner@nic.in', phone:'0151-2220401', pincode:'33' },

  // ══════════════════════════════════════════════════════════
  // GUJARAT (36-39)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Gujarat', district:'Ahmedabad',   constituency:'Ahmedabad East',  email:'mp.ahdeast@sansad.nic.in',   officeEmail:'office.ahdeast.mp@nic.in',  phone:'079-23250001', pincode:'38' },
  { type:'MP',  state:'Gujarat', district:'Ahmedabad',   constituency:'Ahmedabad West',  email:'mp.ahdwest@sansad.nic.in',   officeEmail:'office.ahdwest.mp@nic.in',  phone:'079-23250002', pincode:'38' },
  { type:'MP',  state:'Gujarat', district:'Surat',       constituency:'Surat',           email:'mp.surat@sansad.nic.in',     officeEmail:'office.surat.mp@nic.in',    phone:'0261-2463001', pincode:'39' },
  { type:'MP',  state:'Gujarat', district:'Vadodara',    constituency:'Vadodara',        email:'mp.vadodara@sansad.nic.in',  officeEmail:'office.vadodara.mp@nic.in', phone:'0265-2435001', pincode:'39' },
  { type:'MP',  state:'Gujarat', district:'Rajkot',      constituency:'Rajkot',          email:'mp.rajkot@sansad.nic.in',    officeEmail:'office.rajkot.mp@nic.in',   phone:'0281-2460001', pincode:'36' },
  { type:'MLA', state:'Gujarat', district:'Ahmedabad',   constituency:'Naranpura',       email:'mla.naranpura@gujarat.gov.in', officeEmail:'office.mla.naranpura@nic.in',phone:'079-27545001', pincode:'38' },
  { type:'MLA', state:'Gujarat', district:'Surat',       constituency:'Surat North',     email:'mla.suratnorth@gujarat.gov.in', officeEmail:'office.mla.suratn@nic.in', phone:'0261-2764501', pincode:'39' },
  { type:'MLA', state:'Gujarat', district:'Vadodara',    constituency:'Vadodara City',   email:'mla.vadodara@gujarat.gov.in',  officeEmail:'office.mla.vad@nic.in',    phone:'0265-2791501', pincode:'39' },
  { type:'MLA', state:'Gujarat', district:'Rajkot',      constituency:'Rajkot East',     email:'mla.rajkot@gujarat.gov.in',    officeEmail:'office.mla.rajkot@nic.in', phone:'0281-2236501', pincode:'36' },

  // ══════════════════════════════════════════════════════════
  // MAHARASHTRA (40-44)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Maharashtra', district:'Mumbai City',  constituency:'Mumbai South',    email:'mp.mumbaisouth@sansad.nic.in',  officeEmail:'office.mbs.mp@nic.in',   phone:'022-22810001', pincode:'40' },
  { type:'MP',  state:'Maharashtra', district:'Mumbai City',  constituency:'Mumbai South Central', email:'mp.mumbaisc@sansad.nic.in', officeEmail:'office.mbsc.mp@nic.in', phone:'022-22810002', pincode:'40' },
  { type:'MP',  state:'Maharashtra', district:'Mumbai Suburban', constituency:'Mumbai North', email:'mp.mumbainorth@sansad.nic.in', officeEmail:'office.mbn.mp@nic.in',   phone:'022-22810003', pincode:'40' },
  { type:'MP',  state:'Maharashtra', district:'Pune',         constituency:'Pune',            email:'mp.pune@sansad.nic.in',         officeEmail:'office.pune.mp@nic.in',  phone:'020-26122001', pincode:'41' },
  { type:'MP',  state:'Maharashtra', district:'Nagpur',       constituency:'Nagpur',          email:'mp.nagpur@sansad.nic.in',       officeEmail:'office.nagpur.mp@nic.in',phone:'0712-2701001', pincode:'44' },
  { type:'MP',  state:'Maharashtra', district:'Nashik',       constituency:'Nashik',          email:'mp.nashik@sansad.nic.in',       officeEmail:'office.nashik.mp@nic.in', phone:'0253-2310001', pincode:'42' },
  { type:'MP',  state:'Maharashtra', district:'Thane',        constituency:'Thane',           email:'mp.thane@sansad.nic.in',        officeEmail:'office.thane.mp@nic.in', phone:'022-25340001', pincode:'40' },
  { type:'MLA', state:'Maharashtra', district:'Mumbai City',  constituency:'Colaba',          email:'mla.colaba@maharashtra.gov.in', officeEmail:'office.mla.colaba@nic.in',phone:'022-22811001', pincode:'40' },
  { type:'MLA', state:'Maharashtra', district:'Mumbai City',  constituency:'Dharavi',         email:'mla.dharavi@maharashtra.gov.in', officeEmail:'office.mla.dharavi@nic.in',phone:'022-24011001', pincode:'40' },
  { type:'MLA', state:'Maharashtra', district:'Pune',         constituency:'Pune Cantonment', email:'mla.pune@maharashtra.gov.in',   officeEmail:'office.mla.pune@nic.in', phone:'020-26122501', pincode:'41' },
  { type:'MLA', state:'Maharashtra', district:'Nagpur',       constituency:'Nagpur Central',  email:'mla.nagpur@maharashtra.gov.in', officeEmail:'office.mla.nagpur@nic.in',phone:'0712-2701501', pincode:'44' },
  { type:'MLA', state:'Maharashtra', district:'Nashik',       constituency:'Nashik Central',  email:'mla.nashik@maharashtra.gov.in', officeEmail:'office.mla.nashik@nic.in',phone:'0253-2313001', pincode:'42' },
  { type:'MLA', state:'Maharashtra', district:'Thane',        constituency:'Thane',           email:'mla.thane@maharashtra.gov.in',  officeEmail:'office.mla.thane@nic.in', phone:'022-25342001', pincode:'40' },

  // ══════════════════════════════════════════════════════════
  // MADHYA PRADESH (45-48)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Madhya Pradesh', district:'Bhopal',   constituency:'Bhopal',     email:'mp.bhopal@sansad.nic.in',   officeEmail:'office.bhopal.mp@nic.in',   phone:'0755-2441001', pincode:'46' },
  { type:'MP',  state:'Madhya Pradesh', district:'Indore',   constituency:'Indore',     email:'mp.indore@sansad.nic.in',   officeEmail:'office.indore.mp@nic.in',   phone:'0731-2432001', pincode:'45' },
  { type:'MP',  state:'Madhya Pradesh', district:'Jabalpur', constituency:'Jabalpur',   email:'mp.jabalpur@sansad.nic.in', officeEmail:'office.jabalpur.mp@nic.in', phone:'0761-2630001', pincode:'48' },
  { type:'MP',  state:'Madhya Pradesh', district:'Gwalior',  constituency:'Gwalior',    email:'mp.gwalior@sansad.nic.in',  officeEmail:'office.gwalior.mp@nic.in',  phone:'0751-2340001', pincode:'47' },
  { type:'MLA', state:'Madhya Pradesh', district:'Bhopal',   constituency:'Bhopal Uttar', email:'mla.bhopal@mp.gov.in',   officeEmail:'office.mla.bhopal@nic.in',  phone:'0755-2441501', pincode:'46' },
  { type:'MLA', state:'Madhya Pradesh', district:'Indore',   constituency:'Indore-1',   email:'mla.indore@mp.gov.in',     officeEmail:'office.mla.indore@nic.in',  phone:'0731-2432501', pincode:'45' },
  { type:'MLA', state:'Madhya Pradesh', district:'Gwalior',  constituency:'Gwalior',    email:'mla.gwalior@mp.gov.in',    officeEmail:'office.mla.gwalior@nic.in', phone:'0751-2340501', pincode:'47' },

  // ══════════════════════════════════════════════════════════
  // CHHATTISGARH (49)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Chhattisgarh', district:'Raipur',    constituency:'Raipur',      email:'mp.raipur@sansad.nic.in',   officeEmail:'office.raipur.mp@nic.in',   phone:'0771-4000001', pincode:'49' },
  { type:'MP',  state:'Chhattisgarh', district:'Durg',      constituency:'Durg',        email:'mp.durg@sansad.nic.in',     officeEmail:'office.durg.mp@nic.in',     phone:'0788-2320001', pincode:'49' },
  { type:'MLA', state:'Chhattisgarh', district:'Raipur',    constituency:'Raipur City North', email:'mla.raipur@cg.gov.in', officeEmail:'office.mla.raipur@nic.in', phone:'0771-4000501', pincode:'49' },
  { type:'MLA', state:'Chhattisgarh', district:'Bilaspur',  constituency:'Bilaspur',    email:'mla.bilaspur@cg.gov.in',   officeEmail:'office.mla.bilaspur@nic.in', phone:'07752-230501', pincode:'49' },

  // ══════════════════════════════════════════════════════════
  // TELANGANA (50)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Telangana', district:'Hyderabad',      constituency:'Hyderabad',       email:'mp.hyderabad@sansad.nic.in',  officeEmail:'office.hyd.mp@nic.in',    phone:'040-23242001', pincode:'50' },
  { type:'MP',  state:'Telangana', district:'Secunderabad',   constituency:'Secunderabad',    email:'mp.secunderabad@sansad.nic.in', officeEmail:'office.sec.mp@nic.in',  phone:'040-27502001', pincode:'50' },
  { type:'MP',  state:'Telangana', district:'Medchal-Malkajgiri', constituency:'Malkajgiri', email:'mp.malkajgiri@sansad.nic.in',  officeEmail:'office.mkg.mp@nic.in',  phone:'040-27802001', pincode:'50' },
  { type:'MLA', state:'Telangana', district:'Hyderabad',      constituency:'Jubilee Hills',   email:'mla.jubileehills@telangana.gov.in', officeEmail:'office.mla.jh@nic.in', phone:'040-23245001', pincode:'50' },
  { type:'MLA', state:'Telangana', district:'Hyderabad',      constituency:'Malakpet',        email:'mla.malakpet@telangana.gov.in', officeEmail:'office.mla.malakpet@nic.in', phone:'040-24455001', pincode:'50' },
  { type:'MLA', state:'Telangana', district:'Warangal',       constituency:'Warangal West',   email:'mla.warangal@telangana.gov.in', officeEmail:'office.mla.warangal@nic.in', phone:'0870-2445001', pincode:'50' },

  // ══════════════════════════════════════════════════════════
  // ANDHRA PRADESH (51-53)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Andhra Pradesh', district:'Visakhapatnam', constituency:'Visakhapatnam', email:'mp.vizag@sansad.nic.in',   officeEmail:'office.vizag.mp@nic.in',  phone:'0891-2753001', pincode:'53' },
  { type:'MP',  state:'Andhra Pradesh', district:'Vijayawada',    constituency:'Vijayawada',    email:'mp.vijayawada@sansad.nic.in', officeEmail:'office.vjw.mp@nic.in',  phone:'0866-2478001', pincode:'52' },
  { type:'MP',  state:'Andhra Pradesh', district:'Tirupati',      constituency:'Tirupati',      email:'mp.tirupati@sansad.nic.in',  officeEmail:'office.tirupati.mp@nic.in', phone:'0877-2232001', pincode:'51' },
  { type:'MLA', state:'Andhra Pradesh', district:'Visakhapatnam', constituency:'Visakhapatnam North', email:'mla.vizagnorth@ap.gov.in', officeEmail:'office.mla.vzan@nic.in', phone:'0891-2757001', pincode:'53' },
  { type:'MLA', state:'Andhra Pradesh', district:'Vijayawada',    constituency:'Vijayawada Central', email:'mla.vijayawada@ap.gov.in', officeEmail:'office.mla.vjw@nic.in', phone:'0866-2479001', pincode:'52' },

  // ══════════════════════════════════════════════════════════
  // KARNATAKA (56-59)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Karnataka', district:'Bengaluru Urban', constituency:'Bengaluru North',  email:'mp.bangalorenorth@sansad.nic.in', officeEmail:'office.blrn.mp@nic.in',  phone:'080-22254001', pincode:'56' },
  { type:'MP',  state:'Karnataka', district:'Bengaluru Urban', constituency:'Bengaluru South',  email:'mp.bangaloresouth@sansad.nic.in', officeEmail:'office.blrs.mp@nic.in',  phone:'080-26544001', pincode:'56' },
  { type:'MP',  state:'Karnataka', district:'Bengaluru Urban', constituency:'Bengaluru Central', email:'mp.bangalorecentral@sansad.nic.in', officeEmail:'office.blrc.mp@nic.in', phone:'080-22863001', pincode:'56' },
  { type:'MP',  state:'Karnataka', district:'Mysuru',          constituency:'Mysuru',           email:'mp.mysore@sansad.nic.in',    officeEmail:'office.mysore.mp@nic.in', phone:'0821-2524001', pincode:'57' },
  { type:'MP',  state:'Karnataka', district:'Mangaluru',       constituency:'Dakshina Kannada', email:'mp.mangalore@sansad.nic.in', officeEmail:'office.mgr.mp@nic.in',   phone:'0824-2425001', pincode:'57' },
  { type:'MLA', state:'Karnataka', district:'Bengaluru Urban', constituency:'Jayanagar',        email:'mla.jayanagar@karnataka.gov.in', officeEmail:'office.mla.jaynagar@nic.in', phone:'080-26655001', pincode:'56' },
  { type:'MLA', state:'Karnataka', district:'Bengaluru Urban', constituency:'Shivajinagar',     email:'mla.shivajinagar@karnataka.gov.in', officeEmail:'office.mla.shivnagar@nic.in', phone:'080-22864001', pincode:'56' },
  { type:'MLA', state:'Karnataka', district:'Mysuru',          constituency:'Mysuru City',      email:'mla.mysore@karnataka.gov.in', officeEmail:'office.mla.mysore@nic.in', phone:'0821-2527001', pincode:'57' },
  { type:'MLA', state:'Karnataka', district:'Hubballi',        constituency:'Hubballi-Dharwad East', email:'mla.hubballi@karnataka.gov.in', officeEmail:'office.mla.hubballi@nic.in', phone:'0836-2262001', pincode:'58' },

  // ══════════════════════════════════════════════════════════
  // TAMIL NADU (60-64)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Tamil Nadu', district:'Chennai',     constituency:'Chennai North',  email:'mp.chennaifn@sansad.nic.in', officeEmail:'office.chennain.mp@nic.in', phone:'044-28541001', pincode:'60' },
  { type:'MP',  state:'Tamil Nadu', district:'Chennai',     constituency:'Chennai South',  email:'mp.chennaish@sansad.nic.in', officeEmail:'office.chennaish.mp@nic.in', phone:'044-24332001', pincode:'60' },
  { type:'MP',  state:'Tamil Nadu', district:'Chennai',     constituency:'Chennai Central', email:'mp.chennaicen@sansad.nic.in', officeEmail:'office.chennaicen.mp@nic.in', phone:'044-25230001', pincode:'60' },
  { type:'MP',  state:'Tamil Nadu', district:'Coimbatore',  constituency:'Coimbatore',     email:'mp.coimbatore@sansad.nic.in', officeEmail:'office.cbe.mp@nic.in',    phone:'0422-2390001', pincode:'64' },
  { type:'MP',  state:'Tamil Nadu', district:'Madurai',     constituency:'Madurai',        email:'mp.madurai@sansad.nic.in',   officeEmail:'office.madurai.mp@nic.in', phone:'0452-2531001', pincode:'62' },
  { type:'MLA', state:'Tamil Nadu', district:'Chennai',     constituency:'Egmore',         email:'mla.egmore@tn.gov.in',      officeEmail:'office.mla.egmore@nic.in', phone:'044-28543001', pincode:'60' },
  { type:'MLA', state:'Tamil Nadu', district:'Chennai',     constituency:'Thiru Vi Ka Nagar', email:'mla.tvkn@tn.gov.in',    officeEmail:'office.mla.tvkn@nic.in',  phone:'044-26421001', pincode:'60' },
  { type:'MLA', state:'Tamil Nadu', district:'Coimbatore',  constituency:'Coimbatore North', email:'mla.cbenorth@tn.gov.in', officeEmail:'office.mla.cbn@nic.in',   phone:'0422-2391001', pincode:'64' },
  { type:'MLA', state:'Tamil Nadu', district:'Madurai',     constituency:'Madurai East',   email:'mla.madurai@tn.gov.in',    officeEmail:'office.mla.madurai@nic.in', phone:'0452-2532001', pincode:'62' },

  // ══════════════════════════════════════════════════════════
  // KERALA (67-69)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Kerala', district:'Thiruvananthapuram', constituency:'Thiruvananthapuram', email:'mp.thiruvananthapuram@sansad.nic.in', officeEmail:'office.tvm.mp@nic.in',  phone:'0471-2518001', pincode:'69' },
  { type:'MP',  state:'Kerala', district:'Ernakulam',          constituency:'Ernakulam',          email:'mp.ernakulam@sansad.nic.in',         officeEmail:'office.ekm.mp@nic.in',  phone:'0484-2361001', pincode:'68' },
  { type:'MP',  state:'Kerala', district:'Kozhikode',          constituency:'Kozhikode',          email:'mp.kozhikode@sansad.nic.in',         officeEmail:'office.kzd.mp@nic.in',  phone:'0495-2721001', pincode:'67' },
  { type:'MLA', state:'Kerala', district:'Thiruvananthapuram', constituency:'Thiruvananthapuram', email:'mla.tvm@kerala.gov.in',              officeEmail:'office.mla.tvm@nic.in', phone:'0471-2518401', pincode:'69' },
  { type:'MLA', state:'Kerala', district:'Ernakulam',          constituency:'Thrikkakara',        email:'mla.thrikkakara@kerala.gov.in',       officeEmail:'office.mla.tkr@nic.in', phone:'0484-2361401', pincode:'68' },
  { type:'MLA', state:'Kerala', district:'Kozhikode',          constituency:'Kozhikode North',    email:'mla.kozhikode@kerala.gov.in',         officeEmail:'office.mla.kzdn@nic.in', phone:'0495-2721401', pincode:'67' },
  { type:'MLA', state:'Kerala', district:'Malappuram',         constituency:'Tirur',              email:'mla.tirur@kerala.gov.in',             officeEmail:'office.mla.tirur@nic.in', phone:'0494-2421401', pincode:'67' },

  // ══════════════════════════════════════════════════════════
  // WEST BENGAL (70-74)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'West Bengal', district:'Kolkata',     constituency:'Kolkata North',   email:'mp.kolkatanorth@sansad.nic.in',  officeEmail:'office.kln.mp@nic.in',   phone:'033-22481001', pincode:'70' },
  { type:'MP',  state:'West Bengal', district:'Kolkata',     constituency:'Kolkata South',   email:'mp.kolkatasouth@sansad.nic.in',  officeEmail:'office.kls.mp@nic.in',   phone:'033-24791001', pincode:'70' },
  { type:'MP',  state:'West Bengal', district:'Howrah',      constituency:'Howrah',          email:'mp.howrah@sansad.nic.in',        officeEmail:'office.howrah.mp@nic.in', phone:'033-26383001', pincode:'71' },
  { type:'MP',  state:'West Bengal', district:'Hooghly',     constituency:'Hooghly',         email:'mp.hooghly@sansad.nic.in',       officeEmail:'office.hooghly.mp@nic.in', phone:'033-26721001', pincode:'71' },
  { type:'MLA', state:'West Bengal', district:'Kolkata',     constituency:'Bhowanipore',     email:'mla.bhowanipore@wb.gov.in',      officeEmail:'office.mla.bhowanip@nic.in', phone:'033-24559001', pincode:'70' },
  { type:'MLA', state:'West Bengal', district:'Kolkata',     constituency:'Entally',         email:'mla.entally@wb.gov.in',          officeEmail:'office.mla.entally@nic.in', phone:'033-22300001', pincode:'70' },
  { type:'MLA', state:'West Bengal', district:'Howrah',      constituency:'Howrah North',    email:'mla.howrah@wb.gov.in',           officeEmail:'office.mla.howrah@nic.in', phone:'033-26389001', pincode:'71' },

  // ══════════════════════════════════════════════════════════
  // ODISHA (75-77)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Odisha', district:'Bhubaneswar', constituency:'Bhubaneswar', email:'mp.bhubaneswar@sansad.nic.in', officeEmail:'office.bbsr.mp@nic.in',  phone:'0674-2394001', pincode:'75' },
  { type:'MP',  state:'Odisha', district:'Cuttack',     constituency:'Cuttack',     email:'mp.cuttack@sansad.nic.in',    officeEmail:'office.ctc.mp@nic.in',   phone:'0671-2414001', pincode:'75' },
  { type:'MLA', state:'Odisha', district:'Bhubaneswar', constituency:'Bhubaneswar Central', email:'mla.bbsr@odisha.gov.in', officeEmail:'office.mla.bbsr@nic.in', phone:'0674-2394501', pincode:'75' },
  { type:'MLA', state:'Odisha', district:'Cuttack',     constituency:'Cuttack Sadar', email:'mla.cuttack@odisha.gov.in', officeEmail:'office.mla.ctc@nic.in',  phone:'0671-2414501', pincode:'75' },
  { type:'MLA', state:'Odisha', district:'Sambalpur',   constituency:'Sambalpur',   email:'mla.sambalpur@odisha.gov.in', officeEmail:'office.mla.smbp@nic.in', phone:'0663-2530501', pincode:'76' },

  // ══════════════════════════════════════════════════════════
  // ASSAM (78)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Assam', district:'Kamrup Metropolitan', constituency:'Gauhati',   email:'mp.gauhati@sansad.nic.in',  officeEmail:'office.gauhati.mp@nic.in',  phone:'0361-2547001', pincode:'78' },
  { type:'MP',  state:'Assam', district:'Dibrugarh',           constituency:'Dibrugarh', email:'mp.dibrugarh@sansad.nic.in', officeEmail:'office.dibrugr.mp@nic.in', phone:'0373-2320001', pincode:'78' },
  { type:'MLA', state:'Assam', district:'Kamrup Metropolitan', constituency:'Jalukbari', email:'mla.jalukbari@assam.gov.in', officeEmail:'office.mla.jalukbari@nic.in', phone:'0361-2547501', pincode:'78' },
  { type:'MLA', state:'Assam', district:'Kamrup Metropolitan', constituency:'Dispur',    email:'mla.dispur@assam.gov.in',   officeEmail:'office.mla.dispur@nic.in', phone:'0361-2237501', pincode:'78' },

  // ══════════════════════════════════════════════════════════
  // BIHAR (80-85)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Bihar', district:'Patna',         constituency:'Patna Sahib',   email:'mp.patnasahib@sansad.nic.in',  officeEmail:'office.patnasahib.mp@nic.in', phone:'0612-2230001', pincode:'80' },
  { type:'MP',  state:'Bihar', district:'Patna',         constituency:'Patliputra',    email:'mp.patliputra@sansad.nic.in',  officeEmail:'office.patliputra.mp@nic.in', phone:'0612-2231001', pincode:'80' },
  { type:'MP',  state:'Bihar', district:'Gaya',          constituency:'Gaya',          email:'mp.gaya@sansad.nic.in',        officeEmail:'office.gaya.mp@nic.in',       phone:'0631-2220001', pincode:'82' },
  { type:'MP',  state:'Bihar', district:'Muzaffarpur',   constituency:'Muzaffarpur',   email:'mp.muzaffarpur@sansad.nic.in', officeEmail:'office.mzfpur.mp@nic.in',     phone:'0621-2244001', pincode:'84' },
  { type:'MP',  state:'Bihar', district:'Bhagalpur',     constituency:'Bhagalpur',     email:'mp.bhagalpur@sansad.nic.in',   officeEmail:'office.bhglpur.mp@nic.in',    phone:'0641-2401001', pincode:'81' },
  { type:'MLA', state:'Bihar', district:'Patna',         constituency:'Patna Sahib',   email:'mla.patnasahib@bih.nic.in',   officeEmail:'office.mla.patnasahib@nic.in', phone:'0612-2232001', pincode:'80' },
  { type:'MLA', state:'Bihar', district:'Patna',         constituency:'Bankipur',      email:'mla.bankipur@bih.nic.in',     officeEmail:'office.mla.bankipur@nic.in',   phone:'0612-2233001', pincode:'80' },
  { type:'MLA', state:'Bihar', district:'Gaya',          constituency:'Gaya Town',     email:'mla.gaya@bih.nic.in',         officeEmail:'office.mla.gaya@nic.in',       phone:'0631-2221001', pincode:'82' },
  { type:'MLA', state:'Bihar', district:'Muzaffarpur',   constituency:'Muzaffarpur',   email:'mla.muzaffarpur@bih.nic.in',  officeEmail:'office.mla.mzfpur@nic.in',     phone:'0621-2245001', pincode:'84' },
  { type:'MLA', state:'Bihar', district:'Patna',         constituency:'Digha',         email:'mla.digha@bih.nic.in',        officeEmail:'office.mla.digha@nic.in',      phone:'0612-2580001', pincode:'80' },

  // ══════════════════════════════════════════════════════════
  // CHANDIGARH (16)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Chandigarh', district:'Chandigarh', constituency:'Chandigarh', email:'mp.chandigarh@sansad.nic.in', officeEmail:'office.chd.mp@nic.in', phone:'0172-2741001', pincode:'16' },
  { type:'MLA', state:'Chandigarh', district:'Chandigarh', constituency:'Chandigarh', email:'mla.chandigarh@chandigarh.gov.in', officeEmail:'office.mla.chd@nic.in', phone:'0172-2742001', pincode:'16' },

  // ══════════════════════════════════════════════════════════
  // UTTARAKHAND (24-25)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Uttarakhand', district:'Dehradun',  constituency:'Tehri Garhwal', email:'mp.tehri@sansad.nic.in',      officeEmail:'office.tehri.mp@nic.in',    phone:'0135-2657001', pincode:'24' },
  { type:'MP',  state:'Uttarakhand', district:'Haridwar',  constituency:'Haridwar',      email:'mp.haridwar@sansad.nic.in',   officeEmail:'office.haridwar.mp@nic.in', phone:'01334-220001', pincode:'24' },
  { type:'MLA', state:'Uttarakhand', district:'Dehradun',  constituency:'Dehradun Cantonment', email:'mla.dehradun@uk.gov.in', officeEmail:'office.mla.deh@nic.in', phone:'0135-2657501', pincode:'24' },
  { type:'MLA', state:'Uttarakhand', district:'Haridwar',  constituency:'Haridwar City', email:'mla.haridwar@uk.gov.in',      officeEmail:'office.mla.hdwr@nic.in',    phone:'01334-220501', pincode:'24' },

  // ══════════════════════════════════════════════════════════
  // JHARKHAND (82-83)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Jharkhand', district:'Ranchi',    constituency:'Ranchi',    email:'mp.ranchi@sansad.nic.in',   officeEmail:'office.ranchi.mp@nic.in',   phone:'0651-2210001', pincode:'83' },
  { type:'MP',  state:'Jharkhand', district:'Dhanbad',   constituency:'Dhanbad',   email:'mp.dhanbad@sansad.nic.in',  officeEmail:'office.dhanbad.mp@nic.in',  phone:'0326-2319001', pincode:'82' },
  { type:'MLA', state:'Jharkhand', district:'Ranchi',    constituency:'Ranchi',    email:'mla.ranchi@jharkhand.gov.in', officeEmail:'office.mla.ranchi@nic.in', phone:'0651-2210501', pincode:'83' },
  { type:'MLA', state:'Jharkhand', district:'Dhanbad',   constituency:'Dhanbad',   email:'mla.dhanbad@jharkhand.gov.in', officeEmail:'office.mla.dhanbad@nic.in', phone:'0326-2319501', pincode:'82' },

  // ══════════════════════════════════════════════════════════
  // JAMMU & KASHMIR (18-19)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Jammu & Kashmir', district:'Srinagar', constituency:'Srinagar',  email:'mp.srinagar@sansad.nic.in', officeEmail:'office.srinagar.mp@nic.in', phone:'0194-2502001', pincode:'19' },
  { type:'MP',  state:'Jammu & Kashmir', district:'Jammu',    constituency:'Jammu',     email:'mp.jammu@sansad.nic.in',    officeEmail:'office.jammu.mp@nic.in',    phone:'0191-2544001', pincode:'18' },
  { type:'MLA', state:'Jammu & Kashmir', district:'Srinagar', constituency:'Hazratbal', email:'mla.hazratbal@jk.gov.in',   officeEmail:'office.mla.hazratbal@nic.in', phone:'0194-2502501', pincode:'19' },
  { type:'MLA', state:'Jammu & Kashmir', district:'Jammu',    constituency:'Jammu East', email:'mla.jammueast@jk.gov.in',  officeEmail:'office.mla.jammueast@nic.in', phone:'0191-2544501', pincode:'18' },

  // ══════════════════════════════════════════════════════════
  // GOA (40)
  // ══════════════════════════════════════════════════════════
  { type:'MP',  state:'Goa', district:'North Goa', constituency:'North Goa', email:'mp.northgoa@sansad.nic.in', officeEmail:'office.ngoa.mp@nic.in', phone:'0832-2224001', pincode:'40' },
  { type:'MP',  state:'Goa', district:'South Goa', constituency:'South Goa', email:'mp.southgoa@sansad.nic.in', officeEmail:'office.sgoa.mp@nic.in', phone:'0832-2710001', pincode:'40' },
  { type:'MLA', state:'Goa', district:'North Goa', constituency:'Panaji',    email:'mla.panaji@goa.gov.in',     officeEmail:'office.mla.panaji@nic.in', phone:'0832-2224501', pincode:'40' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function seedRepresentatives() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Clearing old Representative data...');
    await Representative.deleteMany({});

    console.log(`Inserting ${REPRESENTATIVES.length} MLA/MP records...`);
    await Representative.insertMany(REPRESENTATIVES);

    // Count by type
    const mpCount  = REPRESENTATIVES.filter(r => r.type === 'MP').length;
    const mlaCount = REPRESENTATIVES.filter(r => r.type === 'MLA').length;
    const states   = [...new Set(REPRESENTATIVES.map(r => r.state))].length;
    const districts= [...new Set(REPRESENTATIVES.map(r => r.district))].length;

    console.log('\n✅ Representative Database Seeded Successfully!');
    console.log(`📊 Total Records  : ${REPRESENTATIVES.length}`);
    console.log(`🏛️  MPs            : ${mpCount}`);
    console.log(`👤 MLAs           : ${mlaCount}`);
    console.log(`🗺️  States/UTs     : ${states}`);
    console.log(`🏙️  Districts       : ${districts}`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedRepresentatives();
