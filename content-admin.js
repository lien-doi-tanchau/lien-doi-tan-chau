// Admin publication; RLS on the database is the real authorization barrier.
const status = document.getElementById('publishStatus');
const publishBtn = document.getElementById('publishBtn');
const reloadBtn = document.getElementById('reloadPublishedBtn');
const cfg = window.TANCHAU_AUTH || {};
function say(message) { status.textContent = message; }
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  say('Thiếu cấu hình Supabase trong auth-config.js.');
} else {
  try {
    const {createClient} = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const checkAdmin = async () => {
      const {data: {user}, error} = await client.auth.getUser();
      if (error || !user) return false;
      const result = await client.from('profiles').select('role').eq('id',user.id).single();
      return !result.error && result.data?.role === 'admin';
    };
    const loadPublished = async () => {
      const result = await client.from('site_content').select('payload').eq('id','main').maybeSingle();
      if (result.error) throw result.error;
      if (result.data?.payload) {
        // update lexical variable through an explicit bridge
        window.tcSetAdminData(result.data.payload);
        say('Đã tải dữ liệu đang xuất bản từ Supabase.');
      } else {
        say('Chưa có dữ liệu trên Supabase. Bản nháp hiện tại sẽ được đăng lần đầu khi bạn nhấn nút.');
      }
    };
    if (!(await checkAdmin())) {
      say('Bạn cần đăng nhập bằng tài khoản Admin để đăng bài.');
    } else {
      publishBtn.disabled = false; reloadBtn.disabled = false;
      say('Đã xác nhận quyền Admin. Đang tải nội dung trực tuyến…');
      // Preserve local draft on first visit; don't silently overwrite it.
      if (!localStorage.getItem('tanchau-functional-admin-v1')) await loadPublished();
      else say('Đang có bản nháp trên máy. Kiểm tra trước khi đăng, hoặc chọn Tải lại nội dung đã đăng.');
      publishBtn.addEventListener('click', async () => {
        publishBtn.disabled = true;
        try {
          if (!(await checkAdmin())) throw new Error('Phiên Admin không còn hợp lệ. Hãy đăng nhập lại.');
          const payload = window.tcGetAdminData();
          if (!payload?.stats || !Array.isArray(payload.news) || !Array.isArray(payload.events) || !payload.sections) throw new Error('Dữ liệu chưa hợp lệ.');
          if (!confirm('Đăng toàn bộ dữ liệu hiện tại lên website công khai?')) return;
          const result = await client.from('site_content').upsert({id:'main',payload,updated_at:new Date().toISOString()},{onConflict:'id'});
          if (result.error) throw result.error;
          localStorage.removeItem('tanchau-functional-admin-v1');
          say('Đã đăng thành công! Mở trang chủ và tải lại để kiểm tra.');
        } catch(err) { say('Chưa đăng được: '+err.message+' — kiểm tra đã chạy SQL tạo bảng và chính sách quyền.'); }
        finally {publishBtn.disabled=false;}
      });
      reloadBtn.addEventListener('click', async () => {
        if (!confirm('Bỏ bản nháp trên máy và tải nội dung đã đăng?')) return;
        try {localStorage.removeItem('tanchau-functional-admin-v1');await loadPublished();} catch(err){say('Không tải được: '+err.message);}
      });
    }
  } catch(err) { say('Không kết nối được Supabase: '+err.message); }
}
