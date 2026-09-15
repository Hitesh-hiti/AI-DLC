import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = resolve(__dirname, 'data/db.json');
const API_PREFIX = '/api';

const airports = [
  { id:'apt-001', name:'London Heathrow (LHR)', type:'AIRPORT', location:{city:'London',country:'UK'} },
  { id:'apt-002', name:'New York JFK (JFK)', type:'AIRPORT', location:{city:'New York',country:'USA'} },
  { id:'apt-003', name:'San Francisco (SFO)', type:'AIRPORT', location:{city:'San Francisco',country:'USA'} },
  { id:'apt-004', name:'Paris CDG (CDG)', type:'AIRPORT', location:{city:'Paris',country:'France'} },
  { id:'apt-005', name:'Los Angeles (LAX)', type:'AIRPORT', location:{city:'Los Angeles',country:'USA'} },
  { id:'apt-006', name:'Dubai (DXB)', type:'AIRPORT', location:{city:'Dubai',country:'UAE'} },
  { id:'apt-007', name:'Singapore Changi (SIN)', type:'AIRPORT', location:{city:'Singapore',country:'Singapore'} },
  { id:'apt-008', name:'Mumbai (BOM)', type:'AIRPORT', location:{city:'Mumbai',country:'India'} },
  { id:'apt-009', name:'Bengaluru (BLR)', type:'AIRPORT', location:{city:'Bengaluru',country:'India'} },
  { id:'apt-010', name:'Chennai (MAA)', type:'AIRPORT', location:{city:'Chennai',country:'India'} },
];

const seedFlights = () => {
  const base = Date.now();
  const flight = (id, airline, number, aircraft, origin, destination, hours, stops, price, cabin='ECONOMY', offsetDays=7, seats=10) => ({
    offerId:id, airline, flightNumber:number, aircraft, origin, destination,
    departureTime:new Date(base + offsetDays*86400000).toISOString(),
    arrivalTime:new Date(base + offsetDays*86400000 + hours*3600000).toISOString(),
    duration:`PT${hours}H`, stops, cabinClass:cabin, price:{amount:price,currency:'USD'},
    availability:seats, isSoldOut:seats===0,
    fareRules:[
      {ruleType:'CANCELLATION',description:'Free cancellation up to 2 hours before departure',terms:'Cancellations within 2 hours of departure are non-refundable'},
      {ruleType:'CHANGE',description:'Changes allowed with applicable fees',terms:'Flight changes carry a $50 change fee'},
      {ruleType:'BAGGAGE',description:'1 carry-on + 1 personal item included',terms:'First checked bag: $35 · Second: $50'},
    ], metadata:{gdsSupplierId:'demo-gds',lastUpdated:new Date().toISOString()}
  });
  return [
    flight('flight-001','British Airways','BA 112','Boeing 777-200ER','LHR','JFK',7.5,0,450,'ECONOMY',7,12),
    flight('flight-002','United Airlines','UA 908','Boeing 787-10','LHR','JFK',8,0,380,'ECONOMY',7,8),
    flight('flight-003','Virgin Atlantic','VS 004','Airbus A330-300','LHR','JFK',7.75,1,680,'PREMIUM_ECONOMY',7,5),
    flight('flight-004','British Airways','BA 286','Boeing 777-300ER','LHR','JFK',7.5,0,1800,'BUSINESS',8,3),
    flight('flight-005','Lufthansa','LH 401','Airbus A340-600','LHR','JFK',8.5,2,320,'ECONOMY',9,0),
    flight('flight-006','Emirates','EK 201','Airbus A380','DXB','JFK',14,0,920,'ECONOMY',10,14),
    flight('flight-007','Singapore Airlines','SQ 12','Airbus A350','SIN','JFK',18,0,1250,'PREMIUM_ECONOMY',12,7),
  ];
};

async function loadDb() {
  try {
    const db = JSON.parse(await readFile(DB_FILE, 'utf8'));
    if (!Array.isArray(db.flights) || db.flights.length === 0) { db.flights = seedFlights(); await saveDb(db); }
    return db;
  } catch {
    const db = { flights: seedFlights(), bookings: [], approvals: [], policyEvaluations: [], events: [] };
    await saveDb(db); return db;
  }
}
async function saveDb(db) { await mkdir(dirname(DB_FILE), {recursive:true}); await writeFile(DB_FILE, JSON.stringify(db,null,2)); }

const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'});
  res.end(payload);
};
const ok = (res, data, status=200) => json(res,status,{success:true,data});
const fail = (res,status,code,message,details) => json(res,status,{success:false,error:{code,message,details,timestamp:new Date().toISOString()}});
const readBody = async (req) => { let raw=''; for await (const chunk of req) raw += chunk; if (!raw) return {}; try{return JSON.parse(raw);}catch{throw new Error('Invalid JSON body');} };
const now = () => new Date().toISOString();
const money = (amount,currency='USD') => ({amount:Number(amount),currency});
const confirmation = id => `CONF-${id.replaceAll('-','').toUpperCase().slice(0,8)}`;
const audit = (db, action, payload) => db.events.push({id:randomUUID(),action,createdAt:now(),payload});

function detailFromBooking(b) {
  return {
    bookingId:b.bookingId, confirmationNumber:b.confirmationNumber, bookingStatus:b.bookingStatus,
    flightDetails:b.flightDetails, passengers:b.passengerInfo, fareBreakdown:b.fareBreakdown,
    ticketNumbers:b.ticketNumbers, holdExpiresAt:b.holdExpiresAt, approvalId:b.approvalId, pnr:b.pnr,
    cancellationPolicy:b.cancellationPolicy, createdAt:b.createdAt, modifiedAt:b.modifiedAt
  };
}
function policyEvaluate(req) {
  const fare = Number(req.totalFare?.amount || 0);
  const threshold = 1000;
  const advance = Number(req.flight?.advanceBookingDays ?? 999);
  if (req.flight?.destination && ['XXX'].includes(req.flight.destination.toUpperCase())) return {
    outcome:'BLOCK', requiresApproval:false, policies:[{policyId:'pol-destination',policyName:'Destination Restriction',outcome:'BLOCK',details:'Travel to this destination is not permitted by organisational policy',isBreached:true}],
    warnings:[{code:'DESTINATION_BLOCKED',message:'This destination is blocked by organisational policy',severity:'ERROR'}]
  };
  if (fare > threshold) return {
    outcome:'REQUIRE_APPROVAL', requiresApproval:true, policies:[{policyId:'pol-fare',policyName:'High-Fare Approval',outcome:'REQUIRE_APPROVAL',details:'Fare exceeds the approval threshold',threshold:money(threshold,req.totalFare?.currency||'USD'),actualValue:money(fare,req.totalFare?.currency||'USD'),isBreached:true}],
    approvalDetails:{approverIds:['manager-001'],deadline:new Date(Date.now()+86400000).toISOString(),reason:`Fare exceeds the manager approval threshold of USD ${threshold}`}
  };
  if (advance < 7) return {
    outcome:'WARN', requiresApproval:false, policies:[{policyId:'pol-advance',policyName:'Advance Booking',outcome:'WARN',details:'Booking made less than 7 days before departure (recommended: 14+ days)'}],
    warnings:[{code:'ADV_BOOKING_SHORT',message:'This booking is less than 7 days in advance',severity:'WARNING'}]
  };
  return {outcome:'ALLOW',requiresApproval:false,policies:[{policyId:'pol-fare',policyName:'Fare Limit',outcome:'ALLOW',details:'Fare is within the approved limit',threshold:money(threshold,req.totalFare?.currency||'USD'),actualValue:money(fare,req.totalFare?.currency||'USD')} ]};
}

async function handler(req,res) {
  if (req.method === 'OPTIONS') return json(res,204,{});
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') return ok(res,{status:'UP',service:'travel-platform-api',timestamp:now()});
  if (!url.pathname.startsWith(API_PREFIX)) return fail(res,404,'NOT_FOUND','Route not found');
  const path = url.pathname.slice(API_PREFIX.length).replace(/\/+$/,'') || '/';
  const parts = path.split('/').filter(Boolean);
  const db = await loadDb();
  try {
    if (req.method==='GET' && parts[0]==='destinations' && parts[1]==='search') {
      const q=(url.searchParams.get('query')||'').toLowerCase(); const limit=Number(url.searchParams.get('limit')||5);
      return ok(res,{suggestions:airports.filter(a=>a.name.toLowerCase().includes(q)||a.location.city.toLowerCase().includes(q)||a.id.toLowerCase().includes(q)).slice(0,limit)});
    }
    if (req.method==='POST' && path==='/flights/search') {
      const body=await readBody(req); if(!body.origin||!body.destination||!body.departureDate) return fail(res,400,'VALIDATION_ERROR','origin, destination and departureDate are required');
      const requestedCabin=body.cabinClass; const requestedStops=body.filters?.stops;
      let results=db.flights.filter(f=>f.origin===String(body.origin).toUpperCase()&&f.destination===String(body.destination).toUpperCase()&&!f.isSoldOut&&( !requestedCabin || f.cabinClass===requestedCabin));
      if(!results.length) results=db.flights.filter(f=>!f.isSoldOut).map(f=>({...f,origin:String(body.origin).toUpperCase(),destination:String(body.destination).toUpperCase(),cabinClass:requestedCabin||f.cabinClass}));
      if(requestedStops!==undefined) results=results.filter(f=>f.stops===Number(requestedStops));
      if(body.filters?.airlines?.length) results=results.filter(f=>body.filters.airlines.includes(f.airline));
      if(body.filters?.priceRange) results=results.filter(f=>f.price.amount>=body.filters.priceRange.min&&f.price.amount<=body.filters.priceRange.max);
      if(body.sortBy==='PRICE_DESC') results.sort((a,b)=>b.price.amount-a.price.amount); else results.sort((a,b)=>a.price.amount-b.price.amount);
      const pageSize=Number(body.pageSize||10), pageNumber=Number(body.pageNumber||1), total=results.length;
      results=results.slice((pageNumber-1)*pageSize,pageNumber*pageSize);
      return ok(res,{results,meta:{totalCount:total,pageSize,pageNumber,hasMore:pageNumber*pageSize<total},searchId:randomUUID(),timestamp:now()});
    }
    if (req.method==='POST' && path==='/bookings/holds') {
      const body=await readBody(req); if(!body.offerId||!body.travelerId) return fail(res,400,'VALIDATION_ERROR','offerId and travelerId are required to hold a booking');
      const offer=db.flights.find(f=>f.offerId===body.offerId); if(!offer) return fail(res,404,'OFFER_NOT_FOUND','Flight offer was not found'); if(offer.isSoldOut) return fail(res,409,'SOLD_OUT','Flight offer is sold out');
      const bookingId=randomUUID(); const taxes=offer.price.amount*.15, fees=25, total=(offer.price.amount+taxes+fees)*Math.max(1,Number(body.flightDetails?.passengers||1));
      const policy=policyEvaluate({organizationId:body.organizationId,travelerId:body.travelerId,offerId:body.offerId,flight:{...body.flightDetails,airline:offer.airline,nonStop:offer.stops===0,advanceBookingDays:Math.max(0,Math.round((new Date(body.flightDetails.departureDate)-Date.now())/86400000))},totalFare:money(total)});
      const expires=new Date(Date.now()+1800000).toISOString();
      const b={bookingId,offerId:offer.offerId,organizationId:body.organizationId,travelerId:body.travelerId,passengerInfo:body.passengerInfo||[],flightDetails:{...body.flightDetails,origin:offer.origin,destination:offer.destination},bookingStatus:policy.outcome==='REQUIRE_APPROVAL'?'PENDING_APPROVAL':'HELD',confirmationNumber:confirmation(bookingId),holdExpiresAt:expires,fareBreakdown:{baseFare:money(offer.price.amount*Number(body.flightDetails?.passengers||1)),taxes:money(taxes*Number(body.flightDetails?.passengers||1)),fees:money(fees*Number(body.flightDetails?.passengers||1)),totalFare:money(total)},cancellationPolicy:{refundable:true,cancellationDeadline:new Date(Date.now()+172800000).toISOString(),penaltyAmount:money(50)},createdAt:now(),modifiedAt:now(),approvalId:undefined,ticketNumbers:[]};
      if(policy.requiresApproval){ const approvalId=`APPR-${bookingId.replaceAll('-','').slice(0,8).toUpperCase()}`; b.approvalId=approvalId; db.approvals.push({approvalId,bookingId,organizationId:body.organizationId,travelerId:body.travelerId,requestReason:policy.approvalDetails.reason,flightSummary:{origin:offer.origin,destination:offer.destination,departureDate:body.flightDetails.departureDate,returnDate:body.flightDetails.returnDate,airline:offer.airline,cabinClass:offer.cabinClass,totalFare:b.fareBreakdown.totalFare},policyViolations:policy.policies,assignedTo:policy.approvalDetails.approverIds,deadline:policy.approvalDetails.deadline,status:'PENDING',createdAt:now()}); }
      db.bookings.push(b); audit(db,'BOOKING_HOLD_CREATED',{bookingId,offerId:offer.offerId}); await saveDb(db);
      const response={bookingId,bookingStatus:b.bookingStatus,confirmationNumber:b.confirmationNumber,holdExpiresAt:b.holdExpiresAt,flightSummary:{airline:offer.airline,flightNumber:offer.flightNumber,origin:offer.origin,destination:offer.destination,departureTime:offer.departureTime,arrivalTime:offer.arrivalTime,cabinClass:offer.cabinClass,passengers:Number(body.flightDetails?.passengers||1)},fareBreakdown:b.fareBreakdown,cancellationPolicy:b.cancellationPolicy,createdAt:b.createdAt};
      if(b.approvalId){const a=db.approvals.find(x=>x.approvalId===b.approvalId); response.approvalDetails={approvalId:a.approvalId,approverName:'Sarah Johnson (Manager)',approverEmail:'sarah.johnson@company.com',approvalExpiresAt:a.deadline,reason:a.requestReason};}
      return ok(res,response,201);
    }
    if (req.method==='POST' && parts[0]==='bookings' && parts[2]==='confirm') {
      const id=decodeURIComponent(parts[1]); const body=await readBody(req); const b=db.bookings.find(x=>x.bookingId===id); if(!b) return fail(res,404,'Select Flight with less cost','Select Flight with less cost'); if(!body.paymentReference) return fail(res,400,'VALIDATION_ERROR','paymentReference is required'); if(b.bookingStatus==='CANCELLED') return fail(res,409,'INVALID_STATUS','Cancelled booking cannot be confirmed'); if(b.bookingStatus==='PENDING_APPROVAL') return fail(res,409,'APPROVAL_REQUIRED','Booking requires approval before confirmation');
      b.bookingStatus='CONFIRMED'; b.ticketNumbers=[`TKT-${randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`]; b.confirmedAt=now(); b.modifiedAt=now(); audit(db,'BOOKING_CONFIRMED',{bookingId:id}); await saveDb(db);
      return ok(res,{bookingId:id,bookingStatus:'CONFIRMED',confirmationNumber:b.confirmationNumber,pnr:b.pnr,ticketNumbers:b.ticketNumbers,confirmedAt:b.confirmedAt,nextSteps:['E-ticket will be emailed within 5 minutes']});
    }
    if (req.method==='GET' && parts[0]==='bookings' && parts.length===2) { const b=db.bookings.find(x=>x.bookingId===decodeURIComponent(parts[1])); if(!b) return fail(res,404,'BOOKING_NOT_FOUND','Booking was not found'); return ok(res,detailFromBooking(b)); }
    if (req.method==='GET' && path==='/bookings') {
      const status=url.searchParams.get('status'); const org=url.searchParams.get('organizationId'); const user=url.searchParams.get('userId'); const pageSize=Number(url.searchParams.get('pageSize')||10),pageNumber=Number(url.searchParams.get('pageNumber')||1);
      let items=db.bookings.filter(b=>(!status||b.bookingStatus===status)&&(!org||b.organizationId===org)&&(!user||b.travelerId===user)); const total=items.length; items=items.slice((pageNumber-1)*pageSize,pageNumber*pageSize); return ok(res,{bookings:items.map(detailFromBooking),meta:{totalCount:total,pageSize,pageNumber,hasMore:pageNumber*pageSize<total}});
    }
    if (req.method==='POST' && parts[0]==='bookings' && parts[2]==='cancel') {
      const id=decodeURIComponent(parts[1]); const body=await readBody(req); const b=db.bookings.find(x=>x.bookingId===id); if(!b) return fail(res,404,'BOOKING_NOT_FOUND','Booking was not found'); if(b.bookingStatus==='CANCELLED') return fail(res,409,'ALREADY_CANCELLED','Booking is already cancelled');
      b.bookingStatus='CANCELLED'; b.modifiedAt=now(); const cancellationId=randomUUID(); audit(db,'BOOKING_CANCELLED',{bookingId:id,reason:body.reason}); await saveDb(db); return ok(res,{bookingId:id,bookingStatus:'CANCELLED',cancellationId,cancelledAt:b.modifiedAt,refundEligible:true,refundAmount:b.fareBreakdown.totalFare,refundStatus:'PENDING',estimatedRefundDate:new Date(Date.now()+604800000).toISOString()});
    }
    if (req.method==='POST' && path==='/policies/evaluate') { const body=await readBody(req); if(!body.organizationId||!body.travelerId||!body.offerId) return fail(res,400,'VALIDATION_ERROR','organizationId, travelerId and offerId are required'); const result=policyEvaluate(body); const response={evaluationId:randomUUID(),timestamp:now(),...result}; db.policyEvaluations.push({...response,organizationId:body.organizationId,travelerId:body.travelerId}); await saveDb(db); return ok(res,response); }
    if (req.method==='POST' && parts[0]==='approvals' && parts[2]==='decision') { const id=decodeURIComponent(parts[1]); const body=await readBody(req); const a=db.approvals.find(x=>x.approvalId===id); if(!a) return fail(res,404,'APPROVAL_NOT_FOUND','Approval request was not found'); if(!['APPROVED','REJECTED'].includes(body.decision)) return fail(res,400,'VALIDATION_ERROR','decision must be APPROVED or REJECTED'); a.status=body.decision; a.respondedAt=now(); a.responseComments=body.comments; const b=db.bookings.find(x=>x.bookingId===a.bookingId); if(b){b.bookingStatus=body.decision==='APPROVED'?'HELD':'CANCELLED';b.modifiedAt=now();} audit(db,'APPROVAL_DECISION',{approvalId:id,decision:body.decision}); await saveDb(db); return ok(res,{approvalId:id,decision:body.decision,decidedAt:a.respondedAt,decidedBy:body.approverUserId,comments:body.comments,nextSteps:[body.decision==='APPROVED'?'Booking will proceed to ticketing':'Booking has been cancelled']}); }
    if (req.method==='POST' && parts[0]==='bookings' && parts[2]==='pnr') { const id=decodeURIComponent(parts[1]); const b=db.bookings.find(x=>x.bookingId===id); if(!b) return fail(res,404,'BOOKING_NOT_FOUND','Booking was not found'); b.pnr=b.pnr||id.replaceAll('-','').toUpperCase().slice(0,6); b.modifiedAt=now(); await saveDb(db); return ok(res,{pnr:b.pnr,bookingId:id,generatedAt:now(),status:'STUB'}); }
    if (req.method==='POST' && parts[0]==='bookings' && parts[2]==='payment-approval') { const id=decodeURIComponent(parts[1]); const body=await readBody(req); const b=db.bookings.find(x=>x.bookingId===id); if(!b) return fail(res,404,'BOOKING_NOT_FOUND','Booking was not found'); return ok(res,{paymentReference:`PAY-${id.replaceAll('-','').toUpperCase().slice(0,8)}`,method:'LODGE_CARD',approvedAt:now(),amount:body.amount,status:'STUB'}); }
    return fail(res,404,'NOT_FOUND',`Route ${req.method} ${path} not found`);
  } catch (error) { console.error(error); return fail(res,500,'INTERNAL_ERROR',error instanceof Error?error.message:'Internal server error'); }
}

const server=http.createServer((req,res)=>handler(req,res));
server.listen(PORT,HOST,()=>console.log(`TravelPlatform API running at http://localhost:${PORT}${API_PREFIX}`));
