let difficultyChart = null;
let hashrateChart = null;
let currentDifficulty = 0;

async function fetchCurrentStats() {
    try {
        const poolRes = await fetch('current.json');
        const poolData = await poolRes.json();
        
        const emissionRes = await fetch('emission.json');
        const emissionData = await emissionRes.json();
        
        const height = poolData.network?.height || emissionData.height || 'N/A';
        const difficultyRaw = poolData.network?.difficulty || 0;
        currentDifficulty = difficultyRaw;
        const difficulty = difficultyRaw ? (difficultyRaw / 1e9).toFixed(2) + ' G' : 'N/A';
        const hashrate = difficultyRaw ? ((difficultyRaw / 120) / 1e6).toFixed(2) + ' MH/s' : 'N/A';
        
        const circulating = emissionData.circulatingSupply ? (emissionData.circulatingSupply / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        const totalSupply = emissionData.total ? (emissionData.total / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        
        document.getElementById('height').innerText = height;
        document.getElementById('difficulty').innerText = difficulty;
        document.getElementById('hashrate').innerText = hashrate;
        document.getElementById('supply').innerText = circulating;
        document.getElementById('total').innerText = totalSupply;
        document.getElementById('updated').innerText = new Date().toLocaleString();
        
        updateCalculator();
        
    } catch (err) {
        console.error('Stats fetch error:', err);
        document.getElementById('height').innerText = 'Loading...';
    }
}

function updateCalculator() {
    if (!currentDifficulty) return;
    
    let hashrateInput = parseFloat(document.getElementById('hashrateInput').value);
    const unit = document.getElementById('hashrateUnit').value;
    
    if (isNaN(hashrateInput)) hashrateInput = 0;
    
    let hashrateHs = hashrateInput;
    if (unit === 'kh') hashrateHs = hashrateInput * 1000;
    if (unit === 'mh') hashrateHs = hashrateInput * 1000000;
    
    const blockReward = 138.5;
    const secondsPerBlock = 120;
    const blocksPerDay = 86400 / secondsPerBlock;
    const networkHashrate = currentDifficulty / 120;
    
    if (networkHashrate === 0) return;
    
    const userShare = hashrateHs / networkHashrate;
    const dailyReward = userShare * blocksPerDay * blockReward;
    
    document.getElementById('dailyReward').innerText = dailyReward.toFixed(4);
    document.getElementById('weeklyReward').innerText = (dailyReward * 7).toFixed(4);
    document.getElementById('monthlyReward').innerText = (dailyReward * 30.5).toFixed(4);
}

async function loadHistory() {
    try {
        const res = await fetch('data/history.json');
        if (!res.ok) throw new Error('No history yet');
        const history = await res.json();
        
        if (!history || history.length === 0) {
            console.log('History is empty');
            return;
        }
        
        const timestamps = history.map(h => {
            const date = new Date(h.timestamp);
            return date.toLocaleDateString();
        });
        const difficulties = history.map(h => parseFloat(h.difficulty) / 1e9);
        const hashrates = history.map(h => (parseFloat(h.difficulty) / 120) / 1e6);
        
        if (difficultyChart) difficultyChart.destroy();
        if (hashrateChart) hashrateChart.destroy();
        
        const ctxDiff = document.getElementById('difficultyChart').getContext('2d');
        difficultyChart = new Chart(ctxDiff, {
            type: 'line',
            data: { 
                labels: timestamps, 
                datasets: [{ 
                    label: 'Difficulty (G)', 
                    data: difficulties, 
                    borderColor: '#3b82f6', 
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#e0e0e0', font: { size: 11 } } }
                }
            }
        });
        
        const ctxHash = document.getElementById('hashrateChart').getContext('2d');
        hashrateChart = new Chart(ctxHash, {
            type: 'line',
            data: { 
                labels: timestamps, 
                datasets: [{ 
                    label: 'Network Hashrate (MH/s)', 
                    data: hashrates, 
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#e0e0e0', font: { size: 11 } } }
                }
            }
        });
    } catch (err) {
        console.log('History not available yet:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inputs = ['hashrateInput', 'hashrateUnit'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateCalculator);
    });
});

fetchCurrentStats();
loadHistory();
setInterval(fetchCurrentStats, 60000);
setInterval(loadHistory, 300000);
