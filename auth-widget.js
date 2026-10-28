// Chức năng bổ sung: không sửa nội dung và bố cục website gốc.
// Cần cấu hình Supabase và chạy SQL trong HUONG_DAN_DANG_NHAP.txt.
const cfg=window.TANCHAU_AUTH||{};
const isAdminPage=location.pathname.split('/').pop()==='admin.html';
const style=document.createElement('style');
style.textContent=`#tc-auth{position:fixed;top:10px;right:12px;z-index:2147483000;font:14px Arial,sans-serif}
#tc-auth button{cursor:pointer;border:1px solid #f7cc73;border-radius:8px;padding:9px 13px;background:#a9000c;color:#fff;font-weight:700;box-shadow:0 2px 9px #0003}
#tc-auth-dialog{position:fixed;inset:0;z-index:2147483001;background:#0008;display:none;align-items:center;justify-content:center;padding:16px;font:15px Arial,sans-serif}
#tc-auth-dialog.open{display:flex}
#tc-auth-panel{background:#fff;border-radius:15px;width:min(100%,400px);padding:22px;box-shadow:0 10px 35px #0004;color:#152038}
#tc-auth-panel h2{color:#b9000c;margin:0 0 8px;font-size:22px}
#tc-auth-panel label{display:block;margin-top:12px;font-weight:bold}
#tc-auth-panel input{display:block;width:100%;box-sizing:border-box;padding:11px;margin-top:5px;border:1px solid #bbb;border-radius:7px}
#tc-auth-panel button{margin-top:14px;cursor:pointer;border:0;border-radius:7px;padding:11px;background:#c50012;color:#fff;font-weight:bold}
#tc-auth-panel .secondary{background:#eee;color:#222;margin-left:6px}
#tc-auth-status{margin-top:12px;line-height:1.5;font-size:13px}
#tc-admin-lock{position:fixed;inset:0;background:#fff;z-index:2147482999;display:flex;align-items:center;justify-content:center;font:16px Arial,sans-serif;text-align:center;padding:30px}
`;
document.head.append(style);
const authRoot=document.createElement('div');authRoot.id='tc-auth';
authRoot.innerHTML='<button type="button" id="tc-auth-open">Đăng nhập</button>';
document.body.append(authRoot);
const modal=document.createElement('div');modal.id='tc-auth-dialog';
modal.innerHTML=`<div id="tc-auth-panel" role="dialog" aria-modal="true" aria-label="Đăng nhập Liên đội"><h2>Đăng nhập Liên đội</h2><p>Khách đăng nhập để theo dõi; chỉ quản trị viên được chỉnh sửa.</p><form id="tc-auth-form"><label>Email<input id="tc-email" type="email" autocomplete="username" required></label><label>Mật khẩu<input id="tc-password" type="password" autocomplete="current-password" required></label><button type="submit">Đăng nhập</button><button type="button" class="secondary" id="tc-auth-close">Đóng</button></form><div id="tc-auth-status" aria-live="polite"></div></div>`;
document.body.append(modal);
const $=id=>document.getElementById(id);
let client=null, user=null, role='guest';
const configured=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey);
let lock;
if(isAdminPage){lock=document.createElement('div');lock.id='tc-admin-lock';lock.textContent='Đang xác minh quyền quản trị…';document.body.append(lock)}
function status(t){$('tc-auth-status').textContent=t}
function open(){modal.classList.add('open');$('tc-email').focus()}
function close(){modal.classList.remove('open')}
$('tc-auth-close').onclick=close;
modal.addEventListener('click',e=>{if(e.target===modal)close()});
function button(label,fn){$('tc-auth-open').textContent=label;$('tc-auth-open').onclick=fn}
function showUser(){
  if(!user){button('Đăng nhập',open);return}
  button('Tài khoản: '+user.email+' · Đăng xuất',async()=>{await client.auth.signOut();location.reload()});
  if(role==='admin'&&!isAdminPage){
    let a=document.getElementById('tc-admin-entry');
    if(!a){a=document.createElement('a');a.id='tc-admin-entry';a.href=cfg.adminPage||'admin.html';a.textContent='Mở quản trị';a.style.cssText='display:block;text-align:center;background:#fff;color:#a9000c;font-weight:bold;border-radius:6px;padding:8px;margin-top:4px';authRoot.append(a)}
  }
}
function deny(reason){if(lock){lock.innerHTML='';const d=document.createElement('div');d.textContent=reason;const b=document.createElement('button');b.textContent='Đăng nhập';b.style.cssText='display:block;margin:16px auto;padding:10px 20px';b.onclick=open;lock.append(d,b)}}
if(!configured){
  button('Đăng nhập',()=>{open();status('Chưa cấu hình xác thực. Quản trị viên cần điền Supabase URL và anon key trong auth-config.js.')});
  if(isAdminPage)deny('Chưa cấu hình đăng nhập quản trị. Xem HUONG_DAN_DANG_NHAP.txt.');
}else{
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    async function refresh(){
      const {data:{user:u},error}=await client.auth.getUser();
      user=error?null:u;role='guest';
      if(user){
        const result=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
        if(!result.error&&result.data?.role==='admin')role='admin';
      }
      showUser();
      if(isAdminPage){if(role==='admin'){lock.remove();addAccountManager()}else deny('Chỉ tài khoản Admin mới được vào trang chỉnh sửa.')}
    }
    $('tc-auth-form').onsubmit=async e=>{
      e.preventDefault();status('Đang đăng nhập…');
      const {error}=await client.auth.signInWithPassword({email:$('tc-email').value.trim(),password:$('tc-password').value});
      if(error){status('Đăng nhập không thành công: '+error.message);return}
      $('tc-password').value='';close();await refresh()
    };
    await refresh();
  }catch(e){status('Không kết nối được dịch vụ xác thực: '+e.message);button('Đăng nhập',open);if(isAdminPage)deny('Không thể xác minh quyền Admin.')}
}

function addAccountManager(){
 if(document.getElementById('tc-account-manager'))return;
 const box=document.createElement('section');box.id='tc-account-manager';
 box.style.cssText='margin:20px auto;padding:16px;max-width:1100px;background:white;border:2px solid #b9000c;border-radius:10px;font:14px Arial,sans-serif';
 box.innerHTML='<h2>Quản lý quyền truy cập</h2><p>Danh sách tài khoản đã đăng ký trong Supabase. Chỉ Admin được đổi quyền. Tạo tài khoản mới trong Supabase → Authentication → Users.</p><div id="tc-accounts">Đang tải...</div>';
 document.body.append(box);
 async function loadAccounts(){
  const {data,error}=await client.from('profiles').select('id,email,role').order('email');
  const host=document.getElementById('tc-accounts');
  if(error){host.textContent='Không đọc được danh sách: '+error.message;return}
  host.replaceChildren();
  for(const account of data||[]){
   const row=document.createElement('div');row.style.cssText='padding:8px 0;border-bottom:1px solid #ddd;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
   const name=document.createElement('span');name.textContent=account.email||account.id;name.style.minWidth='220px';
   const select=document.createElement('select');
   for(const roleName of ['guest','admin']){const opt=document.createElement('option');opt.value=roleName;opt.textContent=roleName==='admin'?'Quản trị viên':'Khách xem';select.append(opt)}
   select.value=account.role;
   if(account.id===user.id)select.disabled=true;
   select.onchange=async()=>{const {error}=await client.from('profiles').update({role:select.value}).eq('id',account.id);if(error){alert('Không đổi được quyền: '+error.message);select.value=account.role}else account.role=select.value};
   row.append(name,select);host.append(row)
  }
 }
 loadAccounts()
}
