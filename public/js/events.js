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

// ------------------------ Load Config ------------------------
window.addEventListener('DOMContentLoaded', async () => {
    const config = await fetch('/api/get-config').then(res => res.json());

    if (config.success) {
        const deviceSelect = document.getElementById('device');
        const durationSelect = document.getElementById('relative');

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
    }
});

// ------------------------ Fetch Button ------------------------
document.getElementById('fetch-btn').addEventListener('click', async () => {
    const mode = document.getElementById('mode').value;
    const relative = document.getElementById('relative').value;
    const model = document.getElementById('device').value;

    let body = { mode };

    if (mode === "relative" && relative) body.relative = relative;
    else if (mode === "custom") {
        body.from_date = document.getElementById('from_date').value;
        body.to_date = document.getElementById('to_date').value;
    }

    if (model) body.model = model;

    const res = await fetch('/api/link-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
        // alert('✅ Events fetched & linked successfully!');
        // location.reload(); 
    } else {
        alert("❌ Failed: " + data.error);
    }
});
