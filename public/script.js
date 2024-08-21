const API_BASE_URL = 'http://3.34.95.101:3000';
const ADMIN_PASSWORD = 'chltjddnr1!';
const BOARD_IDS = {
    QUICK_MARKET: 'quickMarket',
    ISSUE_NEWS: 'issueNews'
};

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
            const response = await fetch(`${API_BASE_URL}/posts?boardId=${boardId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`게시물을 불러오는 데 실패했습니다: ${error.message}`);
        }
    },

    async fetchIssueNews() {
        try {
            const response = await fetch(`${API_BASE_URL}/issue-news`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Issue News를 불러오는 데 실패했습니다: ${error.message}`);
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

    async saveIssueNews(issueNews) {
        try {
            const response = await fetch(`${API_BASE_URL}/issue-news`, createRequest('POST', issueNews));
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Issue News 저장에 실패했습니다: ${error.message}`);
        }
    },

    async deleteIssueNews(id, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/issue-news/${id}`, createRequest('DELETE', { password }));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Issue News 삭제에 실패했습니다: ${error.message}`);
        }
    },

    async fetchPolls() {
        try {
            const response = await fetch(`${API_BASE_URL}/polls`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`투표를 불러오는 데 실패했습니다: ${error.message}`);
        }
    },

    async submitVote(pollId, vote) {
        try {
            const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, createRequest('POST', vote));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`투표 제출에 실패했습니다: ${error.message}`);
        }
    }
};

// DOM manipulation functions
const dom = {
    renderQuickMarketTable(posts) {
        const tableBody = document.getElementById('quickMarketBody');
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

    renderIssueNewsTable(issueNews) {
        const tableBody = document.getElementById('issueNewsBody');
        tableBody.innerHTML = '';
        issueNews.forEach(news => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${news.issuer}</td>
                <td>${news.maturity}</td>
                <td>${news.issueRate}</td>
                <td>${news.prevRate}</td>
                <td>${news.expectedSpread}</td>
                <td>${news.issueAmount}</td>
                <td class="status-${news.status}">${news.status}</td>
                <td>${new Date(news.updateTime).toLocaleString()}</td>
            `;
            row.addEventListener('click', (event) => {
                if (event.target.cellIndex !== 7) {
                    this.openIssueNewsPopup(news);
                } else {
                    this.editIssueNews(news);
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

    openIssueNewsModal(issueNews = null) {
        const modal = document.getElementById('issueNewsModal');
        if (issueNews) {
            document.getElementById('issuer').value = issueNews.issuer;
            document.getElementById('maturity').value = issueNews.maturity;
            document.getElementById('issueRate').value = issueNews.issueRate;
            document.getElementById('prevRate').value = issueNews.prevRate;
            document.getElementById('expectedSpread').value = issueNews.expectedSpread;
            document.getElementById('issueAmount').value = issueNews.issueAmount;
            document.getElementById('status').value = issueNews.status;
            document.getElementById('issueNewsPassword').value = issueNews.password || '';
            modal.dataset.id = issueNews._id;
        } else {
            document.getElementById('issuer').value = '';
            document.getElementById('maturity').value = '';
            document.getElementById('issueRate').value = '';
            document.getElementById('prevRate').value = '';
            document.getElementById('expectedSpread').value = '';
            document.getElementById('issueAmount').value = '';
            document.getElementById('status').value = '관심';
            document.getElementById('issueNewsPassword').value = '';
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

    closeIssueNewsModal() {
        document.getElementById('issueNewsModal').style.display = 'none';
    },

    openIssueNewsPopup(news) {
        const popup = document.getElementById('issueNewsPopup');
        document.getElementById('selectedIssueNewsInfo').textContent = `발행사: ${news.issuer}, 만기: ${news.maturity}`;
        document.getElementById('brokerName').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('rate').value = '';
        popup.style.display = 'block';
    },

    closeIssueNewsPopup() {
        document.getElementById('issueNewsPopup').style.display = 'none';
    },

    editIssueNews(issueNews) {
        const password = prompt('Enter password to edit:');
        if (password === issueNews.password || password === ADMIN_PASSWORD) {
            this.openIssueNewsModal(issueNews);
        } else {
            alert('Incorrect password');
        }
    },

    renderPolls(polls) {
        const pollContainer1 = document.getElementById('poll1');
        const pollContainer2 = document.getElementById('poll2');
        
        if (polls.length > 0) this.displayPoll(polls[0], pollContainer1);
        if (polls.length > 1) this.displayPoll(polls[1], pollContainer2);
    },

    displayPoll(poll, container) {
        container.innerHTML = `
            <h3>${poll.question}</h3>
            ${poll.isSubjective 
                ? `<input type="text" class="subjective-answer" placeholder="Enter your answer">` 
                : poll.options.map((option, index) => 
                    `<label><input type="radio" name="poll_${poll._id}" value="${index}"> ${option.text}</label>`
                ).join('')
            }
            <button class="submit-vote" data-poll-id="${poll._id}">Submit Vote</button>
            <div class="poll-results" style="display: none;"></div>
            <div class="poll-stats"></div>
        `;

        container.querySelector('.submit-vote').addEventListener('click', () => controller.submitVote(poll, container));
        
        if (localStorage.getItem(`voted_${poll._id}`)) {
            this.displayPollResults(poll, container);
        }

        this.updatePollStats(poll, container);
    },

    updatePollStats(poll, container) {
        const statsContainer = container.querySelector('.poll-stats');
        const totalVotes = poll.isSubjective ? poll.answers.length : poll.options.reduce((sum, option) => sum + option.votes, 0);

        let statsHTML = `<p>현재 참가자 수: ${totalVotes}</p>`;

        if (!poll.isSubjective) {
            statsHTML += '<ul>';
            poll.options.forEach(option => {
                const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(2) : 0;
                statsHTML += `<li>${option.text}: ${option.votes}명 (${percentage}%)</li>`;
            });
            statsHTML += '</ul>';
        }

        statsContainer.innerHTML = statsHTML;
    },

    displayPollResults(poll, container) {
        const resultsContainer = container.querySelector('.poll-results');
        resultsContainer.style.display = 'block';
        container.querySelector('.submit-vote').style.display = 'none';

        if (poll.isSubjective) {
            resultsContainer.innerHTML = '<h4>Submitted Answers:</h4>' +
                poll.answers.map(answer => `<p>${answer}</p>`).join('');
        } else {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            const chartData = {
                labels: poll.options.map(option => option.text),
                datasets: [{
                    data: poll.options.map(option => option.votes),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            };

            const canvas = document.createElement('canvas');
            resultsContainer.innerHTML = '';
            resultsContainer.appendChild(canvas);

            new Chart(canvas, {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: `Total Votes: ${totalVotes}`
                        }
                    }
                }
            });
        }

        this.updatePollStats(poll, container);
    },

    renderBrokerLinks() {
        const container = document.querySelector('.broker-links');
        if (!container) {
            console.error("Broker links container not found");
            return;
        }
        container.innerHTML = '';
        const links = [
            { name: 'A증권사', url: 'a-securities.html' },
            { name: 'B증권사', url: '#' },
            { name: 'C증권사', url: '#' },
            { name: 'D증권사', url: '#' },
            { name: 'E증권사', url: '#' },
            { name: 'F증권사', url: '#' },
        ];
        links.forEach(link => {
            const button = document.createElement('a');
            button.href = link.url;
            button.className = 'broker-button';
            button.textContent = link.name;
            if (link.name === 'A증권사') {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    window.location.href = 'a-securities.html';
                });
            } else {
                button.target = '_blank';
            }
            container.appendChild(button);
        });
    }
};

// Controller
const controller = {
    async init() {
        try {
            await this.fetchPosts(BOARD_IDS.QUICK_MARKET);
            await this.fetchIssueNews();
            await this.fetchPolls();
            dom.renderBrokerLinks();
            this.setupEventListeners();
        } catch (error) {
            handleApiError(error, "초기화 중 오류가 발생했습니다.");
        }
    },

    async fetchPosts(boardId) {
        try {
            const posts = await api.fetchPosts(boardId);
            dom.renderQuickMarketTable(posts);
        } catch (error) {
            handleApiError(error, "게시물을 불러오는 데 실패했습니다.");
        }
    },

    async fetchIssueNews() {
        try {
            const issueNews = await api.fetchIssueNews();
            dom.renderIssueNewsTable(issueNews);
        } catch (error) {
            handleApiError(error, "Issue News를 불러오는 데 실패했습니다.");
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
                boardId
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
            await this.fetchPosts(BOARD_IDS.QUICK_MARKET);
            document.getElementById('editModal').style.display = 'none';
            document.getElementById('fullPostModal').style.display = 'none';
        } catch (error) {
            handleApiError(error, "게시물 수정에 실패했습니다.");
        }
    },

    async deletePost(postId, password) {
        try {
            await api.deletePost(postId, password);
            await this.fetchPosts(BOARD_IDS.QUICK_MARKET);
            document.getElementById('fullPostModal').style.display = 'none';
        } catch (error) {
            handleApiError(error, "게시물 삭제에 실패했습니다.");
        }
    },

    async saveIssueNews() {
        const modal = document.getElementById('issueNewsModal');
        const issueNews = {
            issuer: document.getElementById('issuer').value,
            maturity: document.getElementById('maturity').value,
            issueRate: document.getElementById('issueRate').value,
            prevRate: document.getElementById('prevRate').value,
            expectedSpread: document.getElementById('expectedSpread').value,
            issueAmount: document.getElementById('issueAmount').value,
            status: document.getElementById('status').value,
            password: document.getElementById('issueNewsPassword').value
        };

        if (modal.dataset.id) {
            issueNews.id = modal.dataset.id;
        }

        try {
            await api.saveIssueNews(issueNews);
            await this.fetchIssueNews();
            dom.closeIssueNewsModal();
        } catch (error) {
            handleApiError(error, "Issue News 저장에 실패했습니다.");
        }
    },

    async deleteIssueNews(id, password) {
        try {
            await api.deleteIssueNews(id, password);
            await this.fetchIssueNews();
            dom.closeIssueNewsModal();
        } catch (error) {
            handleApiError(error, "Issue News 삭제에 실패했습니다.");
        }
    },

    async fetchPolls() {
        try {
            const polls = await api.fetchPolls();
            dom.renderPolls(polls);
        } catch (error) {
            handleApiError(error, "투표를 불러오는 데 실패했습니다.");
        }
    },

    async submitVote(poll, container) {
        if (localStorage.getItem(`voted_${poll._id}`)) {
            alert("You have already voted in this poll.");
            return;
        }

        let vote;
        if (poll.isSubjective) {
            vote = container.querySelector('.subjective-answer').value;
            if (!vote) {
                alert("Please enter your answer.");
                return;
            }
        } else {
            const selectedOption = container.querySelector(`input[name="poll_${poll._id}"]:checked`);
            if (!selectedOption) {
                alert("Please select an option.");
                return;
            }
            vote = parseInt(selectedOption.value);
        }

        try {
            const result = await api.submitVote(poll._id, poll.isSubjective ? { answer: vote } : { optionIndex: vote });
            dom.displayPollResults(result, container);
            localStorage.setItem(`voted_${poll._id}`, 'true');
        } catch (error) {
            handleApiError(error, "투표 제출에 실패했습니다.");
        }
    },

    setupEventListeners() {
        document.getElementById('addButton1').addEventListener('click', () => dom.openModal(BOARD_IDS.QUICK_MARKET));
        document.getElementById('addButton2').addEventListener('click', () => dom.openIssueNewsModal());
        document.getElementById('saveButton').addEventListener('click', () => this.savePost());
        document.getElementById('saveIssueNewsButton').addEventListener('click', () => this.saveIssueNews());
        document.getElementById('deleteIssueNewsButton').addEventListener('click', () => {
            const modal = document.getElementById('issueNewsModal');
            const id = modal.dataset.id;
            const password = document.getElementById('issueNewsPassword').value;
            if (id && password) {
                this.deleteIssueNews(id, password);
            }
        });
        document.getElementById('closeModalButton').addEventListener('click', () => dom.closeModal());
        document.getElementById('closeIssueNewsModalButton').addEventListener('click', () => dom.closeIssueNewsModal());
        document.getElementById('adminButton').addEventListener('click', () => {
            const password = prompt("Enter admin password:");
            if (password === ADMIN_PASSWORD) {
                window.location.href = '/admin.html';
            } else {
                alert("Incorrect password");
            }
        });

        // Issue News Popup 닫기 버튼에 이벤트 리스너 추가
        document.querySelector('#issueNewsPopup .button-group button:last-child').addEventListener('click', () => dom.closeIssueNewsPopup());

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                dom.closeModal();
                dom.closeIssueNewsModal();
                document.getElementById('fullPostModal').style.display = 'none';
                dom.closeIssueNewsPopup(); // ESC 키로도 팝업을 닫을 수 있도록 추가
                document.getElementById('editModal').style.display = 'none';
            }
            if (event.ctrlKey && event.key === 'Enter') {
                if (document.getElementById('modal').style.display === 'block') {
                    this.savePost();
                }
                if (document.getElementById('issueNewsModal').style.display === 'block') {
                    this.saveIssueNews();
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