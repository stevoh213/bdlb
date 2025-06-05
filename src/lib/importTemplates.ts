import { GradeSystem } from './gradeConversion';
import { ClimbTypeSpec, CsvClimb, SendTypeSpec } from './importSpec';

export type MountainProjectCsvRow = Record<string, unknown>;
export type EightANuCsvRow = Record<string, unknown>;
export type TheCragCsvRow = Record<string, unknown>;
export type VerticalLifeCsvRow = Record<string, unknown>;
export type GenericJsonClimbObject = Record<string, unknown>;

export type ImportSourceType = "generic" | "mountainProject" | "eightANu" | "theCrag" | "verticalLife" | "genericJson";

export interface ImportMappingTemplate {
  sourceType: ImportSourceType;
  name: string;
  headerToCsvClimbField: Record<string, keyof CsvClimb | ''>;
  transform?: (
    rawRow: Record<string, unknown>,
    currentMappings: Record<string, keyof CsvClimb | ''>
  ) => Partial<CsvClimb>;
  isJson?: boolean;
  sourceGradeSystem?: GradeSystem;
  defaultClimbType?: 'boulder' | 'route';
}

export const mountainProjectTemplate: ImportMappingTemplate = {
  sourceType: "mountainProject", name: "Mountain Project",
  sourceGradeSystem: GradeSystem.YDS,
  defaultClimbType: 'route',
  headerToCsvClimbField: {'Route': 'name', 'Your Rating': 'grade', 'Date': 'date', 'Location': 'location', 'Description': 'notes', 'Pitches': '', 'Style': '', 'Lead Style': '', 'Attempts': 'attempts'},
  transform: (r,c) => { const p: Partial<CsvClimb>={}; for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(String(v)); if(!isNaN(n))(p as any)[f as keyof CsvClimb]=n} else {(p as any)[f as keyof CsvClimb]=String(v)}}}} const styleRaw=r['Style']; const s=(styleRaw!==null&&styleRaw!==undefined&&String(styleRaw)!=='') ? String(styleRaw).trim().toLowerCase():undefined; if(s){if(s.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(s.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(s.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(s.includes('tr')||s.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(s.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} const leadStyleRaw=r['Lead Style']; const l=(leadStyleRaw!==null&&leadStyleRaw!==undefined&&String(leadStyleRaw)!=='') ? String(leadStyleRaw).trim().toLowerCase():undefined; if(l){if(l.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(l.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(l.includes('redpoint')||l.includes('send'))p.send_type=SendTypeSpec.SEND; else if(l.includes('pinkpoint'))p.send_type=SendTypeSpec.SEND; else if(l.includes('fell')||l.includes('hung')||l.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(l.includes('project')||l.includes('working'))p.send_type=SendTypeSpec.PROJECT} const attemptsRawFromField=r['Attempts']; const attemptsValue = attemptsRawFromField ?? l; if(attemptsValue!==null&&attemptsValue!==undefined&&String(attemptsValue)!==''){const attemptsStr=String(attemptsValue); const m=attemptsStr.match(/(\\d+)\\s*(try|tries|go|goes|attempts)/i); if(m&&m[1]){p.attempts=parseInt(m[1],10)} else {const n=parseInt(attemptsStr,10); if(!isNaN(n) && !p.attempts){if(n>0&&n<1000 && (attemptsRawFromField !== undefined || (l && !l.match(/[a-zA-Z]/i))))p.attempts=n}}} const pitchesRaw=r['Pitches']; if(pitchesRaw!==null&&pitchesRaw!==undefined&&String(pitchesRaw)!==''){const t=parseInt(String(pitchesRaw),10); if(!isNaN(t)&&t>1)p.notes=p.notes?`Pitches: ${t}. ${p.notes}`:`Pitches: ${t}.`} return p;}
};
export const eightANuTemplate: ImportMappingTemplate = {
  sourceType: "eightANu", name: "8a.nu",
  sourceGradeSystem: GradeSystem.FRENCH,
  defaultClimbType: 'route',
  headerToCsvClimbField: {'Name': 'name', 'Grade': 'grade', 'Date': 'date', 'Comment': 'notes', 'Crag': 'location', 'Country': 'country', 'Rating': 'rating', 'Attempts': 'attempts', 'Type': '', 'Ascent type': ''},
  transform: (r,c) => { const p: Partial<CsvClimb>={}; for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(String(v)); if(!isNaN(n))(p as any)[f as keyof CsvClimb]=n} else {(p as any)[f as keyof CsvClimb]=String(v)}}}} const typeRaw=r['Type']; const t=(typeRaw!==null&&typeRaw!==undefined&&String(typeRaw)!=='')?String(typeRaw).trim().toLowerCase():undefined; const ak=Object.keys(r).find(k=>String(k).trim().toLowerCase()==='ascent type'); const ascentTypeRaw=ak?r[ak]:undefined; const a=(ascentTypeRaw!==null&&ascentTypeRaw!==undefined&&String(ascentTypeRaw)!=='')?String(ascentTypeRaw).trim().toLowerCase():undefined; if(t){if(t.includes('sport climbing'))p.type=ClimbTypeSpec.SPORT; else if(t.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(t.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(t.includes('top rope')||t.includes('toprope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(t.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} if(a){if(a.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(a.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(a.includes('redpoint')||a.includes('send'))p.send_type=SendTypeSpec.SEND; else if(a.includes('toprope')||a.includes('top rope'))p.send_type=SendTypeSpec.ATTEMPT; else if(a.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(a.includes('project')||a.includes('working'))p.send_type=SendTypeSpec.PROJECT} const recommendRaw=r['Recommend']; const rec=(recommendRaw!==null&&recommendRaw!==undefined&&String(recommendRaw)!=='')?String(recommendRaw).trim():undefined; if(rec&&rec.toLowerCase()==='yes')p.notes=p.notes?`Recommended. ${rec}. ${p.notes}`:"Recommended."; return p;}
};
export const theCragTemplate: ImportMappingTemplate = {
  sourceType: "theCrag", name: "theCrag.com",
  sourceGradeSystem: GradeSystem.AUSTRALIAN,
  defaultClimbType: 'route',
  headerToCsvClimbField: {'Route Name': 'name', 'Your Grade': 'grade', 'Date Logged': 'date', 'Comment': 'notes', 'Crag Name': 'location', 'Country': 'country', 'Your Rating': 'rating', 'Attempts': 'attempts', 'Tick Type': '', 'Route Style': ''},
  transform: (r,c) => { const p: Partial<CsvClimb>={}; for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(String(v)); if(!isNaN(n))(p as any)[f as keyof CsvClimb]=n} else {(p as any)[f as keyof CsvClimb]=String(v)}}}} if(!p.grade&&r['Guidebook Grade']!==null&&r['Guidebook Grade']!==undefined)p.grade=String(r['Guidebook Grade']); if(p.date&&String(p.date).includes(' '))p.date=String(p.date).split(' ')[0]; const routeStyleRaw=r['Route Style']; const rs=(routeStyleRaw!==null&&routeStyleRaw!==undefined&&String(routeStyleRaw)!=='')?String(routeStyleRaw).trim().toLowerCase():undefined; if(rs){if(rs.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(rs.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(rs.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(rs.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(rs.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} const tickTypeRaw=r['Tick Type']; const tt=(tickTypeRaw!==null&&tickTypeRaw!==undefined&&String(tickTypeRaw)!=='')?String(tickTypeRaw).trim().toLowerCase():undefined; if(tt){if(tt.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(tt.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(tt.includes('redpoint')||tt.includes('clean'))p.send_type=SendTypeSpec.SEND; else if(tt.includes('top rope clean')||tt.includes('second clean'))p.send_type=SendTypeSpec.SEND; else if(tt.includes('attempt')||tt.includes('top rope with rests')||tt.includes('working'))p.send_type=SendTypeSpec.ATTEMPT; else if(tt.includes('project'))p.send_type=SendTypeSpec.PROJECT} const pitchesClimbedRaw=r['Pitches Climbed']; if(pitchesClimbedRaw!==null&&pitchesClimbedRaw!==undefined&&String(pitchesClimbedRaw)!==''){const pc=parseInt(String(pitchesClimbedRaw),10); if(!isNaN(pc)&&pc>1)p.notes=p.notes?`Pitches: ${pc}. ${p.notes}`:`Pitches: ${pc}.`} return p;}
};
export const verticalLifeTemplate: ImportMappingTemplate = {
  sourceType: "verticalLife", name: "Vertical Life",
  sourceGradeSystem: GradeSystem.FRENCH,
  defaultClimbType: 'route',
  headerToCsvClimbField: {'Date': 'date', 'Route Name': 'name', 'Grade': 'grade', 'Ascent Type': '', 'Rating': 'rating', 'Comment': 'notes', 'Crag': 'location', 'Sector': '', 'Country': 'country', 'Attempts': 'attempts', 'Climb Type': ''},
  transform: (r,c) => { const p: Partial<CsvClimb>={}; for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(String(v)); if(!isNaN(n))(p as any)[f as keyof CsvClimb]=n} else {(p as any)[f as keyof CsvClimb]=String(v)}}}} const ascentTypeRaw=r['Ascent Type']; const at=(ascentTypeRaw!==null&&ascentTypeRaw!==undefined&&String(ascentTypeRaw)!=='')?String(ascentTypeRaw).trim().toLowerCase():undefined; const climbTypeRaw=r['Climb Type']; const styleRaw=r['Style']; const ctVal = (climbTypeRaw !== null && climbTypeRaw !== undefined && String(climbTypeRaw) !== '') ? String(climbTypeRaw) : ((styleRaw !== null && styleRaw !== undefined && String(styleRaw) !== '') ? String(styleRaw) : undefined); const ct = ctVal ? ctVal.trim().toLowerCase() : undefined; const cragRaw=r['Crag']; const sectorRaw=r['Sector']; const crg=(cragRaw!==null&&cragRaw!==undefined&&String(cragRaw)!=='')?String(cragRaw).trim():undefined; const sct=(sectorRaw!==null&&sectorRaw!==undefined&&String(sectorRaw)!=='')?String(sectorRaw).trim():undefined; if(crg&&sct)p.location=`${crg} - ${sct}`; else if(crg)p.location=crg; if(ct){if(ct.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(ct.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(ct.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(ct.includes('toprope')||ct.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(ct.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} if(at){if(at.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(at.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(at.includes('redpoint')||at.includes('send')||at.includes('lead'))p.send_type=SendTypeSpec.SEND; else if(at.includes('toprope')||at.includes('top rope'))p.send_type=SendTypeSpec.SEND; else if(at.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(at.includes('project')||at.includes('working'))p.send_type=SendTypeSpec.PROJECT} const locationRaw=p.location; const ln=(locationRaw!==null&&locationRaw!==undefined&&String(locationRaw)!=='')?String(locationRaw).toLowerCase():""; if(ln.includes('gym')||ln.includes('climbing hall')||ln.includes('boulderhalle')||ln.includes('kletterzentrum'))p.gym=p.location; return p;}
};
export const genericJsonTemplate: ImportMappingTemplate = {
  sourceType: "genericJson", name: "Generic JSON", isJson: true,
  headerToCsvClimbField: {},
  transform: (r,c) => { const p: Partial<CsvClimb>={}; for(const k in c){const f=c[k]; if(f&&Object.prototype.hasOwnProperty.call(r,k)){const v=r[k]; if(v!==null&&v!==undefined&&String(v)!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(String(v)); if(!isNaN(n))(p as any)[f as keyof CsvClimb]=n} else if(f==='type'){p.type=String(v).toLowerCase() as ClimbTypeSpec} else if(f==='send_type'){p.send_type=String(v).toLowerCase() as SendTypeSpec} else if(['skills','physical_skills','technical_skills'].includes(f)){if(Array.isArray(v)){(p as any)[f as keyof CsvClimb]=v.map(String)} else {(p as any)[f as keyof CsvClimb]=String(v).split(',').map(s=>s.trim()).filter(s=>s!=='')}} else {(p as any)[f as keyof CsvClimb]=String(v)}}}} return p;}
};

export const ALL_IMPORT_TEMPLATES: ImportMappingTemplate[] = [
  mountainProjectTemplate, eightANuTemplate, theCragTemplate, verticalLifeTemplate, genericJsonTemplate,
];

export const getInitialMappingsFromTemplate = (sK: string[], t?: ImportMappingTemplate): Record<string, keyof CsvClimb|''> => {
  const nM: Record<string, keyof CsvClimb|''>={}; const lTM: Record<string, keyof CsvClimb|''>={};
  if(t&&t.headerToCsvClimbField){for(const h in t.headerToCsvClimbField){lTM[String(h).toLowerCase().replace(/[\s_-]/g,'')]=t.headerToCsvClimbField[h]}}
  sK.forEach(k=>{const nk=String(k).toLowerCase().replace(/[\s_-]/g,''); if(t&&lTM[nk]!==undefined){nM[k]=lTM[nk]!} else{nM[k]=''}}); return nM;
};
