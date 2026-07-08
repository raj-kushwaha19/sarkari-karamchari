/**
 * CATEGORY RESOLVER (No hardcoded emails)
 */

const CATEGORY_LABELS = {
  electricity: 'Electricity',
  water:       'Water Supply',
  roads:       'Roads & Infrastructure',
  sanitation:  'Sanitation & Waste',
  police:      'Police',
  streetlight: 'Street Lights',
  telecom:     'Telecom / Network',
  aadhaar:     'Aadhaar / Documents',
  ration:      'Ration / PDS',
  foodsafety:  'Food Safety',
  general:     'General Grievance',
  traffic:     'Traffic & Parking',
};

const detectCategory = (text) => {
  const t = text.toLowerCase();
  if (t.match(/electricity|eletricity|bijli|light|power\s*cut|blackout|voltage|meter|transformer|wire|current/)) return 'electricity';
  if (t.match(/water|pani|paani|panni|pipeline|pipe|sewage|drain|naali|tapwater|borewell/)) return 'water';
  
  // Sanitation/Dead Animals takes precedence
  if (t.match(/garbage|kachra|sanitation|dustbin|waste|sweeping|gutter|open\s*defec|cow|animal|mar\s*gyi|dead|badbu|smell|carcass|dog/)) return 'sanitation';
  
  // Traffic takes precedence over roads if both are mentioned
  if (t.match(/traffic|jam|parking|vehicle|car|bike|no\s*entry/)) return 'traffic';
  if (t.match(/road|sadak|pothole|footpath|divider|flyover|highway|gali/)) return 'roads';
  if (t.match(/police|crime|theft|chori|assault|eve\s*tease|harassment|fir|complaint|law/)) return 'police';
  if (t.match(/street\s*light|streetlight|lamp\s*post|pole\s*light/)) return 'streetlight';
  if (t.match(/mobile\s*tower|signal|network|internet|bsnl|airtel|jio|broadband|telecom/)) return 'telecom';
  if (t.match(/aadhaar|aadhar|uid|biometric|enroll/)) return 'aadhaar';
  if (t.match(/ration|pds|food\s*card|kerosene|wheat|rice\s*quota/)) return 'ration';
  if (t.match(/food|restaurant|dhaba|hygiene|unhygienic|khana|quality/)) return 'foodsafety';
  return 'general';
};

const VERIFIED_EMAILS = {
  foodsafety: {
    '11': 'cfss.delhi@nic.in', // Delhi
    'default': 'compliance@fssai.gov.in' // National FSSAI
  },
  water: {
    '11': 'grievances-djb@delhi.gov.in' // Delhi Jal Board
  },
  electricity: {
    '11': 'customercare@bsesdelhi.com' // Delhi BSES
  },
  sanitation: {
    '11': 'mcd-ithelpdesk@mcd.nic.in' // Delhi MCD 
  },
  police: {
    '11': 'cp.amulya@delhipolice.gov.in' // Delhi Police
  },
  traffic: {
    '11': 'jtcpt.dtp@nic.in' // Delhi Traffic Police
  }
};

const resolveOfficialEmail = (rawText, pincode) => {
  const categoryKey = detectCategory(rawText);
  
  let verifiedEmail = null;
  if (VERIFIED_EMAILS[categoryKey]) {
    const statePrefix = String(pincode).substring(0, 2);
    verifiedEmail = VERIFIED_EMAILS[categoryKey][statePrefix] || VERIFIED_EMAILS[categoryKey]['default'] || null;
  }

  return {
    category: categoryKey,
    name: CATEGORY_LABELS[categoryKey],
    verifiedEmail: verifiedEmail
  };
};

const getStateFromPincode = (pincode) => {
  const prefix = String(pincode).substring(0, 2);
  const stateMap = {
    '11': 'Delhi', '12': 'Haryana', '13': 'Haryana',
    '14': 'Punjab', '15': 'Punjab', '16': 'Punjab', '17': 'Himachal Pradesh',
    '18': 'Jammu & Kashmir', '19': 'Jammu & Kashmir',
    '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh', '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
    '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
    '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
    '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra',
    '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh', '49': 'Chhattisgarh',
    '50': 'Telangana', '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh',
    '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
    '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu',
    '67': 'Kerala', '68': 'Kerala', '69': 'Kerala',
    '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal',
    '75': 'Odisha', '76': 'Odisha', '77': 'Odisha',
    '78': 'Assam', '79': 'North East India',
    '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '83': 'Bihar', '84': 'Bihar', '85': 'Bihar'
  };
  return stateMap[prefix] || '';
};

module.exports = { resolveOfficialEmail, detectCategory, CATEGORY_LABELS, getStateFromPincode, VERIFIED_EMAILS };
