// Public content: Supabase first, bundled JSON as safe fallback.
window.tcLoadContent = async function () {
  const cfg = window.TANCHAU_AUTH || {};
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      const url = cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/site_content?id=eq.main&select=payload';
      const res = await fetch(url, {headers: {'apikey': cfg.supabaseAnonKey, 'Accept': 'application/json'}, cache:'no-store'});
      if (!res.ok) throw new Error('Supabase HTTP ' + res.status);
      const rows = await res.json();
      if (rows.length && rows[0].payload && rows[0].payload.stats) return rows[0].payload;
    } catch (err) { console.warn('Chưa đọc được nội dung trực tuyến, dùng dữ liệu dự phòng:', err); }
  }
  const res = await fetch('site-data.json?v='+Date.now(), {cache:'no-store'});
  if (!res.ok) throw new Error('Không tải được nội dung website');
  return res.json();
};
