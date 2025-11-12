// Конфиг из твоего Firebase проекта
const firebaseConfig = {
    apiKey: "AIzaSyD8c-sO88P_QZLejDdOqbF2eAKDbnGopI4",
    authDomain: "mxmess-bdc21.firebaseapp.com",
    projectId: "mxmess-bdc21",
    storageBucket: "mxmess-bdc21.firebasestorage.app",
    messagingSenderId: "272145235529",
    appId: "1:272145235529:web:0bd3d5d287579b943f0998"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Регистрация
async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            name: email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Регистрация успешна!');
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Вход
async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('messageInput');
    
    if (!currentChatId) {
        alert('Сначала выбери собеседника!');
        return;
    }
    
    await sendPrivateMessage(currentChatWith, input.value);
    input.value = '';
}

// Слушатель сообщений в реальном времени
function setupMessagesListener() {
    if (!currentChatId) return;
    
    db.collection('messages')
        .where('chatId', '==', currentChatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = '';
            
            snapshot.forEach(doc => {
                const msg = doc.data();
                const messageElement = document.createElement('div');
                messageElement.innerHTML = `<strong>${msg.userEmail}:</strong> ${msg.text}`;
                messagesDiv.appendChild(messageElement);
            });
            
            // Прокрутка вниз
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
}

// Слушатель авторизации
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
        setupMessagesListener();
    } else {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('chat').style.display = 'none';
    }
});

// Выход
function signOut() {
    auth.signOut();
}

// Создать или найти личный чат
async function getOrCreatePrivateChat(otherUserId) {
    const currentUser = auth.currentUser;
    const chatId = [currentUser.uid, otherUserId].sort().join('_');
    
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    
    if (!chatDoc.exists) {
        await chatRef.set({
            type: 'private',
            members: [currentUser.uid, otherUserId],
            created: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: 'Чат создан',
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    
    return chatId;
}

// Отправка в личный чат
async function sendPrivateMessage(otherUserId, text) {
    const chatId = await getOrCreatePrivateChat(otherUserId);
    
    await db.collection('messages').add({
        chatId: chatId,
        userId: auth.currentUser.uid,
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Обновляем последнее сообщение в чате
    await db.collection('chats').doc(chatId).update({
        lastMessage: text,
        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
    });
}

let currentChatId = null;
let currentChatWith = null;

// Загрузить список пользователей
async function loadUsers() {
    const usersSnapshot = await db.collection('users').get();
    const usersDiv = document.getElementById('users');
    usersDiv.innerHTML = '';
    
    usersSnapshot.forEach(doc => {
        const user = doc.data();
        if (user.id !== auth.currentUser.uid) {
            const userElement = document.createElement('div');
            userElement.innerHTML = `
                <button onclick="openChat('${doc.id}', '${user.name || user.email}')">
                    💬 ${user.name || user.email}
                </button>
            `;
            usersDiv.appendChild(userElement);
        }
    });
}

// Открыть чат с пользователем
async function openChat(otherUserId, otherUserName) {
    currentChatId = await getOrCreatePrivateChat(otherUserId);
    currentChatWith = otherUserName;
    
    document.getElementById('chatWith').textContent = `Чат с ${otherUserName}`;
    document.getElementById('userList').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    
    setupMessagesListener();
}

// Показать список пользователей
function showUserList() {
    document.getElementById('userList').style.display = 'block';
    document.getElementById('chat').style.display = 'none';
    loadUsers();
}
