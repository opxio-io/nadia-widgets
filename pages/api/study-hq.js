const NOTION_VERSION='2022-06-28';
// Opxio workspace databases, inspected 2026-09-15. Keep secrets server-side.
const DB={
  courses:'3f5fe600-97f6-83fc-a7b7-01ae1196760c',
  coursework:'e3ffe600-97f6-8343-8fab-8147ad31ad98',
  classes:'c75fe600-97f6-8277-8d86-01c9d2ac6c4f',
  plants:'b85fe600-97f6-82cf-84b9-015aebca8b8c'
};
const text=p=>(p?.title||p?.rich_text||[]).map(x=>x.plain_text||'').join('');
const num=p=>p?.number??null;
const pick=p=>p?.select?.name||p?.status?.name||'';
const multi=p=>(p?.multi_select||[]).map(x=>x.name);
const date=p=>p?.date?.start||null;
const rel=p=>(p?.relation||[]).map(x=>x.id);
const chk=p=>!!p?.checkbox;
const formula=p=>p?.formula?.number??p?.formula?.string??p?.formula?.boolean??null;
async function query(id,token){let out=[],cursor;do{const body={page_size:100,...(cursor?{start_cursor:cursor}:{})};const r=await fetch(`https://api.notion.com/v1/databases/${id}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`Notion ${r.status}: ${await r.text()}`);const j=await r.json();out.push(...j.results);cursor=j.has_more?j.next_cursor:null}while(cursor);return out}
export default async function handler(req,res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=120');if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const token=process.env.NOTION_TOKEN||process.env.NADIA_NOTION_API_KEY||process.env.STUDY_NOTION_API_KEY||process.env.NOTION_API_KEY;if(!token)return res.status(503).json({error:'Notion API key is not configured.'});try{const[c,w,cl,p]=await Promise.all([query(DB.courses,token),query(DB.coursework,token),query(DB.classes,token),query(DB.plants,token)]);return res.status(200).json({updatedAt:new Date().toISOString(),courses:c.map(x=>({id:x.id,code:text(x.properties.Code),subject:text(x.properties.Subject),status:pick(x.properties.Status),credits:num(x.properties.Credits),category:pick(x.properties.Category),program:multi(x.properties.Program),semester:rel(x.properties.Semester),assignmentProgress:formula(x.properties['Assignment Progress']),examProgress:formula(x.properties['Exams Progress']),tasksDue:formula(x.properties['Tasks Due'])})),coursework:w.map(x=>({id:x.id,title:text(x.properties.Title),course:rel(x.properties.Course),type:pick(x.properties.Type),due:date(x.properties['Due Date']),status:pick(x.properties.Status)})),classes:cl.map(x=>({id:x.id,name:text(x.properties.Name),course:rel(x.properties['class code']),type:pick(x.properties.Type),date:date(x.properties.Date),days:multi(x.properties.Days),time:text(x.properties.Time),campus:pick(x.properties.Campus),room:pick(x.properties.Room)})),plants:p.map(x=>({id:x.id,name:text(x.properties.Plant),commonName:text(x.properties['Common Name']),scientificName:text(x.properties['Scientific Name']),room:pick(x.properties.Room),light:pick(x.properties.Light),waterEvery:num(x.properties['Water Every Days']),lastWatered:date(x.properties['Last Watered']),nextWater:date(x.properties['Next Water']),nextFertilize:date(x.properties['Next Fertilize']),health:pick(x.properties.Health),difficulty:pick(x.properties.Difficulty),petSafe:chk(x.properties['Pet Safe'])}))});}catch(e){console.error(e);return res.status(500).json({error:'Unable to load sanctuaire de nadia data.',detail:process.env.NODE_ENV==='development'?e.message:undefined})}}
