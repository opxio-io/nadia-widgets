const NOTION_VERSION='2022-06-28';
const map={learned:'Learned?',practiced:'Practiced?',alone:'Can Do Alone?',review:'Needs Review?'};
export default async function handler(req,res){
 if(req.method!=='PATCH')return res.status(405).json({error:'Method not allowed'});
 const token=process.env.NOTION_TOKEN||process.env.NADIA_NOTION_API_KEY||process.env.STUDY_NOTION_API_KEY||process.env.NOTION_API_KEY;
 if(!token)return res.status(503).json({error:'Notion API key missing'});
 const {id,confidence,...vals}=req.body||{}; if(!id)return res.status(400).json({error:'Missing topic id'});
 const properties={};
 for(const [k,n] of Object.entries(map)) if(typeof vals[k]==='boolean') properties[n]={checkbox:vals[k]};
 if(confidence) properties.Confidence={select:{name:confidence}};
 try{
  const r=await fetch('https://api.notion.com/v1/pages/'+id,{method:'PATCH',headers:{Authorization:'Bearer '+token,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'},body:JSON.stringify({properties})});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)return res.status(r.status).json({error:'Notion update failed',detail:body});
  return res.status(200).json({ok:true,properties:Object.keys(properties)});
 }catch(e){return res.status(500).json({error:'Could not update Notion',detail:e.message})}
}