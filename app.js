const notices=[{title:'歡迎來到中正福星社區公告網',category:'社區消息',summary:'社區消息有了新的閱讀方式，手機掃碼就能隨時掌握。',body:'歡迎來到中正福星社區公告網！\n\n本站方便街坊以手機或電腦查看公告，也可透過 QR code 快速進入。\n\n目前網站仍為示範版，公告分類與內容僅供展示。正式消息將於管理單位提供後更新。',pinned:true},{title:'公共空間使用提醒',category:'生活提醒',summary:'一起愛護共享空間，讓社區環境更舒適。',body:'【示範內容】\n使用公共空間後，請協助維持環境整潔。\n\n實際公共設施使用規則與開放時間，待社區管理單位提供後公告。'},{title:'社區活動資訊預告',category:'活動資訊',summary:'相聚的好時光，歡迎一起參與社區生活。',body:'【示範內容】\n這裡將刊登社區活動資訊。\n\n活動日期、地點、報名方式與聯絡人，待社區提供後公布。目前尚無開放報名的活動。'}];let category='全部';const list=document.querySelector('#list'),search=document.querySelector('#search'),dialog=document.querySelector('#detail');function render(){list.replaceChildren();let count=0;notices.forEach((n,i)=>{if(category!=='全部'&&n.category!==category)return;if(!(n.title+n.summary+n.body).includes(search.value.trim()))return;count++;let b=document.createElement(n.url?'a':'button');if(n.url){b.href=n.url;b.target='_blank';b.rel='noopener'}b.className='notice'+(n.pinned?' pinned':'');b.innerHTML=`<span class="date"><b>${n.url?'PDF':'示範'}</b>${n.url?'社區文件':'待發布'}</span><span><span class="tag">${n.category}</span>${n.pinned?'<span class="pin">⌁ 置頂公告</span>':''}<h3>${escapeHtml(n.title)}</h3><p>${n.summary}</p></span><span class="arrow">↗</span>`;if(!n.url)b.onclick=()=>{document.querySelector('#detailtitle').textContent=n.title;document.querySelector('#detailtag').textContent=n.category;document.querySelector('#detailbody').textContent=n.body;dialog.showModal()};list.append(b)});document.querySelector('#empty').hidden=!!count}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});render()});search.addEventListener('input',render);document.querySelectorAll('.close,.closebottom').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});render();

const demoNote=document.querySelector('.demo-note');if(demoNote)demoNote.textContent='PDF 為社區上傳的文件；其餘標示「示範」的公告僅供版型展示。';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const pdfStatus = document.createElement('p');
pdfStatus.setAttribute('role', 'status');
pdfStatus.style.fontSize = '14px';
list.before(pdfStatus);
async function loadPdfs() {
  pdfStatus.replaceChildren('正在載入社區 PDF 公告…');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.github.com/repos/wilsony0917/xizhi-luckystar/contents/announcement?ref=main', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const files = await response.json();
    if (!Array.isArray(files)) throw new Error('Invalid directory');
    const pdfs = files.filter(file => file.type === 'file' && /\.pdf$/i.test(file.name))
      .sort((a, b) => b.name.localeCompare(a.name, 'zh-Hant', { numeric: true }))
      .map(file => ({
        title: file.name, category: '社區消息',
        summary: '點選開啟 PDF 文件（新分頁開啟）。', body: '',
        url: './announcement/' + encodeURIComponent(file.name)
      }));
    for (let i = notices.length - 1; i >= 0; i--) if (notices[i].url) notices.splice(i, 1);
    notices.unshift(...pdfs);
    render();
    pdfStatus.textContent = pdfs.length ? '' : '目前尚無 PDF 公告。';
  } catch (error) {
    pdfStatus.textContent = '暫時無法載入 PDF 公告，請稍後重試。';
    const retry = document.createElement('button');
    retry.textContent = '重新載入';
    retry.style.marginLeft = '12px';
    retry.onclick = loadPdfs;
    pdfStatus.append(retry);
  } finally {
    clearTimeout(timeout);
  }
}
loadPdfs();
