const storage = chrome.storage.local;

function remove() {
    const arxiv_id = this.dataset.id;

    storage.get(['id_list'], items => {
        items.id_list.splice(items.id_list.indexOf(arxiv_id), 1);
        storage.set(items, () => (
            storage.remove(arxiv_id, () => {
                const element = Array.from(document.getElementsByClassName('card'))
                    .filter(tag => tag.dataset.id == arxiv_id)
                    .shift();

                element.parentNode.removeChild(element);
            })
        ));
    });
}

function search() {
    const items = Array.from(document.getElementsByClassName('card'))
                       .map(tag => {
                           tag.style.display = 'none';
                           return {
                               tag: tag,
                               title: tag.getElementsByClassName('title')[0].textContent.toLowerCase(),
                               authors: tag.getElementsByClassName('authors')[0].textContent.toLowerCase(),
                               abstract: tag.getElementsByClassName('abstract')[0].textContent.toLowerCase(),
                               date: tag.getElementsByClassName('upload')[0].textContent.toLowerCase(),
                           };
                       });

    const searched = this.value.split(',')
                         .map(cond => cond.split(':').map(c => c.trim()))
                         .map(([key, value]) => (
                             items.filter(item => (item[key] || '').includes((value || '').toLowerCase()))
                                  .map(item => item.tag)
                         ));
    
    for (let filtered of new Set(searched.flat())) {
        filtered.style.display = 'flex';
    }
}

chrome.storage.local.get(['id_list'], items => {
    const wrapper = document.getElementsByClassName('arxiv')[0];

    document.getElementsByName('search')[0].oninput = search;

    if ('id_list' in items) {
        items.id_list.map(id => {
            chrome.storage.local.get([id], items => {
                const item = JSON.parse(items[id]);
                const node = document.createElement('div');
                node.className = 'card';
                node.dataset.id = item.arxiv_id;
                node.innerHTML = `
                    <div class="content">
                        <a href="#" class="close" data-id="${item.arxiv_id}"></a>
                        <h2 class="title">${item.title}</h2>
                        <p class="authors">${item.authors.join(', ')}</p>
                        <small class="upload">${item.upload_date}</small>
                        <p class="abstract">${item.abstract}</p>
                    </div>
                    <div class="links">
                        <a class="page" target="_blank" href="https://arxiv.org/abs/${item.arxiv_id}">Site</a>
                        <a class="read" target="_blank" href="${item.pdf_url}">PDF</a>
                        <small class="saved">${item.save_date}</small>
                    </div>
                `
                wrapper.appendChild(node);
                node.getElementsByClassName('close')[0].onclick = remove;
            });
        });
    } else {

    }
});
