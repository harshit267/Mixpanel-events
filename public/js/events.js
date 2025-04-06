



document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-props-btn');
    let showingAll = false;

    toggleBtn.addEventListener('click', () => {
        const hiddenProps = document.querySelectorAll('.hidden-prop');
        hiddenProps.forEach(el => {
            el.style.display = showingAll ? 'none' : 'list-item';
        });

        toggleBtn.textContent = showingAll ? 'Show All Properties' : 'Hide $ Properties';
        showingAll = !showingAll;
    });
});

// ------------------------ Mode Switch ------------------------

const modeSelector = document.getElementById('mode');
const relativeSelector = document.getElementById('relative-selector');
const customDate = document.getElementById('custom-date');

modeSelector.addEventListener('change', () => {
    if (modeSelector.value === 'relative') {
        relativeSelector.style.display = 'block';
        customDate.style.display = 'none';
    } else {
        relativeSelector.style.display = 'none';
        customDate.style.display = 'inline';
    }
});

// ------------------------ Search ------------------------

const searchInput = document.getElementById('search-input');
const noResult = document.getElementById('no-result');

searchInput.addEventListener('input', function () {
    const search = this.value.toLowerCase();
    const eventBlocks = document.querySelectorAll('.event-block');
    let found = false;

    eventBlocks.forEach(block => {
        const interfaceText = block.querySelector('.interface-text')?.innerText.toLowerCase() || "";
        const propsText = block.querySelector('.props-text')?.innerText.toLowerCase() || "";

        if (interfaceText.includes(search) || propsText.includes(search)) {
            block.classList.remove('hidden');
            found = true;
        } else {
            block.classList.add('hidden');
        }
    });

    noResult.style.display = found ? 'none' : 'block';
});

// ------------------------ Load Config & Restore Filters ------------------------

window.addEventListener('DOMContentLoaded', async () => {
    const config = await fetch('/api/get-config').then(res => res.json());

    if (config.success) {
        const deviceSelect = document.getElementById('device');
        const durationSelect = document.getElementById('relative');
        const versionSelect = document.getElementById('version');
        const buildSelect = document.getElementById('build');
        const version = versionSelect.value;
        const build = buildSelect.value;

        if (version) body.version = version;
        if (build) body.build = build;


        config.allowedVersions.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            versionSelect.appendChild(opt);
        });

        config.allowedBuilds.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            buildSelect.appendChild(opt);
        });


        config.allowedDevices.forEach(device => {
            const opt = document.createElement('option');
            opt.value = device;
            opt.textContent = device;
            deviceSelect.appendChild(opt);
        });

        config.durations.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.value;
            opt.textContent = d.label;
            durationSelect.appendChild(opt);
        });

        // ===== Restore Filters =====
        if (localStorage.getItem('mode')) {
            modeSelector.value = localStorage.getItem('mode');
            modeSelector.dispatchEvent(new Event('change'));
        }
        if (localStorage.getItem('relative')) document.getElementById('relative').value = localStorage.getItem('relative');
        if (localStorage.getItem('from_date')) document.getElementById('from_date').value = localStorage.getItem('from_date');
        if (localStorage.getItem('to_date')) document.getElementById('to_date').value = localStorage.getItem('to_date');
        if (localStorage.getItem('device')) document.getElementById('device').value = localStorage.getItem('device');
        if (localStorage.getItem('search')) document.getElementById('search-input').value = localStorage.getItem('search');
        versionSelect.value = localStorage.getItem('version') || "";
        buildSelect.value = localStorage.getItem('build') || "";
        // re-trigger search
        searchInput.dispatchEvent(new Event('input'));

        // optional: clear for next session
        localStorage.removeItem('mode');
        localStorage.removeItem('relative');
        localStorage.removeItem('from_date');
        localStorage.removeItem('to_date');
        localStorage.removeItem('device');
        localStorage.removeItem('search');
    }
});

// ------------------------ Fetch Button ------------------------

document.getElementById('fetch-btn').addEventListener('click', async () => {
    const mode = modeSelector.value;
    const relative = document.getElementById('relative').value;
    const model = document.getElementById('device').value;
    const version = document.getElementById('version').value;
    const build = document.getElementById('build').value;

    let body = { mode };

    if (mode === "relative" && relative) {
        body.relative = relative;
    } else if (mode === "custom") {
        body.from_date = document.getElementById('from_date').value;
        body.to_date = document.getElementById('to_date').value;
    }

    if (model) body.model = model;
    if (version) body.version = version;
    if (build) body.build = build;

    // ===== Store Filters Before Reload =====
    localStorage.setItem('mode', mode);
    localStorage.setItem('relative', relative);
    localStorage.setItem('from_date', document.getElementById('from_date').value);
    localStorage.setItem('to_date', document.getElementById('to_date').value);
    localStorage.setItem('device', model);
    localStorage.setItem('search', searchInput.value);
    localStorage.setItem('version', version);
    localStorage.setItem('build', build);

    const res = await fetch('/api/link-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
        location.reload();
    } else {
        alert("❌ Failed: " + data.error);
    }
});
