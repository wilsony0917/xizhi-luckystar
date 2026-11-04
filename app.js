const notices=[];let category='全部';const list=document.querySelector('#list'),search=document.querySelector('#search'),dialog=document.querySelector('#detail');function render(){list.replaceChildren();let count=0;notices.forEach((n,i)=>{if(category!=='全部'&&n.category!==category)return;if(!(n.title+n.summary+n.body).includes(search.value.trim()))return;count++;let b=document.createElement(n.url?'a':'button');if(n.url){b.href=n.url;b.target='_blank';b.rel='noopener'}b.className='notice'+(n.pinned?' pinned':'');b.innerHTML=`<span class="date"><b>${n.url?'PDF':'示範'}</b>${n.url?'社區文件':'待發布'}</span><span><span class="tag">${n.category}</span>${n.pinned?'<span class="pin">⌁ 置頂公告</span>':''}<h3>${escapeHtml(n.title)}</h3><p>${n.summary}</p></span><span class="arrow">↗</span>`;if(!n.url)b.onclick=()=>{document.querySelector('#detailtitle').textContent=n.title;document.querySelector('#detailtag').textContent=n.category;document.querySelector('#detailbody').textContent=n.body;dialog.showModal()};list.append(b)});document.querySelector('#empty').hidden=!!count}document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});render()});search.addEventListener('input',render);document.querySelectorAll('.close,.closebottom').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});render();

const demoNote=document.querySelector('.demo-note');if(demoNote)demoNote.remove();

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
