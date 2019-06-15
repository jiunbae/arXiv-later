const storage = chrome.storage.sync;
const legacy_storage = chrome.storage.local;

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

function save() {
    storage.get(['id_list'], result => {
        if ('id_list' in result) {
            Promise.all(result.id_list.map(id => (
                new Promise((resolve, reject) => (
                    storage.get([id], res => {
                        resolve(JSON.parse(res[id]));
                    })
                ))
            ))).then(items => {
                const temp = document.createElement('a');
                const file = new Blob([JSON.stringify(items)], { type: 'application/json' });

                temp.href = URL.createObjectURL(file);
                temp.download = 'arXiv-later.json'
                temp.click();
            });
        } else {
            alert('nothing to export');
        }
    });
}

function load() {
    if (this.files && this.files.length == 1) {
        const reader = new FileReader();

        reader.onload = e => {
            const content = JSON.parse(e.target.result);

            if (Array.isArray(content)) {
                storage.get(['id_list'], result => {
                    const id_list = result['id_list'] || [];

                    Promise.all(content.map(item => (
                        new Promise((resolve, reject) => {
                            if (!id_list.includes(item.arxiv_id)) {
                                storage.set({ [ item.arxiv_id ]: JSON.stringify(item) }, () => {
                                    id_list.push(item.arxiv_id);
                                    resolve(item.arxiv_id);
                                })
                            } else {
                                resolve(item.arxiv_id);
                            }
                        })
                    ))).then(result => {
                        storage.set({ id_list }, () => {
                            location.reload();
                        });
                    });
                });
            } else {
                alert('type error');
            }
        }
        reader.readAsText(this.files[0]);
    }
}

storage.get(['id_list'], result => {
    const id_list = result['id_list'] || [];
    const wrapper = document.getElementsByClassName('arxiv')[0];

    document.getElementsByName('search')[0].oninput = search;
    document.getElementById('export').onclick = save;
    document.getElementById('import').onchange = load;

    // Legacy parts
    legacy_storage.get(['id_list'], legacy_result => {
        const legacy_list = legacy_result['id_list'] || [];

        Promise.all(
            legacy_list.filter(id => !id_list.includes(id))
                       .map(id => new Promise((resolve, reject) => (
                           legacy_storage.get([id], item => (
                               storage.set({ [id]: item[id] }, () => {
                                   id_list.push(id);
                                   resolve(id);
                               })
                           ))
                       )))
        ).then(result => {
            storage.set({ id_list }, () => {
                // fetch
                id_list.map(id => {
                    storage.get([id], items => {
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
            });
        });
    });
});
