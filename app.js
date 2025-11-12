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
    const user = auth.currentUser;
    
    if (!user || !input.value.trim()) return;
    
    await db.collection('messages').add({
        text: input.value,
        userId: user.uid,
        userEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        chatId: 'family-chat' // один общий чат для семьи
    });
    
    input.value = '';
}

// Слушатель сообщений в реальном времени
function setupMessagesListener() {
    db.collection('messages')
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
