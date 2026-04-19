let difficultyChart = null;
let hashrateChart = null;

async function fetchCurrentStats() {
    try {
        const poolRes = await fetch('https://pool.scalaproject.io/api/stats');
        const poolData = await poolRes.json();
        
        const emissionRes = await fetch('https://emission.scala.network/');
        const emissionText = await emissionRes.text();
        
        const heightMatch = emissionText.match(/height["']?\s*:\s*(\d+)/i);
        const totalMatch = emissionText.match(/total["']?\s*:\s*(\d+)/i);
        const circMatch = emissionText.match(/circulatingSupply["']?\s*:\s*(\d+)/i);
        
        const height = poolData.network?.height || heightMatch?.[1] || 'N/A';
        const difficulty = poolData.network?.difficulty ? (poolData.network.difficulty / 1e9).toFixed(2) + ' G' : 'N/A';
        const hashrate = poolData.network?.difficulty ? ((poolData.network.difficulty / 120) / 1e6).toFixed(2) + ' MH/s' : 'N/A';
        const circulating = circMatch?.[1] ? (parseInt(circMatch[1]) / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        const totalSupply = totalMatch?.[1] ? (parseInt(totalMatch[1]) / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        
        document.getElementById('height').innerText = height;
        document.getElementById('difficulty').innerText = difficulty;
        document.getElementById('hashrate').innerText = hashrate;
        document.getElementById('supply').innerText = circulating;
        document.getElementById('total').innerText = totalSupply;
        document.getElementById('updated').innerText = new Date().toLocaleString();
        
    } catch (err) {
        console.error('Stats fetch error:', err);
        document.getElementById('height').innerText = 'Error';
    }
}

async function loadHistory() {
    try {
        const res = await fetch('data/history.json');
        if (!res.ok) throw new Error('No history yet');
        const history = await res.json();
        
        const timestamps = history.map(h => new Date(h.timestamp).toLocaleDateString());
        const difficulties = history.map(h => h.difficulty / 1e9);
        const hashrates = history.map(h => (h.difficulty / 120) / 1e6);
        
        if (difficultyChart) difficultyChart.destroy();
        if (hashrateChart) hashrateChart.destroy();
        
        const ctxDiff = document.getElementById('difficultyChart').getContext('2d');
        difficultyChart = new Chart(ctxDiff, {
            type: 'line',
            data: { labels: timestamps, datasets: [{ label: 'Difficulty (G)', data: difficulties, borderColor: '#3b82f6', fill: false }] },
            options: { responsive: true, maintainAspectRatio: true }
        });
        
        const ctxHash = document.getElementById('hashrateChart').getContext('2d');
        hashrateChart = new Chart(ctxHash, {
            type: 'line',
            data: { labels: timestamps, datasets: [{ label: 'Network Hashrate (MH/s)', data: hashrates, borderColor: '#10b981', fill: false }] },
            options: { responsive: true, maintainAspectRatio: true }
        });
    } catch (err) {
        console.log('History not available yet:', err);
    }
}

fetchCurrentStats();
loadHistory();
setInterval(fetchCurrentStats, 60000);
