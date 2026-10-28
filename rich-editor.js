// Trình biên tập tin/bài và chuyên mục; chỉ tài khoản Admin được phép tải ảnh.
const cfg=window.TANCHAU_AUTH||{};
let supabase;
async function client(){if(!supabase){const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');supabase=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey)}return supabase}
const escapeHTML=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plainToHtml=s=>'<p>'+escapeHTML(s).replace(/\n/g,'<br>')+'</p>';
const editors={};let active=null;
function clean(html){
 // Fail closed if the sanitizer could not be loaded.
 if(!window.DOMPurify)throw Error('Chưa tải được thư viện bảo mật định dạng. Kiểm tra Internet rồi tải lại trang.');
 return DOMPurify.sanitize(html,{ALLOWED_CSS_PROPERTIES:['text-align','font-family','font-size','line-height','color','background-color','margin-left','margin-right','text-indent','width'],ALLOWED_TAGS:['p','br','h2','h3','h4','strong','b','em','i','u','ul','ol','li','blockquote','a','img','figure','figcaption','div','span','table','thead','tbody','tr','th','td'],ALLOWED_ATTR:['href','src','alt','title','target','rel','class','style','colspan','rowspan'],ALLOW_DATA_ATTR:false,FORBID_TAGS:['script','style','iframe','svg','math','form','video','audio']});
}
async function uploadImage(file){
 if(!file||!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw Error('Chỉ hỗ trợ ảnh JPG, PNG, WebP, GIF.');
 if(file.size>10*1024*1024)throw Error('Ảnh quá 10 MB. Hãy nén ảnh trước khi tải.');
 const sb=await client();const {data:{user},error:authErr}=await sb.auth.getUser();if(authErr||!user)throw Error('Vui lòng đăng nhập Admin.');
 const {data:profile,error:profileErr}=await sb.from('profiles').select('role').eq('id',user.id).single();
 if(profileErr||profile?.role!=='admin')throw Error('Chỉ Admin được chèn ảnh.');
 const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];
 const path='articles/'+crypto.randomUUID()+'.'+ext;
 const result=await sb.storage.from('tanchau-public').upload(path,file,{contentType:file.type,upsert:false});
 if(result.error)throw Error('Không tải được ảnh: '+result.error.message);
 return sb.storage.from('tanchau-public').getPublicUrl(path).data.publicUrl;
}
function command(editor,cmd,val){editor.focus();document.execCommand(cmd,false,val||null)}
function addButton(toolbar,text,fn,title){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title||text;b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',fn);toolbar.append(b)}
function selectionBookmark(editor){const sel=window.getSelection();if(sel.rangeCount&&editor.contains(sel.anchorNode))return sel.getRangeAt(0).cloneRange();return null}
function insertImage(editor,url,range){editor.focus();const sel=window.getSelection();if(range){sel.removeAllRanges();sel.addRange(range)}const img=document.createElement('img');img.src=url;img.alt='Hình ảnh hoạt động';img.loading='lazy';const r=sel.rangeCount?sel.getRangeAt(0):null;if(r){r.deleteContents();r.insertNode(img);r.setStartAfter(img);r.collapse(true);sel.removeAllRanges();sel.addRange(r)}else editor.append(img)}
function build(id,hostId){const host=document.getElementById(hostId);if(!host)return;const toolbar=document.createElement('div');toolbar.className='rich-toolbar';const editor=document.createElement('div');editor.className='rich-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','Nội dung bài viết');editor.dataset.editor=id;
 const heading=document.createElement('select');heading.innerHTML='<option value="p">Đoạn văn</option><option value="h2">Tiêu đề lớn</option><option value="h3">Tiêu đề nhỏ</option>';heading.title='Kiểu đoạn';heading.onchange=()=>command(editor,'formatBlock',heading.value);toolbar.append(heading);
 for(const [name,cmd] of [['B','bold'],['I','italic'],['U','underline'],['• Danh sách','insertUnorderedList'],['1. Danh sách','insertOrderedList'],['Căn trái','justifyLeft'],['Căn giữa','justifyCenter'],['Căn phải','justifyRight'],['Căn đều','justifyFull'],['Thụt lề +','indent'],['Thụt lề −','outdent'],['Xóa định dạng','removeFormat']])addButton(toolbar,name,()=>command(editor,cmd));
 const font=document.createElement('select');font.title='Phông chữ';font.innerHTML='<option value="">Phông chữ</option>'+['Arial','Times New Roman','Georgia','Verdana','Tahoma','Courier New'].map(f=>'<option value="'+f+'">'+f+'</option>').join('');font.onchange=()=>{if(font.value)command(editor,'fontName',font.value)};toolbar.append(font);
 const fontsize=document.createElement('select');fontsize.title='Cỡ chữ';fontsize.innerHTML='<option value="">Cỡ chữ</option>'+[12,13,14,16,18,20,24,28,32,36].map((n,i)=>'<option value="'+(i+1)+'">'+n+' px</option>').join('');fontsize.onchange=()=>{if(fontsize.value)command(editor,'fontSize',fontsize.value)};toolbar.append(fontsize);
 const line=document.createElement('select');line.title='Giãn dòng';line.innerHTML='<option value="">Giãn dòng</option>'+['1','1.15','1.5','1.75','2'].map(v=>'<option value="'+v+'">'+v+'</option>').join('');line.onchange=()=>{editor.style.lineHeight=line.value};toolbar.append(line);
 for(const [label,cmd] of [['Màu chữ','foreColor'],['Tô nền','hiliteColor']]){const inp=document.createElement('input');inp.type='color';inp.title=label;inp.value=cmd==='foreColor'?'#172033':'#fff2b3';inp.onchange=()=>command(editor,cmd,inp.value);toolbar.append(inp)}
 addButton(toolbar,'▦ Bảng',()=>{const rows=Math.min(10,Math.max(1,Number(prompt('Số hàng (1–10):','3'))||0));const cols=Math.min(6,Math.max(1,Number(prompt('Số cột (1–6):','3'))||0));const html='<table style="width:100%"><tbody>'+Array.from({length:rows},()=>'<tr>'+Array.from({length:cols},()=>'<td>Ô nội dung</td>').join('')+'</tr>').join('')+'</tbody></table><p></p>';editor.focus();document.execCommand('insertHTML',false,html)});
 addButton(toolbar,'🔗 Liên kết',()=>{const url=prompt('Nhập đường dẫn HTTPS:');if(url&&/^https:\/\//i.test(url))command(editor,'createLink',url);else if(url)alert('Chỉ dùng liên kết https://')});
 const imageInput=document.createElement('input');imageInput.type='file';imageInput.accept='image/jpeg,image/png,image/webp,image/gif';imageInput.hidden=true;toolbar.append(imageInput);
 addButton(toolbar,'🖼 Chèn ảnh',()=>{active={editor,range:selectionBookmark(editor)};imageInput.click()});
 imageInput.onchange=async()=>{const file=imageInput.files[0];imageInput.value='';if(!file)return;const b=active?.range;try{host.querySelector('.rich-help').textContent='Đang tải ảnh lên Supabase…';const url=await uploadImage(file);insertImage(editor,url,b);host.querySelector('.rich-help').textContent='Đã chèn ảnh. Nhấn Lưu mục và Đăng thay đổi lên website.'}catch(err){alert(err.message);host.querySelector('.rich-help').textContent='Không thể chèn ảnh.'}};
 const docxInput=document.createElement('input');docxInput.type='file';docxInput.accept='.docx';docxInput.hidden=true;toolbar.append(docxInput);
 addButton(toolbar,'📄 Nhập Word (.docx)',()=>docxInput.click());
 docxInput.onchange=async()=>{const file=docxInput.files[0];docxInput.value='';if(!file)return;try{if(file.size>20*1024*1024)throw Error('File Word quá 20 MB.');if(!window.mammoth)throw Error('Không tải được thư viện đọc Word.');if(!confirm('Nhập Word sẽ thay nội dung đang soạn ở ô này. Tiếp tục?'))return;const buffer=await file.arrayBuffer();const result=await mammoth.convertToHtml({arrayBuffer:buffer},{convertImage:mammoth.images.imgElement(async image=>{const base64=await image.read('base64');const mime=image.contentType||'image/png';if(!['image/jpeg','image/png','image/webp','image/gif'].includes(mime))return {src:''};const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const url=await uploadImage(new File([bytes],'word-image',{type:mime}));return {src:url}})});editor.innerHTML=clean(result.value);host.querySelector('.rich-help').textContent='Đã nhập Word. Kiểm tra bố cục, lưu mục và đăng website.';if(result.messages?.length)console.info('Word import:',result.messages)}catch(err){alert('Chưa nhập được Word: '+err.message)}};
 addButton(toolbar,'👁 Xem trước',()=>{let html;try{html=clean(editor.innerHTML)}catch(err){alert(err.message);return}const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#0009;z-index:99999;display:grid;place-items:center;padding:20px';const panel=document.createElement('div');panel.style.cssText='background:#fff;border-radius:12px;padding:20px;width:min(800px,100%);max-height:90vh;overflow:auto';const close=document.createElement('button');close.textContent='✕ Đóng xem trước';close.onclick=()=>overlay.remove();const view=document.createElement('div');view.className='rich-preview';view.innerHTML=html;panel.append(close,view);overlay.append(panel);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.append(overlay)});
 addButton(toolbar,'↶ Hoàn tác',()=>command(editor,'undo'));addButton(toolbar,'↷ Làm lại',()=>command(editor,'redo'));
 const help=document.createElement('p');help.className='rich-help';help.textContent='Chọn ảnh trong bài và nhấn Delete để xóa khỏi nội dung. Sau khi lưu mục, nhấn “Đăng thay đổi lên website”.';host.append(toolbar,editor,help);editors[id]=editor;
}
// Load dependencies before editing; never publish unsanitized HTML.
try{
 const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)});
 await load('https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js');
 await load('https://cdn.jsdelivr.net/npm/mammoth@1.9.1/mammoth.browser.min.js');
}catch(err){console.error('Rich editor dependency:',err)}
build('detail','detailEditorHost');build('sectionDetail','sectionEditorHost');
window.tcEditor={set(id,value){const ed=editors[id];if(!ed)return;ed.innerHTML=/^\s*</.test(value||'')?clean(value):plainToHtml(value||'')},get(id){const ed=editors[id];if(!ed)throw Error('Chưa sẵn sàng trình soạn thảo.');return clean(ed.innerHTML)}};
