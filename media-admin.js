// Supabase RLS is the authorization boundary. UI checks alone are insufficient.
const $=id=>document.getElementById(id), cfg=window.TANCHAU_AUTH||{};
const status=$('mediaStatus'), form=$('mediaForm'), list=$('mediaAdminList');
const say=s=>status.textContent=s;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey){say('Thiếu cấu hình Supabase.');}
else try {
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 const sb=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
 const isAdmin=async()=>{const {data:{user}}=await sb.auth.getUser();if(!user)return false;const r=await sb.from('profiles').select('role').eq('id',user.id).single();return !r.error&&r.data?.role==='admin'};
 if(!await isAdmin()){say('Hãy đăng nhập bằng tài khoản Admin rồi tải lại trang.');}
 else {
  form.hidden=false;
  const render=async()=>{
   const {data,error}=await sb.from('media_library').select('id,title,category,created_at,file_path').order('created_at',{ascending:false}).limit(100);
   if(error){say('Không đọc được thư viện: '+error.message+' — đã chạy SUPABASE_MEDIA.sql chưa?');return;}
   list.replaceChildren();
   for(const item of data){const div=document.createElement('div');div.className='item';const span=document.createElement('span');span.textContent=item.title+' ('+item.category+') ';const btn=document.createElement('button');btn.textContent='Xóa';btn.onclick=async()=>{
    if(!confirm('Xóa nội dung "'+item.title+'"?'))return;
    if(!await isAdmin()){say('Phiên Admin không hợp lệ.');return;}
    const result=await sb.from('media_library').delete().eq('id',item.id);
    if(result.error){say('Không xóa được: '+result.error.message);return;}
    if(item.file_path){const storageResult=await sb.storage.from('tanchau-public').remove([item.file_path]);if(storageResult.error)say('Đã xóa bài nhưng chưa xóa được tệp: '+storageResult.error.message);}
    await render();
   };div.append(span,btn);list.append(div);}
  };
  await render();say('Đã sẵn sàng đăng tài liệu và đa phương tiện.');
  form.addEventListener('submit',async ev=>{
   ev.preventDefault();const btn=$('mediaSubmit');btn.disabled=true;
   try{
    if(!await isAdmin())throw Error('Không có quyền Admin.');
    const file=$('mediaFile').files[0],link=$('mediaUrl').value.trim();
    if(!file&&!link)throw Error('Chọn tệp hoặc nhập đường dẫn.');
    if(file&&link)throw Error('Chỉ chọn một nguồn: tệp hoặc đường dẫn.');
    if(file&&file.size>50*1024*1024)throw Error('Tệp vượt 50 MB. Video lớn nên đăng YouTube.');
    if(link&&!/^https:\/\//i.test(link))throw Error('Đường dẫn phải bắt đầu bằng https://');
    let file_path=null;
    if(file){file_path=crypto.randomUUID()+'/'+file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
     say('Đang tải tệp lên Supabase…');const upload=await sb.storage.from('tanchau-public').upload(file_path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(upload.error)throw upload.error;
    }
    const row={title:$('mediaTitle').value.trim(),description:$('mediaDescription').value.trim(),category:$('mediaCategory').value,school_year:$('mediaYear').value.trim(),month:$('mediaMonth').value?Number($('mediaMonth').value):null,featured:$('mediaFeatured').checked,allow_download:$('mediaDownload').checked,file_path,external_url:link||null,mime_type:file?.type||null};
    const result=await sb.from('media_library').insert(row);
    if(result.error){if(file_path)await sb.storage.from('tanchau-public').remove([file_path]);throw result.error;}
    form.reset();say('Đăng thành công! Mở Thư viện công khai để kiểm tra.');await render();
   }catch(err){say('Chưa đăng được: '+err.message)}finally{btn.disabled=false;}
  });
 }
}catch(err){say('Không kết nối được: '+err.message)}
