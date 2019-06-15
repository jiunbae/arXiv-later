function getMeta(name, context = document) {
    return Array.from(context.getElementsByTagName('meta'))
                .filter(tag => tag.name == name)
                .shift();
}

function getElement(name, context = document) {
    return context.getElementsByClassName(name)[0];
}

function getNow() {
    let today = new Date();
    return `${today.getFullYear()}/${(today.getMonth()+1).toString().padStart(2, '0')}/${(today.getDate()).toString().padStart(2, '0')}`;
}

const arxiv_id = getMeta('citation_arxiv_id').content;

chrome.storage.local.get([arxiv_id], items => {
    const target = getElement('full-text').getElementsByTagName('UL')[0];
    const button = document.createElement('a');
    const wrapper = document.createElement('li');

    button.href = '#';
    button.onclick = () => {
        const title = getElement('title').innerText;
        const authors = Array.from(getElement('authors').getElementsByTagName('a'))
                             .map(tag => tag.innerText);
        const abstract = getElement('abstract').innerText;
        const subject = getElement('subjects').innerText;
        const category = getElement('subheader').innerText.split(' > ');

        const pdf_url = getMeta('citation_pdf_url').content;
        const upload_date = getMeta('citation_date').content;
        const save_date = getNow();

        let jsonfile = {};
        jsonfile[arxiv_id] = JSON.stringify({
            title, authors, abstract, subject, category, 
            arxiv_id, pdf_url, upload_date, save_date,
        });

        chrome.storage.local.set(jsonfile, () => {
            button.innerHTML = `Keeped (${save_date})`;
        });

        chrome.storage.local.get(['id_list'], items => {
            let manifest = {};
            manifest['id_list'] = items.id_list || [];

            if (!manifest['id_list'].includes(arxiv_id)) {
                manifest['id_list'].push(arxiv_id);
                chrome.storage.local.set(manifest, () => {
                    button.innerHTML = `Keeped (${save_date})`;
                });
            }
        });
    };

    button.appendChild(document.createTextNode('Keep'));
    wrapper.appendChild(button);

    target.insertBefore(wrapper, target.childNodes[2]);

    if (arxiv_id in items) {
        const item = JSON.parse(items[arxiv_id]);
        button.innerHTML = `Keeped (${item.save_date})`;
    }
});
