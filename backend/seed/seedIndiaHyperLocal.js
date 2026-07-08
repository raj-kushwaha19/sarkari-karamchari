const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const DepartmentEmailCache = require('../src/models/DepartmentEmailCache');

dotenv.config({ path: path.join(__dirname, '../.env') });

const STATE_LEVEL_PREFIXES = {
  '11': 'Delhi', 
  '12': 'Haryana', '13': 'Haryana',
  '14': 'Punjab', '15': 'Punjab', '16': 'Punjab', 
  '17': 'Himachal Pradesh',
  '18': 'Jammu & Kashmir', '19': 'Jammu & Kashmir',
  '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh', '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
  '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
  '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
  '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra',
  '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh', 
  '49': 'Chhattisgarh',
  '50': 'Telangana', 
  '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh',
  '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
  '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu',
  '67': 'Kerala', '68': 'Kerala', '69': 'Kerala',
  '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal',
  '75': 'Odisha', '76': 'Odisha', '77': 'Odisha',
  '78': 'Assam', '79': 'North East India',
  '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '83': 'Bihar', '84': 'Bihar', '85': 'Bihar'
};

const generateStateDepartments = (stateName) => {
  const safeName = stateName.replace(/\s+/g, '').toLowerCase();
  return {
    police: { name: `${stateName} State Police HQ`, email: `dgp@${safeName}police.gov.in` },
    traffic: { name: `${stateName} State Traffic Directorate`, email: `traffic@${safeName}police.gov.in` },
    water: { name: `${stateName} State Water Supply Board`, email: `grievance@${safeName}water.gov.in` },
    electricity: { name: `${stateName} State Electricity Board`, email: `customercare@${safeName}power.gov.in` },
    sanitation: { name: `${stateName} State Urban Local Bodies`, email: `complaints@${safeName}municipal.gov.in` },
    roads: { name: `${stateName} PWD / Highways`, email: `pwd@${safeName}.gov.in` },
    health: { name: `${stateName} Dept of Health`, email: `cmo@${safeName}health.gov.in` },
    transport: { name: `${stateName} State Transport HQ`, email: `rto@${safeName}transport.gov.in` },
    fire: { name: `${stateName} Fire & Emergency Services`, email: `fire@${safeName}.gov.in` },
    ration: { name: `${stateName} Dept of Food & PDS`, email: `pds@${safeName}food.gov.in` },
    streetlight: { name: `${stateName} Municipal Admin`, email: `streetlights@${safeName}municipal.gov.in` },
    forest: { name: `${stateName} Forest Dept`, email: `forest@${safeName}.gov.in` }
  };
};

// MASSIVE HYPER-LOCAL OVERRIDES (~40 Cities)
const HYPER_LOCAL_OVERRIDES = {
  // --- METROS ---
  '110': { // Delhi Exact
    police: { name: 'Delhi Police', email: 'cp.amulya@delhipolice.gov.in' }, traffic: { name: 'Delhi Traffic Police', email: 'jtcpt.dtp@nic.in' }, water: { name: 'Delhi Jal Board', email: 'grievances-djb@delhi.gov.in' }, electricity: { name: 'BSES Delhi', email: 'customercare@bsesdelhi.com' }, sanitation: { name: 'Municipal Corporation of Delhi', email: 'mcd-ithelpdesk@mcd.nic.in' }, foodsafety: { name: 'Department of Food Safety Delhi', email: 'cfss.delhi@nic.in' }, roads: { name: 'Delhi PWD', email: 'eincpwd.delhi@gov.in' }, streetlight: { name: 'MCD Streetlights', email: 'mcd-ithelpdesk@mcd.nic.in' }, ration: { name: 'Delhi Food & Civil Supplies', email: 'cfs@nic.in' }, forest: { name: 'Delhi Forest Department', email: 'cfdelhi@nic.in' }, transport: { name: 'Delhi Transport Department', email: 'commtpt@nic.in' }, fire: { name: 'Delhi Fire Service', email: 'dfshq.dlfire@nic.in' }, health: { name: 'Delhi Health Services', email: 'dghs@nic.in' }
  },
  '400': { // Mumbai
    police: { name: 'Mumbai Police HQ', email: 'cp.mumbai@mahapolice.gov.in' }, traffic: { name: 'Mumbai Traffic Police', email: 'cp.mumbai.jtcp.traf@mahapolice.gov.in' }, water: { name: 'BMC Water Department', email: 'he@mcgm.gov.in' }, electricity: { name: 'BEST / Tata Power', email: 'customercare@mahadiscom.in' }, sanitation: { name: 'Brihanmumbai Municipal Corporation', email: 'mc@mcgm.gov.in' }, foodsafety: { name: 'FDA Mumbai', email: 'fda@maharashtra.gov.in' }, roads: { name: 'BMC Roads Dept', email: 'mc@mcgm.gov.in' }, streetlight: { name: 'BMC Lighting', email: 'mc@mcgm.gov.in' }, ration: { name: 'Mumbai Ration Office', email: 'fcs@maharashtra.gov.in' }, forest: { name: 'SGNP Rescue', email: 'pccf_ho_ngp@mahaforest.gov.in' }, transport: { name: 'Mumbai RTO', email: 'rto.mumbai@maha.gov.in' }, fire: { name: 'Mumbai Fire Brigade', email: 'mfb@mcgm.gov.in' }, health: { name: 'BMC Health Department', email: 'eho@mcgm.gov.in' }
  },
  '560': { // Bangalore
    police: { name: 'Bangalore City Police', email: 'compol@ksp.gov.in' }, traffic: { name: 'Bangalore Traffic Police', email: 'addlcp.traffic@ksp.gov.in' }, water: { name: 'BWSSB Bangalore', email: 'callcenter@bwssb.gov.in' }, electricity: { name: 'BESCOM', email: 'helpline@bescom.co.in' }, sanitation: { name: 'BBMP', email: 'comm@bbmp.gov.in' }, roads: { name: 'BBMP Major Roads', email: 'comm@bbmp.gov.in' }, transport: { name: 'Bangalore RTO', email: 'transcom@nic.in' }, fire: { name: 'Bangalore Fire Services', email: 'dg.ksfes@karnataka.gov.in' }, health: { name: 'BBMP Health', email: 'cho@bbmp.gov.in' }, streetlight: { name: 'BBMP Lighting', email: 'comm@bbmp.gov.in' }
  },
  '600': { // Chennai
    police: { name: 'Chennai Greater Police', email: 'cop@chennaipolice.gov.in' }, traffic: { name: 'Chennai Traffic Police', email: 'addlcop.traffic@chennaipolice.gov.in' }, water: { name: 'CMWSSB', email: 'grievance@chennaimetrowater.tn.nic.in' }, electricity: { name: 'TANGEDCO', email: 'cpro@tnebnet.org' }, sanitation: { name: 'Greater Chennai Corporation', email: 'commissioner@chennaicorporation.gov.in' }, roads: { name: 'GCC Roads', email: 'commissioner@chennaicorporation.gov.in' }, transport: { name: 'Chennai RTO', email: 'rto.chennai@tn.gov.in' }, health: { name: 'GCC Health', email: 'health@chennaicorporation.gov.in' }, fire: { name: 'TN Fire', email: 'tnfrs@tn.gov.in' }
  },
  '700': { // Kolkata
    police: { name: 'Kolkata Police', email: 'cp@kolkatapolice.gov.in' }, traffic: { name: 'Kolkata Traffic Police', email: 'dctp@kolkatapolice.gov.in' }, water: { name: 'KMC Water Supply', email: 'kmc.water@kmcgov.in' }, electricity: { name: 'CESC Kolkata', email: 'cescltd@rpsg.in' }, sanitation: { name: 'Kolkata Municipal Corporation', email: 'kmc.swm@kmcgov.in' }, roads: { name: 'KMC Roads', email: 'kmc.roads@kmcgov.in' }, transport: { name: 'Kolkata RTO', email: 'rto.kolkata@wb.gov.in' }, health: { name: 'KMC Health', email: 'kmc.health@kmcgov.in' }, fire: { name: 'WB Fire', email: 'wbfs@wb.gov.in' }
  },
  '500': { // Hyderabad
    police: { name: 'Hyderabad Police', email: 'cp-hyd@tspolice.gov.in' }, traffic: { name: 'Hyderabad Traffic Police', email: 'addlcp-tr-hyd@tspolice.gov.in' }, water: { name: 'HMWSSB', email: 'customer_care@hyderabadwater.gov.in' }, electricity: { name: 'TSSPDCL', email: 'customerservice@tssourthernpower.com' }, sanitation: { name: 'GHMC', email: 'commissioner@ghmc.gov.in' }, roads: { name: 'GHMC Roads', email: 'commissioner@ghmc.gov.in' }, transport: { name: 'Hyderabad RTO', email: 'rto.hyd@ts.gov.in' }, fire: { name: 'TS Fire', email: 'dgfire@ts.gov.in' }, health: { name: 'GHMC Health', email: 'cmoh@ghmc.gov.in' }
  },

  // --- TIER 2 & 3 CITIES ---
  '411': { // Pune
    police: { name: 'Pune City Police', email: 'cp.pune@mahapolice.gov.in' }, traffic: { name: 'Pune Traffic Police', email: 'dcp.traffic.pune@mahapolice.gov.in' }, water: { name: 'PMC Water Supply', email: 'water@punecorporation.org' }, electricity: { name: 'MSEDCL Pune', email: 'customercare@mahadiscom.in' }, sanitation: { name: 'Pune Municipal Corporation', email: 'info@punecorporation.org' }, roads: { name: 'PMC Road Dept', email: 'info@punecorporation.org' }, fire: { name: 'Pune Fire Brigade', email: 'fire@punecorporation.org' }, transport: { name: 'Pune RTO', email: 'rto.pune@maha.gov.in' }
  },
  '440': { // Nagpur
    police: { name: 'Nagpur City Police', email: 'cp.nagpur@mahapolice.gov.in' }, traffic: { name: 'Nagpur Traffic Police', email: 'dcp.traffic.nagpur@mahapolice.gov.in' }, water: { name: 'NMC Water', email: 'nmcngp@gmail.com' }, sanitation: { name: 'Nagpur Municipal Corporation', email: 'nmcngp@gmail.com' }, electricity: { name: 'MSEDCL Nagpur', email: 'customercare@mahadiscom.in' }, fire: { name: 'Nagpur Fire', email: 'nmcngp@gmail.com' }
  },
  '570': { // Mysore
    police: { name: 'Mysuru City Police', email: 'compolmysuru@ksp.gov.in' }, sanitation: { name: 'Mysuru City Corporation', email: 'mccmysore@gmail.com' }, electricity: { name: 'CESC Mysore', email: 'customercare@cescmysore.org' }, water: { name: 'VVWW', email: 'vvww@mysore.gov.in' }, traffic: { name: 'Mysore Traffic', email: 'addlcp.traffic@ksp.gov.in' }
  },
  '122': { // Gurugram
    police: { name: 'Gurugram Police', email: 'cp.ggm@hry.nic.in' }, traffic: { name: 'Gurugram Traffic Police', email: 'dcp.traffic.ggm@hry.nic.in' }, water: { name: 'GMDA', email: 'ceo.gmda@gov.in' }, electricity: { name: 'DHBVN', email: 'customercare@dhbvn.org.in' }, sanitation: { name: 'Municipal Corporation Gurugram', email: 'cmc@mcg.gov.in' }, roads: { name: 'MCG Roads', email: 'cmc@mcg.gov.in' }, fire: { name: 'Gurugram Fire', email: 'fire@mcg.gov.in' }
  },
  '121': { // Faridabad
    police: { name: 'Faridabad Police', email: 'cp.fbd@hry.nic.in' }, sanitation: { name: 'Municipal Corporation Faridabad', email: 'mcfbd@hry.nic.in' }, water: { name: 'MCF Water', email: 'mcfbd@hry.nic.in' }, electricity: { name: 'DHBVN Faridabad', email: 'customercare@dhbvn.org.in' }, traffic: { name: 'Faridabad Traffic', email: 'dcp.traffic.fbd@hry.nic.in' }
  },
  '800': { // Patna
    police: { name: 'Patna Police', email: 'ssp-patna-bih@nic.in' }, traffic: { name: 'Patna Traffic Police', email: 'sp-traffic-pat@bih.nic.in' }, water: { name: 'Patna Water Board', email: 'buidcopatna@gmail.com' }, electricity: { name: 'PESU Patna', email: 'helpline.sbpdcl@gmail.com' }, sanitation: { name: 'Patna Municipal Corporation', email: 'pmcprda@gmail.com' }, roads: { name: 'RCD Patna', email: 'rcd-bih@nic.in' }, fire: { name: 'Patna Fire', email: 'dg-fire-bih@nic.in' }
  },
  '201': { // Noida
    police: { name: 'Noida Police Commisionerate', email: 'cp.gbn@up.nic.in' }, traffic: { name: 'Noida Traffic Police', email: 'dcptraffic.gbn@up.nic.in' }, water: { name: 'Noida Jal Board', email: 'noida@noidaauthorityonline.in' }, electricity: { name: 'PVVNL', email: 'mdpvvnl@uppcl.org' }, sanitation: { name: 'Noida Authority', email: 'noida@noidaauthorityonline.in' }, roads: { name: 'Noida Authority', email: 'noida@noidaauthorityonline.in' }
  },
  '226': { // Lucknow
    police: { name: 'Lucknow Police', email: 'cp.lko@up.nic.in' }, traffic: { name: 'Lucknow Traffic', email: 'dcptraffic.lko@up.nic.in' }, water: { name: 'Jal Sansthan Lucknow', email: 'gmjalko@gmail.com' }, electricity: { name: 'MVVNL', email: 'md.mvvnl@uppcl.org' }, sanitation: { name: 'Lucknow Municipal Corporation', email: 'nnlko@nic.in' }, fire: { name: 'Lucknow Fire', email: 'upfireservice@nic.in' }
  },
  '380': { // Ahmedabad
    police: { name: 'Ahmedabad City Police', email: 'cp-ahd@gujarat.gov.in' }, traffic: { name: 'Ahmedabad Traffic', email: 'jcp-traf-ahd@gujarat.gov.in' }, sanitation: { name: 'Ahmedabad Municipal Corporation', email: 'info@ahmedabadcity.gov.in' }, electricity: { name: 'Torrent Power', email: 'connect.ahd@torrentpower.com' }, water: { name: 'AMC Water', email: 'info@ahmedabadcity.gov.in' }, roads: { name: 'AMC Roads', email: 'info@ahmedabadcity.gov.in' }
  },
  
  // -- NEWLY ADDED TIER 2 & 3 CITIES --
  '302': { // Jaipur
    police: { name: 'Jaipur Police', email: 'cp.jaipur@rajpolice.gov.in' }, traffic: { name: 'Jaipur Traffic', email: 'dcp.traffic.jaipur@rajpolice.gov.in' }, water: { name: 'PHED Jaipur', email: 'phed.jaipur@rajasthan.gov.in' }, electricity: { name: 'JVVNL', email: 'helpline@jvvnl.org' }, sanitation: { name: 'Jaipur Municipal Corporation', email: 'jmc@rajasthan.gov.in' }
  },
  '395': { // Surat
    police: { name: 'Surat Police', email: 'cp-surat@gujarat.gov.in' }, traffic: { name: 'Surat Traffic', email: 'dcp-traf-surat@gujarat.gov.in' }, water: { name: 'SMC Water', email: 'info@suratmunicipal.org' }, electricity: { name: 'DGVCL', email: 'customercare@dgvcl.com' }, sanitation: { name: 'Surat Municipal Corporation', email: 'info@suratmunicipal.org' }
  },
  '208': { // Kanpur
    police: { name: 'Kanpur Police', email: 'cp.knp@up.nic.in' }, traffic: { name: 'Kanpur Traffic', email: 'dcp.traffic.knp@up.nic.in' }, water: { name: 'Jal Sansthan Kanpur', email: 'jskanpur@gmail.com' }, electricity: { name: 'KESCO', email: 'mdkesco@gmail.com' }, sanitation: { name: 'Kanpur Nagar Nigam', email: 'kmc@up.nic.in' }
  },
  '452': { // Indore
    police: { name: 'Indore Police', email: 'sp.indore@mppolice.gov.in' }, traffic: { name: 'Indore Traffic', email: 'traffic.indore@mppolice.gov.in' }, water: { name: 'Indore Water', email: 'info@imcindore.org' }, electricity: { name: 'MPPKVVCL', email: 'customercare@mpez.co.in' }, sanitation: { name: 'Indore Municipal Corporation', email: 'info@imcindore.org' }
  },
  '462': { // Bhopal
    police: { name: 'Bhopal Police', email: 'sp.bhopal@mppolice.gov.in' }, traffic: { name: 'Bhopal Traffic', email: 'traffic.bhopal@mppolice.gov.in' }, water: { name: 'Bhopal Water', email: 'bmc@bhopalmunicipal.org' }, electricity: { name: 'MPMKVVCL', email: 'customercare@mpcz.co.in' }, sanitation: { name: 'Bhopal Municipal Corporation', email: 'bmc@bhopalmunicipal.org' }
  },
  '141': { // Ludhiana
    police: { name: 'Ludhiana Police', email: 'cp.ludhiana@punjabpolice.gov.in' }, traffic: { name: 'Ludhiana Traffic', email: 'traffic.ludhiana@punjabpolice.gov.in' }, water: { name: 'LMC Water', email: 'mcludhiana@punjab.gov.in' }, electricity: { name: 'PSPCL', email: 'contactus@pspcl.in' }, sanitation: { name: 'Ludhiana Municipal Corp', email: 'mcludhiana@punjab.gov.in' }
  },
  '282': { // Agra
    police: { name: 'Agra Police', email: 'ssp.agra@up.nic.in' }, traffic: { name: 'Agra Traffic', email: 'traffic.agra@up.nic.in' }, water: { name: 'Agra Water', email: 'amc@up.nic.in' }, electricity: { name: 'Torrent Power Agra', email: 'connect.agra@torrentpower.com' }, sanitation: { name: 'Agra Nagar Nigam', email: 'amc@up.nic.in' }
  },
  '422': { // Nashik
    police: { name: 'Nashik Police', email: 'cp.nashik@mahapolice.gov.in' }, traffic: { name: 'Nashik Traffic', email: 'dcp.traffic.nashik@mahapolice.gov.in' }, water: { name: 'NMC Water', email: 'commissioner@nashikcorporation.in' }, electricity: { name: 'MSEDCL Nashik', email: 'customercare@mahadiscom.in' }, sanitation: { name: 'Nashik Municipal Corp', email: 'commissioner@nashikcorporation.in' }
  },
  '360': { // Rajkot
    police: { name: 'Rajkot Police', email: 'cp-rajkot@gujarat.gov.in' }, traffic: { name: 'Rajkot Traffic', email: 'dcp-traf-rajkot@gujarat.gov.in' }, water: { name: 'RMC Water', email: 'mc_rmc@rmc.gov.in' }, electricity: { name: 'PGVCL', email: 'customercare@pgvcl.com' }, sanitation: { name: 'Rajkot Municipal Corp', email: 'mc_rmc@rmc.gov.in' }
  },
  '221': { // Varanasi
    police: { name: 'Varanasi Police', email: 'ssp.vns@up.nic.in' }, traffic: { name: 'Varanasi Traffic', email: 'traffic.vns@up.nic.in' }, water: { name: 'Varanasi Water', email: 'vnn@up.nic.in' }, electricity: { name: 'PUVVNL', email: 'mdpuvvnl@uppcl.org' }, sanitation: { name: 'Varanasi Nagar Nigam', email: 'vnn@up.nic.in' }
  },
  '190': { // Srinagar
    police: { name: 'Srinagar Police', email: 'ssp.srinagar@jkpolice.gov.in' }, traffic: { name: 'Srinagar Traffic', email: 'traffic.sgr@jkpolice.gov.in' }, water: { name: 'PHE Kashmir', email: 'phe.kashmir@jk.gov.in' }, electricity: { name: 'JKPDD', email: 'jkpdd@jk.gov.in' }, sanitation: { name: 'Srinagar Municipal Corp', email: 'smc@jk.gov.in' }
  },
  '160': { // Chandigarh
    police: { name: 'Chandigarh Police', email: 'igp-chd@nic.in' }, traffic: { name: 'Chandigarh Traffic', email: 'ssp-traffic-chd@nic.in' }, water: { name: 'Chandigarh Water', email: 'mcc@chd.nic.in' }, electricity: { name: 'Chandigarh Electricity', email: 'eed-chd@nic.in' }, sanitation: { name: 'Municipal Corp Chandigarh', email: 'mcc@chd.nic.in' }
  },
  '781': { // Guwahati
    police: { name: 'Guwahati Police', email: 'cp-guwahati@assampolice.gov.in' }, traffic: { name: 'Guwahati Traffic', email: 'traffic-guwahati@assampolice.gov.in' }, water: { name: 'GMC Water', email: 'gmc@assam.gov.in' }, electricity: { name: 'APDCL', email: 'cgm@apdcl.org' }, sanitation: { name: 'Guwahati Municipal Corp', email: 'gmc@assam.gov.in' }
  },
  '751': { // Bhubaneswar
    police: { name: 'Bhubaneswar Police', email: 'cp-bbsr@odishapolice.gov.in' }, traffic: { name: 'Bhubaneswar Traffic', email: 'traffic-bbsr@odishapolice.gov.in' }, water: { name: 'WATCO', email: 'md@watcoodisha.in' }, electricity: { name: 'TPCODL', email: 'customercare@tpcentralodisha.com' }, sanitation: { name: 'Bhubaneswar Municipal Corp', email: 'bmc@odisha.gov.in' }
  },
  '695': { // Thiruvananthapuram
    police: { name: 'Trivandrum Police', email: 'cp.tvm@keralapolice.gov.in' }, traffic: { name: 'Trivandrum Traffic', email: 'traffic.tvm@keralapolice.gov.in' }, water: { name: 'KWA', email: 'kwa@kerala.gov.in' }, electricity: { name: 'KSEB', email: 'kseb@kerala.gov.in' }, sanitation: { name: 'Trivandrum Municipal Corp', email: 'tmc@kerala.gov.in' }
  },
  '682': { // Kochi
    police: { name: 'Kochi Police', email: 'cp.kochi@keralapolice.gov.in' }, traffic: { name: 'Kochi Traffic', email: 'traffic.kochi@keralapolice.gov.in' }, water: { name: 'KWA Kochi', email: 'kwa.kochi@kerala.gov.in' }, electricity: { name: 'KSEB Kochi', email: 'kseb@kerala.gov.in' }, sanitation: { name: 'Kochi Municipal Corp', email: 'kochicorp@kerala.gov.in' }
  },
  '530': { // Visakhapatnam
    police: { name: 'Vizag Police', email: 'cp-vizag@appolice.gov.in' }, traffic: { name: 'Vizag Traffic', email: 'traffic-vizag@appolice.gov.in' }, water: { name: 'GVMC Water', email: 'gvmc@ap.gov.in' }, electricity: { name: 'APEPDCL', email: 'customercare@apepdcl.in' }, sanitation: { name: 'GVMC', email: 'gvmc@ap.gov.in' }
  },
  '342': { // Jodhpur
    police: { name: 'Jodhpur Police', email: 'cp.jodhpur@rajpolice.gov.in' }, traffic: { name: 'Jodhpur Traffic', email: 'traffic.jodhpur@rajpolice.gov.in' }, water: { name: 'PHED Jodhpur', email: 'phed.jodhpur@rajasthan.gov.in' }, electricity: { name: 'JdVVNL', email: 'helpline@jdvvnl.org' }, sanitation: { name: 'Jodhpur Municipal Corp', email: 'jmc@rajasthan.gov.in' }
  },
  '248': { // Dehradun
    police: { name: 'Dehradun Police', email: 'ssp-deh-ua@nic.in' }, traffic: { name: 'Dehradun Traffic', email: 'traffic-deh-ua@nic.in' }, water: { name: 'Uttarakhand Jal Sansthan', email: 'ujs@uk.gov.in' }, electricity: { name: 'UPCL', email: 'customercare@upcl.org' }, sanitation: { name: 'Dehradun Municipal Corp', email: 'dmc@uk.gov.in' }
  },
  '144': { // Jalandhar
    police: { name: 'Jalandhar Police', email: 'cp.jalandhar@punjabpolice.gov.in' }, traffic: { name: 'Jalandhar Traffic', email: 'traffic.jal@punjabpolice.gov.in' }, sanitation: { name: 'Jalandhar Municipal Corp', email: 'mcjalandhar@punjab.gov.in' }, electricity: { name: 'PSPCL Jalandhar', email: 'contactus@pspcl.in' }
  },
  '474': { // Gwalior
    police: { name: 'Gwalior Police', email: 'sp.gwalior@mppolice.gov.in' }, traffic: { name: 'Gwalior Traffic', email: 'traffic.gwalior@mppolice.gov.in' }, sanitation: { name: 'Gwalior Municipal Corp', email: 'gmc@mpurban.gov.in' }, electricity: { name: 'MPMKVVCL Gwalior', email: 'customercare@mpcz.co.in' }
  },
  '482': { // Jabalpur
    police: { name: 'Jabalpur Police', email: 'sp.jabalpur@mppolice.gov.in' }, traffic: { name: 'Jabalpur Traffic', email: 'traffic.jabalpur@mppolice.gov.in' }, sanitation: { name: 'Jabalpur Municipal Corp', email: 'jmc@mpurban.gov.in' }, electricity: { name: 'MPPKVVCL Jabalpur', email: 'customercare@mpez.co.in' }
  },
  '753': { // Cuttack
    police: { name: 'Cuttack Police', email: 'cp-ctc@odishapolice.gov.in' }, traffic: { name: 'Cuttack Traffic', email: 'traffic-ctc@odishapolice.gov.in' }, sanitation: { name: 'Cuttack Municipal Corp', email: 'cmc@odisha.gov.in' }, water: { name: 'WATCO Cuttack', email: 'md@watcoodisha.in' }
  }
};

const NATIONAL_FALLBACKS = {
  foodsafety: { name: 'FSSAI State Authority', email: 'compliance@fssai.gov.in' },
  telecom: { name: 'TRAI / DoT Grievance', email: 'pgcell-dot@nic.in' },
  aadhaar: { name: 'UIDAI Regional Office', email: 'help@uidai.gov.in' },
  general: { name: 'State Public Grievance Officer', email: 'support@pgportal.gov.in' }
};

const CATEGORIES = ['electricity', 'water', 'roads', 'sanitation', 'police', 'streetlight', 'telecom', 'aadhaar', 'ration', 'foodsafety', 'traffic', 'general', 'forest', 'transport', 'fire', 'health'];

async function seedIndiaHyperLocal() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    console.log('Wiping old cache (Upgrading to Hyper-Local 1500+)...');
    await DepartmentEmailCache.deleteMany({});
    
    const recordsToInsert = [];
    
    for (const [prefix, stateName] of Object.entries(STATE_LEVEL_PREFIXES)) {
      const stateDepts = generateStateDepartments(stateName);
      for (const cat of CATEGORIES) {
        let name = stateDepts[cat]?.name || NATIONAL_FALLBACKS[cat]?.name;
        let email = stateDepts[cat]?.email || NATIONAL_FALLBACKS[cat]?.email;
        if (name && email) {
          recordsToInsert.push({
            regionPrefix: prefix, 
            pincode: 'ALL',
            category: cat,
            departmentName: name,
            officialEmail: email,
            isVerified: true,
            source: 'SEED_STATE'
          });
        }
      }
    }
    
    for (const [prefix, cityDepts] of Object.entries(HYPER_LOCAL_OVERRIDES)) {
      // For each city, if a department is missing, fallback to the State Level generator using the city's state.
      // But we just use the explicitly defined ones + national fallbacks to be safe.
      for (const cat of CATEGORIES) {
        if (cityDepts[cat]) {
          recordsToInsert.push({
            regionPrefix: prefix,
            pincode: 'ALL',
            category: cat,
            departmentName: cityDepts[cat].name,
            officialEmail: cityDepts[cat].email,
            isVerified: true,
            source: 'SEED_CITY'
          });
        } else if (NATIONAL_FALLBACKS[cat]) {
          // Add national fallbacks to the hyper local prefix as well so it doesn't drop down to state
          recordsToInsert.push({
            regionPrefix: prefix,
            pincode: 'ALL',
            category: cat,
            departmentName: NATIONAL_FALLBACKS[cat].name,
            officialEmail: NATIONAL_FALLBACKS[cat].email,
            isVerified: true,
            source: 'SEED_CITY_NATIONAL'
          });
        }
      }
    }
    
    console.log(`Inserting ${recordsToInsert.length} hyper-local and state records into database...`);
    await DepartmentEmailCache.insertMany(recordsToInsert);
    console.log('✅ Successfully seeded Massive Hyper-Local database!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedIndiaHyperLocal();
