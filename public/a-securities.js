const API_BASE_URL = 'http://3.34.95.101:3000';
const ADMIN_PASSWORD = 'chltjddnr1!';
const BOARD_IDS = {
    MARKET_VIEW: 'marketView',
    ISSUE_SALES: 'issueSales'
};
const SECURITIES_ID = 'aSecurities';

// Utility functions
const handleApiError = (error, customMessage) => {
    console.error(error);
    alert(`${customMessage} 자세한 내용: ${error.message}`);
};

const createRequest = (method, body = null) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
});

// API calls
const api = {
    async fetchPosts(boardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts?boardId=${boardId}&securitiesId=${SECURITIES_ID}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`게시물을 불러오는 데 실패했습니다: ${error.message}`);
        }
    },

    async fetchIssueSales() {
        try {
            const response = await fetch(`${API_BASE_URL}/issue-sales?boardId=${SECURITIES_ID}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Issue Sales를 불러오는 데 실패했습니다: ${error.message}`);
        }
    },

    async savePost(post) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, createRequest('POST', post));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`게시물 저장에 실패했습니다: ${error.message}`);
        }
    },

    async updatePost(postId, updatedData) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, createRequest('PUT', updatedData));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`게시물 수정에 실패했습니다: ${error.message}`);
        }
    },

    async deletePost(postId, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, createRequest('DELETE', { password }));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`게시물 삭제에 실패했습니다: ${error.message}`);
        }
    },

    async saveIssueSales(issueSales) {
        try {
            const response = await fetch(`${API_BASE_URL}/issue-sales`, createRequest('POST', issueSales));
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Issue Sales 저장에 실패했습니다: ${error.message}`);
        }
    }
};

// DOM manipulation functions
const dom = {
    renderMarketViewTable(posts) {
        const tableBody = document.getElementById('marketViewBody');
        tableBody.innerHTML = '';
        posts.forEach(post => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td class="content-column">${post.content.split('\n')[0]}</td>
                <td class="author-column">${post.author}</td>
                <td class="timestamp-column">${new Date(post.timestamp).toLocaleString()}</td>
            `;
            row.dataset.id = post._id;
            row.addEventListener('click', () => this.viewFullPost(post));
        });
    },

    renderIssueSalesTable(issueSales) {
        const tableBody = document.getElementById('issueSalesBody');
        tableBody.innerHTML = '';
        issueSales.forEach(issue => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${issue.issuer}</td>
                <td>${issue.maturity}</td>
                <td>${issue.issueRate}</td>
                <td>${issue.prevRate}</td>
                <td>${issue.expectedSpread}</td>
                <td>${issue.issueAmount}</td>
                <td class="status-${issue.status}">${issue.status}</td>
                <td>${new Date(issue.updateTime).toLocaleString()}</td>
            `;
            row.dataset.id = issue._id;
            row.addEventListener('click', (event) => {
                if (event.target.cellIndex !== 7) {
                    this.openIssueSalesPopup(issue);
                } else {
                    this.editIssueSales(issue);
                }
            });
        });
    },

    viewFullPost(post) {
        const modal = document.getElementById('fullPostModal');
        document.getElementById('fullPostTitle').textContent = post.content.split('\n')[0];
        const contentElement = document.getElementById('fullPostContent');
        contentElement.innerHTML = post.content.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        modal.style.display = 'block';

        document.getElementById('editPostBtn').onclick = () => this.promptPasswordAndEdit(post);
        document.getElementById('deletePostBtn').onclick = () => this.promptPasswordAndDelete(post);
        document.getElementById('closeFullPostModalBtn').onclick = () => modal.style.display = 'none';
    },

    promptPasswordAndEdit(post) {
        const password = prompt("수정하려면 비밀번호를 입력하세요:");
        if (password === post.password || password === ADMIN_PASSWORD) {
            this.openEditModal(post);
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    },

    openEditModal(post) {
        const modal = document.getElementById('editModal');
        const textarea = document.getElementById('editPostContent');
        textarea.value = post.content;
        modal.style.display = 'block';

        document.getElementById('saveEditBtn').onclick = () => controller.saveEdit(post._id, textarea.value, post.password);
        document.getElementById('closeEditModalBtn').onclick = () => modal.style.display = 'none';
    },

    promptPasswordAndDelete(post) {
        const password = prompt("삭제하려면 비밀번호를 입력하세요:");
        if (password === post.password || password === ADMIN_PASSWORD) {
            controller.deletePost(post._id, password);
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    },

    openModal(boardId) {
        const modal = document.getElementById('modal');
        modal.dataset.boardId = boardId;
        modal.style.display = 'block';
    },

    openIssueSalesModal(issueSales = null) {
        const modal = document.getElementById('issueSalesModal');
        if (issueSales) {
            document.getElementById('issuer').value = issueSales.issuer;
            document.getElementById('maturity').value = issueSales.maturity;
            document.getElementById('issueRate').value = issueSales.issueRate;
            document.getElementById('prevRate').value = issueSales.prevRate;
            document.getElementById('expectedSpread').value = issueSales.expectedSpread;
            document.getElementById('issueAmount').value = issueSales.issueAmount;
            document.getElementById('status').value = issueSales.status;
            document.getElementById('issueSalesPassword').value = issueSales.password || '';
            modal.dataset.id = issueSales._id;
        } else {
            document.getElementById('issuer').value = '';
            document.getElementById('maturity').value = '';
            document.getElementById('issueRate').value = '';
            document.getElementById('prevRate').value = '';
            document.getElementById('expectedSpread').value = '';
            document.getElementById('issueAmount').value = '';
            document.getElementById('status').value = '관심';
            document.getElementById('issueSalesPassword').value = '';
            delete modal.dataset.id;
        }
        modal.style.display = 'block';
    },

    closeModal() {
        document.getElementById('modal').style.display = 'none';
        document.getElementById('postContent').value = '';
        document.getElementById('author').value = '';
        document.getElementById('postPassword').value = '';
    },

    closeIssueSalesModal() {
        document.getElementById('issueSalesModal').style.display = 'none';
    },

    openIssueSalesPopup(issue) {
        const popup = document.getElementById('issueSalesPopup');
        document.getElementById('selectedIssueSalesInfo').textContent = `발행사: ${issue.issuer}, 만기: ${issue.maturity}`;
        document.getElementById('brokerName').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('rate').value = '';
        popup.style.display = 'block';
    },

    editIssueSales(issueSales) {
        const password = prompt('Enter password to edit:');
        if (password === issueSales.password || password === ADMIN_PASSWORD) {
            this.openIssueSalesModal(issueSales);
        } else {
            alert('Incorrect password');
        }
    }
};

// Controller
const controller = {
    async init() {
        try {
            await this.fetchPosts(BOARD_IDS.MARKET_VIEW);
            await this.fetchIssueSales();
            this.setupEventListeners();
        } catch (error) {
            handleApiError(error, "초기화 중 오류가 발생했습니다.");
        }
    },

    async fetchPosts(boardId) {
        try {
            const posts = await api.fetchPosts(boardId);
            dom.renderMarketViewTable(posts);
        } catch (error) {
            handleApiError(error, "게시물을 불러오는 데 실패했습니다.");
        }
    },

    async fetchIssueSales() {
        try {
            const issueSales = await api.fetchIssueSales();
            dom.renderIssueSalesTable(issueSales);
        } catch (error) {
            handleApiError(error, "Issue Sales를 불러오는 데 실패했습니다.");
        }
    },

    async savePost() {
        const content = document.getElementById('postContent').value;
        const author = document.getElementById('author').value;
        const postPassword = document.getElementById('postPassword').value;
        const boardId = document.getElementById('modal').dataset.boardId;

        if (content.length > 0 && author.length > 0) {
            const post = { 
                author, 
                password: postPassword, 
                content, 
                timestamp: new Date().toISOString(), 
                boardId,
                securitiesId: SECURITIES_ID
            };

            try {
                await api.savePost(post);
                await this.fetchPosts(boardId);
                dom.closeModal();
            } catch (error) {
                handleApiError(error, "게시물 저장에 실패했습니다.");
            }
        }
    },

    async saveEdit(postId, newContent, password) {
        try {
            await api.updatePost(postId, { content: newContent, updateTime: new Date().toISOString(), password });
            await this.fetchPosts(BOARD_IDS.MARKET_VIEW);
            document.getElementById('editModal').style.display = 'none';
            document.getElementById('fullPostModal').style.display = 'none';
        } catch (error) {
            handleApiError(error, "게시물 수정에 실패했습니다.");
        }
    },

    async deletePost(postId, password) {
        try {
            await api.deletePost(postId, password);
            await this.fetchPosts(BOARD_IDS.MARKET_VIEW);
            document.getElementById('fullPostModal').style.display = 'none';
        } catch (error) {
            handleApiError(error, "게시물 삭제에 실패했습니다.");
        }
    },

    async saveIssueSales() {
        const modal = document.getElementById('issueSalesModal');
        const issueSales = {
            issuer: document.getElementById('issuer').value,
            maturity: document.getElementById('maturity').value,
            issueRate: document.getElementById('issueRate').value,
            prevRate: document.getElementById('prevRate').value,
            expectedSpread: document.getElementById('expectedSpread').value,
            issueAmount: document.getElementById('issueAmount').value,
            status: document.getElementById('status').value,
            password: document.getElementById('issueSalesPassword').value,
            boardId: SECURITIES_ID
        };

        if (modal.dataset.id) {
            issueSales.id = modal.dataset.id;
        }

        try {
            await api.saveIssueSales(issueSales);
            await this.fetchIssueSales();
            dom.closeIssueSalesModal();
        } catch (error) {
            handleApiError(error, "Issue Sales 저장에 실패했습니다.");
        }
    },

    setupEventListeners() {
        document.getElementById('addMarketViewButton').addEventListener('click', () => dom.openModal(BOARD_IDS.MARKET_VIEW));
        document.getElementById('addIssueSalesButton').addEventListener('click', () => dom.openIssueSalesModal());
        document.getElementById('saveButton').addEventListener('click', () => this.savePost());
        document.getElementById('saveIssueSalesButton').addEventListener('click', () => this.saveIssueSales());
        document.getElementById('closeModalButton').addEventListener('click', () => dom.closeModal());
        document.getElementById('closeIssueSalesModalButton').addEventListener('click', () => dom.closeIssueSalesModal());
        document.getElementById('backButton').addEventListener('click', () => window.location.href = 'index.html');
        document.getElementById('submitIssueSales').addEventListener('click', () => {
            alert('접수되었습니다.');
            document.getElementById('issueSalesPopup').style.display = 'none';
        });
        document.getElementById('closeIssueSalesPopup').addEventListener('click', () => {
            document.getElementById('issueSalesPopup').style.display = 'none';
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                dom.closeModal();
                dom.closeIssueSalesModal();
                document.getElementById('fullPostModal').style.display = 'none';
                document.getElementById('issueSalesPopup').style.display = 'none';
                document.getElementById('editModal').style.display = 'none';
            }
            if (event.ctrlKey && event.key === 'Enter') {
                if (document.getElementById('modal').style.display === 'block') {
                    this.savePost();
                }
                if (document.getElementById('issueSalesModal').style.display === 'block') {
                    this.saveIssueSales();
                }
                if (document.getElementById('editModal').style.display === 'block') {
                    document.getElementById('saveEditBtn').click();
                }
            }
        });
    }
};

// Initialize the application
window.addEventListener('load', () => controller.init());