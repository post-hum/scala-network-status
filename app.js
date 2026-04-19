let difficultyChart = null;
let hashrateChart = null;

async function fetchCurrentStats() {
    try {
        // Читаем данные из локальных JSON файлов (без CORS)
        const poolRes = await fetch('current.json');
        const poolData = await poolRes.json();
        
        const emissionRes = await fetch('emission.json');
        const emissionData = await emissionRes.json();
        
        // Данные из pool.scalaproject.io
        const height = poolData.network?.height || emissionData.height || 'N/A';
        const difficulty = poolData.network?.difficulty ? (poolData.network.difficulty / 1e9).toFixed(2) + ' G' : 'N/A';
        const hashrate = poolData.network?.difficulty ? ((poolData.network.difficulty / 120) / 1e6).toFixed(2) + ' MH/s' : 'N/A';
        
        // Данные эмиссии
        const circulating = emissionData.circulatingSupply ? (emissionData.circulatingSupply / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        const totalSupply = emissionData.total ? (emissionData.total / 1e6).toFixed(2) + 'M XLA' : 'N/A';
        
        document.getElementById('height').innerText = height;
        document.getElementById('difficulty').innerText = difficulty;
        document.getElementById('hashrate').innerText = hashrate;
        document.getElementById('supply').innerText = circulating;
        document.getElementById('total').innerText = totalSupply;
        document.getElementById('updated').innerText = new Date().toLocaleString();
        
    } catch (err) {
        console.error('Stats fetch error:', err);
        document.getElementById('height').innerText = 'Loading...';
    }
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
        
        const timestamps = history.map(h => new Date(h.timestamp).toLocaleDateString());
        const difficulties = history.map(h => h.difficulty / 1e9);
        const hashrates = history.map(h => (h.difficulty / 120) / 1e6);
        
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
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#e0e0e0' } }
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
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#e0e0e0' } }
                }
            }
        });
    } catch (err) {
        console.log('History not available yet:', err);
    }
}

// Запускаем загрузку
fetchCurrentStats();
loadHistory();

// Обновляем каждую минуту
setInterval(fetchCurrentStats, 60000);
setInterval(loadHistory, 300000);
