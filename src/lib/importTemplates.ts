import type { Climb } from '@/types/climbing'; // Assuming @ is configured for src
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from './importSpec';
import { GradeSystem } from './gradeConversion'; // Import GradeSystem

// CSV Row Interfaces (for clarity in templates) - Keep minified for brevity
export interface MountainProjectCsvRow { /* ... */ }
export interface EightANuCsvRow { /* ... */ }
export interface TheCragCsvRow { /* ... */ }
export interface VerticalLifeCsvRow { /* ... */ }
export type GenericJsonClimbObject = Record<string, any>;


export type ImportSourceType = "generic" | "mountainProject" | "eightANu" | "theCrag" | "verticalLife" | "genericJson";

export interface ImportMappingTemplate {
  sourceType: ImportSourceType;
  name: string;
  headerToCsvClimbField: Record<string, keyof CsvClimb | ''>;
  transform?: (
    rawRow: Record<string, any>,
    currentMappings: Record<string, keyof CsvClimb | ''>
  ) => Partial<CsvClimb>;
  isJson?: boolean;
  sourceGradeSystem?: GradeSystem; // Dominant grade system in the source file
  defaultClimbType?: 'boulder' | 'route'; // Helps grade normalization pick a target system
}

// Minified existing templates - actual content remains the same, adding new properties
export const mountainProjectTemplate: ImportMappingTemplate = {
  sourceType: "mountainProject", name: "Mountain Project",
  sourceGradeSystem: GradeSystem.YDS, // MP uses YDS for routes, V-Scale for boulders. Defaulting to YDS, transform may refine.
  defaultClimbType: 'route', // Most MP entries are routes, but bouldering is significant.
  headerToCsvClimbField: {'Route': 'name', 'Your Rating': 'grade', 'Date': 'date', 'Location': 'location', 'Description': 'notes', 'Pitches': '', 'Style': '', 'Lead Style': '', 'Attempts': 'attempts'},
  transform: (r,c) => { let p:Partial<CsvClimb>={}; /* ... (existing minified transform) ... */ for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(v); if(!isNaN(n))(p as any)[f]=n} else (p as any)[f]=v}}} const s=r['Style']?.trim().toLowerCase(); if(s){if(s.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(s.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(s.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(s.includes('tr')||s.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(s.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} const l=r['Lead Style']?.trim().toLowerCase(); if(l){if(l.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(l.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(l.includes('redpoint')||l.includes('send'))p.send_type=SendTypeSpec.SEND; else if(l.includes('pinkpoint'))p.send_type=SendTypeSpec.SEND; else if(l.includes('fell')||l.includes('hung')||l.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(l.includes('project')||l.includes('working'))p.send_type=SendTypeSpec.PROJECT} const a=r['Attempts']||l; if(a){const m=a.match(/(\d+)\s*(try|tries|go|goes|attempts)/); if(m&&m[1])p.attempts=parseInt(m[1],10); else if(!isNaN(parseInt(a,10))&&!p.attempts){const n=parseInt(a,10); if(n>0&&n<1000&&(r['Attempts']||(l&&!l.match(/[a-zA-Z]/))))p.attempts=n}} if(r['Pitches']){const t=parseInt(r['Pitches'],10); if(!isNaN(t)&&t>1)p.notes=p.notes?`Pitches: ${t}. ${p.notes}`:`Pitches: ${t}.`} return p;}
};
export const eightANuTemplate: ImportMappingTemplate = {
  sourceType: "eightANu", name: "8a.nu",
  sourceGradeSystem: GradeSystem.FRENCH, // 8a.nu often uses French for routes, Font for boulders.
  defaultClimbType: 'route', // Or 'boulder', depending on typical user data.
  headerToCsvClimbField: {'Name': 'name', 'Grade': 'grade', 'Date': 'date', 'Comment': 'notes', 'Crag': 'location', 'Country': 'country', 'Rating': 'rating', 'Attempts': 'attempts', 'Type': '', 'Ascent type': ''},
  transform: (r,c) => { let p:Partial<CsvClimb>={}; /* ... (existing minified transform) ... */ for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(v); if(!isNaN(n))(p as any)[f]=n} else (p as any)[f]=v}}} const t=r['Type']?.trim().toLowerCase(); const ak=Object.keys(r).find(k=>k.trim().toLowerCase()==='ascent type'); const a=ak?r[ak]?.trim().toLowerCase():undefined; if(t){if(t.includes('sport climbing'))p.type=ClimbTypeSpec.SPORT; else if(t.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(t.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(t.includes('top rope')||t.includes('toprope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(t.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} if(a){if(a.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(a.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(a.includes('redpoint')||a.includes('send'))p.send_type=SendTypeSpec.SEND; else if(a.includes('toprope')||a.includes('top rope'))p.send_type=SendTypeSpec.ATTEMPT; else if(a.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(a.includes('project')||a.includes('working'))p.send_type=SendTypeSpec.PROJECT} const rec=r['Recommend']?.trim(); if(rec&&rec.toLowerCase()==='yes')p.notes=p.notes?`Recommended. ${p.notes}`:"Recommended."; return p;}
};
export const theCragTemplate: ImportMappingTemplate = {
  sourceType: "theCrag", name: "theCrag.com",
  sourceGradeSystem: GradeSystem.AUSTRALIAN, // theCrag often defaults to local, e.g. Ewbank for Australia.
  defaultClimbType: 'route',
  headerToCsvClimbField: {'Route Name': 'name', 'Your Grade': 'grade', 'Date Logged': 'date', 'Comment': 'notes', 'Crag Name': 'location', 'Country': 'country', 'Your Rating': 'rating', 'Attempts': 'attempts', 'Tick Type': '', 'Route Style': ''},
  transform: (r,c) => { let p:Partial<CsvClimb>={}; /* ... (existing minified transform) ... */ for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(v); if(!isNaN(n))(p as any)[f]=n} else (p as any)[f]=v}}} if(!p.grade&&r['Guidebook Grade'])p.grade=r['Guidebook Grade']; if(p.date&&p.date.includes(' '))p.date=p.date.split(' ')[0]; const rs=r['Route Style']?.trim().toLowerCase(); if(rs){if(rs.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(rs.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(rs.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(rs.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(rs.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} const tt=r['Tick Type']?.trim().toLowerCase(); if(tt){if(tt.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(tt.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(tt.includes('redpoint')||tt.includes('clean'))p.send_type=SendTypeSpec.SEND; else if(tt.includes('top rope clean')||tt.includes('second clean'))p.send_type=SendTypeSpec.SEND; else if(tt.includes('attempt')||tt.includes('top rope with rests')||tt.includes('working'))p.send_type=SendTypeSpec.ATTEMPT; else if(tt.includes('project'))p.send_type=SendTypeSpec.PROJECT} if(r['Pitches Climbed']){const pc=parseInt(r['Pitches Climbed'],10); if(!isNaN(pc)&&pc>1)p.notes=p.notes?`Pitches: ${pc}. ${p.notes}`:`Pitches: ${pc}.`} return p;}
};
export const verticalLifeTemplate: ImportMappingTemplate = {
  sourceType: "verticalLife", name: "Vertical Life",
  sourceGradeSystem: GradeSystem.FRENCH, // VL uses a mix, but French/Font is common.
  defaultClimbType: 'route', // Can be boulder too.
  headerToCsvClimbField: {'Date': 'date', 'Route Name': 'name', 'Grade': 'grade', 'Ascent Type': '', 'Rating': 'rating', 'Comment': 'notes', 'Crag': 'location', 'Sector': '', 'Country': 'country', 'Attempts': 'attempts', 'Climb Type': ''},
  transform: (r,c) => { let p:Partial<CsvClimb>={}; /* ... (existing minified transform) ... */ for(const h in r){const f=c[h]; if(f){const v=r[h]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(v); if(!isNaN(n))(p as any)[f]=n} else (p as any)[f]=v}}} const at=r['Ascent Type']?.trim().toLowerCase(); const ct=r['Climb Type']?.trim().toLowerCase()||r['Style']?.trim().toLowerCase(); const crg=r['Crag']?.trim(); const sct=r['Sector']?.trim(); if(crg&&sct)p.location=`${crg} - ${sct}`; else if(crg)p.location=crg; if(ct){if(ct.includes('sport'))p.type=ClimbTypeSpec.SPORT; else if(ct.includes('boulder'))p.type=ClimbTypeSpec.BOULDER; else if(ct.includes('trad'))p.type=ClimbTypeSpec.TRAD; else if(ct.includes('toprope')||ct.includes('top rope'))p.type=ClimbTypeSpec.TOP_ROPE; else if(ct.includes('alpine'))p.type=ClimbTypeSpec.ALPINE} if(at){if(at.includes('onsight'))p.send_type=SendTypeSpec.ONSIGHT; else if(at.includes('flash'))p.send_type=SendTypeSpec.FLASH; else if(at.includes('redpoint')||at.includes('send')||at.includes('lead'))p.send_type=SendTypeSpec.SEND; else if(at.includes('toprope')||at.includes('top rope'))p.send_type=SendTypeSpec.SEND; else if(at.includes('attempt'))p.send_type=SendTypeSpec.ATTEMPT; else if(at.includes('project')||at.includes('working'))p.send_type=SendTypeSpec.PROJECT} const ln=p.location?.toLowerCase()||""; if(ln.includes('gym')||ln.includes('climbing hall')||ln.includes('boulderhalle')||ln.includes('kletterzentrum'))p.gym=p.location; return p;}
};
export const genericJsonTemplate: ImportMappingTemplate = {
  sourceType: "genericJson", name: "Generic JSON", isJson: true,
  headerToCsvClimbField: {}, // User maps all
  // No specific sourceGradeSystem for generic JSON, assume user maps grades as they are or detection handles it.
  transform: (r,c) => { /* ... (existing minified transform) ... */ let p:Partial<CsvClimb>={}; for(const k in c){const f=c[k]; if(f&&r.hasOwnProperty(k)){const v=r[k]; if(v!==null&&v!==undefined&&v!==''){if(['attempts','rating','elevation_gain','stiffness'].includes(f)){const n=parseFloat(v); if(!isNaN(n))(p as any)[f]=n} else if(f==='type')p.type=String(v).toLowerCase()as ClimbTypeSpec; else if(f==='send_type')p.send_type=String(v).toLowerCase()as SendTypeSpec; else if(['skills','physical_skills','technical_skills'].includes(f)){if(Array.isArray(v))(p as any)[f]=v.map(String); else (p as any)[f]=String(v).split(',').map(s=>s.trim()).filter(s=>s!=='')} else (p as any)[f]=String(v)}}} return p;}
};

export const ALL_IMPORT_TEMPLATES: ImportMappingTemplate[] = [
  mountainProjectTemplate, eightANuTemplate, theCragTemplate, verticalLifeTemplate, genericJsonTemplate,
];

export const getInitialMappingsFromTemplate = (sK: string[], t?: ImportMappingTemplate): Record<string, keyof CsvClimb|''> => {
  const nM: Record<string, keyof CsvClimb|''>={}; const lTM: Record<string, keyof CsvClimb|''>={};
  if(t&&t.headerToCsvClimbField){for(const h in t.headerToCsvClimbField){lTM[h.toLowerCase().replace(/[\s_-]/g,'')]=t.headerToCsvClimbField[h]}}
  sK.forEach(k=>{const nk=k.toLowerCase().replace(/[\s_-]/g,''); if(t&&lTM[nk]!==undefined){nM[k]=lTM[nk]!} else{nM[k]=''}}); return nM;
};
