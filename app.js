const notices=[];let category='全部';const list=document.querySelector('#list'),search=document.querySelector('#search'),dialog=document.querySelector('#detail');function render(){list.replaceChildren();let count=0;notices.forEach((n,i)=>{if(category!=='全部'&&n.category!==category)return;if(!(n.title+n.summary+n.body).includes(search.value.trim()))return;count++;let b=document.createElement(n.url?'a':'button');if(n.url){b.href=n.url;b.target='_blank';b.rel='noopener'}b.className='notice'+(n.pinned?' pinned':'');b.style.gridTemplateColumns='minmax(0, 1fr) auto';b.innerHTML=`<span><span class="tag">${n.category}</span>${n.pinned?'<span class="pin">⌁ 置頂公告</span>':''}<h3>${escapeHtml(n.title.replace(/\.[^.]+$/, ''))}</h3><p>${n.summary}</p></span><span class="arrow">↗</span>`;if(!n.url)b.onclick=()=>{document.querySelector('#detailtitle').textContent=n.title;document.querySelector('#detailtag').textContent=n.category;document.querySelector('#detailbody').textContent=n.body;dialog.showModal()};list.append(b)});document.querySelector('#empty').hidden=!!count}const financeFilter = document.createElement('button');
financeFilter.type = 'button';
financeFilter.dataset.filter = '每月收支';
financeFilter.setAttribute('aria-pressed', 'false');
financeFilter.textContent = '每月收支';
document.querySelector('.filters').append(financeFilter);
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});render()});search.addEventListener('input',render);document.querySelectorAll('.close,.closebottom').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});render();

const demoNote=document.querySelector('.demo-note');if(demoNote)demoNote.remove();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const folders = { announcement: '社區消息', LifeRemind: '生活提醒', ActivityInfo: '活動資訊', MonthlyFinance: '每月收支' };
const status = document.createElement('p');
status.setAttribute('role', 'status');
list.before(status);

async function loadFiles() {
  status.replaceChildren('正在載入社區公告…');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.github.com/repos/wilsony0917/xizhi-luckystar/git/trees/main?recursive=1', {
      cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const {tree, truncated} = await response.json();
    if (!Array.isArray(tree) || truncated) throw new Error('Incomplete file list');
    const files = tree.flatMap(({type, path}) => {
      const [folder, title, ...rest] = path.split('/');
      if (type !== 'blob' || !Object.hasOwn(folders, folder) || !title || rest.length) return [];
      if (!/\.(pdf|jpe?g|png|gif|webp|avif|bmp|svg|ico)$/i.test(title)) return [];
      const kind = /\.pdf$/i.test(title) ? 'PDF' : '圖片';
      return [{title, path, category: folders[folder], kind, body: '',
        summary: '上傳時間：暫無資料',
        url: './' + folder + '/' + encodeURIComponent(title)}];
    });
    // Git tree entries have no dates. Look up the latest commit that touched each file.
    let nextFile = 0;
    await Promise.all(Array.from({length: Math.min(4, files.length)}, async () => {
      while (nextFile < files.length && !controller.signal.aborted) {
        const file = files[nextFile++];
        const query = new URLSearchParams({sha: 'main', path: file.path, per_page: '1'});
        try {
          const history = await fetch('https://api.github.com/repos/wilsony0917/xizhi-luckystar/commits?' + query, {
            signal: controller.signal
          });
          if (!history.ok) continue;
          const [latest] = await history.json();
          file.updatedAt = Date.parse(latest?.commit?.committer?.date) || 0;
        } catch {
          // Keep the announcement visible if its date is unavailable.
        }
      }
    }));
    const dateFormat = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    for (const file of files) {
      if (file.updatedAt) file.summary = '上傳時間：' + dateFormat.format(file.updatedAt);
    }
    files.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      || b.title.localeCompare(a.title, 'zh-Hant', {numeric: true}));
    notices.splice(0, notices.length, ...files);
    render();
    status.textContent = files.length ? '' : '目前尚無公告檔案。';
  } catch {
    status.textContent = '暫時無法載入公告，請稍後重試。';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = '重新載入';
    retry.onclick = loadFiles;
    status.append(' ', retry);
  } finally {
    clearTimeout(timeout);
  }
}
loadFiles();
