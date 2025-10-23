// 数据管理
class DataManager {
    constructor() {
        this.records = this.load('records') || [];
        this.categories = this.load('categories') || this.getDefaultCategories();
        this.budget = this.load('budget') || 0;
    }

    getDefaultCategories() {
        return [
            { id: 1, name: '餐饮', icon: '🍔' },
            { id: 2, name: '交通', icon: '🚗' },
            { id: 3, name: '购物', icon: '🛍️' },
            { id: 4, name: '娱乐', icon: '🎮' },
            { id: 5, name: '医疗', icon: '💊' },
            { id: 6, name: '住房', icon: '🏠' },
            { id: 7, name: '学习', icon: '📚' },
            { id: 8, name: '其他', icon: '📦' }
        ];
    }

    save(key, data) {
        document.cookie = `${key}=${JSON.stringify(data)}; max-age=31536000; path=/`;
    }

    load(key) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === key) {
                return JSON.parse(decodeURIComponent(value));
            }
        }
        return null;
    }

    addRecord(record) {
        record.id = Date.now();
        this.records.unshift(record);
        this.save('records', this.records);
    }

    addCategory(category) {
        category.id = Date.now();
        this.categories.push(category);
        this.save('categories', this.categories);
    }

    setBudget(amount) {
        this.budget = amount;
        this.save('budget', this.budget);
    }

    getRecordsByPeriod(period, date) {
        return this.records.filter(record => {
            const recordDate = new Date(record.date);
            const targetDate = new Date(date);

            if (period === 'day') {
                return recordDate.toDateString() === targetDate.toDateString();
            } else if (period === 'month') {
                return recordDate.getMonth() === targetDate.getMonth() &&
                       recordDate.getFullYear() === targetDate.getFullYear();
            } else if (period === 'year') {
                return recordDate.getFullYear() === targetDate.getFullYear();
            }
        });
    }

    getMonthlySpent() {
        const now = new Date();
        return this.getRecordsByPeriod('month', now)
            .reduce((sum, record) => sum + record.amount, 0);
    }
}

const dataManager = new DataManager();

// 页面导航
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;

            navItems.forEach(nav => nav.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`${targetPage}Page`).classList.add('active');

            if (targetPage === 'stats') renderStats();
            if (targetPage === 'trend') renderTrend();
            if (targetPage === 'list') renderTimeline();
        });
    });
}

// 记账页面
function initRecordPage() {
    const categoryGrid = document.getElementById('categoryGrid');
    const dateInput = document.getElementById('dateInput');
    const photoInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const saveBtn = document.getElementById('saveBtn');

    dateInput.valueAsDate = new Date();

    renderCategories();

    uploadBtn.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('photoPreview');
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.innerHTML = '';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    saveBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('amountInput').value);
        const selectedCategory = document.querySelector('.category-item.selected');
        const date = dateInput.value;
        const note = document.getElementById('noteInput').value;
        const photoPreview = document.getElementById('photoPreview').querySelector('img');

        if (!amount || !selectedCategory) {
            alert('请输入金额并选择类别');
            return;
        }

        const record = {
            amount,
            categoryId: parseInt(selectedCategory.dataset.id),
            date,
            note,
            photo: photoPreview ? photoPreview.src : null
        };

        dataManager.addRecord(record);

        // 重置表单
        document.getElementById('amountInput').value = '';
        document.getElementById('noteInput').value = '';
        document.getElementById('photoPreview').innerHTML = '';
        document.querySelector('.category-item.selected')?.classList.remove('selected');

        updateBudgetDisplay();
        alert('记账成功!');
    });
}

function renderCategories() {
    const categoryGrid = document.getElementById('categoryGrid');
    categoryGrid.innerHTML = dataManager.categories.map(cat => `
        <div class="category-item" data-id="${cat.id}">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');

    categoryGrid.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
}

// 新增类别
function initCategoryModal() {
    const addBtn = document.getElementById('addCategoryBtn');
    const modal = document.getElementById('categoryModal');
    const cancelBtn = document.getElementById('cancelCategoryBtn');
    const confirmBtn = document.getElementById('confirmCategoryBtn');

    addBtn.addEventListener('click', () => modal.classList.add('show'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

    confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('newCategoryName').value;
        const icon = document.getElementById('newCategoryIcon').value;

        if (name && icon) {
            dataManager.addCategory({ name, icon });
            renderCategories();
            updateTrendCategorySelect();
            modal.classList.remove('show');
            document.getElementById('newCategoryName').value = '';
            document.getElementById('newCategoryIcon').value = '';
        }
    });
}

// 预算显示
function initBudgetDisplay() {
    const budgetAmount = document.getElementById('budgetAmount');
    const modal = document.getElementById('budgetModal');
    const cancelBtn = document.getElementById('cancelBudgetBtn');
    const confirmBtn = document.getElementById('confirmBudgetBtn');

    budgetAmount.addEventListener('click', () => modal.classList.add('show'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

    confirmBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('budgetInput').value);
        if (amount) {
            dataManager.setBudget(amount);
            updateBudgetDisplay();
            modal.classList.remove('show');
        }
    });

    updateBudgetDisplay();
}

function updateBudgetDisplay() {
    const spent = dataManager.getMonthlySpent();
    const budget = dataManager.budget;

    document.getElementById('budgetAmount').textContent = budget > 0 ? `¥${budget}` : '点击设置';
    document.getElementById('spentAmount').textContent = spent.toFixed(2);

    if (budget > 0) {
        const percentage = Math.min((spent / budget) * 100, 100);
        document.getElementById('progressFill').style.width = `${percentage}%`;

        if (percentage > 90) {
            document.getElementById('progressFill').style.background = '#ef4444';
        } else if (percentage > 70) {
            document.getElementById('progressFill').style.background = '#f59e0b';
        }
    }
}

// 统计页面
function renderStats() {
    const period = document.querySelector('.date-btn.active').dataset.period;
    let dateStr = document.getElementById('statsDate').value || new Date().toISOString().split('T')[0];
    let date;
    // 修复日维度统计日期解析问题
    if (dateStr && period === 'day') {
        const [year, month, day] = dateStr.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else if (dateStr) {
        date = new Date(dateStr);
    } else {
        date = new Date();
    }
    const records = dataManager.getRecordsByPeriod(period, date);

    const categoryStats = {};
    records.forEach(record => {
        const cat = dataManager.categories.find(c => c.id === record.categoryId);
        if (cat) {
            if (!categoryStats[cat.name]) {
                categoryStats[cat.name] = { amount: 0, icon: cat.icon };
            }
            categoryStats[cat.name].amount += record.amount;
        }
    });

    renderPieChart(categoryStats);
    renderStatsList(categoryStats);
}

function renderPieChart(data) {
    const ctx = document.getElementById('pieChart');
    if (window.pieChartInstance) window.pieChartInstance.destroy();

    window.pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data).map(d => d.amount),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#4facfe',
                    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderStatsList(data) {
    const statsList = document.getElementById('statsList');
    statsList.innerHTML = Object.entries(data).map(([name, info]) => `
        <div class="stats-item">
            <div class="stats-category">
                <span class="stats-icon">${info.icon}</span>
                <span>${name}</span>
            </div>
            <span class="stats-amount">¥${info.amount.toFixed(2)}</span>
        </div>
    `).join('');
}

function initStatsPage() {
    document.getElementById('statsDate').valueAsDate = new Date();

    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderStats();
        });
    });

    document.getElementById('statsDate').addEventListener('change', renderStats);
}

// 趋势页面
function renderTrend() {
    const category = document.getElementById('trendCategory').value;
    const days = parseInt(document.getElementById('trendPeriod').value);

    const data = [];
    const labels = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));

        const dayRecords = dataManager.getRecordsByPeriod('day', date);
        const total = dayRecords
            .filter(r => category === 'all' || r.categoryId === parseInt(category))
            .reduce((sum, r) => sum + r.amount, 0);
        data.push(total);
    }

    renderLineChart(labels, data);
}

function renderLineChart(labels, data) {
    const ctx = document.getElementById('lineChart');
    if (window.lineChartInstance) window.lineChartInstance.destroy();

    window.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: '消费金额',
                data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function initTrendPage() {
    updateTrendCategorySelect();
    document.getElementById('trendCategory').addEventListener('change', renderTrend);
    document.getElementById('trendPeriod').addEventListener('change', renderTrend);
}

function updateTrendCategorySelect() {
    const select = document.getElementById('trendCategory');
    select.innerHTML = '<option value="all">全部类别</option>' +
        dataManager.categories.map(cat =>
            `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
        ).join('');
}

// 明细页面
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const groupedRecords = {};

    dataManager.records.forEach(record => {
        const date = new Date(record.date).toLocaleDateString('zh-CN');
        if (!groupedRecords[date]) groupedRecords[date] = [];
        groupedRecords[date].push(record);
    });

    timeline.innerHTML = Object.entries(groupedRecords).map(([date, records]) => `
        <div class="timeline-date">${date}</div>
        ${records.map(record => {
            const cat = dataManager.categories.find(c => c.id === record.categoryId);
            return `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <div class="timeline-category">
                            <span class="timeline-icon">${cat?.icon || '📦'}</span>
                            <span>${cat?.name || '未知'}</span>
                        </div>
                        <span class="timeline-amount">¥${record.amount.toFixed(2)}</span>
                    </div>
                    ${record.note ? `<div class="timeline-note">${record.note}</div>` : ''}
                    ${record.photo ? `<img src="${record.photo}" class="timeline-photo">` : ''}
                </div>
            `;
        }).join('')}
    `).join('');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initRecordPage();
    initCategoryModal();
    initBudgetDisplay();
    initStatsPage();
    initTrendPage();
});

