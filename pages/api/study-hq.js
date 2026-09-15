const NOTION_VERSION = '2022-06-28';

const DATABASES = {
  courses: process.env.STUDY_COURSES_DB || '6f229180-5b64-4928-8ca9-29ab1c6a8073',
  tasks: process.env.STUDY_TASKS_DB || '6713fdeb-1b64-4917-8d0a-7bab45d07bad',
  sessions: process.env.STUDY_SESSIONS_DB || 'a7f8b817-2ce6-481c-97e6-8bd52044e10f',
  classes: process.env.STUDY_CLASSES_DB || '4b001602-fddd-4585-a1c6-947d89a6cdb0'
};

function text(prop) {
  if (!prop) return '';
  const arr = prop.title || prop.rich_text || [];
  return arr.map(x => x.plain_text || '').join('');
}
function number(prop) { return prop?.number ?? null; }
function select(prop) { return prop?.select?.name || prop?.status?.name || ''; }
function date(prop) { return prop?.date?.start || null; }
function relation(prop) { return (prop?.relation || []).map(x => x.id); }
function checkbox(prop) { return Boolean(prop?.checkbox); }

async function queryDatabase(id, token) {
  const response = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: 100 })
  });
  if (!response.ok) throw new Error(`Notion ${response.status}: ${await response.text()}`);
  return (await response.json()).results;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.STUDY_NOTION_API_KEY || process.env.NOTION_API_KEY;
  if (!token) return res.status(503).json({ error: 'STUDY_NOTION_API_KEY is not configured.' });

  try {
    const [courseRows, taskRows, sessionRows, classRows] = await Promise.all([
      queryDatabase(DATABASES.courses, token), queryDatabase(DATABASES.tasks, token),
      queryDatabase(DATABASES.sessions, token), queryDatabase(DATABASES.classes, token)
    ]);

    const courses = courseRows.map(p => ({ id:p.id, name:text(p.properties.Course), code:text(p.properties.Code), type:select(p.properties.Type), currentGrade:number(p.properties['Current Grade']), targetGrade:number(p.properties['Target Grade']), active:checkbox(p.properties.Active) }));
    const tasks = taskRows.map(p => ({ id:p.id, task:text(p.properties.Task), course:relation(p.properties.Course), type:select(p.properties.Type), due:date(p.properties.Due), status:select(p.properties.Status), weight:number(p.properties['Weight %']), priority:select(p.properties.Priority), submitted:checkbox(p.properties.Submitted) }));
    const sessions = sessionRows.map(p => ({ id:p.id, session:text(p.properties.Session), course:relation(p.properties.Course), when:date(p.properties.When), method:select(p.properties['Study Method']), topic:text(p.properties.Topic), plannedMinutes:number(p.properties['Planned Minutes']), actualMinutes:number(p.properties['Actual Minutes']), status:select(p.properties.Status), completed:checkbox(p.properties.Completed) }));
    const classes = classRows.map(p => ({ id:p.id, name:text(p.properties.Class), course:relation(p.properties.Course), type:select(p.properties.Type), when:date(p.properties.When), location:text(p.properties.Location), topic:text(p.properties.Topic), preparation:text(p.properties.Preparation), attended:checkbox(p.properties.Attended) }));

    return res.status(200).json({ updatedAt:new Date().toISOString(), courses, tasks, sessions, classes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error:'Unable to load Study HQ data.' });
  }
}
