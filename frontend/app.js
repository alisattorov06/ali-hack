class StudentSearchSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsCount = document.getElementById('resultsCount');
        this.dbStatus = document.getElementById('dbStatus');
        this.totalRecords = document.getElementById('totalRecords');
        this.responseTime = document.getElementById('responseTime');
        this.loadingAnimation = document.getElementById('loadingAnimation');
        this.noResults = document.getElementById('noResults');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkServerHealth();
        this.loadSystemStats();
        
        this.searchInput.focus();
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }
    
    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.resetBtn.addEventListener('click', () => this.resetSearch());
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('studentModal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('studentModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    async checkServerHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (response.ok) {
                this.dbStatus.textContent = 'CONNECTED';
                this.dbStatus.className = 'status-value';
                this.dbStatus.style.color = '#00ff9d';
            }
        } catch (error) {
            this.dbStatus.textContent = 'DISCONNECTED';
            this.dbStatus.className = 'status-value';
            this.dbStatus.style.color = '#ff4757';
            console.error('Serverga ulanishda xatolik:', error);
        }
    }
    
    async loadSystemStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/columns`);
            const data = await response.json();
            
            if (data.success) {
                this.totalRecords.textContent = data.total_students;
            }
        } catch (error) {
            console.error('Statistikani yuklashda xatolik:', error);
        }
    }
    
    async performSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (!searchTerm) {
            this.showNotification('Iltimos, qidiruv so\'rovini kiriting', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        const startTime = performance.now();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(searchTerm)}`);
            const endTime = performance.now();
            const responseTimeMs = Math.round(endTime - startTime);
            
            this.responseTime.textContent = `${responseTimeMs}ms`;
            
            const data = await response.json();
            
            this.showLoading(false);
            
            if (data.success) {
                this.displayResults(data.students, searchTerm);
            } else {
                this.showNotification(data.message || 'Qidiruvda xatolik yuz berdi', 'error');
                this.displayResults([], searchTerm);
            }
        } catch (error) {
            this.showLoading(false);
            this.showNotification('Serverga ulanishda xatolik', 'error');
            console.error('Qidiruvda xatolik:', error);
        }
    }
    
    showLoading(show) {
        if (show) {
            this.loadingAnimation.style.display = 'block';
            this.resultsContainer.style.display = 'none';
            this.noResults.style.display = 'none';
        } else {
            this.loadingAnimation.style.display = 'none';
            this.resultsContainer.style.display = 'grid';
        }
    }
    
    displayResults(students, searchTerm) {
        this.resultsCount.textContent = students.length;
        
        if (students.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <i class="fas fa-search-minus"></i>
                    </div>
                    <h3>NO_RESULTS_FOUND</h3>
                    <p>"${searchTerm}" bo'yicha hech qanday natija topilmadi.</p>
                    <p class="search-hint">Ism, familiya yoki Talaba ID sini to'liq kiriting.</p>
                </div>
            `;
            return;
        }
        
        let resultsHTML = '';
        
        students.forEach(student => {
            resultsHTML += this.createStudentCard(student);
        });
        
        this.resultsContainer.innerHTML = resultsHTML;
        document.querySelectorAll('.student-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showStudentDetails(students[index]);
            });
        });
    }
    
    createStudentCard(student) {
        return `
            <div class="student-card">
                <div class="card-header">
                    <span class="student-id">ID: ${student['Talaba ID'] || 'N/A'}</span>
                    <span class="student-status">ACTIVE</span>
                </div>
                <h4 class="student-name">${student['To\'liq ismi'] || 'Ism mavjud emas'}</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Fakultet:</span>
                        <span class="info-value">${student.Fakultet || '---'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Guruh:</span>
                        <span class="info-value">${student.Guruh || '---'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Kurs:</span>
                        <span class="info-value">${student.Kurs || '---'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Ta'lim tili:</span>
                        <span class="info-value">${student['Ta\'lim tili'] || '---'}</span>
                    </div>
                </div>
                <div class="view-details">
                    <i class="fas fa-chevron-right"></i>
                    <span>VIEW_FULL_PROFILE</span>
                </div>
            </div>
        `;
    }
    
    showStudentDetails(student) {
        const modal = document.getElementById('studentModal');
        const modalBody = document.getElementById('modalBody');
        const modalStudentName = document.getElementById('modalStudentName');
        
        modalStudentName.textContent = student['To\'liq ismi'] || 'Noma\'lum talaba';

        const detailsHTML = this.createStudentDetailsHTML(student);
        modalBody.innerHTML = detailsHTML;
        
        modal.style.display = 'block';
        
        document.getElementById('printProfile')?.addEventListener('click', () => {
            this.printStudentProfile(student);
        });
    }
    
    createStudentDetailsHTML(student) {
        const groups = {
            personal: {
                title: 'Shaxsiy Ma\'lumotlar',
                icon: 'fas fa-id-card',
                fields: [
                    'Talaba ID', 'To\'liq ismi', 'Fuqarolik', 'Davlat', 'Millat',
                    'Viloyat', 'Tuman', 'Jins', 'Tug\'ilgan sana', 'Pasport raqami',
                    'JSHSHIR-kod', 'Pasport berilgan sana'
                ]
            },
            education: {
                title: 'Ta\'lim Ma\'lumotlari',
                icon: 'fas fa-graduation-cap',
                fields: [
                    'Kurs', 'Fakultet', 'Guruh', 'Ta\'lim tili', 'O\'quv yili',
                    'Semestr', 'Bitiruvchi', 'Mutaxassislik', 'Ta\'lim turi',
                    'Ta\'lim shakli'
                ]
            },
            financial: {
                title: 'Moliya va Grant',
                icon: 'fas fa-money-check-alt',
                fields: [
                    'To\'lov shakli', 'Grant turi'
                ]
            },
            background: {
                title: 'Oldingi Ta\'lim',
                icon: 'fas fa-history',
                fields: [
                    'Avvalgi ta\'lim ma\'lumoti', 'Talaba toifasi'
                ]
            },
            social: {
                title: 'Ijtimoiy Ma\'lumotlar',
                icon: 'fas fa-users',
                fields: [
                    'Ijtimoiy toifa', 'Birga yashaydiganlar soni',
                    'Birga yashaydiganlar toifasi', 'Yashash joyi statusi',
                    'Yashash joyi geolokatsiyasi'
                ]
            },
            administrative: {
                title: 'Ma\'muriy Ma\'lumotlar',
                icon: 'fas fa-file-contract',
                fields: ['Buyruq']
            }
        };
        
        let detailsHTML = '<div class="student-details">';
        
        // Har bir guruh uchun HTML yaratish
        Object.values(groups).forEach(group => {
            let groupHTML = `
                <div class="detail-group">
                    <div class="group-title">
                        <i class="${group.icon}"></i>
                        <span>${group.title}</span>
                    </div>
            `;
            
            group.fields.forEach(field => {
                if (student[field] !== undefined) {
                    groupHTML += `
                        <div class="detail-item">
                            <span class="detail-label">${field}:</span>
                            <span class="detail-value">${student[field] || '---'}</span>
                        </div>
                    `;
                }
            });
            
            groupHTML += '</div>';
            detailsHTML += groupHTML;
        });
        
        detailsHTML += '</div>';
        return detailsHTML;
    }
    
    printStudentProfile(student) {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${student['To\'liq ismi']} - Talaba Profili</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .section { margin-bottom: 30px; }
                    .section h2 { color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                    .info-item { margin-bottom: 10px; }
                    .label { font-weight: bold; color: #666; }
                    .value { margin-left: 10px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Talaba Profili</h1>
                <div class="section">
                    <h2>Asosiy ma'lumotlar</h2>
                    <div class="info-grid">
                        ${Object.entries(student).map(([key, value]) => `
                            <div class="info-item">
                                <span class="label">${key}:</span>
                                <span class="value">${value || 'Mavjud emas'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="no-print">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    }
    
    resetSearch() {
        this.searchInput.value = '';
        this.resultsCount.textContent = '0';
        this.resultsContainer.innerHTML = '';
        this.noResults.style.display = 'block';
        this.searchInput.focus();
        this.showNotification('Tizim tozalandi', 'info');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                ${type === 'error' ? '⚠️' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span class="notification-text">${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'warning' ? '#ffb300' : '#00b8ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // 3 sekunddan keyin olib tashlash
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new StudentSearchSystem();
    
    const terminal = document.querySelector('.terminal');
    terminal.addEventListener('mousemove', (e) => {
        const rect = terminal.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / terminal.clientWidth) * 100;
        const y = ((e.clientY - rect.top) / terminal.clientHeight) * 100;
        
        terminal.style.setProperty('--mouse-x', `${x}%`);
        terminal.style.setProperty('--mouse-y', `${y}%`);
    });
    
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        document.body.style.backgroundPosition = `${50 + moveX}% ${50 + moveY}%`;
    });
    
    const cursor = document.querySelector('.input-cursor');
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('focus', () => {
        cursor.style.animation = 'blink 1s infinite';
    });
    
    searchInput.addEventListener('blur', () => {
        cursor.style.animation = 'none';
    });
});